<script setup lang="ts">
import { ApiError } from '@/api/anilist';
import * as store from '@/data/store';
import { behind, dayLabel, groupByDay } from '@/domain/calendar';
import { mediaTitle, statusLabel } from '@/domain/labels';
import { loadAiring, type AiringState } from '@/lib/airing';
import { askPermission, exportIcs, notificationsSupported, scheduleInApp } from '@/lib/reminders';
import { uniteLabel } from '@/lib/actions';
import { useBiblio } from '@/stores/biblio';
import { toast } from '@/composables/useToast';
import Icone from '@/components/Icone.vue';
import Affiche from '@/components/Affiche.vue';
import BadgeType from '@/components/BadgeType.vue';
import Feuille from '@/components/Feuille.vue';

const biblio = useBiblio();
const etat = ref<AiringState>({ status: 'loading', rows: [], source: 'api', error: null });
let ac: AbortController | null = null;
async function charger(force = false) {
  ac?.abort();
  ac = new AbortController();
  etat.value = { ...etat.value, status: 'loading' };
  try { etat.value = await loadAiring(biblio.entries, force, ac.signal); }
  catch (e) { if (!(e instanceof ApiError && e.kind === 'aborted')) etat.value = { status: 'error', rows: [], source: 'local', error: String(e) }; }
}
onMounted(() => charger());
onBeforeUnmount(() => ac?.abort());
watch(() => etat.value.rows, rows => { if (biblio.settings.notify) scheduleInApp(rows, biblio.settings); });

const maintenant = ref(Date.now() / 1000);
const minuterie = setInterval(() => (maintenant.value = Date.now() / 1000), 60_000);
onBeforeUnmount(() => clearInterval(minuterie));

