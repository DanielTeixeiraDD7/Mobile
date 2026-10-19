<script setup lang="ts">
import { ApiError } from '@/api/anilist';
import { formatNumber, statusLabel, TYPE_LABELS, unitLabel } from '@/domain/labels';
import { typeStats } from '@/domain/stats';
import { buildProfile } from '@/domain/taste';
import { duree } from '@/domain/screentime';
import { ENTRY_STATUSES, MEDIA_TYPES, type MediaType } from '@/domain/types';
import { chargerRecos, type Recos } from '@/lib/recos';
import { useBiblio } from '@/stores/biblio';
import { ouvrirAjout } from '@/composables/useAjout';
import Icone from '@/components/Icone.vue';
import Assistant from '@/components/Assistant.vue';
import CarteMedia from '@/components/CarteMedia.vue';

const biblio = useBiblio();
const type = ref<MediaType>((MEDIA_TYPES.find(t => biblio.entries.some(e => e.type === t)) ?? 'MOVIE'));
const annee = new Date().getFullYear();

// Vue d'ensemble, toutes catégories.
const global = computed(() => MEDIA_TYPES.map(t => ({ type: t, s: typeStats(biblio.entries, t, new Date(), biblio.settings) })));
const totalMinutes = computed(() => global.value.filter(g => g.type !== 'MANGA' || biblio.settings.mangaDansTemps).reduce((n, g) => n + g.s.minutes.value, 0));
const s = computed(() => global.value.find(g => g.type === type.value)!.s);
const gout = computed(() => buildProfile(biblio.entries, type.value));
const maxGenre = computed(() => gout.value.topGenres[0]?.weight ?? 1);
const COULEURS_STATUT: Record<string, string> = { CURRENT: 'var(--brand)', PLANNING: 'var(--surface-3)', COMPLETED: 'var(--ok)', PAUSED: 'var(--warn)', DROPPED: 'var(--dim)', REWATCH: 'var(--anime)' };

const recos = ref<Recos | null>(null);
const recosEnCours = ref(false);
let ac: AbortController | null = null;
async function recommander() {
  ac?.abort();
  ac = new AbortController();
  recosEnCours.value = true;
  try { recos.value = await chargerRecos(type.value, ac.signal); }
  catch (e) { if (!(e instanceof ApiError && e.kind === 'aborted')) recos.value = { items: [], partiel: false, erreur: String(e) }; }
  finally { recosEnCours.value = false; }
}
watch(type, () => { recos.value = null; ac?.abort(); recosEnCours.value = false; });
onBeforeUnmount(() => ac?.abort());
</script>

