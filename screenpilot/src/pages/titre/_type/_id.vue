<script setup lang="ts">
import { ApiError } from '@/api/anilist';
import * as store from '@/data/store';
import { canIncrement } from '@/domain/progress';
import { formatAiring } from '@/domain/calendar';
import { dateSortie, pasSorti } from '@/domain/sortie';
import { duree, minutesParUnite } from '@/domain/screentime';
import { TYPE_LABELS, formatLabel, formatNumber, mediaStatusLabel, mediaTitle, seasonLabel, statusLabel, totalUnits, unitLabel, unitShort } from '@/domain/labels';
import { ENTRY_STATUSES, MEDIA_TYPES, entryId, sourceOf, type EntryStatus, type HistoryEvent, type LibraryEntry, type MediaSnapshot, type MediaType } from '@/domain/types';
import { details, messageErreur, type Fiche } from '@/lib/sources';
import * as act from '@/lib/actions';
import { useBiblio } from '@/stores/biblio';
import { ouvrirAjout } from '@/composables/useAjout';
import { confirmer } from '@/composables/useConfirm';
import Icone from '@/components/Icone.vue';
import Affiche from '@/components/Affiche.vue';
import BadgeType from '@/components/BadgeType.vue';
import CarteMedia from '@/components/CarteMedia.vue';
import Feuille from '@/components/Feuille.vue';

const route = useRoute();
const router = useRouter();
const biblio = useBiblio();
const type = computed(() => (MEDIA_TYPES.includes(String(route.params.type) as MediaType) ? (String(route.params.type) as MediaType) : null));
const id = computed(() => Number(route.params.id));
const entry = computed(() => (type.value ? biblio.parId(entryId(type.value, id.value)) : undefined));

const fiche = shallowRef<Fiche | null>(null);
const chargement = ref(true);
const erreur = ref<string | null>(null);
const ancien = ref(false);
let ac: AbortController | null = null;
async function charger() {
  if (!type.value || !Number.isFinite(id.value)) { chargement.value = false; erreur.value = 'Lien invalide.'; return; }
  ac?.abort();
  ac = new AbortController();
  chargement.value = true; erreur.value = null;
  try {
    const r = await details(type.value, id.value, ac.signal);
    fiche.value = r.data;
    ancien.value = r.stale;
    // Copie locale rafraîchie si le titre est suivi.
    if (entry.value && !r.stale) await store.updateFields(entry.value.id, { media: r.data.media });
  } catch (e) {
    if (e instanceof ApiError && e.kind === 'aborted') return;
    erreur.value = messageErreur(e);
  } finally {
    chargement.value = false;
  }
}
watch(() => route.fullPath, charger, { immediate: true });
onBeforeUnmount(() => ac?.abort());

const media = computed<MediaSnapshot | null>(() => fiche.value?.media ?? entry.value?.media ?? null);
const titre = computed(() => (media.value ? mediaTitle(media.value, biblio.settings.titleLanguage) : ''));
const autre = computed(() => {
  const m = media.value;
  if (!m) return null;
  return [m.title.romaji, m.title.english, m.title.native].find(t => t && t !== titre.value) ?? null;
});
const total = computed(() => (media.value ? totalUnits(media.value) : null));
const faits = computed(() => {
  const m = media.value;
  if (!m || !type.value) return [];
  return [
    m.type === 'MOVIE' || m.type === 'TV' ? null : formatLabel(m.format),
    seasonLabel(m.season, m.seasonYear) || m.startYear,
    mediaStatusLabel(m.status),
    m.type === 'TV' && m.seasons?.length ? `${m.seasons.length} saison${m.seasons.length > 1 ? 's' : ''}` : null,
    m.type !== 'MOVIE' && total.value ? `${total.value} ${unitLabel(m.type, total.value)}` : null,
    m.type !== 'MANGA' && m.duration ? (m.type === 'MOVIE' ? duree(m.duration) : `${m.duration} min/ép.`) : null,
    m.type === 'MANGA' && m.volumes ? `${m.volumes} vol.` : null,
  ].filter(Boolean) as (string | number)[];
});
const aVenir = computed(() => !!media.value && pasSorti(media.value));
const source = computed(() => (type.value && sourceOf(type.value) === 'tmdb' ? 'TMDB' : 'AniList'));

