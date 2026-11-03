<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { CONSEILS, HABITUDES, JOURS, PLANNING, SEANCES } from '@/core/programmes';
import { jourPlan, OBJECTIF_PAUSES } from '@/core/plan';
import { lancerSeance } from '@/composables/useSeance';
import { BADGES, bruleSemaine, peseesTriees, seancesSemaine } from '@/core/calculs';
import { dateLongue, iso, kg, lireDate, lundi } from '@/core/dates';
import { celebrer } from '@/composables/useCelebration';
import { toast } from '@/composables/useToast';
import Icone from '@/components/Icone.vue';
import Anneau from '@/components/graph/Anneau.vue';
import CartePlanDuJour from '@/components/CartePlanDuJour.vue';

const fit = useFit();
const p = computed(() => fit.profil!);
const jour = computed(() => fit.jourLu());
const heure = new Date().getHours();
const salut = heure < 5 ? 'Bonne nuit' : heure < 12 ? 'Bonjour' : heure < 18 ? 'Salut' : 'Bonsoir';
const conseil = CONSEILS[new Date().getDate() % CONSEILS.length];

/* ——— Objectif (poids → terrain) ——— */
const perdu = computed(() => p.value.startWeight - fit.poids);
const pct = computed(() => { const t = p.value.startWeight - p.value.goalWeight; return Math.max(0, Math.min(100, t > 0 ? (perdu.value / t) * 100 : 0)); });
/** Jour du plan « Objectif foot » (null tant que le plan n'est pas lancé). */
const jp = computed(() => (fit.etat.plan ? jourPlan(fit.etat, fit.date) : null));
const faiteAujourdhui = computed(() => fit.etat.sessions.some(s => s.date === fit.date && s.type !== 'bureau'));
const typeDuJour = computed(() => (jp.value ? jp.value.seance?.type ?? null : PLANNING[new Date().getDay()] ?? null));
const focus = computed(() => {
  if (faiteAujourdhui.value) return 'Séance faite ✔ Récupère, marche, hydrate-toi.';
  if (fit.etat.plan && !jp.value) return 'Ton plan démarre bientôt : bilan de départ et marche tranquille.';
  if (typeDuJour.value) return `Au programme : ${SEANCES[typeDuJour.value].nom.toLowerCase()}.`;
  return 'Repos actif : une marche tranquille suffit.';
});

/* ——— Objectifs du jour (ceux du plan quand il existe) ——— */
const OBJ_PAUSES = computed(() => jp.value?.pauses || OBJECTIF_PAUSES);
const pauses = computed(() => jour.value.pauses ?? 0);
const OBJ_PAS = computed(() => jp.value?.pas || 8000);
const verres = computed(() => Math.round((fit.nutrition?.eau ?? 2) / 0.25));
const mange = computed(() => jour.value.food.reduce((t, f) => t + f.kcal, 0));
const cible = computed(() => (fit.nutrition?.cible ?? 2000) + fit.bruleAujourdhui.seances);
type Cle = 'pas' | 'eau' | 'repas' | 'pauses';
const anneaux = computed(() => [
  { cle: 'pas' as Cle, label: 'Pas', icone: 'chaussure', couleur: 'var(--accent)', couleur2: 'var(--volt-2)', ratio: jour.value.steps / OBJ_PAS.value, val: jour.value.steps >= 10000 ? `${(jour.value.steps / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k` : jour.value.steps.toLocaleString('fr-FR'), obj: `/ ${(OBJ_PAS.value / 1000).toLocaleString('fr-FR')}k` },
  { cle: 'eau' as Cle, label: 'Eau', icone: 'goutte', couleur: 'var(--eau)', ratio: jour.value.water / verres.value, val: `${(jour.value.water * 0.25).toLocaleString('fr-FR')}`, obj: `/ ${(fit.nutrition?.eau ?? 2).toLocaleString('fr-FR')} L` },
  { cle: 'repas' as Cle, label: 'Repas', icone: 'repas', couleur: mange.value > cible.value ? 'var(--bad)' : 'var(--flamme)', ratio: mange.value / cible.value, val: mange.value.toLocaleString('fr-FR'), obj: `/ ${cible.value.toLocaleString('fr-FR')}` },
  { cle: 'pauses' as Cle, label: 'Pauses', icone: 'bureau', couleur: 'var(--pause)', ratio: pauses.value / OBJ_PAUSES.value, val: String(pauses.value), obj: `/ ${OBJ_PAUSES.value}` },
]);
const choix = ref<Cle>('pas');

