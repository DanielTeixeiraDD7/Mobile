<script setup lang="ts">
import { EXERCICES, ANIM_REPOS, MATERIEL } from '@/core/exercices';
import { construire, type Etape } from '@/core/seance';
import { SEANCES, type TypeSeance } from '@/core/programmes';
import { kcalSeance } from '@/core/calculs';
import { aujourdhui, minutes } from '@/core/dates';
import { bip, dire, taireVoix, vibrer } from '@/core/audio';
import type { SeanceFaite } from '@/core/etat';
import { useFit } from '@/stores/fit';
import { ouvrirFiche } from '@/composables/useSeance';
import { toast } from '@/composables/useToast';
import Figurine from './Figurine.vue';
import Icone from './Icone.vue';

/** Lecteur plein écran : démonstration, minuteur, voix, bips, conseils, version plus facile en un geste. */
const props = defineProps<{ type: TypeSeance }>();
const emit = defineEmits<{ fermer: [] }>();
const fit = useFit();
const r = fit.reglages;

const etapes = ref<(Etape & { passe?: number })[]>(construire(props.type, fit.profil!.level, { vus: fit.etat.vus, demo: r.demo !== false, remplacements: fit.etat.remplacements }));
const i = ref(0);
const reste = ref(etapes.value[0]!.dur);
const enMarche = ref(false);
const ecoule = ref(0);
const fini = ref<SeanceFaite | null>(null);
const quitter = ref(false);
const voix = ref(r.voice);
let minuterie: ReturnType<typeof setInterval> | undefined;
let dernier = 0;
let verrou: WakeLockSentinel | null = null;
const pasDebut = fit.jourLu().steps;
let podoAuto = false;

const etape = computed(() => etapes.value[i.value]!);
const suivante = computed(() => etapes.value[i.value + 1]);
const ex = computed(() => EXERCICES[etape.value.cle]);
const exSuivant = computed(() => (suivante.value ? EXERCICES[suivante.value.cle] : undefined));
/** Pendant le repos, on montre (et on prépare) l'exercice qui arrive. */
const montre = computed(() => (etape.value.phase === 'rest' ? exSuivant.value : ex.value));
const total = computed(() => etapes.value.reduce((t, s) => t + s.dur, 0));
const fait = computed(() => etapes.value.slice(0, i.value).reduce((t, s) => t + s.dur, 0) + (etape.value.dur - reste.value));
const PHASES: Record<Etape['phase'], string> = { warmup: 'Échauffement', work: 'Effort', rest: 'Repos', cool: 'Retour au calme', demo: 'Découverte' };
const libellePhase = computed(() => (etape.value.phase === 'work' && etape.value.round ? `Tour ${etape.value.round}/${etape.value.rounds}` : PHASES[etape.value.phase]));
// Consigne affichée : départ pendant la démo et les 5 premières secondes, puis points clés en rotation.
const consigne = computed(() => {
  const e = montre.value;
  if (!e) return '';
  if (etape.value.phase === 'rest') return `Prépare-toi : ${e.depart}`;
  const passe = etape.value.dur - reste.value;
  if (etape.value.phase === 'demo' || passe < 5) return e.depart;
  const liste = [...e.etapes, ...e.cles];
  return liste[Math.floor((passe - 5) / 7) % liste.length] ?? '';
});
const materielAPreparer = computed(() => {
  if (etape.value.phase !== 'rest' || !exSuivant.value) return [];
  const actuel = new Set(ex.value?.materiel ?? []);
  return exSuivant.value.materiel.filter(m => !actuel.has(m)).map(m => MATERIEL[m]);
});
const facile = computed(() => (ex.value?.versionFacile && etape.value.phase === 'work' ? EXERCICES[ex.value.versionFacile] : undefined));

function parler(t: string) { if (voix.value) dire(t); }
function annoncer() {
  const s = etape.value, e = ex.value;
  if (s.phase === 'rest') {
    const n = exSuivant.value;
    const prep = materielAPreparer.value.length ? ` Prépare : ${materielAPreparer.value.map(m => m.nom.toLowerCase()).join(', ')}.` : '';
    parler(`Repos. Ensuite : ${n ? n.nom : 'fin'}.${prep}`);
  } else if (s.phase === 'demo' && e) {
    parler(`Nouvel exercice : ${e.nom}. Regarde la démonstration. ${e.depart}`);
  } else if (e) {
    const conseil = r.conseilVocal !== false ? ` ${e.cles[0]}.` : '';
    parler(`${e.nom}.${e.unilateral ? ' Commence par le côté droit.' : ''}${conseil}`);
  }
  if (r.vibrate) vibrer(200);
}

