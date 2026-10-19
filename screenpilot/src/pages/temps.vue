<script setup lang="ts">
import { duree, serie, bilan, bornes, type Periode } from '@/domain/screentime';
import { TYPE_LABELS, mediaTitle, unitLabel, formatNumber } from '@/domain/labels';
import { MEDIA_TYPES, type MediaType } from '@/domain/types';
import * as store from '@/data/store';
import { useBiblio } from '@/stores/biblio';
import { useBilan, libellePeriode, libelleTranche, variation } from '@/composables/useTemps';
import { toast } from '@/composables/useToast';
import Icone from '@/components/Icone.vue';
import Nombre from '@/components/Nombre.vue';
import Affiche from '@/components/Affiche.vue';
import Feuille from '@/components/Feuille.vue';
import Donut from '@/components/graph/Donut.vue';
import Anneau from '@/components/graph/Anneau.vue';
import BarresTemps from '@/components/graph/BarresTemps.vue';

const biblio = useBiblio();
const route = useRoute();
const periode = ref<Periode>(['jour', 'semaine', 'mois'].includes(String(route.query.p)) ? (route.query.p as Periode) : 'semaine');
const decalage = ref(0);
watch(periode, () => { decalage.value = 0; choisie.value = null; });
watch(decalage, () => { choisie.value = null; });
const { courant: b, precedent, comparable } = useBilan(periode, decalage);

const libelle = computed(() => libellePeriode(periode.value, b.value.debut, b.value.fin, decalage.value));
const ecart = computed(() => variation(b.value.total, comparable.value));
const nomPrecedent = computed(() => decalage.value === 0
  ? ({ jour: 'hier à la même heure', semaine: 'la semaine dernière à ce stade', mois: 'le mois dernier à ce stade' })[periode.value]
  : ({ jour: 'la veille', semaine: 'la semaine d’avant', mois: 'le mois d’avant' })[periode.value]);
const parJour = computed(() => (b.value.jours ? b.value.total / b.value.jours : 0));

