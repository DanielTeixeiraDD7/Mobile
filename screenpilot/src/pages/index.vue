<script setup lang="ts">
import { bilan, bornes, duree, serie } from '@/domain/screentime';
import { insights } from '@/domain/assistant';
import { formatAiring } from '@/domain/calendar';
import { TYPE_LABELS, mediaTitle, formatNumber } from '@/domain/labels';
import { MEDIA_TYPES, type MediaSnapshot, type MediaType } from '@/domain/types';
import { useBiblio } from '@/stores/biblio';
import { variation, totalJusqua } from '@/composables/useTemps';
import { statut, uniteLabel } from '@/lib/actions';
import Icone from '@/components/Icone.vue';
import LigneTitre from '@/components/LigneTitre.vue';
import CarteMedia from '@/components/CarteMedia.vue';
import Catalogue from '@/components/Catalogue.vue';
import Avatar from '@/components/Avatar.vue';
import { useSocial } from '@/stores/social';
import { classement } from '@/domain/classement';
import { jourLocal } from '@/lib/social';
import Affiche from '@/components/Affiche.vue';
import BarresTemps from '@/components/graph/BarresTemps.vue';

const biblio = useBiblio();
const heure = new Date().getHours();
const salut = heure < 5 ? 'Bonne nuit' : heure < 18 ? 'Bonjour' : 'Bonsoir';
const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

// Temps d'écran de la semaine (lundi → dimanche) et de la précédente.
const semaine = computed(() => {
  const { debut, fin } = bornes('semaine', new Date());
  const b = bilan(biblio.sessionsVues, 'semaine', debut, fin);
  const avant = totalJusqua('semaine', -1);
  const jour = bornes('jour', new Date());
  const aujourdhui = bilan(biblio.sessionsVues, 'jour', jour.debut, jour.fin).total;
  return { ...b, avant, aujourdhui };
});
const ecart = computed(() => variation(semaine.value.total, semaine.value.avant));
const tranches = computed(() => semaine.value.tranches.map((t, i) => ({
  libelle: 'LMMJVSD'[i]!, parType: t.parType, total: t.minutes,
  actif: Date.now() >= t.debut && Date.now() < t.debut + 86_400_000,
})));
// Classement entre amis (si compte et amis).
const social = useSocial();
const monRang = computed(() => {
  const p = social.profil;
  if (social.etat !== 'connecte' || !p || !social.reseau.amis.length) return null;
  const { debut, fin } = bornes('semaine', new Date());
  const r = classement(social.stats, [p, ...social.reseau.amis], p.id, jourLocal(debut.getTime()), jourLocal(fin.getTime())).filter(x => x.partage);
  const i = r.findIndex(x => x.moi);
  return { rang: i + 1, sur: r.length, premier: r[0]! };
});
const serieJours = computed(() => serie(biblio.sessionsVues));

const enCours = computed(() => biblio.entries
  .filter(e => (e.status === 'CURRENT' || e.status === 'REWATCH') && e.type !== 'MOVIE')
  .sort((a, b) => b.updatedAt - a.updatedAt));
const filmsAVoir = computed(() => biblio.entries.filter(e => e.type === 'MOVIE' && e.status === 'PLANNING').sort((a, b) => b.addedAt - a.addedAt).slice(0, 12));

// Prochaines diffusions connues localement (anime : AniList, séries : TMDB), 7 jours.
const bientot = computed(() => {
  const now = Date.now() / 1000;
  return biblio.entries
    .filter(e => (e.type === 'ANIME' || e.type === 'TV') && e.status !== 'DROPPED' && e.status !== 'COMPLETED' && e.media.nextAiring
      && e.media.nextAiring.airingAt > now - 3600 && e.media.nextAiring.airingAt < now + 7 * 86400)
    .sort((a, b) => a.media.nextAiring!.airingAt - b.media.nextAiring!.airingAt)
    .slice(0, 6);
});

const conseils = computed(() => insights({ entries: biblio.entries, history: biblio.history, lang: biblio.settings.titleLanguage, now: Date.now() }).slice(0, 3));
const titreDe = (id?: string) => (id ? biblio.parId(id) : undefined);

// Nouveautés pour les utilisateurs d'AnimePilot (une seule fois).
const CLE_INTRO = 'screenpilot:intro-vue';
const intro = ref(false);
try { intro.value = biblio.entries.length > 0 && !localStorage.getItem(CLE_INTRO); } catch { /* ignoré */ }
function fermerIntro() { intro.value = false; try { localStorage.setItem(CLE_INTRO, '1'); } catch { /* ignoré */ } }

// À découvrir : catégorie choisie (films par défaut, ou la plus suivie).
const [plusSuivie, nb] = MEDIA_TYPES.map(t => [t, biblio.entries.filter(e => e.type === t).length] as const).sort((x, y) => y[1] - x[1])[0]!;
const typeTendance = ref<MediaType>(nb ? plusSuivie : 'MOVIE');
const titre = (m: MediaSnapshot) => mediaTitle(m, biblio.settings.titleLanguage);
</script>