function tick() {
  const now = Date.now();
  const dt = (now - dernier) / 1000;
  dernier = now;
  const avant = Math.ceil(reste.value);
  const moitie = etape.value.dur / 2;
  const avantMoitie = reste.value > moitie;
  reste.value -= dt;
  ecoule.value += dt;
  etape.value.passe = (etape.value.passe ?? 0) + dt;
  const apres = Math.ceil(reste.value);
  if (ex.value?.unilateral && etape.value.phase !== 'rest' && etape.value.phase !== 'demo' && avantMoitie && reste.value <= moitie) {
    parler('Change de côté.');
    if (r.sound) { bip(990, 90); setTimeout(() => bip(990, 90), 160); }
    if (r.vibrate) vibrer([120, 80, 120]);
  }
  if (apres !== avant && apres <= 3 && apres > 0 && r.sound) bip(880);
  if (reste.value <= 0) { if (r.sound) bip(1320, 300); suivant(); }
}
function reprendre() {
  if (enMarche.value || fini.value) return;
  enMarche.value = true;
  dernier = Date.now();
  minuterie = setInterval(tick, 250);
}
function pause() { enMarche.value = false; clearInterval(minuterie); }
function suivant() {
  if (i.value >= etapes.value.length - 1) return terminer();
  i.value++;
  reste.value = etape.value.dur;
  annoncer();
}
function precedent() {
  if (i.value > 0) i.value--;
  reste.value = etape.value.dur;
  annoncer();
}

/** « Trop dur » : la version plus facile remplace l'exercice pour la suite de la séance (et les prochaines). */
function plusFacile() {
  const f = facile.value, e = ex.value;
  if (!f || !e) return;
  for (let k = i.value; k < etapes.value.length; k++) {
    const s = etapes.value[k]!;
    if (s.cle === e.id && s.phase === 'work') Object.assign(s, { cle: f.id, nom: f.nom, icone: f.icone, met: f.met });
  }
  fit.remplacer(e.id, f.id);
  toast(`Remplacé par « ${f.nom} » (aussi pour les prochaines séances, modifiable dans la bibliothèque).`, { duree: 5000 });
  parler(f.nom + '.');
}
function commentFaire() {
  pause();
  ouvrirFiche((etape.value.phase === 'rest' ? suivante.value?.cle : etape.value.cle) ?? etape.value.cle);
}

function terminer() {
  pause();
  const faites = etapes.value.map(s => ({ met: s.met, dur: Math.min(s.dur, s.passe ?? 0) }));
  const kcal = kcalSeance(faites, fit.poids);
  const pas = Math.max(0, fit.jourLu().steps - pasDebut);
  const exos = [...new Set(etapes.value.filter(s => s.cle !== 'rest' && (s.passe ?? 0) > 5).map(s => s.cle))];
  const s: SeanceFaite = { date: aujourdhui(), type: props.type, level: fit.profil!.level, duration: Math.round(ecoule.value), kcal, feel: 0, steps: pas, exos };
  fit.enregistrerSeance(s);
  fini.value = s;
  parler('Séance terminée. Bravo !');
  if (r.vibrate) vibrer([200, 100, 200, 100, 400]);
}
function noter(n: 1 | 2 | 3) {
  const msg = fit.noter(n);
  fermer();
  toast(msg, { type: 'ok', duree: 4000 });
}
function demanderFermeture() {
  if (ecoule.value < 60 || fini.value) return fermer();
  pause();
  quitter.value = true;
}
function fermer() {
  pause();
  taireVoix();
  verrou?.release().catch(() => {}); verrou = null;
  if (podoAuto) fit.arreterPodometre();
  emit('fermer');
}

async function verrouiller() { try { if ('wakeLock' in navigator) verrou = await navigator.wakeLock.request('screen'); } catch { /* ignoré */ } }
const surVisibilite = () => { if (document.visibilityState === 'visible' && !fini.value) verrouiller(); };
onMounted(async () => {
  document.body.classList.add('noscroll');
  if (r.sound) bip(660, 1); // débloque l'audio sur iPhone (geste de l'utilisateur)
  verrouiller();
  document.addEventListener('visibilitychange', surVisibilite);
  if (props.type === 'marche' && !fit.podoActif) podoAuto = await fit.demarrerPodometre();
  annoncer();
  reprendre();
});
onBeforeUnmount(() => {
  pause();
  document.body.classList.remove('noscroll');
  document.removeEventListener('visibilitychange', surVisibilite);
});
watch(voix, v => { if (!v) taireVoix(); fit.reglage('voice', v); });