function verre(n: number) {
  fit.eau(n);
  if (fit.jourLu().water === verres.value) celebrer('💧 Objectif hydratation atteint !');
}
function ajouterPause() {
  fit.pause(pauses.value + 1);
  if (pauses.value === OBJ_PAUSES.value) celebrer('🪑 Toutes tes pauses actives sont faites !'); else toast(`Pause ${pauses.value} / ${OBJ_PAUSES.value} ✅`, { type: 'ok' });
}
async function podometre() {
  if (fit.podoActif) toast(`${fit.arreterPodometre().toLocaleString('fr-FR')} pas comptés ✅`, { type: 'ok' });
  else if (await fit.demarrerPodometre()) toast('Comptage lancé 👟');
}
const saisiePas = ref('');
function enregistrerPas() {
  if (saisiePas.value === '') return toast('Entre ton nombre de pas');
  const v = Number(saisiePas.value) || 0;
  fit.pas(v); saisiePas.value = '';
  if (v >= OBJ_PAS.value) celebrer('👟 Objectif de pas atteint !'); else toast('Pas enregistrés');
}
const pasSemaine = computed(() => Array.from({ length: 7 }, (_, k) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - k));
  return { j: JOURS[d.getDay()]![0], v: fit.etat.days[iso(d)]?.steps ?? 0, auj: k === 6 };
}));
const maxPas = computed(() => Math.max(OBJ_PAS.value, ...pasSemaine.value.map(x => x.v)));

/* ——— Poids ——— */
const pesePas = computed(() => !fit.etat.weights.some(w => w.date === fit.date));
const pesee = ref('');
function peser() {
  const v = Number(pesee.value.replace(',', '.'));
  try {
    const palier = fit.ajouterPesee(v);
    pesee.value = '';
    if (palier) celebrer(`🏅 Palier atteint : sous les ${palier} kg !`); else toast('Pesée enregistrée ✅', { type: 'ok' });
  } catch { toast('Poids invalide', { type: 'danger' }); }
}
/** Mini-courbe des 12 dernières pesées. */
const spark = computed(() => {
  const w = peseesTriees(fit.etat).slice(-12);
  if (w.length < 2) return null;
  const v = w.map(x => x.kg);
  const lo = Math.min(...v), hi = Math.max(...v), W = 120, H = 44;
  const pts = v.map((y, i) => [(i / (v.length - 1)) * W, 4 + (1 - (y - lo) / Math.max(0.5, hi - lo)) * (H - 8)] as const);
  const ligne = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return { ligne, aire: `${ligne} L${W},${H} L0,${H} Z`, dernier: pts[pts.length - 1]!, W, H };
});

/* ——— Série, semaine, badges ——— */
const datesFaites = computed(() => new Set(fit.etat.sessions.map(s => s.date)));
const semaineJours = computed(() => Array.from({ length: 7 }, (_, k) => {
  const d = lireDate(lundi()); d.setDate(d.getDate() + k);
  const i = iso(d);
  return { l: JOURS[d.getDay()]![0], fait: datesFaites.value.has(i), auj: i === fit.date, futur: i > fit.date };
}));
const semaine = computed(() => ({ n: seancesSemaine(fit.etat).length, kcal: bruleSemaine(fit.etat) }));
const badges = computed(() => BADGES.map(b => ({ ...b, ok: b.test(fit.etat) })));
const nbBadges = computed(() => badges.value.filter(b => b.ok).length);
const prochain = computed(() => badges.value.find(b => !b.ok));

function habitude(id: string, v: boolean) {
  fit.habitude(id, v);
  if (HABITUDES.every(h => fit.jourLu().habits[h.id])) celebrer('✅ Journée parfaite !');
}
const nbHabitudes = computed(() => HABITUDES.filter(h => jour.value.habits[h.id]).length);
</script>