<template>
  <div class="page">
    <header class="tete">
      <div class="grow">
        <p class="date">{{ date }}</p>
        <h1>{{ salut }}</h1>
      </div>
      <router-link to="/calendrier" class="icon-btn" aria-label="Calendrier des sorties"><Icone nom="calendrier" /></router-link>
      <router-link to="/reglages" class="icon-btn mobile-only" aria-label="Réglages"><Icone nom="reglages" /></router-link>
    </header>

    <div v-if="intro" class="card intro">
      <div class="row between"><b>AnimePilot devient ScreenPilot</b><button type="button" class="icon-btn petit" aria-label="Fermer" @click="fermerIntro"><Icone nom="fermer" :taille="16" /></button></div>
      <p class="small muted">Ta bibliothèque est intacte. Nouveau : films et séries, temps d’écran par jour, semaine et mois (y compris ton historique passé), objectif hebdomadaire.</p>
      <div class="row">
        <router-link to="/temps" class="btn small primary" @click="fermerIntro">Voir mon temps d’écran</router-link>
        <router-link to="/recherche" class="btn small" @click="fermerIntro">Ajouter un film</router-link>
      </div>
    </div>

    <router-link to="/temps" class="card hero">
      <div class="row between">
        <span class="label">Temps d’écran · semaine</span>
        <span v-if="serieJours > 1" class="serie"><Icone nom="feu" :taille="14" /> {{ serieJours }} j</span>
      </div>
      <div class="chiffres">
        <b class="num gros">{{ semaine.total ? '≈ ' + duree(semaine.total) : '0 min' }}</b>
        <span class="small muted">
          <template v-if="ecart !== null">
            <span :class="ecart > 0 ? 'hausse' : 'baisse'">{{ ecart > 0 ? '+' : '−' }}{{ Math.abs(ecart) }} %</span> vs la semaine dernière à ce stade
          </template>
          <template v-else>Aujourd’hui : {{ duree(semaine.aujourdhui) }}</template>
        </span>
      </div>
      <BarresTemps :tranches="tranches" :format="duree" :hauteur="92" />
      <div class="types">
        <span v-for="t in MEDIA_TYPES.filter(x => semaine.parType[x] > 0)" :key="t"><i :style="{ background: TYPE_LABELS[t].couleur }" />{{ TYPE_LABELS[t].plusieurs }} {{ duree(semaine.parType[t]) }}</span>
        <span v-if="!biblio.settings.mangaDansTemps && semaine.unites.MANGA"><i :style="{ background: TYPE_LABELS.MANGA.couleur }" />Manga {{ formatNumber(semaine.unites.MANGA) }} ch. lus</span>
        <span v-if="!semaine.total && !semaine.unites.MANGA" class="dim">Appuie sur + quand tu finis un épisode : ton temps se calcule tout seul.</span>
      </div>
    </router-link>

    <router-link v-if="monRang" to="/amis" class="card rang">
      <Avatar :pseudo="monRang.premier.personne.pseudo" :couleur="monRang.premier.personne.couleur" :taille="34" />
      <span class="grow">
        <b>{{ monRang.rang === 1 ? 'Tu es en tête cette semaine' : `Tu es ${monRang.rang}ᵉ sur ${monRang.sur} cette semaine` }}</b>
        <small class="muted">{{ monRang.rang === 1 ? 'Classement entre amis' : `${monRang.premier.personne.pseudo} mène avec ${duree(monRang.premier.valeur)}` }}{{ social.reseau.recues.length ? ` · ${social.reseau.recues.length} demande(s) d’ami` : '' }}</small>
      </span>
      <Icone nom="droite" :taille="18" class="dim" />
    </router-link>
    <router-link v-else-if="social.reseau.recues.length" to="/amis" class="card rang"><Icone nom="personnes" /><b class="grow">{{ social.reseau.recues.length }} demande(s) d’ami</b><Icone nom="droite" :taille="18" /></router-link>

    <section v-if="conseils.length" class="section">
      <div class="section-head"><h2>À savoir</h2></div>
      <ul class="card conseils">
        <li v-for="c in conseils" :key="c.id">
          <Icone nom="eclair" :taille="18" />
          <router-link v-if="titreDe(c.entryId)" :to="`/titre/${titreDe(c.entryId)!.type}/${titreDe(c.entryId)!.mediaId}`" class="grow">{{ c.text }}</router-link>
          <span v-else class="grow">{{ c.text }}</span>
          <button v-if="c.action && titreDe(c.entryId)" type="button" class="btn small" @click="statut(titreDe(c.entryId)!, c.action.status)">{{ c.action.label }}</button>
        </li>
      </ul>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>En cours</h2>
        <router-link v-if="enCours.length" to="/bibliotheque?statut=CURRENT">Tout voir</router-link>
      </div>
      <transition-group v-if="enCours.length" tag="ul" name="list" class="card lignes">
        <LigneTitre v-for="e in enCours.slice(0, 8)" :key="e.id" :entry="e" />
      </transition-group>
      <div v-else class="card vide">
        <Icone nom="play" :taille="30" />
        <p>Rien en cours. Cherche un film, une série, un anime ou un manga.</p>
        <router-link to="/recherche" class="btn primary small">Rechercher</router-link>
      </div>
    </section>

    <section v-if="bientot.length" class="section">
      <div class="section-head"><h2>Bientôt</h2><router-link to="/calendrier">Calendrier</router-link></div>
      <ul class="hscroll bientot">
        <li v-for="e in bientot" :key="e.id">
          <router-link :to="`/titre/${e.type}/${e.mediaId}`" class="card prochain">
            <Affiche :src="e.media.cover" :couleur="e.media.coverColor" :titre="titre(e.media)" :largeur="44" :rayon="8" />
            <span class="grow">
              <b class="clamp2">{{ titre(e.media) }}</b>
              <small>{{ uniteLabel(e, e.media.nextAiring!.episode) }} · {{ formatAiring(e.media.nextAiring!.airingAt) }}</small>
            </span>
          </router-link>
        </li>
      </ul>
    </section>

    <section v-if="filmsAVoir.length" class="section">
      <div class="section-head"><h2>Films à voir</h2><router-link to="/bibliotheque?type=MOVIE&statut=PLANNING">Tout voir</router-link></div>
      <ul class="hscroll">
        <li v-for="e in filmsAVoir" :key="e.id"><CarteMedia :media="e.media" :badge="false" /></li>
      </ul>
    </section>

    <section class="section">
      <div class="section-head"><h2>À découvrir</h2><router-link :to="`/recherche?type=${typeTendance}`">Plus</router-link></div>
      <div class="chips">
        <button v-for="t in MEDIA_TYPES" :key="t" type="button" class="chip" :class="{ on: typeTendance === t }" @click="typeTendance = t">
          <i class="pt" :style="{ background: TYPE_LABELS[t].couleur }" />{{ TYPE_LABELS[t].plusieurs }}
        </button>
      </div>
      <Catalogue :type="typeTendance" :max="3" pour-toi />
    </section>
  </div>
