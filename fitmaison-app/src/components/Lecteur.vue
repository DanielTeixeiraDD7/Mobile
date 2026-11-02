<script setup lang="ts">
import { EXERCICES, ANIM_REPOS, MATERIEL } from '@/core/exercices';
import { construire, type Etape } from '@/core/seance';
import { SEANCES, TYPES_MARCHE, type TypeSeance } from '@/core/programmes';
import { kcalSeance } from '@/core/calculs';
import { aujourdhui, minutes } from '@/core/dates';
import { bip, dire, taireVoix, vibrer } from '@/core/audio';
import type { SeanceFaite } from '@/core/etat';
import { useFit } from '@/stores/fit';
import { ouvrirFiche, useOptionsSeance } from '@/composables/useSeance';
import { toast } from '@/composables/useToast';
import { SOL, emprise, lireSilhouette, sceneConseillee } from '@/core/figurine';
import Figurine from './Figurine.vue';
import Icone from './Icone.vue';

/** Lecteur plein écran : démonstration, minuteur, voix, bips, conseils, version plus facile en un geste. */
const props = defineProps<{ type: TypeSeance }>();
const emit = defineEmits<{ fermer: [] }>();
const fit = useFit();
const r = fit.reglages;

// Niveau prescrit par le plan (sinon niveau du profil).
const niveauSeance = useOptionsSeance().value.niveau ?? fit.profil!.level;
const etapes = ref<(Etape & { passe?: number })[]>(construire(props.type, niveauSeance, { vus: fit.etat.vus, demo: r.demo !== false, remplacements: fit.etat.remplacements }));
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
  const s: SeanceFaite = { date: aujourdhui(), type: props.type, level: niveauSeance, duration: Math.round(ecoule.value), kcal, feel: 0, steps: pas, exos };
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
  if (TYPES_MARCHE.includes(props.type) && !fit.podoActif) podoAuto = await fit.demarrerPodometre();
  annoncer();
  reprendre();
});
onBeforeUnmount(() => {
  pause();
  document.body.classList.remove('noscroll');
  document.removeEventListener('visibilitychange', surVisibilite);
});
watch(voix, v => { if (!v) taireVoix(); fit.reglage('voice', v); });