// Le personnage s'adapte à la hauteur de l'écran pour que tout tienne sans défiler.
const hauteur = ref(window.innerHeight);
const surResize = () => { hauteur.value = window.innerHeight; };
window.addEventListener('resize', surResize);
onBeforeUnmount(() => window.removeEventListener('resize', surResize));
const tailleFigurine = computed(() => Math.round(Math.min(250, Math.max(140, hauteur.value - 650))));
const anneau = computed(() => 100 - (Math.max(0, reste.value) / etape.value.dur) * 100);
</script>

<template>
  <div class="lecteur" :class="etape.phase">
    <!-- Fin de séance -->
    <div v-if="fini" class="fin">
      <div class="trophee">🎉</div>
      <h1>Séance terminée !</h1>
      <div class="stats3">
        <div class="stat"><b>{{ minutes(fini.duration) }}</b><span>durée</span></div>
        <div class="stat"><b>{{ fini.kcal }}</b><span>kcal</span></div>
        <div class="stat"><b>{{ fini.steps ? fini.steps.toLocaleString('fr-FR') : fit.serie }}</b><span>{{ fini.steps ? 'pas' : 'jours de suite' }}</span></div>
      </div>
      <h3>Comment c’était ?</h3>
      <div class="ressentis">
        <button type="button" @click="noter(1)">😎<span>Facile</span></button>
        <button type="button" @click="noter(2)">🙂<span>Correct</span></button>
        <button type="button" @click="noter(3)">🥵<span>Difficile</span></button>
      </div>
      <p class="small muted">Trois séances « faciles » d’affilée : tu passes au niveau supérieur. Trois « difficiles » : on ralentit.</p>
    </div>

    <template v-else>
      <header class="haut">
        <button type="button" class="icon-btn" aria-label="Quitter la séance" @click="demanderFermeture"><Icone nom="fermer" /></button>
        <span class="phase">{{ libellePhase }}</span>
        <button type="button" class="icon-btn" :aria-label="voix ? 'Couper la voix' : 'Activer la voix'" @click="voix = !voix"><Icone :nom="voix ? 'volume' : 'muet'" :taille="20" /></button>
      </header>
      <div class="barre"><i :style="{ width: (fait / total) * 100 + '%' }" /></div>
      <p class="compteur tiny dim">{{ i + 1 }}/{{ etapes.length }} · {{ SEANCES[type].nom }}</p>

      <div class="corps">
        <p v-if="etape.phase === 'demo'" class="bandeau">Nouveau pour toi : regarde la démonstration</p>
        <p v-else-if="etape.phase === 'rest' && montre" class="bandeau repos">Ensuite : {{ montre.nom }}</p>
        <div class="scene">
          <Figurine :anim="montre?.anim ?? ANIM_REPOS" :taille="tailleFigurine" :joue="enMarche || etape.phase === 'rest'" />
        </div>
        <h1 class="nom">{{ etape.nom }}</h1>
        <div class="minuteur">
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="piste" /><circle cx="60" cy="60" r="54" class="prog" pathLength="100" stroke-dasharray="100" :stroke-dashoffset="anneau" /></svg>
          <b class="num">{{ Math.max(0, Math.ceil(reste)) }}</b>
        </div>
        <transition name="fade" mode="out-in"><p :key="consigne" class="consigne">{{ consigne }}</p></transition>
        <div v-if="materielAPreparer.length" class="prepa">
          <span v-for="m in materielAPreparer" :key="m.nom">{{ m.icone }} {{ m.nom }}</span>
        </div>
        <div class="actions">
          <button v-if="montre" type="button" class="chip" @click="commentFaire"><Icone nom="question" :taille="16" /> Comment faire ?</button>
          <button v-if="facile" type="button" class="chip" @click="plusFacile"><Icone nom="baisse" :taille="16" /> Trop dur ?</button>
        </div>
      </div>

      <p class="ensuite small">
        <template v-if="suivante && etape.phase !== 'rest'">Ensuite : <b>{{ suivante.phase === 'rest' ? suivante.nom : suivante.icone + ' ' + suivante.nom }}</b></template>
        <template v-else-if="!suivante">Dernier exercice !</template>
      </p>
      <div class="commandes">
        <button type="button" class="icon-btn grand" aria-label="Précédent" @click="precedent"><Icone nom="precedent" :taille="24" /></button>
        <button type="button" class="lecture" :aria-label="enMarche ? 'Pause' : 'Reprendre'" @click="enMarche ? pause() : reprendre()"><Icone :nom="enMarche ? 'pause' : 'play'" :taille="32" :epaisseur="2.6" /></button>
        <button type="button" class="icon-btn grand" aria-label="Suivant" @click="suivant"><Icone nom="suivant" :taille="24" /></button>
      </div>
    </template>

    <!-- Quitter une séance commencée -->
    <div v-if="quitter" class="voile" @click.self="quitter = false; reprendre()">
      <div class="boite">
        <b>Arrêter la séance ?</b>
        <button type="button" class="btn primary full" @click="quitter = false; reprendre()">Reprendre</button>
        <button type="button" class="btn full" @click="quitter = false; terminer()">Terminer et enregistrer</button>
        <button type="button" class="btn ghost danger full" @click="fermer">Quitter sans enregistrer</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lecteur { --c: var(--brand); position: fixed; inset: 0; z-index: 70; display: flex; flex-direction: column; padding: calc(var(--safe-t) + 10px) 16px calc(var(--safe-b) + 14px); background: radial-gradient(100% 60% at 50% 25%, color-mix(in srgb, var(--c) 16%, transparent), transparent 70%), var(--bg); overflow-y: auto; }