<template>
  <div class="page accueil entree">
    <!-- Héros -->
    <header class="hero" style="--i: 0">
      <p class="kicker">{{ dateLongue(new Date()) }}</p>
      <h1 class="display">{{ salut }}<template v-if="p.name">, <span>{{ p.name }}</span></template></h1>
      <p class="focus">{{ focus }}</p>
      <router-link to="/poids" class="terrain" aria-label="Progression vers l’objectif">
        <span class="t-ic"><Icone nom="ballon" :taille="20" /></span>
        <span class="grow">
          <span class="row between"><b class="t-l">Vers le terrain</b><b class="num">{{ Math.round(pct) }} %</b></span>
          <span class="progress"><i :style="{ width: pct + '%' }" /></span>
          <small><b class="num">{{ kg(Math.max(0, fit.poids - p.goalWeight)) }} kg</b> avant ton objectif de {{ kg(p.goalWeight) }} kg</small>
        </span>
      </router-link>
    </header>

    <!-- Plan du jour (agent PLAN) -->
    <div class="section plan" style="--i: 1"><CartePlanDuJour /></div>

    <div class="cols-desk" style="--i: 2">
      <div>
        <!-- Anneaux du jour -->
        <section class="card pad section jour" style="--i: 2" aria-labelledby="t-jour">
          <div class="row between"><h2 id="t-jour" class="card-title">Aujourd’hui</h2><span class="tiny muted"><Icone nom="feu" :taille="13" class="flam" /> {{ fit.bruleAujourdhui.total }} kcal brûlées</span></div>
          <div class="anneaux" role="tablist" aria-label="Objectifs du jour">
            <button v-for="a in anneaux" :key="a.cle" type="button" role="tab" class="anneau-btn" :class="{ on: choix === a.cle }" :aria-selected="choix === a.cle" :aria-controls="'pan-' + a.cle" @click="choix = a.cle">
              <Anneau :ratio="a.ratio" :taille="70" :epaisseur="8" :couleur="a.couleur" :couleur2="a.couleur2">
                <Icone :nom="a.icone" :taille="22" :style="{ color: a.couleur }" />
              </Anneau>
              <b class="num">{{ a.val }}</b>
              <small>{{ a.label }} <span class="dim">{{ a.obj }}</span></small>
            </button>
          </div>

          <div :id="'pan-' + choix" class="panneau" role="tabpanel">
            <transition name="fade" mode="out-in">
              <div v-if="choix === 'pas'" key="pas">
                <div class="semaine-pas" aria-label="Pas des 7 derniers jours">
                  <div v-for="(d, k) in pasSemaine" :key="k" :class="{ ok: d.v >= OBJ_PAS, auj: d.auj }" :title="`${d.v.toLocaleString('fr-FR')} pas`"><i :style="{ height: Math.max(4, (d.v / maxPas) * 100) + '%' }" /><small>{{ d.j }}</small></div>
                </div>
                <button type="button" class="btn full" :class="fit.podoActif ? 'dark' : 'primary'" @click="podometre"><Icone :nom="fit.podoActif ? 'pause' : 'play'" :taille="18" /> {{ fit.podoActif ? 'Arrêter le comptage' : 'Compter mes pas' }}</button>
                <p v-if="fit.podoActif" class="small podo"><i class="pulse" /> Comptage en cours : garde l’app ouverte, téléphone en poche ou en main.</p>
                <details class="small saisie-d">
                  <summary class="muted">Saisir le total de l’app Santé</summary>
                  <form class="row saisie" @submit.prevent="enregistrerPas">
                    <input v-model="saisiePas" class="input" type="number" inputmode="numeric" min="0" placeholder="Ex : 7 500" aria-label="Nombre de pas">
                    <button class="btn" type="submit">OK</button>
                  </form>
                  <p class="tiny muted">iPhone : app Santé → Activité → Pas. Le total saisi remplace celui du jour.</p>
                </details>
              </div>
              <div v-else-if="choix === 'eau'" key="eau">
                <div class="verres">
                  <button v-for="n in verres" :key="n" type="button" class="verre" :class="{ plein: n <= jour.water }" :aria-label="`${n} verre${n > 1 ? 's' : ''} (25 cl)`" :aria-pressed="n <= jour.water" @click="verre(n)"><i /></button>
                </div>
                <p class="tiny muted">Un verre = 25 cl. Touche un verre pour le remplir (ou le vider).</p>
              </div>
              <div v-else-if="choix === 'repas'" key="repas">
                <ul class="kv">
                  <li><span>Mangé</span><b class="num">{{ mange }} kcal</b></li>
                  <li><span>Repère du jour (avec séances)</span><b class="num">{{ cible }} kcal</b></li>
                  <li><span>Brûlé : séances / marche</span><b class="num">{{ fit.bruleAujourdhui.seances }} / {{ fit.bruleAujourdhui.marche }} kcal</b></li>
                </ul>
                <router-link to="/nutrition" class="btn full soft"><Icone nom="plus" :taille="18" /> Ajouter un repas</router-link>
              </div>
              <div v-else key="pauses">
                <p class="small muted pz">Assis toute la journée ? Lève-toi et bouge quelques minutes régulièrement : nuque, dos, hanches. La séance « pause active » compte automatiquement.</p>
                <div class="row">
                  <button type="button" class="btn primary grow" @click="lancerSeance('bureau')"><Icone nom="play" :taille="18" /> Pause active 4 min</button>
                  <button type="button" class="btn" aria-label="Noter une pause faite" @click="ajouterPause"><Icone nom="plus" :taille="18" /> 1</button>
                </div>
                <router-link to="/exercices?cat=Bureau" class="lien small ex-bureau">Voir les exercices de bureau</router-link>
              </div>
            </transition>
          </div>
        </section>

        <!-- Habitudes -->
        <section class="card pad section" style="--i: 4" aria-labelledby="t-hab">
          <div class="row between"><h2 id="t-hab" class="card-title">Habitudes</h2><span class="tag" :class="{ volt: nbHabitudes === HABITUDES.length }">{{ nbHabitudes }} / {{ HABITUDES.length }}</span></div>
          <ul class="habitudes">
            <li v-for="h in HABITUDES" :key="h.id">
              <label :class="{ fait: !!jour.habits[h.id] }">
                <span class="emo" aria-hidden="true">{{ h.icone }}</span>
                <span class="grow">{{ h.label }}</span>
                <input type="checkbox" class="coche" :checked="!!jour.habits[h.id]" @change="habitude(h.id, ($event.target as HTMLInputElement).checked)">
              </label>
            </li>
          </ul>
        </section>
      </div>

      <div>
        <!-- Poids -->
        <section class="card section poids" style="--i: 3">
          <router-link to="/poids" class="poids-lien" aria-label="Voir ma progression de poids">
            <div class="grow">
              <p class="label">Poids</p>
              <p class="bignum num">{{ kg(fit.poids) }}<small>kg</small></p>
              <p class="small delta" :class="perdu >= 0 ? 'good' : 'bad'">
                <Icone :nom="perdu >= 0 ? 'tendanceBas' : 'tendanceHaut'" :taille="16" />
                {{ perdu >= 0 ? '−' : '+' }}{{ kg(Math.abs(perdu)) }} kg depuis le début
              </p>
              <p v-if="fit.tendance" class="tiny muted">{{ fit.tendance.parSemaine <= 0 ? '' : '+' }}{{ kg(fit.tendance.parSemaine) }} kg / semaine (4 sem.)</p>
            </div>
            <svg v-if="spark" class="spark" :viewBox="`0 0 ${spark.W} ${spark.H}`" aria-hidden="true">
              <defs><linearGradient id="sparkG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".28" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient></defs>
              <path :d="spark.aire" fill="url(#sparkG)" />
              <path :d="spark.ligne" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              <circle :cx="spark.dernier[0]" :cy="spark.dernier[1]" r="4" fill="currentColor" stroke="var(--surface)" stroke-width="2" />
            </svg>
            <Icone nom="droite" :taille="18" class="dim chev" />
          </router-link>
          <form v-if="pesePas" class="row pesee" @submit.prevent="peser">
            <input v-model="pesee" class="input" type="number" inputmode="decimal" step="0.1" :placeholder="`Pesée du matin (${kg(fit.poids)})`" aria-label="Poids ce matin (kg)">
            <button class="btn primary" type="submit" :disabled="!pesee">Peser</button>
          </form>
        </section>

        <!-- Série & badges -->
        <section class="card pad section serie" style="--i: 5" aria-labelledby="t-serie">
          <div class="row">
            <span class="flamme" :class="{ eteinte: !fit.serie }"><Icone nom="feu" :taille="30" /></span>
            <div class="grow">
              <h2 id="t-serie" class="sr-only">Série et badges</h2>
              <p class="bignum num">{{ fit.serie }}<small>{{ fit.serie > 1 ? 'jours de suite' : 'jour de suite' }}</small></p>
              <p class="tiny muted">{{ semaine.n }} séance{{ semaine.n > 1 ? 's' : '' }} cette semaine · {{ semaine.kcal.toLocaleString('fr-FR') }} kcal brûlées</p>
            </div>
          </div>
          <ol class="dots" aria-label="Séances de la semaine">
            <li v-for="(d, k) in semaineJours" :key="k" :class="{ fait: d.fait, auj: d.auj, futur: d.futur }" :aria-label="`${d.l} : ${d.fait ? 'séance faite' : 'pas de séance'}`">
              <span><Icone v-if="d.fait" nom="check" :taille="14" :epaisseur="3" /></span><small>{{ d.l }}</small>
            </li>
          </ol>
          <router-link to="/profil#badges" class="badge-lien">
            <span class="b-ic">{{ prochain ? '🔒' : '👑' }}</span>
            <span class="grow"><small class="muted">{{ nbBadges }} / {{ badges.length }} badges · prochain</small><b>{{ prochain ? prochain.label : 'Tous débloqués !' }}</b></span>
            <Icone nom="droite" :taille="18" class="dim" />
          </router-link>
        </section>

        <!-- Raccourcis -->
        <nav class="section raccourcis" style="--i: 6" aria-label="Raccourcis">
          <router-link to="/exercices"><span><Icone nom="livre" /></span>Exercices</router-link>
          <router-link to="/exercices?cat=Football"><span><Icone nom="ballon" /></span>Ballon</router-link>
          <router-link to="/nutrition"><span><Icone nom="repas" /></span>Nutrition</router-link>
          <router-link to="/seances"><span><Icone nom="calendrier" /></span>Semaine</router-link>
        </nav>

        <section class="card pad section conseil" style="--i: 7">
          <span class="c-ic"><Icone nom="info" :taille="18" /></span>
          <p><b>Conseil du jour</b>{{ conseil }}</p>
        </section>
      </div>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Accueil" } }