const choisie = ref<number | null>(null);
const tranches = computed(() => b.value.tranches.map((t, i) => {
  const d = new Date(t.debut);
  const maintenant = Date.now();
  return {
    libelle: libelleTranche(periode.value, t.debut, i),
    parType: t.parType,
    total: t.minutes,
    actif: maintenant >= t.debut && maintenant < t.debut + (periode.value === 'jour' ? 3600_000 : 86_400_000),
    detail: periode.value === 'jour' ? `${i}h – ${i + 1}h` : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
}));
const detailChoisi = computed(() => (choisie.value === null ? null : tranches.value[choisie.value] ?? null));
// Repère « moyenne » : objectif quotidien si un objectif hebdo est réglé, sinon moyenne des jours actifs.
const reference = computed(() => {
  if (periode.value === 'jour') return null;
  if (biblio.settings.weeklyGoal) return biblio.settings.weeklyGoal / 7;
  return b.value.joursActifs > 1 ? b.value.total / b.value.joursActifs : null;
});

const typeActif = ref<string | null>(null);
const parts = computed(() => MEDIA_TYPES.filter(t => b.value.parType[t] > 0).map(t => ({ id: t, valeur: b.value.parType[t], couleur: TYPE_LABELS[t].couleur })));
const categories = computed(() => MEDIA_TYPES.map(t => ({
  type: t,
  minutes: b.value.parType[t],
  unites: b.value.unites[t],
  part: b.value.total ? b.value.parType[t] / b.value.total : 0,
  avant: precedent.value.parType[t],
})).sort((x, y) => y.minutes - x.minutes));

const titres = computed(() => b.value.titres.slice(0, 8).map(t => {
  const e = biblio.parId(t.entryId) ?? biblio.history.find(h => h.entryId === t.entryId && h.snapshot)?.snapshot;
  return { ...t, entry: e ?? null };
}).filter(t => t.entry));
const maxTitre = computed(() => Math.max(1, ...titres.value.map(t => t.minutes)));

// Objectif hebdomadaire (temps maximum souhaité).
const semaine = computed(() => {
  const { debut, fin } = bornes('semaine', new Date());
  return bilan(biblio.sessionsVues, 'semaine', debut, fin).total;
});
const objectif = computed(() => biblio.settings.weeklyGoal);
const ratioObjectif = computed(() => (objectif.value ? semaine.value / objectif.value : 0));
const feuilleObjectif = ref(false);
const OBJECTIFS = [5, 7, 10, 14, 20, 30].map(h => h * 60);
async function fixerObjectif(v: number | null) {
  await store.updateSettings({ weeklyGoal: v });
  feuilleObjectif.value = false;
  toast(v ? `Objectif : ${duree(v)} max par semaine` : 'Objectif retiré');
}

// Records, tous temps confondus.
const serieJours = computed(() => serie(biblio.sessionsVues));
const totalGlobal = computed(() => biblio.sessionsVues.reduce((s, x) => s + x.minutes, 0));
const record = computed(() => {
  const parJourMap = new Map<string, { jour: number; minutes: number }>();
  for (const s of biblio.sessionsVues) {
    const d = new Date(s.at); d.setHours(0, 0, 0, 0);
    const k = d.toDateString();
    const v = parJourMap.get(k) ?? { jour: d.getTime(), minutes: 0 };
    v.minutes += s.minutes;
    parJourMap.set(k, v);
  }
  return [...parJourMap.values()].sort((a, b) => b.minutes - a.minutes)[0] ?? null;
});
const premiere = computed(() => biblio.sessionsVues[0]?.at ?? null);
const peutAvancer = computed(() => decalage.value < 0);
const titre = (e: { media: Parameters<typeof mediaTitle>[0] }) => mediaTitle(e.media, biblio.settings.titleLanguage);
const unites = (type: MediaType, n: number) => `${formatNumber(n)} ${unitLabel(type, n)}`;
</script>

<template>
  <div class="page">
    <div class="topbar">
      <h1 class="page-title grow">Temps d’écran</h1>
      <button type="button" class="icon-btn" aria-label="Objectif hebdomadaire" @click="feuilleObjectif = true"><Icone nom="cible" /></button>
    </div>

    <div class="seg" role="tablist" aria-label="Période">
      <button v-for="p in (['jour', 'semaine', 'mois'] as const)" :key="p" type="button" role="tab" :aria-selected="periode === p" :class="{ on: periode === p }" @click="periode = p">
        {{ { jour: 'Jour', semaine: 'Semaine', mois: 'Mois' }[p] }}
      </button>
    </div>

    <section class="card hero">
      <div class="nav-periode">
        <button type="button" class="icon-btn" aria-label="Période précédente" @click="decalage--"><Icone nom="gauche" /></button>
        <span class="grow center"><b class="periode">{{ libelle }}</b></span>
        <button type="button" class="icon-btn" aria-label="Période suivante" :disabled="!peutAvancer" @click="decalage++"><Icone nom="droite" /></button>
      </div>

      <div class="total">
        <span class="approx">≈</span>
        <Nombre class="num gros" :valeur="b.total" :format="duree" />
      </div>
      <p class="sous">
        <template v-if="ecart !== null">
          <span :class="ecart > 0 ? 'hausse' : 'baisse'"><Icone :nom="ecart > 0 ? 'tendanceHaut' : 'tendanceBas'" :taille="15" /> {{ Math.abs(ecart) }} %</span>
          vs {{ nomPrecedent }}
        </template>
        <template v-else-if="b.total > 0">Rien sur la période précédente à ce stade</template>
        <template v-else>{{ b.total ? '' : 'Rien de vu ou lu sur cette période' }}</template>
        <template v-if="periode !== 'jour' && b.total"> · {{ duree(parJour) }} / jour</template>
      </p>

      <BarresTemps v-model:choisie="choisie" :tranches="tranches" :format="duree" :reference="reference" :hauteur="periode === 'mois' ? 150 : 170" />
      <transition name="fade" mode="out-in">
        <div v-if="detailChoisi" :key="choisie ?? -1" class="detail">
          <b>{{ detailChoisi.detail }}</b>
          <span class="num">{{ detailChoisi.total ? duree(detailChoisi.total) : 'rien' }}</span>
          <span v-for="t in MEDIA_TYPES.filter(x => detailChoisi!.parType[x])" :key="t" class="pt-l"><i :style="{ background: TYPE_LABELS[t].couleur }" />{{ duree(detailChoisi.parType[t]) }}</span>
        </div>
        <div v-else class="legende">
          <span v-for="t in MEDIA_TYPES" :key="t"><i :style="{ background: TYPE_LABELS[t].couleur }" />{{ TYPE_LABELS[t].plusieurs }}</span>
        </div>
      </transition>
    </section>

    <section v-if="b.total" class="section">
      <div class="section-head"><h2>Par catégorie</h2></div>
      <div class="card cats">
        <Donut v-model:actif="typeActif" :parts="parts" :taille="168" :epaisseur="20">
          <b class="num donut-v">{{ duree(typeActif ? b.parType[typeActif as MediaType] : b.total) }}</b>
          <small class="muted">{{ typeActif ? TYPE_LABELS[typeActif as MediaType].plusieurs : 'au total' }}</small>
        </Donut>
        <ul class="liste-cats">
          <li v-for="c in categories" :key="c.type" :class="{ eteint: !c.minutes, faible: typeActif && typeActif !== c.type }" @click="typeActif = typeActif === c.type ? null : c.type">
            <span class="ic" :style="{ color: TYPE_LABELS[c.type].couleur, background: `color-mix(in srgb, ${TYPE_LABELS[c.type].couleur} 15%, transparent)` }"><Icone :nom="TYPE_LABELS[c.type].icone" :taille="18" /></span>
            <span class="grow">
              <b>{{ TYPE_LABELS[c.type].plusieurs }}</b>
              <small class="muted">{{ c.unites ? unites(c.type, c.unites) : '—' }}<template v-if="c.avant || c.minutes"> · avant : {{ duree(c.avant) }}</template></small>
            </span>
            <span class="v num">{{ duree(c.minutes) }}<small>{{ Math.round(c.part * 100) }} %</small></span>
          </li>
        </ul>
      </div>
    </section>

    <section v-if="titres.length" class="section">
      <div class="section-head"><h2>Ce qui t’a pris le plus de temps</h2></div>
      <ul class="card top">
        <li v-for="(t, i) in titres" :key="t.entryId">
          <router-link :to="`/titre/${t.entry!.type}/${t.entry!.mediaId}`">
            <span class="rang num">{{ i + 1 }}</span>
            <Affiche :src="t.entry!.media.cover" :couleur="t.entry!.media.coverColor" :titre="titre(t.entry!)" :largeur="38" :rayon="8" />
            <span class="grow">
              <b class="ellipsis">{{ titre(t.entry!) }}</b>
              <span class="barre"><i :style="{ width: (t.minutes / maxTitre) * 100 + '%', background: TYPE_LABELS[t.entry!.type].couleur }" /></span>
            </span>
            <span class="v num">{{ duree(t.minutes) }}<small>{{ unites(t.entry!.type, t.unites) }}</small></span>
          </router-link>
        </li>
      </ul>
    </section>

    <section class="section">
      <div class="section-head"><h2>Objectif de la semaine</h2></div>
      <div class="card pad objectif">
        <template v-if="objectif">
          <Anneau :ratio="Math.min(1, ratioObjectif)" :taille="92" :epaisseur="10" :couleur="ratioObjectif > 1 ? 'var(--danger)' : ratioObjectif > .8 ? 'var(--warn)' : 'var(--ok)'" fond="var(--surface-3)">
            <b class="num">{{ Math.round(ratioObjectif * 100) }} %</b>
          </Anneau>
          <div class="grow">
            <b>{{ duree(semaine) }} sur {{ duree(objectif) }}</b>
            <p class="small muted">{{ ratioObjectif > 1 ? `Dépassé de ${duree(semaine - objectif)}.` : `Il te reste ${duree(objectif - semaine)} cette semaine.` }}</p>
            <button type="button" class="lien small" @click="feuilleObjectif = true">Modifier</button>
          </div>
        </template>
        <template v-else>
          <span class="ic-obj"><Icone nom="cible" :taille="26" /></span>
          <div class="grow">
            <b>Fixe-toi une limite</b>
            <p class="small muted">Un maximum d’heures par semaine, pour garder l’équilibre.</p>
          </div>
          <button type="button" class="btn small primary" @click="feuilleObjectif = true">Choisir</button>
        </template>
      </div>
    </section>

    <section v-if="totalGlobal" class="section">
      <div class="section-head"><h2>Records</h2></div>
      <div class="records">
        <div class="card rec"><Icone nom="feu" :taille="20" /><b class="num">{{ serieJours }} j</b><small>série en cours</small></div>
        <div v-if="record" class="card rec"><Icone nom="etoile" :taille="20" /><b class="num">{{ duree(record.minutes) }}</b><small>le {{ new Date(record.jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' }) }}</small></div>
        <div class="card rec"><Icone nom="horloge" :taille="20" /><b class="num">{{ duree(totalGlobal) }}</b><small>depuis {{ premiere ? new Date(premiere).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '—' }}</small></div>
      </div>
    </section>

    <details class="methode small muted">
      <summary>Comment est calculé ce temps ?</summary>
      <p>C’est une <b>estimation</b> à partir de ce que tu marques comme vu ou lu dans ScreenPilot : chaque épisode compte sa durée (donnée par TMDB ou AniList, sinon {{ 24 }} min pour un anime, 40 min pour une série), chaque film sa durée, chaque chapitre de manga {{ biblio.settings.minutesPerChapter }} min (modifiable dans les réglages).</p>
      <p>Le temps est compté au moment où tu appuies sur +1 (ou « Vu aujourd’hui »). Ajouter un titre déjà fini ne compte pas. Ce n’est pas le « Temps d’écran » du téléphone, auquel une app web n’a pas accès.</p>
    </details>

    <Feuille v-model="feuilleObjectif" titre="Objectif hebdomadaire">
      <p class="muted small">Temps maximum que tu veux passer par semaine devant films, séries, anime et manga.</p>
      <div class="grille-obj">
        <button v-for="o in OBJECTIFS" :key="o" type="button" class="btn" :class="{ primary: objectif === o }" @click="fixerObjectif(o)">{{ duree(o) }}</button>
      </div>
      <button v-if="objectif" type="button" class="btn ghost danger full" @click="fixerObjectif(null)">Retirer l’objectif</button>
    </Feuille>
  </div>
</template>

<route>
{ "meta": { "titre": "Temps d'écran" } }
</route>

<style scoped>
.hero { margin-top: 12px; padding: 14px 16px 16px; background: radial-gradient(120% 80% at 50% -10%, color-mix(in srgb, var(--brand) 16%, transparent), transparent 60%), var(--surface); }
.nav-periode { display: flex; align-items: center; gap: 8px; }
.periode { font-size: 15px; }
.periode { display: inline-block; }
.periode::first-letter { text-transform: uppercase; }
.total { display: flex; align-items: baseline; justify-content: center; gap: 6px; margin: 14px 0 2px; }
.approx { font-size: 26px; font-weight: 700; color: var(--dim); }
.gros { font-size: 46px; font-weight: 850; letter-spacing: -.045em; line-height: 1.05; }
.sous { margin: 0 0 18px; text-align: center; color: var(--muted); font-size: 14px; font-weight: 600; min-height: 21px; }
.sous span { display: inline-flex; align-items: center; gap: 3px; font-weight: 800; }
.hausse { color: var(--brand); } .baisse { color: var(--ok); }
.legende, .detail { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 14px; margin-top: 12px; font-size: 12.5px; font-weight: 700; color: var(--muted); min-height: 20px; }
.legende span, .pt-l { display: inline-flex; align-items: center; gap: 5px; }
.legende i, .pt-l i { width: 8px; height: 8px; border-radius: 3px; }
.detail b { text-transform: capitalize; color: var(--text); }
.detail .num { color: var(--text); font-weight: 800; }
.cats { display: grid; gap: 14px; padding: 18px 12px 10px; }
.donut-v { font-size: 22px; letter-spacing: -.03em; }
.liste-cats { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.liste-cats li { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 14px; cursor: pointer; transition: opacity .2s; }
.liste-cats li.eteint { opacity: .45; }
.liste-cats li.faible { opacity: .4; }
.liste-cats .ic { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; flex: none; }
.liste-cats b, .top b { display: block; font-size: 15px; }
.liste-cats small { display: block; font-size: 12.5px; }
.v { text-align: right; font-weight: 800; font-size: 15px; white-space: nowrap; }
.v small { display: block; font-size: 12px; font-weight: 700; color: var(--dim); }
.top { list-style: none; margin: 0; padding: 6px; }
.top a { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 14px; color: inherit; text-decoration: none; }
.rang { width: 18px; text-align: center; font-weight: 800; color: var(--dim); font-size: 14px; }
.barre { display: block; height: 5px; margin-top: 6px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
.barre i { display: block; height: 100%; border-radius: 3px; }
.objectif { display: flex; align-items: center; gap: 16px; }
.objectif p { margin: 2px 0 4px; }
.ic-obj { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; color: var(--brand); background: var(--brand-soft); flex: none; }
.records { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.rec { display: grid; justify-items: start; gap: 2px; padding: 14px; color: var(--brand); }
.rec b { color: var(--text); font-size: 18px; letter-spacing: -.03em; margin-top: 4px; }
.rec small { color: var(--muted); font-size: 12px; font-weight: 600; }
.methode { margin: 26px 4px 0; }
.methode summary { cursor: pointer; font-weight: 700; }
.grille-obj { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
@media (min-width: 720px) {
  .cats { grid-template-columns: auto 1fr; align-items: center; padding: 20px; gap: 24px; }
}
</style>