const enRetard = computed(() => biblio.entries.filter(e => behind(e, maintenant.value) > 0));
const jours = computed(() => groupByDay(etat.value.rows));
const suitQuelqueChose = computed(() => biblio.entries.some(e => (e.type === 'ANIME' || e.type === 'TV') && e.status !== 'COMPLETED' && e.status !== 'DROPPED'));
const heure = (s: number) => new Date(s * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const titre = (m: Parameters<typeof mediaTitle>[0]) => mediaTitle(m, biblio.settings.titleLanguage);

const feuille = ref(false);
const supporte = notificationsSupported();
async function basculer() {
  if (biblio.settings.notify) return store.updateSettings({ notify: false });
  const p = await askPermission();
  if (p === 'granted') { await store.updateSettings({ notify: true }); toast('Rappels activés (app ouverte).', { type: 'ok' }); }
  else if (p === 'unsupported') toast('Notifications indisponibles ici. Sur iPhone : installe l’app sur l’écran d’accueil (iOS 16.4+).', { type: 'warn', duree: 6000 });
  else toast('Notifications refusées dans les réglages du téléphone.', { type: 'danger' });
}
</script>

<template>
  <div class="page">
    <div class="topbar">
      <h1 class="page-title grow">Calendrier</h1>
      <button type="button" class="icon-btn" aria-label="Rappels" @click="feuille = true"><Icone nom="cloche" /></button>
    </div>

    <p v-if="etat.source === 'cache'" class="banner warn">Horaires enregistrés (AniList injoignable).</p>
    <p v-if="etat.source === 'local' && etat.error" class="banner warn">{{ etat.error }} Affichage du prochain épisode connu de chaque titre.</p>

    <section v-if="enRetard.length" class="card retard">
      <p class="label">À rattraper</p>
      <router-link v-for="e in enRetard" :key="e.id" :to="`/titre/${e.type}/${e.mediaId}`" class="ligne-retard">
        <BadgeType :type="e.type" court />
        <span class="grow ellipsis">{{ titre(e.media) }}</span>
        <span class="tag">{{ behind(e, maintenant) }} ép.</span>
      </router-link>
    </section>

    <p v-if="etat.status === 'loading' && !etat.rows.length" class="muted center">Chargement des sorties…</p>
    <div v-else-if="!etat.rows.length" class="vide">
      <Icone nom="calendrier" :taille="34" />
      <p>{{ suitQuelqueChose ? 'Aucun épisode annoncé cette semaine pour tes séries et anime.' : 'Ajoute des séries ou des anime en cours de diffusion pour voir leurs sorties ici.' }}</p>
      <router-link v-if="!suitQuelqueChose" to="/recherche" class="btn primary small">Rechercher</router-link>
    </div>

    <section v-for="j in jours" :key="j.day" class="section">
      <div class="section-head"><h2>{{ dayLabel(j.day) }}</h2></div>
      <ul class="card lignes">
        <li v-for="r in j.items" :key="`${r.entry.id}-${r.episode}`">
          <router-link :to="`/titre/${r.entry.type}/${r.mediaId}`" class="sortie">
            <Affiche :src="r.entry.media.cover" :couleur="r.entry.media.coverColor" :titre="titre(r.entry.media)" :largeur="44" :rayon="8" />
            <span class="grow">
              <b class="clamp2">{{ titre(r.entry.media) }}</b>
              <small class="muted">{{ uniteLabel(r.entry, r.episode) }} · {{ r.entry.type === 'TV' ? 'date annoncée' : heure(r.airingAt) }} · {{ r.airingAt <= maintenant ? 'sorti' : 'à venir' }}</small>
              <small class="dim">{{ statusLabel(r.entry.type, r.entry.status) }} · vu jusqu’à {{ r.entry.progress ? uniteLabel(r.entry, r.entry.progress) : '—' }}</small>
            </span>
            <BadgeType :type="r.entry.type" court />
          </router-link>
        </li>
      </ul>
    </section>

    <p v-if="etat.rows.length" class="dim small note">Anime : heures de diffusion au Japon converties à ton fuseau (AniList). Séries : date annoncée par TMDB. La sortie en streaming peut être décalée.</p>
    <button v-if="etat.status !== 'loading'" type="button" class="btn ghost full" @click="charger(true)"><Icone nom="synchro" :taille="18" /> Actualiser</button>

    <Feuille v-model="feuille" titre="Rappels">
      <div class="stack">
        <label class="field">
          <span>Prévenir avant la diffusion</span>
          <select class="input" :value="biblio.settings.reminderMinutes" @change="store.updateSettings({ reminderMinutes: Number(($event.target as HTMLSelectElement).value) })">
            <option v-for="m in [0, 5, 15, 30, 60, 120]" :key="m" :value="m">{{ m === 0 ? 'À l’heure exacte' : `${m} min avant` }}</option>
          </select>
        </label>
        <div class="card pad">
          <b>Calendrier du téléphone</b> <span class="small muted">(recommandé)</span>
          <p class="small muted">Exporte les sorties à venir vers l’app Calendrier : les alertes fonctionnent même app fermée. À refaire chaque semaine.</p>
          <button type="button" class="btn primary full" :disabled="!etat.rows.length" @click="exportIcs(etat.rows, biblio.settings)">Exporter (.ics)</button>
        </div>
        <div class="card pad">
          <b>Notifications de l’app</b>
          <p class="small muted">Seulement quand ScreenPilot est ouvert ou en arrière-plan récent : sans serveur (gratuit = local), iOS ne réveille pas une app web fermée.</p>
          <button type="button" class="btn full" :disabled="!supporte && !biblio.settings.notify" @click="basculer">{{ biblio.settings.notify ? 'Désactiver' : supporte ? 'Activer' : 'Non disponible sur ce navigateur' }}</button>
        </div>
      </div>
    </Feuille>
  </div>
</template>

<route>
{ "meta": { "titre": "Calendrier" } }
</route>

<style scoped>
.retard { padding: 14px 16px 8px; margin-bottom: 8px; }
.retard .label { margin: 0 0 6px; }
.ligne-retard { display: flex; align-items: center; gap: 10px; padding: 9px 0; color: inherit; text-decoration: none; font-weight: 600; }
.ligne-retard + .ligne-retard { border-top: 1px solid var(--border); }
.ligne-retard .tag { background: var(--brand-soft); color: var(--brand); }
.lignes { list-style: none; margin: 0; padding: 4px; }
.sortie { display: flex; align-items: center; gap: 12px; padding: 8px 10px; color: inherit; text-decoration: none; }
.sortie b { font-size: 15px; line-height: 1.25; }
.sortie small { display: block; font-size: 12.5px; }
.note { margin: 18px 4px 6px; }
.card.pad p { margin: 6px 0 12px; }
</style>