// Suivi
// Pas encore sorti : seulement « à voir » ou « abandonné » (sauf si déjà marqué autrement).
const statutsProposes = computed<EntryStatus[]>(() => (aVenir.value ? (['PLANNING', 'DROPPED'] as EntryStatus[]).concat(entry.value && !['PLANNING', 'DROPPED'].includes(entry.value.status) ? [entry.value.status] : [])
  : type.value === 'MOVIE' ? ['PLANNING', 'COMPLETED', 'DROPPED'] : [...ENTRY_STATUSES]));
const tempsPasse = computed(() => {
  const e = entry.value;
  if (!e) return 0;
  return biblio.sessionsVues.filter(s => s.entryId === e.id).reduce((n, s) => n + s.minutes, 0);
});
const resteMinutes = computed(() => {
  const e = entry.value;
  if (!e || !total.value || e.type === 'MOVIE') return 0;
  return Math.max(0, total.value - e.progress) * minutesParUnite(e, biblio.settings).minutes;
});
const prochaine = computed(() => (entry.value && entry.value.type !== 'MOVIE' ? act.uniteLabel(entry.value, Math.floor(entry.value.progress) + 1) : ''));
const ici = computed(() => (entry.value ? act.uniteLabel(entry.value, entry.value.progress) : ''));
const evenements = computed(() => (entry.value ? biblio.history.filter(h => h.entryId === entry.value!.id).slice(0, 15) : []));

async function vuAujourdhui() {
  if (!media.value) return;
  const e = entry.value;
  if (e?.status === 'COMPLETED') {
    // Revu : repasse à 0 puis compte le film une fois de plus.
    const r = await store.setStatus(e.id, 'REWATCH');
    if (r.ok) await act.plusUn(biblio.parId(e.id)!);
  } else await act.filmVu(media.value, e);
}
async function retirer() {
  if (!entry.value) return;
  if (await confirmer('La progression, la note et les notes seront retirées. Tu pourras annuler juste après.', { titre: 'Retirer ce titre ?', ok: 'Retirer', annuler: 'Garder' })) {
    await act.retirer(entry.value);
  }
}

// Saisie de la progression exacte (+ raccourcis de fin de saison pour les séries).
const feuilleProg = ref(false);
const saisie = ref('');
watch(feuilleProg, v => { if (v && entry.value) saisie.value = String(entry.value.progress).replace('.', ','); });
const valeur = computed(() => Number(saisie.value.replace(',', '.')));
const valide = computed(() => saisie.value.trim() !== '' && Number.isFinite(valeur.value) && valeur.value >= 0 && (!total.value || valeur.value <= total.value));
const finsSaison = computed(() => {
  let cumul = 0;
  return (media.value?.seasons ?? []).map(s => ({ numero: s.number, episodes: s.episodes, fin: (cumul += s.episodes) }));
});
async function enregistrer(v = valeur.value) {
  if (!entry.value) return;
  feuilleProg.value = false;
  await act.progression(entry.value, v);
}

const notes = ref('');
watch(entry, e => { if (e && document.activeElement?.id !== 'notes') notes.value = e.notes; }, { immediate: true });
function sauverNotes() { if (entry.value && notes.value !== entry.value.notes) store.updateFields(entry.value.id, { notes: notes.value }); }