// Le coach occupe toute la place disponible : caméra cadrée sur lui (et son décor), arrière-plan adapté.
const animCoach = computed(() => montre.value?.anim ?? ANIM_REPOS);
const sceneCoach = computed(() => sceneConseillee(animCoach.value, montre.value?.cat ?? ''));
const cadreCoach = computed((): [number, number, number, number] => {
  const [x, y, w] = emprise(animCoach.value, true);
  const m = 14, haut = Math.max(-20, y - m);
  return [x - m, haut, w + 2 * m, SOL + 8 - haut];
});
const silhouette = lireSilhouette();
const lent = ref(false);
const NOMS_ZONES: Record<string, string> = { tronc: 'Gainage', cuisse: 'Cuisses', tibia: 'Mollets', bras: 'Bras', avbras: 'Bras' };
const zonesCoach = computed(() => [...new Set((animCoach.value.zones ?? []).map(z => NOMS_ZONES[z.replace(/[GD]$/, '')] ?? z))].join(' · '));
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
        <div class="scene" :class="{ repos: etape.phase === 'rest' }">
          <Figurine
            :anim="animCoach" remplir :scene="sceneCoach" :cadre="cadreCoach" :silhouette="silhouette"
            :joue="enMarche || etape.phase === 'rest'" :vitesse="lent ? 0.5 : 1"
          />
          <p v-if="etape.phase === 'demo'" class="bandeau">Nouveau pour toi : regarde la démonstration</p>
          <p v-else-if="etape.phase === 'rest' && montre" class="bandeau repos">Ensuite : {{ montre.nom }}</p>
          <span v-if="zonesCoach && etape.phase !== 'rest'" class="zone-chip"><i aria-hidden="true" />{{ zonesCoach }}</span>
          <button type="button" class="lent-chip" :aria-pressed="lent" @click="lent = !lent">🐢 Ralenti</button>
        </div>
        <div class="infos-ex">
          <div class="minuteur">
            <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="piste" /><circle cx="60" cy="60" r="54" class="prog" pathLength="100" stroke-dasharray="100" :stroke-dashoffset="anneau" /></svg>
            <b class="num">{{ Math.max(0, Math.ceil(reste)) }}</b>
          </div>
          <div class="txt">
            <h1 class="nom display">{{ etape.nom }}</h1>
            <transition name="fade" mode="out-in"><p :key="consigne" class="consigne">{{ consigne }}</p></transition>
          </div>
        </div>
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
.corps { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; max-width: 760px; width: 100%; margin: 8px auto 0; min-height: 0; }
/* Scène du coach : prend toute la hauteur libre, comme une vidéo. */
.scene { position: relative; flex: 1 1 0; min-height: 210px; max-height: 62vh; width: 100%; border-radius: var(--r-lg, 26px); overflow: hidden; background: var(--surface-2); border: 1px solid var(--border); box-shadow: var(--shadow); isolation: isolate; }
.scene :deep(.figurine) { position: absolute; inset: 0; }
.scene::after { content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit; box-shadow: inset 0 0 0 3px color-mix(in srgb, var(--c) 55%, transparent); }
.bandeau { position: absolute; top: 10px; left: 50%; translate: -50% 0; margin: 0; padding: 6px 12px; border-radius: 99px; white-space: nowrap; max-width: calc(100% - 20px); overflow: hidden; text-overflow: ellipsis; background: var(--c); color: var(--on-brand); font-weight: 800; font-size: 13px; box-shadow: 0 6px 18px -8px rgba(0, 0, 0, .5); }
.zone-chip, .lent-chip { position: absolute; bottom: 10px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 99px; font-size: 12.5px; font-weight: 800; color: #fff; background: rgba(8, 12, 10, .6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); border: 0; }
.zone-chip { left: 10px; }
.zone-chip i { width: 9px; height: 9px; border-radius: 50%; background: var(--flamme-vif, #f97316); box-shadow: 0 0 0 3px color-mix(in srgb, var(--flamme-vif, #f97316) 35%, transparent); }
.lent-chip { right: 10px; cursor: pointer; }
.lent-chip[aria-pressed='true'] { background: var(--volt, #c5f23b); color: var(--on-volt, #0a1405); }
.infos-ex { display: flex; align-items: center; gap: 14px; width: 100%; text-align: left; }
.txt { flex: 1; min-width: 0; display: grid; gap: 4px; }
.nom { margin: 0; font-size: var(--fs-2xl, 28px); line-height: 1; }
.minuteur { position: relative; flex: none; width: 88px; height: 88px; }
.minuteur svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.minuteur circle { fill: none; stroke-width: 9; }
.piste { stroke: var(--surface-3); }
.prog { stroke: var(--c); stroke-linecap: round; transition: stroke-dashoffset .25s linear; }
.minuteur b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 30px; font-weight: 850; }
.consigne { margin: 0; min-height: 42px; font-size: 15px; line-height: 1.38; color: var(--muted); }
.prepa { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.prepa span { padding: 4px 10px; border-radius: 99px; background: var(--surface-2); font-size: 13px; font-weight: 700; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
.ensuite { text-align: center; color: var(--muted); margin: 10px 0 8px; min-height: 20px; }
.commandes { display: flex; align-items: center; justify-content: center; gap: 26px; }
.icon-btn.grand { width: 54px; height: 54px; border-radius: 18px; }
.lecture { width: 76px; height: 76px; border-radius: 26px; border: 0; display: grid; place-items: center; color: var(--on-brand); background: var(--c); box-shadow: 0 14px 30px -12px var(--c); transition: transform .12s; }
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
