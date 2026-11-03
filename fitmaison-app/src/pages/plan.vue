<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { SEANCES } from '@/core/programmes';
import { EXERCICES } from '@/core/exercices';
import { construire, duree, exercicesSeance } from '@/core/seance';
import { aujourdhui, dateCourte, iso, kg, lireDate, lundi } from '@/core/dates';
import { imc } from '@/core/calculs';
import type { BilanPlan, PhaseId } from '@/core/etat';
import {
  DOULEUR_MAX, DUREE_MIN_SEMAINES, PHASES, QUESTIONS_SANTE, SIGNAUX_ARRET, SOURCES, INTENSITE,
  avisMedicalConseille, chronologie, consigneIntensite, jalonsFoot, jourPlan, planNutrition, prochainBilan, progresPhase,
  repriseConseillee, semaineDuPlan, lundiSemaine,
} from '@/core/plan';
import { bip } from '@/core/audio';
import { lancerSeance } from '@/composables/useSeance';
import { toast } from '@/composables/useToast';
import { confirmer } from '@/composables/useConfirm';
import { celebrer } from '@/composables/useCelebration';
import Icone from '@/components/Icone.vue';

const fit = useFit();
const route = useRoute();
const plan = computed(() => fit.etat.plan);
const p = computed(() => fit.profil!);

// ---------- Démarrage (pas encore de plan) ----------
const reponses = ref<Record<string, boolean>>(Object.fromEntries((fit.etat.plan?.sante?.oui ?? []).map(id => [id, true])));
const prochainLundi = (() => { const d = lireDate(lundi()); d.setDate(d.getDate() + 7); return iso(d); })();
const depart = ref<'auj' | 'lundi'>(new Date().getDay() === 1 ? 'auj' : 'lundi');
const pasDepart = ref<number | ''>('');
const imcActuel = computed(() => imc(p.value, fit.poids));
function commencer() {
  fit.demarrerPlan(depart.value === 'auj' ? aujourdhui() : prochainLundi, pasDepart.value ? Number(pasDepart.value) : undefined);
  fit.repondreSante(Object.keys(reponses.value).filter(k => reponses.value[k]));
  celebrer('⚽ Ton plan Objectif Foot est prêt !');
  window.scrollTo({ top: 0 });
}
const avis = computed(() => avisMedicalConseille(fit.etat));
const avisApercu = computed(() => {
  const r: string[] = [];
  if (imcActuel.value >= 35) r.push('IMC ≥ 35');
  if (Object.values(reponses.value).some(Boolean)) r.push('au moins un « oui »');
  return r;
});

// ---------- Plan en cours ----------
const j = computed(() => (plan.value ? jourPlan(fit.etat, fit.date) : null));
const avant = computed(() => !!plan.value && !j.value);
const semaine = computed(() => (plan.value ? semaineDuPlan(fit.etat, j.value ? fit.date : plan.value.debut) : []));
const chrono = computed(() => (plan.value ? chronologie(fit.etat, fit.date) : []));
const progres = computed(() => (plan.value ? progresPhase(fit.etat, fit.date) : null));
/** Bilan de départ : affiché une seule fois dans la semaine (premier jour possible). */
const premierJourDepart = computed(() => (plan.value ? (plan.value.debut > fit.date ? plan.value.debut : fit.date) : ''));
const bilanSuivant = computed(() => (plan.value ? prochainBilan(fit.etat, fit.date) : null));
const jalons = computed(() => jalonsFoot(fit.etat, fit.date));
const reprise = computed(() => (plan.value ? repriseConseillee(fit.etat, fit.date) : 0));
const nutri = computed(() => planNutrition(fit.etat));
const jour = computed(() => fit.jourLu());
const faitLe = (d: string, t?: string) => fit.etat.sessions.some(s => s.date === d && (t ? s.type === t : s.type !== 'bureau'));
/** Lundi d'une semaine du plan (frise des phases). */
const lundiDe = (semaine: number) => lundiSemaine(plan.value!, semaine, fit.date);
/** Noms courts pour le calendrier de la semaine. */
const COURT: Record<string, string> = { full: 'Full body', cardio: 'Cardio', renfo: 'Renfo', marche: 'Marche', mobilite: 'Mobilité', bureau: 'Pause', souffle: 'Souffle', foot: 'Ballon', intervalles: 'Interv.', marche_course: 'Trot', prevention: '11+' };
const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const seanceDuJour = computed(() => j.value?.seance ?? null);
const etapesDuJour = computed(() => (seanceDuJour.value ? construire(seanceDuJour.value.type, seanceDuJour.value.niveau, { remplacements: fit.etat.remplacements }) : []));
const exosDuJour = computed(() => exercicesSeance(etapesDuJour.value).map(id => EXERCICES[id]).filter(e => !!e).slice(0, 8));
const faiteAujourdhui = computed(() => !!seanceDuJour.value && faitLe(fit.date, seanceDuJour.value.type));
const minutes = (t: string, n: 1 | 2 | 3) => Math.round(duree(construire(t as never, n)) / 60);

function demarrer() {
  const s = seanceDuJour.value;
  if (s) lancerSeance(s.type, { niveau: s.niveau, plan: true });
}
function reprendre() {
  fit.reprendrePlan(reprise.value);
  toast('On reprend en douceur : cette semaine est allégée 💪', { type: 'ok', duree: 4000 });
}