const ouvertSynopsis = ref(false);
const dateFr = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
function decrire(ev: HistoryEvent, e: LibraryEntry) {
  if (ev.kind === 'add') return `Ajouté (${statusLabel(e.type, ev.after.status ?? 'PLANNING')})`;
  if (ev.kind === 'remove') return 'Retiré de la bibliothèque';
  const parts: string[] = [];
  if (ev.after.progress !== undefined && e.type !== 'MOVIE') parts.push(`${unitShort(e.type)} ${formatNumber(ev.before.progress ?? 0)} → ${formatNumber(ev.after.progress)}`);
  if (ev.after.status) parts.push(statusLabel(e.type, ev.after.status));
  if (ev.after.score !== undefined) parts.push(ev.after.score === null ? 'Note retirée' : `Note ${formatNumber(ev.after.score)}/10`);
  return parts.join(' · ') || 'Modification';
}
const retour = () => (window.history.state?.back ? router.back() : router.push('/'));
</script>

<template>
  <div class="page">
    <div class="fond" aria-hidden="true"><img v-if="media?.cover" :src="media.cover" alt=""></div>
    <div class="topbar">
      <button type="button" class="icon-btn verre" aria-label="Retour" @click="retour"><Icone nom="retour" /></button>
      <span class="grow" />
      <a v-if="media?.siteUrl" class="icon-btn verre" :href="media.siteUrl" target="_blank" rel="noopener noreferrer" :aria-label="`Voir sur ${source}`"><Icone nom="externe" :taille="20" /></a>
    </div>

    <div v-if="!media" class="vide">
      <template v-if="chargement"><p>Chargement…</p></template>
      <template v-else><Icone nom="alerte" :taille="30" /><p>{{ erreur ?? 'Titre introuvable.' }}</p><button type="button" class="btn small" @click="charger">Réessayer</button></template>
    </div>

    <template v-else>
      <section class="hero">
        <Affiche :src="media.cover" :couleur="media.coverColor" :titre="titre" :largeur="118" :rayon="16" />
        <div class="grow infos">
          <BadgeType :type="media.type" />
          <h1>{{ titre }}</h1>
          <p v-if="autre" class="small muted">{{ autre }}</p>
          <p class="small muted">{{ faits.join(' · ') }}</p>
          <p v-if="media.averageScore" class="small"><Icone nom="etoile" :taille="13" class="inline" /> <b>{{ (media.averageScore / 10).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) }}</b><span class="muted">/10 sur {{ source }}</span></p>
          <p v-if="aVenir" class="sortie-prevue"><Icone nom="calendrier" :taille="14" /> {{ dateSortie(media) ? `Sortie le ${dateSortie(media)}` : 'Pas encore sorti' }}</p>
          <p v-if="media.nextAiring && media.type !== 'MOVIE'" class="small prochain">{{ media.type === 'TV' ? act.uniteLabel({ type: media.type, media }, media.nextAiring.episode) : `Ép. ${media.nextAiring.episode}` }} · {{ formatAiring(media.nextAiring.airingAt) }}</p>
        </div>
      </section>

      <p v-if="ancien" class="banner warn">Infos enregistrées ({{ source }} injoignable).</p>
      <p v-else-if="erreur" class="banner warn">{{ erreur }} Infos affichées : copie locale.</p>

      <!-- Pas encore dans la bibliothèque -->
      <div v-if="!entry" class="card pad ajout">
        <template v-if="aVenir">
          <p class="small muted">Pas encore sorti{{ dateSortie(media) ? ` : prévu le ${dateSortie(media)}` : '' }}. Garde-le dans ta liste pour ne pas le rater.</p>
          <button type="button" class="btn primary full" @click="act.ajouter(media, 'PLANNING')"><Icone nom="plus" :taille="18" /> {{ statusLabel(media.type, 'PLANNING') }}</button>
        </template>
        <template v-else-if="media.type === 'MOVIE'">
          <button type="button" class="btn primary full" @click="vuAujourdhui"><Icone nom="oeil" :taille="18" /> Vu aujourd’hui</button>
          <div class="row">
            <button type="button" class="btn grow" @click="act.ajouter(media, 'PLANNING')">À voir</button>
            <button type="button" class="btn grow" @click="act.ajouter(media, 'COMPLETED')">Déjà vu avant</button>
          </div>
        </template>
        <template v-else>
          <button type="button" class="btn primary full" @click="act.ajouter(media, 'CURRENT')"><Icone nom="play" :taille="18" /> {{ statusLabel(media.type, 'CURRENT') }}</button>
          <div class="row">
            <button type="button" class="btn grow" @click="act.ajouter(media, 'PLANNING')">{{ statusLabel(media.type, 'PLANNING') }}</button>
            <button type="button" class="btn grow" @click="ouvrirAjout(media)">Autre…</button>
          </div>
        </template>
        <p v-if="!aVenir" class="tiny dim center">« Déjà vu » / « Terminé » à l’ajout ne compte pas dans le temps d’écran.</p>
      </div>

      <!-- Suivi -->
      <template v-else>
        <div class="card suivi">
          <div class="chips">
            <button v-for="s in statutsProposes" :key="s" type="button" class="chip" :class="{ on: entry.status === s }" :aria-pressed="entry.status === s"
              @click="entry.status !== s && (s === 'COMPLETED' && entry.type === 'MOVIE' ? vuAujourdhui() : act.statut(entry, s))">{{ statusLabel(entry.type, s) }}</button>
          </div>

          <div v-if="entry.type === 'MOVIE'" class="film">
            <template v-if="entry.status === 'COMPLETED'">
              <p><Icone nom="check" :taille="18" class="ok" /> Vu{{ entry.completedAt ? ` le ${dateFr(entry.completedAt)}` : '' }}<template v-if="entry.repeatCount"> · revu {{ entry.repeatCount }} fois</template></p>
              <button type="button" class="btn small" @click="vuAujourdhui"><Icone nom="synchro" :taille="16" /> Revu aujourd’hui</button>
            </template>
            <p v-else-if="aVenir" class="small muted">Dans ta liste. Tu pourras le marquer comme vu après sa sortie{{ dateSortie(media) ? ` (${dateSortie(media)})` : '' }}.</p>
            <button v-else type="button" class="btn primary full" @click="vuAujourdhui"><Icone nom="oeil" :taille="18" /> Vu aujourd’hui</button>
          </div>

          <template v-else>
            <div class="prog">
              <button type="button" class="rond" :disabled="entry.progress <= 0" :aria-label="`Retirer 1 ${unitLabel(entry.type, 1)}`" @click="act.progression(entry, Math.max(0, Math.ceil(entry.progress - 1)))"><Icone nom="moins" /></button>
              <button type="button" class="valeur" aria-label="Saisir la progression exacte" @click="feuilleProg = true">
                <b class="num">{{ entry.progress ? ici : '—' }}</b>
                <span class="muted small">{{ formatNumber(entry.progress) }} / {{ total ?? '?' }} {{ unitLabel(entry.type) }}</span>
              </button>
              <button type="button" class="rond principal" :disabled="!canIncrement(entry) || aVenir" :aria-label="`+1 : ${prochaine}`" @click="act.plusUn(entry)"><Icone nom="plus" :epaisseur="2.6" /></button>
            </div>
            <div v-if="total" class="progress grosse"><i :style="{ width: Math.min(100, (entry.progress / total) * 100) + '%', background: TYPE_LABELS[entry.type].couleur }" /></div>
            <p v-if="canIncrement(entry)" class="small muted center suivant">Prochain : <b>{{ prochaine }}</b></p>
          </template>

          <div class="mini-stats">
            <div><b class="num">{{ tempsPasse ? '≈ ' + duree(tempsPasse) : '—' }}</b><small>temps compté</small></div>
            <div v-if="resteMinutes"><b class="num">≈ {{ duree(resteMinutes) }}</b><small>pour finir</small></div>
            <div>
              <select :value="entry.score ?? ''" class="note num" aria-label="Ma note" @change="act.note(entry, ($event.target as HTMLSelectElement).value === '' ? null : Number(($event.target as HTMLSelectElement).value))">
                <option value="">—</option>
                <option v-for="v in Array.from({ length: 21 }, (_, i) => 10 - i / 2)" :key="v" :value="v">{{ formatNumber(v) }}</option>
              </select>
              <small>ma note /10</small>
            </div>
          </div>

          <p v-if="entry.startedAt || entry.completedAt" class="small muted dates">
            <template v-if="entry.startedAt && entry.type !== 'MOVIE'">Commencé le {{ dateFr(entry.startedAt) }}. </template>
            <template v-if="entry.completedAt && entry.type !== 'MOVIE'">Terminé le {{ dateFr(entry.completedAt) }}. </template>
            <template v-if="entry.repeatCount && entry.type !== 'MOVIE'">Revu {{ entry.repeatCount }} fois.</template>
          </p>
          <label class="field notes">
            <span>Notes personnelles</span>
            <textarea id="notes" v-model="notes" class="input" maxlength="2000" placeholder="Où tu l’as vu, avec qui, ce que tu en as pensé…" @blur="sauverNotes" />
          </label>
        </div>
      </template>

      <div v-if="media.genres.length" class="chips wrap genres"><span v-for="g in media.genres" :key="g" class="tag">{{ g }}</span></div>

      <section v-if="fiche?.description" class="section">
        <div class="section-head"><h2>Synopsis</h2></div>
        <p class="synopsis" :class="{ clamp4: !ouvertSynopsis }">{{ fiche.description }}</p>
        <button v-if="fiche.description.length > 240" type="button" class="lien small" @click="ouvertSynopsis = !ouvertSynopsis">{{ ouvertSynopsis ? 'Réduire' : 'Lire la suite' }}</button>
      </section>

      <section v-if="fiche?.recommendations.length" class="section">
        <div class="section-head"><h2>Dans le même genre</h2></div>
        <ul class="hscroll">
          <li v-for="r in fiche.recommendations.slice(0, 12)" :key="r.media.id"><CarteMedia :media="r.media" :badge="false" @ajouter="ouvrirAjout" /></li>
        </ul>
      </section>

      <section v-if="entry && evenements.length" class="section">
        <div class="section-head"><h2>Historique</h2></div>
        <ul class="card histo">
          <li v-for="ev in evenements" :key="ev.id" :class="{ annule: ev.undone }">
            <span class="grow small">{{ decrire(ev, entry) }}<br><span class="dim">{{ new Date(ev.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) }}{{ ev.undone ? ' · annulé' : '' }}</span></span>
            <button v-if="!ev.undone && ev.kind !== 'remove'" type="button" class="icon-btn" aria-label="Annuler cette action" @click="act.annuler(ev.id)"><Icone nom="annuler" :taille="18" /></button>
          </li>
        </ul>
      </section>

      <button v-if="entry" type="button" class="btn ghost danger full retirer" @click="retirer">Retirer de ma bibliothèque</button>
      <p class="dim tiny center source">Données : {{ source }}{{ source === 'TMDB' ? ' (ScreenPilot n’est ni approuvé ni certifié par TMDB)' : '' }}.</p>
    </template>

    <Feuille v-model="feuilleProg" titre="Progression">
      <form v-if="entry" class="stack" @submit.prevent="valide && enregistrer()">
        <label class="field">
          <span>{{ entry.type === 'MANGA' ? 'Dernier chapitre lu (10,5 accepté)' : 'Épisodes vus (au total)' }}</span>
          <input v-model="saisie" class="input num" :inputmode="entry.type === 'MANGA' ? 'decimal' : 'numeric'" autofocus>
          <small class="muted">{{ total ? `Total : ${total}` : 'Total inconnu (en cours de diffusion).' }}</small>
        </label>
        <div v-if="finsSaison.length > 1" class="saisons">
          <span class="label">Fin de saison</span>
          <div class="chips wrap">
            <button v-for="s in finsSaison" :key="s.numero" type="button" class="chip" :class="{ on: entry.progress === s.fin }" @click="enregistrer(s.fin)">S{{ s.numero }} <small class="dim">{{ s.episodes }} ép.</small></button>
          </div>
        </div>
        <p class="tiny dim">Le temps d’écran compte la différence au moment de l’enregistrement.</p>
        <button type="submit" class="btn primary full" :disabled="!valide">Enregistrer</button>
      </form>
    </Feuille>
  </div>
