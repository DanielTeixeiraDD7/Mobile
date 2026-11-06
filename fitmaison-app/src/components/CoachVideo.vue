<script setup lang="ts">
import { MATERIEL, type Exercice } from '@/core/exercices';
import {
  SOL, dureeCycle, ecrireSilhouette, emprise, lireSilhouette, sceneConseillee, type Segment, type Silhouette,
} from '@/core/figurine';
import Figurine from './Figurine.vue';

/**
 * « Vidéo » d'un exercice, 100 % hors-ligne : le coach animé, ralenti, barre de lecture sur un mouvement,
 * compteur de répétitions, sous-titres synchronisés avec les consignes et voix off (synthèse vocale du téléphone).
 */
const props = withDefaults(defineProps<{ ex: Exercice; autoplay?: boolean }>(), { autoplay: true });

const reduit = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const lire = (cle: string) => { try { return localStorage.getItem(cle); } catch { return null; } };
const ecrire = (cle: string, v: string) => { try { localStorage.setItem(cle, v); } catch { /* stockage indisponible */ } };

// ---------- Lecture ----------
const cycle = computed(() => dureeCycle(props.ex.anim) || 1);
const t = ref(0);
const joue = ref(props.autoplay && !reduit);
const vitesse = ref<0.25 | 0.5 | 1>(1);
const boucle = ref(true);
const VITESSES = [0.25, 0.5, 1] as const;
let raf = 0, dernier = 0, visible = true, glisse = false, tenu = 0;
const tenuAffiche = ref(0);

function image(now: number) {
  const dt = dernier ? Math.min(0.1, (now - dernier) / 1000) : 0;
  dernier = now;
  if (joue.value && !glisse) {
    let nt = t.value + dt * vitesse.value;
    if (!boucle.value) {
      const fin = (Math.floor(t.value / cycle.value + 1e-6) + 1) * cycle.value;
      if (nt >= fin) { nt = fin - 1e-3; joue.value = false; }
    }
    t.value = nt;
    tenu += dt; tenuAffiche.value = Math.floor(tenu);
    sousTitres(dt);
  }
  raf = joue.value && visible ? requestAnimationFrame(image) : 0;
}
function demarrer() { if (!raf && joue.value && visible) { dernier = 0; raf = requestAnimationFrame(image); } }
function stopper() { cancelAnimationFrame(raf); raf = 0; }
function basculer() { joue.value = !joue.value; }
watch(joue, v => {
  if (v) { if (!boucle.value && pos.value >= cycle.value - 0.01) t.value = Math.ceil(t.value / cycle.value) * cycle.value; demarrer(); direPiste(); }
  else { stopper(); taire(); }
});