</route>

<style scoped>
/* Héros */
.hero { padding: 6px 2px 0; }
.hero h1 { margin: 6px 0 6px; font-size: 46px; }
.hero h1 span { color: var(--accent); }
.focus { margin: 0 0 14px; font-size: 16.5px; font-weight: 600; color: var(--muted); }
.terrain { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 18px; background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-sm); color: inherit; text-decoration: none; max-width: 520px; }
.t-ic { width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--pitch-grad); color: #fff; }
.terrain .row { margin-bottom: 6px; }
.t-l { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; color: var(--accent); }
.terrain .progress { display: block; }
.terrain small { display: block; margin-top: 6px; font-size: 12.5px; color: var(--muted); }
.terrain small b { color: var(--text); }
.plan :deep(> *) { display: block; }

/* Anneaux */
.card-title { margin: 0; font-size: 17px; font-weight: 900; font-stretch: 80%; text-transform: uppercase; letter-spacing: .03em; }
.flam { display: inline; vertical-align: -2px; color: var(--flamme); }
.anneaux { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin: 14px -6px 0; }
.anneau-btn { display: grid; justify-items: center; gap: 2px; padding: 8px 0 8px; border: 0; border-radius: 18px; background: none; color: inherit; transition: background .2s; }
.anneau-btn.on { background: var(--surface-2); }
.anneau-btn b { margin-top: 6px; font-size: 18px; font-weight: 900; font-stretch: 80%; line-height: 1; }
.anneau-btn small { font-size: 11.5px; font-weight: 700; color: var(--muted); white-space: nowrap; }
.anneau-btn small .dim { font-weight: 600; }
.panneau { margin-top: 12px; padding-top: 14px; border-top: 1px solid var(--border); min-height: 120px; }
.panneau .kv { margin-bottom: 14px; }
.semaine-pas { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; height: 76px; margin: 0 0 14px; }
.semaine-pas div { display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 5px; }
.semaine-pas i { display: block; width: 100%; max-width: 24px; border-radius: 8px 8px 4px 4px; background: var(--surface-3); transition: height .6s var(--ease); }
.semaine-pas .ok i { background: var(--brand-grad); }
.semaine-pas .auj small { color: var(--text); }
.semaine-pas small { font-size: 11px; color: var(--dim); font-weight: 800; }
.podo { display: flex; align-items: center; gap: 8px; color: var(--good); margin: 10px 0 0; font-weight: 700; }
.podo i { width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex: none; }
.saisie-d { margin-top: 12px; }
.saisie { margin-top: 8px; }
.verres { display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 8px; margin-bottom: 8px; }
.verre { height: 48px; padding: 3px; border-radius: 6px 6px 12px 12px; border: 2px solid color-mix(in srgb, var(--eau) 55%, transparent); background: transparent; display: flex; align-items: flex-end; transition: transform .15s var(--ease-spring); }
.verre:active { transform: scale(.9); }
.verre i { display: block; width: 100%; height: 0; border-radius: 3px 3px 8px 8px; background: linear-gradient(to top, var(--eau), color-mix(in srgb, var(--eau-vif) 70%, #fff)); transition: height .35s var(--ease); }
.verre.plein i { height: 100%; }
.pz { margin: 0 0 12px; }
.ex-bureau { display: inline-block; margin-top: 12px; }

/* Poids */
.poids { overflow: hidden; }
.poids-lien { display: flex; align-items: center; gap: 12px; padding: 18px 16px 16px 18px; color: inherit; text-decoration: none; }
.poids .bignum { font-size: 44px; margin: 4px 0 6px; }
.delta { display: flex; align-items: center; gap: 4px; margin: 0 0 2px; font-weight: 800; white-space: nowrap; }
.poids .tiny { margin: 0; }
.spark { width: 120px; height: 56px; flex: none; color: var(--accent); overflow: visible; }
.chev { flex: none; }
.pesee { padding: 0 16px 16px; }

/* Série */
.flamme { width: 58px; height: 58px; flex: none; border-radius: 20px; display: grid; place-items: center; color: #fff; background: linear-gradient(160deg, #ffb340, #ff5a1f); box-shadow: 0 10px 24px -10px #ff5a1f; }
.flamme :deep(path) { fill: rgba(255,255,255,.25); }
.flamme.eteinte { background: var(--surface-2); color: var(--dim); box-shadow: none; }
.serie .bignum { font-size: 36px; }
.serie .bignum small { font-size: 14px; }
.serie .tiny { margin: 4px 0 0; }
.dots { list-style: none; margin: 16px 0 14px; padding: 0; display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.dots li { display: grid; justify-items: center; gap: 4px; }
.dots span { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-2); border: 2px solid transparent; color: var(--on-volt); }
.dots .fait span { background: var(--volt); }
.dots .auj span { border-color: var(--accent); }
.dots .futur span { opacity: .55; }
.dots small { font-size: 11px; font-weight: 800; color: var(--dim); }
.dots .auj small { color: var(--text); }
.badge-lien { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 16px; background: var(--surface-2); color: inherit; text-decoration: none; }
.b-ic { font-size: 22px; }
.badge-lien small { display: block; font-size: 12px; font-weight: 700; }
.badge-lien b { display: block; font-size: 15px; }

/* Habitudes */
.habitudes { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 6px; }
.habitudes label { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; background: var(--surface-2); font-size: 15px; font-weight: 600; cursor: pointer; transition: background .2s; }
.habitudes label.fait { background: var(--volt-soft); }
.habitudes label.fait .grow { text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--text) 40%, transparent); }
.emo { font-size: 20px; width: 26px; text-align: center; }

/* Raccourcis */
.raccourcis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.raccourcis a { display: grid; justify-items: center; gap: 6px; padding: 12px 2px; border-radius: 18px; color: var(--text); text-decoration: none; font-size: 12px; font-weight: 800; background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-sm); transition: transform .14s var(--ease); }
.raccourcis a:active { transform: scale(.94); }
.raccourcis span { width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; background: var(--brand-soft); color: var(--accent); }

/* Conseil */
.conseil { display: flex; gap: 12px; align-items: flex-start; }
.c-ic { width: 34px; height: 34px; flex: none; border-radius: 12px; display: grid; place-items: center; background: color-mix(in srgb, var(--eau) 14%, transparent); color: var(--eau); }
.conseil p { margin: 0; font-size: 14.5px; color: var(--muted); }
.conseil b { display: block; color: var(--text); font-size: 13px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 2px; }

@media (min-width: 992px) {
  .hero h1 { font-size: 64px; }
}
</style>