</template>

<route>
{ "meta": { "titre": "Fiche" } }
</route>

<style scoped>
.page { position: relative; }
.fond { position: absolute; z-index: -1; top: calc(-14px - var(--safe-t)); left: -16px; right: -16px; height: 340px; overflow: hidden; pointer-events: none; }
.fond img { width: 100%; height: 100%; object-fit: cover; filter: blur(38px) saturate(1.3); opacity: .45; transform: scale(1.2); }
.fond::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 20%, var(--bg)); }
.verre { background: color-mix(in srgb, var(--surface) 55%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
.hero { display: flex; gap: 16px; align-items: flex-end; margin: 8px 0 16px; }
.hero :deep(.affiche) { box-shadow: 0 20px 40px -18px rgba(0, 0, 0, .8); }
.infos { display: grid; justify-items: start; gap: 2px; }
.infos h1 { margin: 6px 0 2px; font-size: 25px; line-height: 1.12; letter-spacing: -.03em; }
.infos p { margin: 0; }
.inline { display: inline-block; vertical-align: -2px; color: var(--movie); }
.prochain { color: var(--brand); font-weight: 700; }
.ajout { display: grid; gap: 8px; }
.sortie-prevue { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px !important; padding: 4px 10px; border-radius: 99px; background: var(--brand-soft); color: var(--brand); font-size: 13px; font-weight: 800; }
.ajout p { margin: 2px 0 0; }
.suivi { padding: 14px 16px 16px; }
.suivi .chips { margin: 0 -16px 6px; }
.film { display: grid; justify-items: start; gap: 10px; margin: 10px 0 4px; }
.film p { margin: 0; display: flex; align-items: center; gap: 8px; font-weight: 700; }
.ok { color: var(--ok); }
.prog { display: flex; align-items: center; gap: 12px; margin: 12px 0 10px; }
.rond { width: 54px; height: 54px; flex: none; border-radius: 18px; border: 0; display: grid; place-items: center; background: var(--surface-2); transition: transform .1s; }
.rond:active { transform: scale(.92); }
.rond:disabled { opacity: .35; }
.rond.principal { color: #fff; background: var(--brand-grad); box-shadow: 0 12px 24px -12px var(--brand); }
.valeur { flex: 1; display: grid; justify-items: center; gap: 0; border: 0; background: none; padding: 4px; border-radius: 14px; }
.valeur b { font-size: 26px; letter-spacing: -.03em; }
.grosse { height: 8px; }
.suivant { margin: 8px 0 0; }
.mini-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; margin-top: 14px; }
.mini-stats > div { display: grid; justify-items: center; padding: 10px 6px; border-radius: 14px; background: var(--surface-2); text-align: center; }
.mini-stats b { font-size: 16px; }
.mini-stats small { font-size: 11.5px; color: var(--muted); font-weight: 600; }
.note { border: 0; background: none; font-weight: 800; font-size: 16px; text-align: center; padding: 0; appearance: none; }
.dates { margin: 12px 0 0; }
.notes { margin-top: 12px; }
.genres { margin-top: 14px; }
.synopsis { margin: 0; color: var(--muted); white-space: pre-line; }
.histo { list-style: none; margin: 0; padding: 4px 14px; }
.histo li { display: flex; align-items: center; gap: 10px; padding: 9px 0; }
.histo li + li { border-top: 1px solid var(--border); }
.histo li.annule { opacity: .5; text-decoration: line-through; }
.retirer { margin-top: 18px; }
.source { margin-top: 12px; }
.saisons { display: grid; gap: 8px; }
@media (min-width: 992px) {
  .fond { top: -28px; left: -36px; right: -36px; }
  .hero :deep(.affiche) { width: 160px !important; }
  .infos h1 { font-size: 32px; }
}
</style>