// ---------- Barre de lecture (un mouvement complet) ----------
const pos = computed(() => ((t.value % cycle.value) + cycle.value) % cycle.value);
const rep = computed(() => Math.floor(t.value / cycle.value + 1e-6) + 1);
const marques = computed(() => {
  const a = props.ex.anim, n = a.poses.length, m: number[] = [];
  let x = 0;
  for (let i = 0; i < (a.cycle ? n - 1 : n) - 1; i++) { x += a.durees[i] ?? a.durees[a.durees.length - 1] ?? 1; m.push(x / cycle.value); }
  return m;
});
const piste = useTemplateRef<HTMLElement>('piste');
function allerA(v: number) {
  const base = Math.floor(t.value / cycle.value + 1e-6) * cycle.value;
  t.value = base + Math.min(cycle.value - 1e-3, Math.max(0, v));
}
let reprendre = false;
function depuisPointeur(e: PointerEvent) {
  const r = piste.value!.getBoundingClientRect();
  allerA(((e.clientX - r.left) / r.width) * cycle.value);
}
function appui(e: PointerEvent) {
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  glisse = true; reprendre = joue.value; joue.value = false;
  depuisPointeur(e);
}
function glisser(e: PointerEvent) { if (glisse) depuisPointeur(e); }
function lacher() { if (!glisse) return; glisse = false; if (reprendre) joue.value = true; }
function clavierPiste(e: KeyboardEvent) {
  const pas = cycle.value / 20;
  const actions: Record<string, () => void> = {
    ArrowLeft: () => allerA(pos.value - pas), ArrowDown: () => allerA(pos.value - pas),
    ArrowRight: () => allerA(pos.value + pas), ArrowUp: () => allerA(pos.value + pas),
    PageDown: () => allerA(pos.value - cycle.value / 4), PageUp: () => allerA(pos.value + cycle.value / 4),
    Home: () => allerA(0), End: () => allerA(cycle.value),
  };
  const f = actions[e.key];
  if (!f) return;
  e.preventDefault();
  joue.value = false;
  f();
}
const sec = (v: number) => v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ---------- Sous-titres + voix off ----------
interface Piste { titre: string; texte: string; oral: string }
const pistes = computed<Piste[]>(() => {
  const e = props.ex, n = e.etapes.length;
  return [
    { titre: 'Position de départ', texte: e.depart, oral: `Position de départ. ${e.depart}` },
    ...e.etapes.map((x, i) => ({ titre: `Étape ${i + 1}/${n}`, texte: x, oral: `${n > 1 ? `Étape ${i + 1}. ` : ''}${x}` })),
    { titre: 'Respiration', texte: e.respiration, oral: `Respiration : ${e.respiration}` },
    ...e.cles.map(c => ({ titre: 'Point clé', texte: c, oral: `Point clé : ${c}.` })),
  ];
});
const idx = ref(0);
const actuelle = computed(() => pistes.value[idx.value] ?? pistes.value[0]!);
let ecouleSt = 0, repVue = 1, parle = false, jeton = 0;
const voix = ref(lire('fitmaison_coach_voix') === '1');
const voixDispo = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Une consigne reste affichée le temps de la lire (ou de l'entendre), puis change au début d'un mouvement. */
function sousTitres(dt: number) {
  ecouleSt += dt;
  const min = Math.min(9, Math.max(2.8, 1.6 + actuelle.value.texte.length * 0.055));
  const frontiere = rep.value !== repVue;
  repVue = rep.value;
  const mur = ecouleSt >= min && !parle;
  if (mur && (frontiere || ecouleSt >= min + 2.5 || cycle.value / vitesse.value > 4)) changerPiste(1, false);
}
function changerPiste(sens: 1 | -1, manuel = true) {
  const n = pistes.value.length;
  let i = idx.value + sens;
  if (i >= n) i = boucle.value || manuel ? 0 : n - 1;
  if (i < 0) i = n - 1;
  if (i === idx.value) return;
  idx.value = i; ecouleSt = 0;
  direPiste();
}
function direPiste() {
  if (!voix.value || !voixDispo || !joue.value) return;
  try {
    speechSynthesis.cancel();
    const p = actuelle.value;
    const u = new SpeechSynthesisUtterance(p.oral);
    u.lang = 'fr-FR';
    u.rate = vitesse.value < 1 ? 0.92 : 1;
    const v = speechSynthesis.getVoices().find(x => x.lang?.startsWith('fr'));
    if (v) u.voice = v;
    const moi = ++jeton;
    parle = true;
    const fin = () => { if (moi === jeton) parle = false; };
    u.onend = fin; u.onerror = fin;
    // Certains navigateurs ne signalent jamais la fin : on libère quand même.
    setTimeout(fin, p.oral.length * 85 + 2500);
    speechSynthesis.speak(u);
  } catch { parle = false; }
}
function taire() { parle = false; jeton++; if (voixDispo && voix.value) { try { speechSynthesis.cancel(); } catch { /* ignoré */ } } }
function basculerVoix() {
  if (voix.value) { taire(); voix.value = false; } else { voix.value = true; ecouleSt = 0; direPiste(); }
  ecrire('fitmaison_coach_voix', voix.value ? '1' : '0');
}

// ---------- Caméra : cadrage large / serré, miroir ----------
const camera = ref<'large' | 'serre'>('large');
const miroir = ref(false);
function cadreCible(): [number, number, number, number] {
  const large = camera.value === 'large';
  const [x, y, w] = emprise(props.ex.anim, large);
  const m = large ? 20 : 6;
  // En haut : place pour les badges (vue, ralenti, compteur).
  const haut = Math.max(-24, y - m - (large ? 4 : 16)), sol = SOL + (large ? 8 : 4);
  // Place sous le sol pour la barre de commandes (le coach ne passe jamais dessous).
  const bas = sol + (sol - haut) * 0.3;
  return [x - m, haut, w + 2 * m, bas - haut];
}
const cadre = ref(cadreCible());
let rafCadre = 0;
function viser() {
  const de = cadre.value.slice() as typeof cadre.value, vers = cadreCible();
  cancelAnimationFrame(rafCadre);
  if (reduit) { cadre.value = vers; return; }
  const debut = performance.now();
  const pas = (now: number) => {
    const k = Math.min(1, (now - debut) / 450), e = 1 - Math.pow(1 - k, 3);
    cadre.value = de.map((v, i) => v + (vers[i]! - v) * e) as typeof cadre.value;
    if (k < 1) rafCadre = requestAnimationFrame(pas);
  };
  rafCadre = requestAnimationFrame(pas);
}
watch(camera, viser);

// ---------- Corpulence ----------
const silhouette = ref<Silhouette>(lireSilhouette());
watch(silhouette, s => ecrireSilhouette(s));

// ---------- Plein écran (API Fullscreen, sinon plein écran « maison ») ----------
const racine = useTemplateRef<HTMLElement>('racine');
const natif = ref(false);
const pseudo = ref(false);
type DocFS = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
type ElFS = HTMLElement & { webkitRequestFullscreen?: () => void };
async function pleinEcran() {
  const d = document as DocFS;
  if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen ?? d.webkitExitFullscreen)?.call(d); return; }
  if (pseudo.value) { pseudo.value = false; return; }
  const el = racine.value as ElFS | null;
  const req = el?.requestFullscreen ?? el?.webkitRequestFullscreen;
  if (el && req) { try { await req.call(el); return; } catch { /* refusé : solution de repli */ } }
  pseudo.value = true;
}
const surFS = () => { const d = document as DocFS; natif.value = !!racine.value && (d.fullscreenElement ?? d.webkitFullscreenElement) === racine.value; };
const plein = computed(() => natif.value || pseudo.value);