// Douleur du jour
const douleur = computed({ get: () => jour.value.douleur ?? 0, set: v => fit.douleur(Number(v)) });

// ---------- Bilan guidé ----------
const bilanOuvert = ref(route.hash === '#bilan');
const vide = (): Partial<BilanPlan> => ({ poids: fit.poids || undefined });
const bilan = ref<Partial<BilanPlan>>(vide());
const longueur = ref<number | ''>(''); // longueur d'un aller (m)
const allers = ref<number | ''>('');
watch([longueur, allers], ([l, a]) => { if (l && a) bilan.value.marche6 = Math.round(Number(l) * Number(a)); });
const nombre = (v: unknown) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v));
function enregistrerBilan() {
  const b: BilanPlan = { date: fit.date };
  (['marche6', 'assisDebout', 'gainage', 'escaliers', 'poids', 'tour', 'douleur'] as const).forEach(k => { const v = nombre(bilan.value[k]); if (v !== undefined) b[k] = v; });
  if (bilan.value.parole !== undefined) b.parole = bilan.value.parole;
  if (Object.keys(b).length < 3) return toast('Note au moins deux mesures (ex. marche 6 min et escaliers).', { type: 'warn' });
  const phaseAvant = j.value?.phase.id;
  const premier = !plan.value?.bilans.length;
  fit.ajouterBilan(b);
  bilanOuvert.value = false;
  bilan.value = vide(); longueur.value = ''; allers.value = '';
  const valide = chronologie(fit.etat, fit.date).some(c => c.phase.id === phaseAvant && c.statut === 'faite' && c.valide?.date === fit.date);
  if (valide) celebrer(phaseAvant === 'terrain' ? '🏆 Prêt pour un entraînement de foot !' : '✅ Bilan réussi : la phase suivante commence lundi !');
  else if (progresPhase(fit.etat, fit.date).reussi) toast('Bilan réussi ! Le passage se fera au bilan de fin de phase 👍', { type: 'ok', duree: 4000 });
  else toast(premier ? 'Bilan de départ enregistré : c’est ton point de comparaison 💪' : 'Bilan enregistré. Regarde ce qui reste à valider 👇', { type: 'ok', duree: 4000 });
}