<template>
  <div class="page">
    <div class="topbar">
      <h1 class="page-title grow">Profil</h1>
      <router-link to="/donnees" class="icon-btn" aria-label="Données (export, import)"><Icone nom="donnees" /></router-link>
      <router-link to="/reglages" class="icon-btn" aria-label="Réglages"><Icone nom="reglages" /></router-link>
    </div>

    <section class="card resume">
      <div v-for="g in global" :key="g.type" class="case" :style="{ '--c': TYPE_LABELS[g.type].couleur }" @click="type = g.type">
        <Icone :nom="TYPE_LABELS[g.type].icone" :taille="18" />
        <b class="num">{{ g.s.total }}</b>
        <small>{{ TYPE_LABELS[g.type].plusieurs }}</small>
      </div>
      <p class="small muted total">≈ <b>{{ duree(totalMinutes) }}</b> passées devant tout ça (d’après ta progression).</p>
    </section>

    <section class="section"><Assistant /></section>

    <section class="section">
      <div class="seg" role="tablist" aria-label="Catégorie">
        <button v-for="t in MEDIA_TYPES" :key="t" type="button" role="tab" :aria-selected="type === t" :class="{ on: type === t }" @click="type = t">{{ TYPE_LABELS[t].plusieurs }}</button>
      </div>

      <p v-if="!s.total" class="vide"><span>Pas encore de {{ TYPE_LABELS[type].plusieurs.toLowerCase() }} dans ta bibliothèque.</span></p>
      <template v-else>
        <div class="stats">
          <div class="stat"><b class="num">{{ s.total }}</b><small>titres</small></div>
          <div v-if="type !== 'MOVIE'" class="stat"><b class="num">{{ formatNumber(s.units.value) }}</b><small>{{ unitLabel(type) }} {{ type === 'MANGA' ? 'lus' : 'vus' }}</small></div>
          <div v-if="type !== 'MANGA' || biblio.settings.mangaDansTemps" class="stat" :title="s.minutes.note"><b class="num">≈ {{ duree(s.minutes.value) }}</b><small>{{ type === 'MANGA' ? 'de lecture' : 'de visionnage' }}</small></div>
          <div v-if="type !== 'MANGA' && s.remainingMinutes.value" class="stat" :title="s.remainingMinutes.note"><b class="num">≈ {{ duree(s.remainingMinutes.value) }}</b><small>reste à voir</small></div>
          <div v-if="s.meanScore" class="stat"><b class="num">{{ formatNumber(s.meanScore.value) }}/10</b><small>note moyenne</small></div>
          <div class="stat"><b class="num">{{ s.completedThisYear }}</b><small>{{ type === 'MOVIE' ? 'vus' : 'terminés' }} en {{ annee }}</small></div>
        </div>
        <div class="barre-statuts" aria-label="Répartition par statut">
          <i v-for="st in ENTRY_STATUSES.filter(x => s.byStatus[x])" :key="st" :style="{ flex: s.byStatus[st], background: COULEURS_STATUT[st] }" />
        </div>
        <p class="legende small muted">
          <span v-for="st in ENTRY_STATUSES.filter(x => s.byStatus[x])" :key="st"><i :style="{ background: COULEURS_STATUT[st] }" />{{ statusLabel(type, st) }} {{ s.byStatus[st] }}</span>
        </p>
        <details class="small muted methode">
          <summary>Comment sont calculés ces chiffres ?</summary>
          <p>{{ s.units.note }} {{ s.minutes.note }} {{ type !== 'MANGA' ? s.remainingMinutes.note : '' }}</p>
        </details>

        <template v-if="gout.topGenres.length">
          <div class="section-head sous"><h2>Tes goûts</h2></div>
          <p v-if="gout.weak" class="banner">Basé sur {{ gout.basedOn }} titre(s) : note ou termine-en d’autres pour l’affiner.</p>
          <ul class="genres">
            <li v-for="g in gout.topGenres" :key="g.name">
              <span>{{ g.name }}</span>
              <span class="jauge"><i :style="{ width: (g.weight / maxGenre) * 100 + '%', background: TYPE_LABELS[type].couleur }" /></span>
            </li>
          </ul>
          <p v-if="gout.disliked.length" class="small muted">Moins apprécié : {{ gout.disliked.map(d => d.name).join(', ') }}</p>
        </template>
      </template>

      <div class="section-head sous">
        <h2>Recommandations</h2>
        <button v-if="recos" type="button" @click="recommander">Recalculer</button>
      </div>
      <div v-if="!recos && !recosEnCours" class="card pad">
        <p class="small muted reco-aide">Calcul local à partir de tes goûts. Candidats : titres proches de ce que tu as ajouté, sorties de ton pays, cinéma local et du monde ({{ type === 'MOVIE' || type === 'TV' ? 'TMDB' : 'AniList' }}). Marche dès le premier titre.</p>
        <button type="button" class="btn primary full" @click="recommander">Me recommander des {{ TYPE_LABELS[type].plusieurs.toLowerCase() }}</button>
      </div>
      <p v-else-if="recosEnCours" class="muted">Calcul…</p>
      <template v-else-if="recos">
        <p v-if="recos.erreur" class="banner error">{{ recos.erreur }}</p>
        <p v-if="recos.partiel" class="banner warn">Certaines données n’ont pas pu être chargées : liste partielle.</p>
        <ul class="hscroll">
          <li v-for="r in recos.items" :key="r.media.id"><CarteMedia :media="r.media" :sous-titre="r.reasons[0]?.replace(/^Genres que tu apprécies : /, '')" :badge="false" @ajouter="ouvrirAjout" /></li>
        </ul>
      </template>
    </section>

    <section class="section">
      <div class="card pad bientot">
        <span class="ic"><Icone nom="personnes" :taille="22" /></span>
        <div class="grow">
          <b>Bientôt : amis et comparaisons</b>
          <p class="small muted">Compte facultatif, ajout d’amis par code, classement du temps d’écran de la semaine, titres en commun. Rien ne sera partagé sans ton accord.</p>
        </div>
      </div>
    </section>

    <nav class="liens">
      <router-link to="/calendrier" class="card"><Icone nom="calendrier" /> Calendrier</router-link>
      <router-link to="/donnees" class="card"><Icone nom="donnees" /> Sauvegarde</router-link>
      <router-link to="/reglages" class="card"><Icone nom="reglages" /> Réglages</router-link>
    </nav>
  </div>
</template>

<route>
{ "meta": { "titre": "Profil" } }
</route>

<style scoped>
.resume { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 12px; }
.case { display: grid; justify-items: center; gap: 2px; padding: 10px 4px; border-radius: 14px; background: color-mix(in srgb, var(--c) 12%, transparent); color: var(--c); cursor: pointer; }
.case b { font-size: 22px; color: var(--text); letter-spacing: -.03em; }
.case small { font-size: 12px; font-weight: 700; color: var(--muted); }
.total { grid-column: 1 / -1; margin: 6px 4px 0; text-align: center; }
.total b { color: var(--text); }
.stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; margin-top: 14px; }
.stat { padding: 12px 14px; border-radius: 16px; background: var(--surface); border: 1px solid var(--border); }
.stat b { display: block; font-size: 20px; letter-spacing: -.03em; }
.stat small { color: var(--muted); font-weight: 600; font-size: 12.5px; }
.barre-statuts { display: flex; gap: 3px; height: 10px; margin: 14px 0 6px; border-radius: 6px; overflow: hidden; }
.legende { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 0; }
.legende span { display: inline-flex; align-items: center; gap: 5px; }
.legende i { width: 8px; height: 8px; border-radius: 3px; }
.methode { margin: 12px 0 0; }
.methode summary { cursor: pointer; font-weight: 700; }
.sous { margin-top: 24px; }
.genres { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.genres li { display: grid; grid-template-columns: 130px 1fr; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; }
.jauge { height: 8px; border-radius: 4px; background: var(--surface-2); overflow: hidden; }
.jauge i { display: block; height: 100%; border-radius: 4px; }
.reco-aide { margin: 0 0 12px; }
.bientot { display: flex; gap: 14px; align-items: flex-start; background: linear-gradient(135deg, color-mix(in srgb, var(--tv) 14%, var(--surface)), var(--surface)); }
.bientot p { margin: 4px 0 0; }
.bientot .ic { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: color-mix(in srgb, var(--tv) 20%, transparent); color: var(--tv); flex: none; }
.liens { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 16px; }
.liens a { display: grid; justify-items: center; gap: 6px; padding: 14px 6px; color: var(--text); text-decoration: none; font-weight: 700; font-size: 13.5px; }
.vide span { color: var(--muted); font-weight: 600; }
</style>