function clavier(e: KeyboardEvent) {
  const cible = e.target as HTMLElement;
  if (cible.closest('button, [role="slider"]') && (e.key === ' ' || e.key === 'Enter')) return;
  if (e.key === ' ' || e.key === 'k') { e.preventDefault(); basculer(); }
  else if (e.key === 'f') pleinEcran();
  else if (e.key === 'Escape' && pseudo.value) pseudo.value = false;
}

// ---------- Cycle de vie ----------
let obs: IntersectionObserver | null = null;
const surVisibilite = () => { if (document.visibilityState === 'hidden') joue.value = false; };
onMounted(() => {
  if (reduit) t.value = (props.ex.anim.durees[0] ?? 1) * 0.999;
  if ('IntersectionObserver' in window && racine.value) {
    obs = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting || plein.value; if (visible) demarrer(); else stopper(); });
    obs.observe(racine.value);
  }
  document.addEventListener('fullscreenchange', surFS);
  document.addEventListener('webkitfullscreenchange', surFS);
  document.addEventListener('visibilitychange', surVisibilite);
  demarrer();
});
onBeforeUnmount(() => {
  stopper(); cancelAnimationFrame(rafCadre); obs?.disconnect(); taire();
  document.removeEventListener('fullscreenchange', surFS);
  document.removeEventListener('webkitfullscreenchange', surFS);
  document.removeEventListener('visibilitychange', surVisibilite);
});
watch(() => props.ex.id, () => {
  taire(); t.value = 0; tenu = 0; tenuAffiche.value = 0; idx.value = 0; ecouleSt = 0; repVue = 1;
  cadre.value = cadreCible();
  direPiste();
});