// Minuteur des tests (6 min de marche, 30 s d'assis-debout, gainage)
const minuteur = ref<{ total: number; reste: number; nom: string; croissant?: boolean } | null>(null);
let tic: ReturnType<typeof setInterval> | undefined;
function lancerMinuteur(nom: string, total: number, croissant = false) {
  clearInterval(tic);
  bip(660, 1);
  const debut = Date.now();
  minuteur.value = { nom, total, reste: total, croissant };
  tic = setInterval(() => {
    const m = minuteur.value!;
    const e = (Date.now() - debut) / 1000;
    m.reste = croissant ? e : Math.max(0, total - e);
    if (!croissant && m.reste <= 0) { clearInterval(tic); bip(1320, 400); setTimeout(() => bip(1320, 400), 500); }
  }, 200);
}
function arreterMinuteur() {
  clearInterval(tic);
  const m = minuteur.value;
  if (m?.croissant) bilan.value.gainage = Math.round(m.reste);
  minuteur.value = null;
}
onBeforeUnmount(() => clearInterval(tic));
const affiche = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- Réglages ----------
const rappel = computed(() => plan.value?.rappel ?? { actif: false, minutes: 60, debut: 9, fin: 18 });
const notifPossible = typeof Notification !== 'undefined';
async function basculerNotif(v: boolean) {
  const ok = await fit.reglerRappel({ notification: v });
  if (v && ok) toast('Notifications activées (seulement quand l’app est ouverte en arrière-plan).', { type: 'ok' });
}
const phaseChoisie = ref<PhaseId | ''>('');
async function choisirPhase() {
  if (!phaseChoisie.value) return;
  const ph = PHASES.find(x => x.id === phaseChoisie.value)!;
  if (await confirmer(`Passer directement à « ${ph.nom} » à partir d’aujourd’hui ? Les bilans de passage resteront nécessaires pour la suite.`, { ok: 'Changer', annuler: 'Annuler', danger: false })) {
    fit.forcerPhase(phaseChoisie.value);
    toast(`Phase « ${ph.nom} » à partir d’aujourd’hui`);
  }
  phaseChoisie.value = '';
}
async function arreter() {
  if (await confirmer('Arrêter le plan ? Tes séances et pesées restent enregistrées, mais les bilans du plan seront effacés.', { ok: 'Arrêter le plan', annuler: 'Garder' })) fit.arreterPlan();
}
const feuVert = computed({ get: () => !!plan.value?.sante?.avisMedical, set: v => fit.repondreSante(plan.value?.sante?.oui ?? [], v) });
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div class="grow">
        <p class="kicker">Objectif foot</p>
        <h1 class="page-title">Mon plan</h1>
        <p class="page-sub">Perdre du poids et retrouver le souffle pour rejouer au foot, à la maison et au jardin. Tu avances quand ton corps est prêt, pas seulement quand le calendrier le dit.</p>
      </div>
    </header>

    <!-- ===================== Démarrage ===================== -->
    <template v-if="!plan">
      <section class="card pitch pad-lg intro">
        <p class="kicker">{{ DUREE_MIN_SEMAINES }} semaines minimum · 4 phases</p>
        <h2 class="display">Du canapé au terrain</h2>
        <ol class="phases-intro">
          <li v-for="(ph, k) in PHASES" :key="ph.id"><span class="n">{{ k + 1 }}</span><span><b>{{ ph.icone }} {{ ph.nom }}</b> <small>{{ ph.semaines }} sem. min.</small><br><small class="muted">{{ ph.but }}</small></span></li>
        </ol>
        <p class="small muted">Chaque phase se termine par un bilan simple (marche de 6 min, assis-debout, escaliers…). Bilan réussi : tu passes à la suite. Sinon : on prolonge de 2 semaines, sans culpabiliser.</p>
      </section>

      <section class="card pad section">
        <h2 class="card-title"><Icone nom="medical" :taille="20" /> Avant de commencer : 8 questions de sécurité</h2>
        <p class="small muted">Inspirées du questionnaire PAR-Q+ (le questionnaire officiel, gratuit, est sur <a href="https://eparmedx.com/" target="_blank" rel="noopener">eparmedx.com</a>). Réponds honnêtement : rien n’est envoyé, tout reste sur ton téléphone.</p>
        <ul class="rows questions">
          <li v-for="q in QUESTIONS_SANTE" :key="q.id">
            <span class="grow small">{{ q.q }}</span>
            <div class="seg ouinon" role="group" :aria-label="q.q">
              <button type="button" :aria-pressed="reponses[q.id] === false" :class="{ on: reponses[q.id] === false }" @click="reponses[q.id] = false">Non</button>
              <button type="button" :aria-pressed="reponses[q.id] === true" :class="{ on: reponses[q.id] === true }" @click="reponses[q.id] = true">Oui</button>
            </div>
          </li>
        </ul>
        <div v-if="avisApercu.length" class="banner warn">
          <Icone nom="medical" :taille="18" />
          <span><b>Prends rendez-vous chez ton médecin traitant avant de vraiment t’entraîner</b> ({{ avisApercu.join(', ') }}). C’est une précaution normale avec ce profil, pas une mauvaise nouvelle : il vérifiera ta tension, ton cœur et ton souffle, et te dira si des examens sont utiles. En attendant, tu peux marcher à ton rythme et te lever souvent du bureau.</span>
        </div>
      </section>

      <section class="card pad section">
        <h2 class="card-title"><Icone nom="calendrier" :taille="20" /> Ton départ</h2>
        <div class="seg">
          <button type="button" :class="{ on: depart === 'auj' }" @click="depart = 'auj'">Aujourd’hui</button>
          <button type="button" :class="{ on: depart === 'lundi' }" @click="depart = 'lundi'">Lundi {{ dateCourte(prochainLundi) }}</button>
        </div>
        <label class="field section-s">
          <span>Tes pas par jour en ce moment (facultatif)</span>
          <input v-model="pasDepart" class="input" type="number" inputmode="numeric" min="0" placeholder="Ex. 3 000 – sinon on part de 3 000">
        </label>
        <p class="tiny muted">L’objectif de pas augmente d’environ 1 000 toutes les 2 semaines, jusqu’à 10 000.</p>
        <button type="button" class="btn primary lg full section-s" @click="commencer"><Icone nom="play" :taille="20" /> Commencer mon plan</button>
      </section>
    </template>

    <!-- ===================== Plan en cours ===================== -->
    <template v-else>
      <div v-if="avis.conseille && !plan.sante?.avisMedical" class="banner warn">
        <Icone nom="medical" :taille="18" />
        <span class="grow"><b>Pense à voir ton médecin traitant</b> ({{ avis.raisons.join(', ') }}). Montre-lui ce plan : il pourra l’adapter. En attendant, garde l’intensité « facile » (tu peux parler en phrases complètes).
          <label class="row feu"><input v-model="feuVert" type="checkbox" class="coche"> <span class="small">J’ai eu le feu vert de mon médecin</span></label></span>
      </div>
      <div v-if="reprise" class="banner info">
        <Icone nom="synchro" :taille="18" />
        <span class="grow">Ça fait plus d’une semaine sans séance : aucun souci, ça arrive. <b>Reprends là où tu t’étais arrêté</b>, avec une semaine allégée.
          <button type="button" class="btn small soft reprendre" @click="reprendre">Reprendre en douceur</button></span>
      </div>
      <p v-if="avant" class="banner info"><Icone nom="calendrier" :taille="18" /> Ton plan commence le {{ dateCourte(plan.debut) }}. Voici ta première semaine.</p>

      <div class="cols-desk">
        <div>
          <!-- Aujourd'hui -->
          <section v-if="j" class="card pitch pad-lg aujourdhui">
            <div class="row between"><p class="kicker">Aujourd’hui · {{ j.phase.icone }} {{ j.phase.nom }} · semaine {{ j.semaineDansPhase + 1 }}<template v-if="j.etape.prolongation"> (prolongation)</template></p></div>
            <template v-if="seanceDuJour">
              <h2 class="display">{{ SEANCES[seanceDuJour.type].icone }} {{ SEANCES[seanceDuJour.type].nom }}</h2>
              <p class="muted small">{{ Math.round(duree(etapesDuJour) / 60) }} min · niveau {{ seanceDuJour.niveau }} · {{ SEANCES[seanceDuJour.type].desc }}</p>
              <p class="intensite small"><Icone nom="bulle" :taille="15" /> {{ consigneIntensite(seanceDuJour.type) }}</p>
              <ul class="exos">
                <li v-for="e in exosDuJour" :key="e.id" class="tag">{{ e.icone }} {{ e.nom }}</li>
              </ul>
            </template>
            <template v-else>
              <h2 class="display">😌 Repos actif</h2>
              <p class="muted small">Pas de séance : marche tranquillement pour atteindre tes pas, et étire-toi si tu veux.</p>
            </template>
            <p v-if="j.allege" class="note small"><Icone nom="alerte" :taille="15" /> {{ j.allege }}</p>
            <p v-if="j.reprise" class="note small"><Icone nom="synchro" :taille="15" /> Semaine de reprise : niveaux allégés.</p>
            <div class="objectifs">
              <div><span class="tiny muted">Pas visés</span><b class="num">{{ j.pas.toLocaleString('fr-FR') }}</b><div class="progress fin"><i :style="{ width: Math.min(100, (jour.steps / j.pas) * 100) + '%' }" /></div></div>
              <div><span class="tiny muted">Pauses bureau</span><b class="num">{{ jour.pauses ?? 0 }} / {{ j.pauses || '—' }}</b><div class="progress fin"><i :style="{ width: j.pauses ? Math.min(100, ((jour.pauses ?? 0) / j.pauses) * 100) + '%' : '0%' }" /></div></div>
            </div>
            <div class="actions">
              <button v-if="seanceDuJour && !faiteAujourdhui" type="button" class="btn primary lg" @click="demarrer"><Icone nom="play" :taille="20" /> Démarrer</button>
              <span v-else-if="faiteAujourdhui" class="btn on-pitch lg"><Icone nom="check" :taille="20" /> Séance faite, bravo !</span>
              <button v-else type="button" class="btn on-pitch lg" @click="lancerSeance('mobilite')">🧘 Mobilité 10 min</button>
              <button type="button" class="btn on-pitch lg" aria-label="Pause active bureau, 4 minutes" @click="lancerSeance('bureau')"><Icone nom="bureau" :taille="18" /> 4 min</button>
            </div>
            <a href="#securite" class="stop tiny"><Icone nom="alerte" :taille="14" /> Signaux d’arrêt : douleur thoracique, malaise, essoufflement anormal…</a>
          </section>

          <!-- Douleur du jour -->
          <section v-if="j" class="card pad section">
            <h2 class="card-title"><Icone nom="medical" :taille="20" /> Genoux et dos aujourd’hui</h2>
            <div class="row douleur">
              <input v-model="douleur" type="range" min="0" max="10" step="1" class="grow" aria-label="Douleur de 0 à 10">
              <b class="num valeur" :class="{ bad: douleur > DOULEUR_MAX }">{{ douleur }}/10</b>
            </div>
            <p class="tiny muted">Règle de la douleur : jusqu’à {{ DOULEUR_MAX }}/10 et qui disparaît en 24 h, c’est acceptable. Au-dessus, ou si ça ne redescend pas, le plan allège automatiquement les séances suivantes.</p>
          </section>

          <!-- Semaine -->
          <section class="section">
            <div class="section-head"><h2>Ta semaine</h2><span class="small muted" v-if="j">semaine {{ j.semaine + 1 }} du plan</span></div>
            <div class="semaine">
              <div v-for="(d, k) in semaine" :key="k" class="jour card" :class="{ auj: d?.date === fit.date, fait: d && faitLe(d.date, d.seance?.type), repos: !d?.seance, passe: d && d.date < fit.date && !faitLe(d.date, d.seance?.type) && d.seance }">
                <span class="tiny jn">{{ JOURS_COURTS[k] }} <small v-if="d">{{ lireDate(d.date).getDate() }}</small></span>
                <span class="ic" aria-hidden="true">{{ d && faitLe(d.date, d.seance?.type) && d.seance ? '✅' : d?.seance ? SEANCES[d.seance.type].icone : '😌' }}</span>
                <b class="tiny nm">{{ d?.seance ? COURT[d.seance.type] : 'Repos' }}</b>
                <small v-if="d?.seance" class="tiny dim">{{ minutes(d.seance.type, d.seance.niveau) }} min · N{{ d.seance.niveau }}</small>
                <span v-if="d?.bilan && (d.bilan !== 'depart' || d.date === premierJourDepart)" class="tag volt bilan">Bilan</span>
              </div>
            </div>
          </section>

          <!-- Bilan -->
          <section id="bilan" class="card pad section">
            <div class="row between">
              <h2 class="card-title"><Icone nom="drapeau" :taille="20" /> Bilan</h2>
              <span v-if="bilanSuivant && !bilanOuvert" class="small muted">{{ bilanSuivant.date === fit.date ? 'aujourd’hui' : 'prévu le ' + dateCourte(bilanSuivant.date) }}</span>
            </div>
            <p v-if="!bilanOuvert" class="small muted">{{ !plan.bilans.length ? 'Ton bilan de départ sert de point de comparaison : fais-le la première semaine (15 min, au jardin ou dans la rue).' : 'Le bilan de fin de phase décide si tu passes à la suite. Tu peux en faire un quand tu veux.' }}</p>
            <button v-if="!bilanOuvert" type="button" class="btn full" :class="{ primary: j?.bilan }" @click="bilanOuvert = true"><Icone nom="drapeau" :taille="18" /> {{ !plan.bilans.length ? 'Faire mon bilan de départ' : 'Faire un bilan' }}</button>

            <form v-else class="bilan-form" @submit.prevent="enregistrerBilan">
              <p class="banner info"><Icone nom="info" :taille="18" /> Échauffe-toi 3 min en marchant. Arrête un test si un signal d’arrêt apparaît (voir plus bas). Tu peux sauter un test.</p>

              <fieldset>
                <legend><span class="n">1</span> Marche de 6 minutes</legend>
                <p class="small muted">Marque un aller (10 à 30 m) bien plat dans le jardin ou la rue. Marche aussi vite que tu peux <b>sans courir</b>, en faisant demi-tour à chaque bout, pendant 6 min. Compte les allers.</p>
                <button type="button" class="btn small soft" @click="lancerMinuteur('Marche 6 min', 360)"><Icone nom="chrono" :taille="16" /> Minuteur 6 min</button>
                <div class="grid2">
                  <label class="field"><span>Longueur d’un aller (m)</span><input v-model="longueur" class="input" type="number" inputmode="decimal" min="1" placeholder="ex. 20"></label>
                  <label class="field"><span>Nombre d’allers</span><input v-model="allers" class="input" type="number" inputmode="decimal" min="0" step="0.5" placeholder="ex. 22"></label>
                </div>
                <label class="field"><span>Distance totale (m)</span><input v-model.number="bilan.marche6" class="input" type="number" inputmode="numeric" min="0" placeholder="ex. 450"></label>
              </fieldset>

              <fieldset>
                <legend><span class="n">2</span> Test de la parole (pendant la marche)</legend>
                <div class="seg trois">
                  <button type="button" :class="{ on: bilan.parole === 2 }" @click="bilan.parole = 2">Phrases complètes</button>
                  <button type="button" :class="{ on: bilan.parole === 1 }" @click="bilan.parole = 1">Phrases courtes</button>
                  <button type="button" :class="{ on: bilan.parole === 0 }" @click="bilan.parole = 0">Quelques mots</button>
                </div>
              </fieldset>

              <fieldset>
                <legend><span class="n">3</span> Assis-debout en 30 s</legend>
                <p class="small muted">Chaise stable contre un mur, bras croisés sur la poitrine. Lève-toi complètement et rassieds-toi, le plus de fois possible en 30 s, sans élan.</p>
                <button type="button" class="btn small soft" @click="lancerMinuteur('Assis-debout', 30)"><Icone nom="chrono" :taille="16" /> Minuteur 30 s</button>
                <label class="field"><span>Répétitions</span><input v-model.number="bilan.assisDebout" class="input" type="number" inputmode="numeric" min="0" placeholder="ex. 12"></label>
              </fieldset>

              <fieldset>
                <legend><span class="n">4</span> Gainage</legend>
                <p class="small muted">Planche sur les genoux (ou chaise contre le mur si le dos tire). Tiens tant que la position reste propre, dos plat.</p>
                <button type="button" class="btn small soft" @click="lancerMinuteur('Gainage', 0, true)"><Icone nom="chrono" :taille="16" /> Chronomètre</button>
                <label class="field"><span>Secondes tenues</span><input v-model.number="bilan.gainage" class="input" type="number" inputmode="numeric" min="0" placeholder="ex. 25"></label>
              </fieldset>

              <fieldset>
                <legend><span class="n">5</span> Escaliers</legend>
                <p class="small muted">Monte un étage (une quinzaine de marches) à ton rythme, puis note ton essoufflement : 0 = aucun, 10 = maximal.</p>
                <div class="row"><input v-model.number="bilan.escaliers" type="range" min="0" max="10" class="grow" aria-label="Essoufflement de 0 à 10"><b class="num valeur">{{ bilan.escaliers ?? '–' }}/10</b></div>
              </fieldset>

              <fieldset>
                <legend><span class="n">6</span> Mesures</legend>
                <div class="grid2">
                  <label class="field"><span>Poids (kg)</span><input v-model.number="bilan.poids" class="input" type="number" inputmode="decimal" step="0.1" min="30" max="350"></label>
                  <label class="field"><span>Tour de taille (cm)</span><input v-model.number="bilan.tour" class="input" type="number" inputmode="decimal" min="40" max="250" placeholder="au nombril"></label>
                </div>
                <label class="field"><span>Douleur genoux / dos pendant les tests (0–10)</span><input v-model.number="bilan.douleur" class="input" type="number" inputmode="numeric" min="0" max="10" placeholder="0"></label>
              </fieldset>

              <div class="row">
                <button type="button" class="btn ghost" @click="bilanOuvert = false">Annuler</button>
                <button type="submit" class="btn primary grow"><Icone nom="check" :taille="18" /> Enregistrer le bilan</button>
              </div>
            </form>

            <ul v-if="plan.bilans.length && !bilanOuvert" class="rows historique">
              <li v-for="b in [...plan.bilans].reverse().slice(0, 4)" :key="b.date">
                <span class="ico">🏁</span>
                <span class="grow"><b>{{ dateCourte(b.date) }}</b><small>
                  <template v-if="b.marche6">{{ b.marche6 }} m en 6 min · </template><template v-if="b.assisDebout !== undefined">{{ b.assisDebout }} assis-debout · </template><template v-if="b.gainage !== undefined">gainage {{ b.gainage }} s · </template><template v-if="b.escaliers !== undefined">escaliers {{ b.escaliers }}/10</template><template v-if="b.poids"> · {{ kg(b.poids) }} kg</template><template v-if="b.tour"> · {{ b.tour }} cm</template>
                </small></span>
              </li>
            </ul>
          </section>
        </div>

        <div>
          <!-- Phases -->
          <section class="card pad section phases-card">
            <h2 class="card-title"><Icone nom="plan" :taille="20" /> Les 4 phases</h2>
            <ol class="timeline">
              <li v-for="c in chrono" :key="c.phase.id" :class="c.statut">
                <span class="pt" aria-hidden="true">{{ c.statut === 'faite' ? '✓' : c.index + 1 }}</span>
                <div class="grow">
                  <b>{{ c.phase.icone }} {{ c.phase.nom }}</b>
                  <small class="muted">{{ c.sautee ? 'passée' : c.statut === 'faite' ? `validée le ${dateCourte(c.valide!.date)}` : c.statut === 'en_cours' ? `en cours · ${c.phase.semaines} sem. min.${c.prolongation ? ` · +${c.prolongation} sem.` : ''}` : `à partir du ${dateCourte(lundiDe(c.debut))}` }}</small>
                  <small v-if="c.statut === 'en_cours'" class="contenu">{{ c.phase.contenu }}</small>
                </div>
              </li>
            </ol>
          </section>

          <!-- Critères de passage -->
          <section v-if="progres && j && !j.pret" class="card pad section">
            <h2 class="card-title"><Icone nom="cible" :taille="20" /> {{ j.phase.id === 'terrain' ? 'Prêt pour un entraînement ?' : `Pour passer à « ${PHASES[PHASES.findIndex(x => x.id === j!.phase.id) + 1]?.nom} »` }}</h2>
            <ul class="criteres">
              <li v-for="c in progres.criteres" :key="c.id" :class="c.ok === true ? 'ok' : c.ok === false ? 'ko' : 'na'">
                <span class="etat" aria-hidden="true">{{ c.ok === true ? '✓' : c.ok === false ? '✗' : '–' }}</span>
                <span class="small">{{ c.label }}</span>
              </li>
            </ul>
            <p class="tiny muted">{{ progres.bilan ? `Mesures de ton bilan du ${dateCourte(progres.bilan.date)}` : 'Pas encore de bilan dans cette phase : « – » = à mesurer' }} ; séances comptées jusqu’à aujourd’hui. Ces seuils sont prudents et propres à ce plan (pas des normes médicales).</p>
          </section>

          <!-- Chemin foot -->
          <section class="card pad section">
            <h2 class="card-title"><Icone nom="ballon" :taille="20" /> Chemin vers le terrain</h2>
            <ol class="jalons">
              <li v-for="m in jalons" :key="m.id" :class="{ ok: m.ok }"><span class="ic">{{ m.ok ? m.icone : '○' }}</span><span class="small">{{ m.label }}</span></li>
            </ol>
            <p v-if="j?.pret" class="banner info"><Icone nom="trophee" :taille="18" /> Tu as validé tous les critères. Pour ton premier entraînement : préviens le coach, fais l’échauffement 11+ complet, joue à intensité réduite et arrête-toi avant d’être épuisé. Les petits sauts peuvent maintenant être introduits progressivement.</p>
            <p v-else class="tiny muted">Pas de saut ni de match avant d’avoir validé la dernière phase : avec du poids en plus, chaque appui charge beaucoup les genoux (chaque kilo perdu les soulage). Le ballon, lui, est là dès la première semaine.</p>
          </section>

          <!-- Nutrition -->
          <section class="card pad section">
            <h2 class="card-title"><Icone nom="assiette" :taille="20" /> Ton assiette</h2>
            <div class="stats3">
              <div class="stat"><b class="num">{{ nutri.cible.toLocaleString('fr-FR') }}</b><span>kcal / jour visées</span></div>
              <div class="stat"><b class="num">{{ nutri.proteines }} g</b><span>protéines / jour</span></div>
              <div class="stat"><b class="num">{{ kg(nutri.perteHebdo) }}</b><span>kg / semaine estimés</span></div>
            </div>
            <p class="small muted">Métabolisme de base ≈ {{ nutri.bmr.toLocaleString('fr-FR') }} kcal (formule de Mifflin-St Jeor), dépense ≈ {{ nutri.tdee.toLocaleString('fr-FR') }} kcal avec ton activité, soit un déficit d’environ {{ nutri.deficit }} kcal. Une perte de <b>0,5 à 1 kg par semaine</b> est considérée comme sûre et durable (NHS). Au début ça va souvent plus vite (eau), puis ça ralentit : c’est normal.</p>
            <ul class="rows">
              <li v-for="r in nutri.repas" :key="r.id"><span class="grow"><b>{{ r.nom }} <span class="tag">~{{ r.kcal }} kcal</span></b><small>{{ r.idee }}</small></span></li>
            </ul>
            <router-link to="/nutrition" class="btn full soft section-s">Noter mes repas <Icone nom="droite" :taille="16" /></router-link>
          </section>

          <!-- Pauses bureau -->
          <section class="card pad section">
            <h2 class="card-title"><Icone nom="bureau" :taille="20" /> Mode bureau</h2>
            <p class="small muted">Rester assis longtemps sans pause est mauvais pour la glycémie, même quand on fait du sport. Lève-toi régulièrement : 2 à 4 min suffisent.</p>
            <label class="row reglage"><span class="grow"><b>Rappel de pause active</b><small class="muted">Quand l’app est ouverte, du lundi au vendredi</small></span><input type="checkbox" class="switch" :checked="rappel.actif" @change="fit.reglerRappel({ actif: ($event.target as HTMLInputElement).checked })"></label>
            <template v-if="rappel.actif">
              <div class="seg">
                <button v-for="m in [30, 45, 60, 90]" :key="m" type="button" :class="{ on: rappel.minutes === m }" @click="fit.reglerRappel({ minutes: m })">{{ m }} min</button>
              </div>
              <div class="grid2 section-s">
                <label class="field"><span>De (heure)</span><input class="input" type="number" min="0" max="23" :value="rappel.debut ?? 9" @change="fit.reglerRappel({ debut: Number(($event.target as HTMLInputElement).value) })"></label>
                <label class="field"><span>À (heure)</span><input class="input" type="number" min="1" max="24" :value="rappel.fin ?? 18" @change="fit.reglerRappel({ fin: Number(($event.target as HTMLInputElement).value) })"></label>
              </div>
              <label v-if="notifPossible" class="row reglage"><span class="grow"><b>Notification système</b><small class="muted">Si l’app est en arrière-plan (ton navigateur te demandera l’autorisation)</small></span><input type="checkbox" class="switch" :checked="!!rappel.notification" @change="basculerNotif(($event.target as HTMLInputElement).checked)"></label>
            </template>
          </section>

          <!-- Sécurité -->
          <section id="securite" class="card pad section securite">
            <h2 class="card-title"><Icone nom="alerte" :taille="20" /> Signaux d’arrêt</h2>
            <p class="small">Arrête-toi tout de suite et, si ça ne passe pas au repos, appelle le <b>15</b> (ou le 112) :</p>
            <ul class="small">
              <li v-for="s in SIGNAUX_ARRET" :key="s">{{ s }}</li>
            </ul>
            <h3 class="small">Bien doser l’effort</h3>
            <ul class="small muted">
              <li>{{ INTENSITE.facile }}</li><li>{{ INTENSITE.moderee }}</li><li>{{ INTENSITE.soutenue }} Pas pour l’instant.</li>
            </ul>
            <p class="tiny muted">Ce plan ne remplace pas un avis médical.</p>
          </section>

          <!-- Réglages du plan -->
          <section class="card pad section">
            <h2 class="card-title"><Icone nom="reglages" :taille="20" /> Réglages du plan</h2>
            <label class="field"><span>Changer de phase (si le plan est trop facile ou trop dur)</span>
              <div class="row"><select v-model="phaseChoisie" class="input grow"><option value="">Choisir…</option><option v-for="ph in PHASES" :key="ph.id" :value="ph.id">{{ ph.icone }} {{ ph.nom }}</option></select><button type="button" class="btn" :disabled="!phaseChoisie" @click="choisirPhase">OK</button></div>
            </label>
            <label v-if="!avis.conseille || plan.sante?.avisMedical !== undefined" class="row reglage"><span class="grow"><b>Feu vert de mon médecin</b><small class="muted">Nécessaire pour valider « prêt pour un entraînement »</small></span><input v-model="feuVert" type="checkbox" class="switch"></label>
            <button type="button" class="btn ghost danger full" @click="arreter">Arrêter le plan</button>
          </section>

          <details class="card pad section sources">
            <summary class="small"><b>Sources du plan</b></summary>
            <ul class="small"><li v-for="s in SOURCES" :key="s.url"><a :href="s.url" target="_blank" rel="noopener">{{ s.nom }}</a></li></ul>
          </details>
        </div>
      </div>
    </template>

    <!-- Minuteur des tests -->
    <div v-if="minuteur" class="voile" @click.self="arreterMinuteur">
      <div class="boite card pad-lg">
        <p class="kicker">{{ minuteur.nom }}</p>
        <b class="chrono num">{{ affiche(minuteur.reste) }}</b>
        <div v-if="!minuteur.croissant" class="progress"><i :style="{ width: (100 - (minuteur.reste / minuteur.total) * 100) + '%' }" /></div>
        <p class="small muted">{{ minuteur.croissant ? 'Arrête quand la position n’est plus propre.' : minuteur.reste <= 0 ? 'Terminé ! Note ton résultat.' : 'Concentre-toi, on bipe à la fin.' }}</p>
        <button type="button" class="btn primary full" @click="arreterMinuteur">{{ minuteur.croissant ? 'Stop' : minuteur.reste <= 0 ? 'Noter' : 'Arrêter' }}</button>
      </div>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Mon plan" } }