</template>

<route>
{ "meta": { "titre": "Accueil" } }
</route>

<style scoped>
.tete { display: flex; align-items: center; gap: 8px; margin: 4px 4px 16px; }
.tete h1 { margin: 0; font-size: 30px; letter-spacing: -.035em; line-height: 1.1; }
.date { margin: 0; font-size: 13px; font-weight: 700; color: var(--muted); text-transform: capitalize; }
.intro { padding: 16px; margin-bottom: 14px; background: linear-gradient(135deg, color-mix(in srgb, var(--brand) 16%, var(--surface)), var(--surface)); }
.intro p { margin: 6px 0 12px; }
.icon-btn.petit { width: 30px; height: 30px; border-radius: 10px; }
.hero { display: block; padding: 16px 16px 14px; color: inherit; text-decoration: none; background: radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--brand) 18%, transparent), transparent 60%), var(--surface); }
.serie { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 800; color: var(--brand-3); }
.chiffres { display: grid; margin: 8px 0 14px; }
.gros { font-size: 36px; font-weight: 850; letter-spacing: -.045em; line-height: 1.1; }
.hausse { color: var(--brand); font-weight: 800; } .baisse { color: var(--ok); font-weight: 800; }
.types { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 12px; font-size: 12.5px; font-weight: 700; color: var(--muted); }
.types span { display: inline-flex; align-items: center; gap: 5px; }
.types i { width: 8px; height: 8px; border-radius: 3px; }
.rang { display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-top: 12px; color: inherit; text-decoration: none; }
.rang b { display: block; font-size: 15px; }
.rang small { display: block; font-size: 12.5px; }
.conseils { list-style: none; margin: 0; padding: 6px 14px; }
.conseils li { display: flex; align-items: center; gap: 12px; padding: 10px 0; font-size: 14.5px; color: var(--brand-3); }
.conseils li + li { border-top: 1px solid var(--border); }
.conseils a, .conseils span { color: var(--text); text-decoration: none; }
.lignes { position: relative; list-style: none; margin: 0; padding: 4px; }
.bientot > li { width: 236px; }
.prochain { display: flex; gap: 10px; align-items: center; padding: 10px; color: inherit; text-decoration: none; border-radius: 16px; }
.prochain b { font-size: 14px; line-height: 1.25; }
.prochain small { display: block; font-size: 12px; color: var(--brand); font-weight: 700; margin-top: 2px; }
@media (min-width: 992px) { .mobile-only { display: none; } }
</style>