// ---------- Infos sous l'écran ----------
const scene = computed(() => sceneConseillee(props.ex.anim, props.ex.cat));
const NOMS_ZONES: Record<string, string> = { tronc: 'abdos et gainage', cuisse: 'cuisses et fessiers', tibia: 'mollets', bras: 'épaules et bras', avbras: 'épaules et bras' };
const zones = computed(() => [...new Set((props.ex.anim.zones ?? []).map((z: Segment) => NOMS_ZONES[z.replace(/[GD]$/, '')] ?? z))]);
const DECOR: Record<string, string> = { ballon: '⚽ Ballon', plot: '🔶 Plots', bureau: '💻 Bureau' };
const materiel = computed(() => {
  const nom = (n: string) => { const x = n.replace(/^(Une?|Des) /i, ''); return x.charAt(0).toUpperCase() + x.slice(1); };
  const l = props.ex.materiel.map(m => MATERIEL[m]).filter(Boolean).map(m => `${m.icone} ${nom(m.nom)}`);
  const vus = new Set(l.map(x => x.toLowerCase()));
  for (const d of props.ex.anim.decor ?? []) {
    const x = DECOR[d.type];
    if (x && !vus.has(x.toLowerCase()) && !(props.ex.materiel as string[]).some(m => m === d.type || m === d.type + 's')) { l.push(x); vus.add(x.toLowerCase()); }
  }
  return l;
});
const libelleRep = computed(() => (props.ex.tenue ? 'secondes tenues' : props.ex.anim.cycle ? 'tour' : 'répétition'));
const valeurRep = computed(() => (props.ex.tenue ? tenuAffiche.value : rep.value));
</script>