.lecteur.warmup { --c: var(--brand-3); }
.lecteur.rest { --c: var(--eau); }
.lecteur.cool { --c: var(--calme); }
.lecteur.demo { --c: var(--force); }
.haut { display: flex; align-items: center; justify-content: space-between; }
.phase { font-weight: 800; color: var(--c); text-transform: uppercase; letter-spacing: .08em; font-size: 13px; }
.barre { height: 5px; border-radius: 3px; background: var(--surface-3); overflow: hidden; margin-top: 10px; }
.barre i { display: block; height: 100%; background: var(--c); transition: width .3s linear; }
.compteur { margin: 6px 0 0; text-align: center; }
.corps { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; max-width: 520px; width: 100%; margin: 0 auto; }
.bandeau { margin: 8px 0 0; padding: 5px 12px; border-radius: 99px; background: color-mix(in srgb, var(--c) 18%, transparent); color: var(--c); font-weight: 800; font-size: 13px; }
.scene { margin-top: 2px; }
.nom { margin: 0; font-size: 26px; letter-spacing: -.03em; line-height: 1.15; }
.minuteur { position: relative; width: 86px; height: 86px; margin: 2px 0; }
.minuteur svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.minuteur circle { fill: none; stroke-width: 9; }
.piste { stroke: var(--surface-3); }
.prog { stroke: var(--c); stroke-linecap: round; transition: stroke-dashoffset .25s linear; }
.minuteur b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 30px; font-weight: 850; }
.consigne { margin: 0; min-height: 44px; font-size: 15.5px; line-height: 1.4; color: var(--text); max-width: 34ch; }
.prepa { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.prepa span { padding: 4px 10px; border-radius: 99px; background: var(--surface-2); font-size: 13px; font-weight: 700; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
.ensuite { text-align: center; color: var(--muted); margin: 10px 0 8px; min-height: 20px; }
.commandes { display: flex; align-items: center; justify-content: center; gap: 26px; }
.icon-btn.grand { width: 54px; height: 54px; border-radius: 18px; }
.lecture { width: 76px; height: 76px; border-radius: 26px; border: 0; display: grid; place-items: center; color: #fff; background: var(--c); box-shadow: 0 14px 30px -12px var(--c); transition: transform .12s; }
.lecture:active { transform: scale(.94); }
.fin { margin: auto; max-width: 420px; width: 100%; display: grid; gap: 14px; text-align: center; }
.fin h1 { margin: 0; font-size: 30px; }
.fin h3 { margin: 10px 0 0; }
.trophee { font-size: 64px; }
.ressentis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.ressentis button { display: grid; justify-items: center; gap: 4px; padding: 14px 6px; border-radius: 18px; border: 1px solid var(--border); background: var(--surface); font-size: 30px; }
.ressentis span { font-size: 13px; font-weight: 700; color: var(--muted); }
.voile { position: fixed; inset: 0; z-index: 75; background: rgba(0,0,0,.55); display: grid; place-items: center; padding: 20px; }
.boite { width: min(360px, 100%); display: grid; gap: 10px; padding: 20px; border-radius: 22px; background: var(--surface); text-align: center; }
</style>