</route>

<style scoped>
.intro h2 { margin: 4px 0 12px; font-size: var(--fs-3xl); }
.phases-intro { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 10px; }
.phases-intro li { display: flex; gap: 12px; align-items: flex-start; }
.n { flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--volt); color: var(--on-volt); font-weight: 900; font-size: var(--fs-sm); }
.intro p { margin: 0; }
.questions li { gap: 10px; }
.ouinon { flex: none; width: 116px; }
.ouinon button { min-height: 34px; }
.section-s { margin-top: 12px; }
.feu { margin-top: 8px; gap: 8px; }
.reprendre { margin-top: 8px; display: flex; }
.aujourdhui { display: grid; gap: 8px; }
.aujourdhui p { margin: 0; }
.aujourdhui h2 { margin: 2px 0 0; font-size: var(--fs-3xl); }
.intensite { display: flex; gap: 6px; align-items: flex-start; font-weight: 700; }
.exos { list-style: none; margin: 2px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.exos .tag { background: rgba(255, 255, 255, .14); color: inherit; }
.note { display: flex; gap: 6px; align-items: flex-start; padding: 8px 10px; border-radius: var(--r-xs); background: rgba(255, 255, 255, .12); font-weight: 700; }
.objectifs { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 6px; }
.objectifs > div { display: grid; gap: 4px; }
.objectifs b { font-size: var(--fs-xl); font-weight: 900; font-stretch: 80%; }
.actions { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; margin-top: 8px; }
.stop { display: inline-flex; align-items: center; gap: 6px; color: inherit; opacity: .8; text-decoration: none; font-weight: 700; }
.stop :deep(.ic) { color: var(--volt); }
.douleur { gap: 14px; }
.valeur { min-width: 52px; text-align: right; font-size: var(--fs-lg); }
input[type='range'] { accent-color: var(--accent); min-height: 32px; }
.semaine { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.jour { display: grid; justify-items: center; align-content: start; gap: 2px; padding: 10px 2px 8px; text-align: center; box-shadow: none; min-width: 0; }
.jour .jn { font-weight: 800; color: var(--muted); }
.jour .jn small { color: var(--dim); font-weight: 700; }
.jour .ic { font-size: 22px; line-height: 1.2; }
.jour .nm { font-weight: 800; line-height: 1.15; }
.jour.auj { border-color: var(--accent); box-shadow: 0 0 0 2px var(--brand-soft); }
.jour.repos { background: var(--surface-2); }
.jour.fait { background: var(--brand-soft); }
.jour.passe { opacity: .6; }
.jour .bilan { margin-top: 4px; font-size: 10.5px; padding: 2px 6px; }
.bilan-form { display: grid; gap: 14px; margin-top: 4px; }
.bilan-form .banner { margin: 0; }
fieldset { border: 1px solid var(--border); border-radius: var(--r-sm); padding: 12px 14px 14px; margin: 0; display: grid; gap: 10px; }
legend { display: flex; align-items: center; gap: 8px; padding: 0 6px; font-weight: 800; }
fieldset p { margin: 0; }
fieldset .btn.small { justify-self: start; }
.trois button { font-size: var(--fs-xs); min-height: 44px; line-height: 1.15; }
.historique { margin-top: 8px; }
.timeline { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }
.timeline li { position: relative; display: flex; gap: 12px; padding: 0 0 16px; }
.timeline li:not(:last-child)::before { content: ''; position: absolute; left: 14px; top: 30px; bottom: 2px; width: 2px; background: var(--border-2); }
.timeline li.faite::before { background: var(--accent); }
.timeline .pt { flex: none; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-weight: 900; font-size: var(--fs-sm); background: var(--surface-2); color: var(--muted); border: 2px solid var(--border-2); }
.timeline .faite .pt { background: var(--accent); color: var(--on-brand); border-color: transparent; }
.timeline .en_cours .pt { background: var(--volt); color: var(--on-volt); border-color: transparent; box-shadow: 0 0 0 5px var(--volt-soft); }
.timeline b { display: block; }
.timeline small { display: block; font-size: var(--fs-sm); }
.timeline .contenu { margin-top: 4px; color: var(--text); }
.criteres { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 8px; }
.criteres li { display: flex; gap: 10px; align-items: flex-start; }
.criteres .etat { flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 900; background: var(--surface-2); color: var(--dim); }
.criteres .ok .etat { background: var(--volt); color: var(--on-volt); }
.criteres .ko .etat { background: color-mix(in srgb, var(--warn) 22%, transparent); color: var(--warn); }
.jalons { list-style: none; margin: 0 0 6px; padding: 0; display: grid; gap: 8px; }
.jalons li { display: flex; gap: 10px; align-items: center; color: var(--muted); }
.jalons li.ok { color: var(--text); font-weight: 700; }
.jalons .ic { width: 26px; text-align: center; font-size: 18px; }
.reglage { padding: 10px 0; gap: 12px; }
.reglage b, .reglage small { display: block; }
.securite ul { margin: 6px 0 10px; padding-left: 18px; display: grid; gap: 4px; }
.securite h3 { margin: 12px 0 0; }
.sources summary { cursor: pointer; }
.sources ul { margin: 10px 0 0; padding-left: 18px; display: grid; gap: 6px; }
.voile { position: fixed; inset: 0; z-index: 80; background: rgba(0, 0, 0, .55); display: grid; place-items: center; padding: 20px; }
.boite { width: min(380px, 100%); display: grid; gap: 12px; text-align: center; }
.boite p { margin: 0; }
.chrono { font-size: 64px; font-weight: 900; font-stretch: 75%; line-height: 1; }
@media (max-width: 420px) {
  .jour .nm { font-size: 10px; }
  .jour small.dim { font-size: 9.5px; }
}
</style>