<template>
  <div class="coach-video">
  <Teleport to="body" :disabled="!pseudo">
    <figure ref="racine" class="cv" :class="{ plein, pseudo, enPause: !joue }" :aria-label="`Démonstration vidéo : ${ex.nom}`" @keydown="clavier">
      <div class="ecran">
        <Figurine
          class="fig" :anim="ex.anim" :temps="t" remplir :scene="scene" :silhouette="silhouette"
          :cadre="cadre" :miroir="miroir"
        />
        <button type="button" class="zone-clic" :aria-label="joue ? 'Mettre en pause' : 'Lire la démonstration'" tabindex="-1" @click="basculer" />

        <div class="haut">
          <span class="badge">{{ ex.anim.vue === 'face' ? 'Vue de face' : 'Vue de profil' }}{{ miroir ? ' · miroir' : '' }}</span>
          <span v-if="vitesse < 1" class="badge lent">Ralenti {{ vitesse === 0.25 ? '¼' : '½' }}</span>
          <span class="flex" />
          <div class="compteur" aria-hidden="true"><b>{{ valeurRep }}</b><small>{{ libelleRep }}</small></div>
        </div>

        <transition name="pop">
          <button v-if="!joue" type="button" class="gros-play" aria-label="Lire la démonstration" @click="basculer">
            <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
          </button>
        </transition>

        <div class="bas">
          <div
            ref="piste" class="timeline" role="slider" tabindex="0" aria-label="Position dans le mouvement"
            :aria-valuemin="0" :aria-valuemax="Number(cycle.toFixed(2))" :aria-valuenow="Number(pos.toFixed(2))"
            :aria-valuetext="`${sec(pos)} secondes sur ${sec(cycle)}`"
            @pointerdown="appui" @pointermove="glisser" @pointerup="lacher" @pointercancel="lacher" @keydown="clavierPiste"
          >
            <div class="rail">
              <i class="rempli" :style="{ width: (pos / cycle) * 100 + '%' }" />
              <i v-for="(m, k) in marques" :key="k" class="marque" :style="{ left: m * 100 + '%' }" />
            </div>
            <i class="poignee" :style="{ left: (pos / cycle) * 100 + '%' }" />
          </div>

          <div class="barre">
            <button type="button" class="ib" :aria-label="joue ? 'Pause' : 'Lecture'" @click="basculer">
              <svg v-if="joue" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" class="epais" /></svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" class="plein-svg" /></svg>
            </button>
            <span class="temps">{{ sec(pos) }} / {{ sec(cycle) }} s</span>
            <div class="vitesses" role="group" aria-label="Vitesse de lecture">
              <button v-for="v in VITESSES" :key="v" type="button" :aria-pressed="vitesse === v" :aria-label="`Vitesse ${v === 1 ? 'normale' : v === 0.5 ? 'divisée par deux' : 'divisée par quatre'}`" @click="vitesse = v">
                {{ v === 1 ? '1×' : v === 0.5 ? '0,5×' : '0,25×' }}
              </button>
            </div>
            <span class="flex" />
            <button type="button" class="ib" :aria-pressed="boucle" :aria-label="boucle ? 'Lecture en boucle activée' : 'Lecture en boucle désactivée'" title="Boucle" @click="boucle = !boucle">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l3 3-3 3M20 6H8a4 4 0 0 0-4 4v1M7 21l-3-3 3-3M4 18h12a4 4 0 0 0 4-4v-1" /></svg>
            </button>
            <button v-if="voixDispo" type="button" class="ib" :aria-pressed="voix" :aria-label="voix ? 'Couper la voix du coach' : 'Activer la voix du coach'" title="Voix du coach" @click="basculerVoix">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" /><path v-if="voix" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /><path v-else d="M16 9.5l5 5M21 9.5l-5 5" /></svg>
            </button>
            <button type="button" class="ib" :aria-pressed="camera === 'serre'" :aria-label="camera === 'serre' ? 'Plan large' : 'Gros plan sur le coach'" title="Cadrage" @click="camera = camera === 'serre' ? 'large' : 'serre'">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5 5" /><path :d="camera === 'serre' ? 'M8 10.5h5' : 'M8 10.5h5M10.5 8v5'" /></svg>
            </button>
            <button type="button" class="ib" :aria-pressed="miroir" aria-label="Voir de l’autre côté" title="Autre côté" @click="miroir = !miroir">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18" stroke-dasharray="2 2.5" /><path d="M9 7L3 17h6zM15 7l6 10h-6z" /></svg>
            </button>
            <button type="button" class="ib" :aria-label="plein ? 'Quitter le plein écran' : 'Plein écran'" title="Plein écran" @click="pleinEcran">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="plein ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="st-bar">
      <div class="st">
        <button type="button" class="st-nav" aria-label="Consigne précédente" @click="changerPiste(-1)">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <div class="st-texte" aria-live="polite" aria-atomic="true">
          <transition name="st" mode="out-in">
            <div :key="idx">
              <span class="st-titre">{{ actuelle.titre }}</span>
              <p>{{ actuelle.texte }}</p>
            </div>
          </transition>
        </div>
        <button type="button" class="st-nav" aria-label="Consigne suivante" @click="changerPiste(1)">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
      <div class="points" aria-hidden="true"><i v-for="(_, i) in pistes" :key="i" :class="{ on: i === idx }" /></div>
      </div>

      <figcaption class="infos">
        <p class="legende"><i class="pastille" /> <span>Zone travaillée : <b>{{ zones.length ? zones.join(', ') : ex.muscles }}</b></span></p>
        <div class="ligne">
          <div class="chips" aria-label="Matériel">
            <span v-for="m in materiel" :key="m" class="tag">{{ m }}</span>
            <span v-if="!materiel.length" class="tag">🙌 Aucun matériel</span>
          </div>
          <div class="seg petit" role="group" aria-label="Corpulence du coach">
            <span class="seg-l">Coach</span>
            <button type="button" :class="{ on: silhouette === 'standard' }" :aria-pressed="silhouette === 'standard'" @click="silhouette = 'standard'">Mince</button>
            <button type="button" :class="{ on: silhouette === 'robuste' }" :aria-pressed="silhouette === 'robuste'" @click="silhouette = 'robuste'">Costaud</button>
          </div>
        </div>
      </figcaption>
    </figure>
  </Teleport>
  </div>
</template>

<style scoped>
.cv { margin: 0; container-type: inline-size; display: grid; gap: 10px; outline: none; }
.ecran {
  position: relative; overflow: hidden; border-radius: var(--r, 22px) var(--r, 22px) 0 0; aspect-ratio: 16 / 10; isolation: isolate;
  background: var(--surface-2); box-shadow: var(--shadow); border: 1px solid var(--border); border-bottom: 0;
}
@container (max-width: 520px) { .ecran { aspect-ratio: 4 / 4.1; } }
@container (min-width: 521px) { .ecran { max-height: min(64vh, 600px); width: 100%; } }
.fig { position: absolute; inset: 0; }
.zone-clic { position: absolute; inset: 0; border: 0; background: none; cursor: pointer; padding: 0; }

.haut { position: absolute; inset: 0 0 auto; display: flex; align-items: flex-start; gap: 6px; padding: 10px; pointer-events: none; }
.flex { flex: 1; }
.badge { padding: 5px 10px; border-radius: 99px; font-size: 12px; font-weight: 800; letter-spacing: .02em; color: #fff; background: rgba(8, 12, 10, .55); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.badge.lent { background: var(--volt, #c5f23b); color: var(--on-volt, #0a1405); }
.compteur { display: grid; justify-items: center; min-width: 64px; padding: 6px 10px 5px; border-radius: 16px; color: #fff; background: rgba(8, 12, 10, .55); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); line-height: 1; }
.compteur b { font-size: 26px; font-weight: 900; font-variant-numeric: tabular-nums; font-stretch: var(--display-stretch, 100%); }
.compteur small { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; opacity: .8; margin-top: 3px; }

.gros-play {
  position: absolute; left: 50%; top: 42%; translate: -50% -50%; width: 74px; height: 74px; border-radius: 50%; border: 0;
  display: grid; place-items: center; padding-left: 4px; color: var(--on-volt, #0a1405); background: var(--volt, #c5f23b);
  box-shadow: 0 0 0 10px color-mix(in srgb, var(--volt, #c5f23b) 25%, transparent), 0 18px 40px -12px rgba(0, 0, 0, .6); cursor: pointer;
}
.gros-play:active { scale: .94; }
.pop-enter-active, .pop-leave-active { transition: opacity .2s, scale .25s var(--ease-spring, ease); }
.pop-enter-from, .pop-leave-to { opacity: 0; scale: .7; }

.bas {
  position: absolute; inset: auto 0 0; padding: 26px 10px 4px; color: #fff;
  background: linear-gradient(to top, rgba(4, 8, 6, .8) 0%, rgba(4, 8, 6, .5) 60%, transparent 100%);
}
/* Sous-titres : bandeau sous l'image (en plein écran : par-dessus, au-dessus des commandes). */
.st-bar { margin-top: -10px; padding: 8px 10px 10px; color: #fff; background: #0b110d; border-radius: 0 0 var(--r, 22px) var(--r, 22px); box-shadow: var(--shadow); }
.st { display: flex; align-items: center; gap: 4px; }
.st-texte { flex: 1; min-height: 52px; display: grid; align-content: end; text-align: center; }
.st-titre { display: inline-block; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; color: var(--volt, #c5f23b); }
.st-texte p { margin: 2px auto 0; max-width: 46ch; font-size: 15px; line-height: 1.35; font-weight: 650; text-shadow: 0 1px 2px rgba(0, 0, 0, .6); text-wrap: balance; }
.st-nav { flex: none; width: 32px; height: 32px; border-radius: 50%; border: 0; display: grid; place-items: center; color: #fff; background: rgba(255, 255, 255, .12); cursor: pointer; }
.st-nav svg, .ib svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.st-enter-active, .st-leave-active { transition: opacity .22s, translate .22s; }
.st-enter-from { opacity: 0; translate: 0 6px; }
.st-leave-to { opacity: 0; translate: 0 -4px; }
.points { display: flex; justify-content: center; gap: 4px; margin: 6px 0 2px; }
.points i { width: 5px; height: 5px; border-radius: 3px; background: rgba(255, 255, 255, .3); transition: width .25s, background .25s; }
.points i.on { width: 16px; background: var(--volt, #c5f23b); }

.timeline { position: relative; height: 22px; display: flex; align-items: center; cursor: pointer; touch-action: none; border-radius: 8px; }
.timeline:focus-visible { outline: 2px solid var(--volt, #c5f23b); outline-offset: 2px; }
.rail { position: relative; flex: 1; height: 5px; border-radius: 3px; background: rgba(255, 255, 255, .25); overflow: hidden; }
.rempli { position: absolute; inset: 0 auto 0 0; background: var(--volt, #c5f23b); border-radius: 3px; }
.marque { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: rgba(0, 0, 0, .45); }
.poignee { position: absolute; top: 50%; width: 15px; height: 15px; margin: -7.5px 0 0 -7.5px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--volt, #c5f23b) 40%, transparent), 0 2px 6px rgba(0, 0, 0, .5); }

.barre { display: flex; align-items: center; gap: 2px; margin-top: 2px; }
.ib { width: 38px; height: 38px; flex: none; border: 0; border-radius: 12px; display: grid; place-items: center; background: none; color: #fff; cursor: pointer; }
.ib svg { width: 22px; height: 22px; }
.ib .epais { stroke-width: 3.2; }
.ib .plein-svg { fill: currentColor; stroke: none; }
.ib:hover { background: rgba(255, 255, 255, .1); }
.ib[aria-pressed='true'] { color: var(--volt, #c5f23b); }
.temps { font-size: 12.5px; font-weight: 700; font-variant-numeric: tabular-nums; opacity: .85; margin: 0 6px 0 2px; white-space: nowrap; }
.vitesses { display: flex; padding: 2px; border-radius: 10px; background: rgba(255, 255, 255, .12); }
.vitesses button { min-width: 40px; height: 30px; padding: 0 6px; border: 0; border-radius: 8px; background: none; color: #fff; font-size: 12.5px; font-weight: 800; cursor: pointer; }
.vitesses button[aria-pressed='true'] { background: var(--volt, #c5f23b); color: var(--on-volt, #0a1405); }
@container (max-width: 480px) {
  .temps { display: none; }
  .ib { width: 34px; }
  .vitesses button { min-width: 36px; padding: 0 4px; }
  .st-texte p { font-size: 14px; }
}
@container (max-width: 300px) { .st-nav { display: none; } }

.infos { display: grid; gap: 8px; }
.legende { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14px; color: var(--muted); }
.legende b { color: var(--text); }
.pastille { flex: none; width: 12px; height: 12px; border-radius: 50%; background: var(--flamme-vif, #f97316); box-shadow: 0 0 0 4px color-mix(in srgb, var(--flamme-vif, #f97316) 25%, transparent); }
.ligne { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.seg.petit { padding: 3px; border-radius: 13px; }
.seg.petit { align-items: center; }
.seg.petit button { flex: none; min-height: 32px; padding: 0 12px; border-radius: 10px; font-size: 12.5px; white-space: nowrap; }
.seg-l { padding: 0 6px 0 8px; font-size: 12px; font-weight: 800; color: var(--muted); }

/* Plein écran : l'écran prend toute la place, les infos disparaissent. */
.cv.plein { background: #000; width: 100vw; height: 100vh; height: 100dvh; display: block; }
.cv.plein .ecran { aspect-ratio: auto; width: 100%; height: 100%; border-radius: 0; border: 0; }
.cv.plein .infos { display: none; }
.cv.plein { position: relative; }
.cv.plein .st-bar { position: absolute; left: 0; right: 0; bottom: calc(84px + var(--safe-b, 0px)); margin: 0; background: none; box-shadow: none; border-radius: 0; }
/* Le coach s'arrête au-dessus des sous-titres et des commandes : rien ne le cache. */
.cv.plein .ecran { background: #0b110d; }
.cv.plein .fig { bottom: calc(196px + var(--safe-b, 0px)); height: auto; }
.cv.plein .bas { background: none; }
.cv.plein .bas { padding-top: 8px; padding-bottom: calc(10px + var(--safe-b, 0px)); }
.cv.plein .st-texte p { font-size: 18px; }
.cv.pseudo { position: fixed; inset: 0; z-index: 200; }
@media (prefers-reduced-motion: reduce) { .st-enter-active, .st-leave-active, .pop-enter-active, .pop-leave-active { transition: none; } }
</style>
