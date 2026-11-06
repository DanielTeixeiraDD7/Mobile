<script setup lang="ts">
import { useId } from 'vue';
import {
  BALLON_R, HAUTEUR, SOL, corps, image, ombre, orientation, placeDecor, teteLocal, troncLocal,
  type Animation, type Peinture, type Scene, type Silhouette,
} from '@/core/figurine';

/**
 * Coach animé qui montre l'exercice : personnage dessiné à partir du squelette (membres galbés, tenue de sport,
 * ombre au sol, zones d'effort qui s'illuminent). S'arrête hors écran et si l'utilisateur limite les animations.
 */
const props = withDefaults(defineProps<{
  anim: Animation; taille?: number; joue?: boolean; vitesse?: number; temps?: number | null;
  /** Corpulence du coach. */
  silhouette?: Silhouette;
  /** Décor d'arrière-plan (discret, suit le thème clair/sombre). */
  scene?: Scene | null;
  /** Remplit son conteneur (largeur et hauteur 100 %) au lieu d'une taille fixe. */
  remplir?: boolean;
  /** Cadrage de la caméra [x, y, largeur, hauteur] dans la scène 200 × 200. */
  cadre?: [number, number, number, number] | null;
  /** Vue miroir (l'autre côté). */
  miroir?: boolean;
}>(), { taille: 220, joue: true, vitesse: 1, temps: null, silhouette: 'standard', scene: null, remplir: false, cadre: null, miroir: false });

const t = ref(0);
const racine = useTemplateRef<SVGSVGElement>('racine');
let raf = 0, depart = 0, visible = true;
const reduit = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function boucle(now: number) {
  if (!depart) depart = now;
  t.value = ((now - depart) / 1000) * props.vitesse;
  raf = requestAnimationFrame(boucle);
}
function lancer() { if (!raf && props.joue && !reduit && visible && props.temps === null) raf = requestAnimationFrame(boucle); }
function arreter() { cancelAnimationFrame(raf); raf = 0; depart = 0; }
let obs: IntersectionObserver | null = null;
onMounted(() => {
  // Animation réduite : on montre la pose la plus parlante (milieu du mouvement).
  if (reduit) t.value = (props.anim.durees[0] ?? 1) * 0.999;
  if ('IntersectionObserver' in window && racine.value) {
    obs = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; if (visible) lancer(); else arreter(); });
    obs.observe(racine.value);
  }
  lancer();
});
onBeforeUnmount(() => { arreter(); obs?.disconnect(); });
watch(() => [props.joue, props.anim, props.temps === null], () => { arreter(); t.value = reduit ? (props.anim.durees[0] ?? 1) * 0.999 : 0; lancer(); });

const id = useId();
const url = (n: string) => `url(#${id}-${n})`;
const temps = computed(() => props.temps ?? t.value);
const s = computed(() => image(props.anim, temps.value));
const zones = computed(() => props.anim.zones ?? []);
const calques = computed(() => corps(s.value, props.anim.vue, props.silhouette, zones.value));
const tronc = computed(() => troncLocal(props.anim.vue, props.silhouette));
const tete = computed(() => teteLocal(props.anim.vue));
const angles = computed(() => orientation(s.value));
const posTronc = computed(() => `translate(${s.value.hanche[0].toFixed(2)} ${s.value.hanche[1].toFixed(2)}) rotate(${angles.value.tronc.toFixed(2)})`);
const posTete = computed(() => `translate(${s.value.tete[0].toFixed(2)} ${s.value.tete[1].toFixed(2)}) rotate(${angles.value.tete.toFixed(2)})`);
const zoneTronc = computed(() => zones.value.includes('tronc'));
const ombreSol = computed(() => ombre(s.value));
const decors = computed(() => (props.anim.decor ?? []).map(d => ({ ...d, ...placeDecor(props.anim, d, temps.value) })));
const peinture = (p: Peinture) => (p === 'aucune' ? 'none' : url(p));
const vueBox = computed(() => (props.cadre ? props.cadre.map(v => v.toFixed(1)).join(' ') : '0 0 200 200'));

// Ballon : pentagones (un au centre, cinq coupés par le bord).
const penta = (cx: number, cy: number, r: number, rot: number) =>
  'M' + Array.from({ length: 5 }, (_, i) => { const a = ((rot + i * 72 - 90) * Math.PI) / 180; return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`; }).join(' L') + 'Z';
const BALLON = (() => {
  const R = BALLON_R;
  let d = penta(0, 0, R * 0.36, 0);
  let coutures = '';
  for (let i = 0; i < 5; i++) {
    const a = ((i * 72 - 90) * Math.PI) / 180, b = ((i * 72 - 90 + 36) * Math.PI) / 180;
    d += ' ' + penta(Math.cos(b) * R * 0.98, Math.sin(b) * R * 0.98, R * 0.36, 180 + i * 72);
    coutures += ` M${(Math.cos(a) * R * 0.36).toFixed(2)} ${(Math.sin(a) * R * 0.36).toFixed(2)} L${(Math.cos(a) * R * 0.78).toFixed(2)} ${(Math.sin(a) * R * 0.78).toFixed(2)}`;
  }
  return { d, coutures };
})();
// Sans arrière-plan, les murs restent dans le cadre (vignettes) ; avec, ils remplissent la scène.
const largeMur = (x: number) => (props.remplir || props.scene ? 400 : Math.max(0, Math.min(34, x > 100 ? 202 - x : x + 2)));
const haut = computed(() => (props.remplir || props.scene ? -300 : 14));
const decorProche = computed(() => (props.anim.decor ?? []).some(d => (d.type === 'mur' || d.type === 'porte') && d.x > 110));
const plot = (h: number) => 6.4 - (4.8 * (h - 2)) / 15;
</script>

<template>
  <svg
    ref="racine" class="figurine" :class="{ remplir, avecScene: !!scene }"
    :width="remplir ? '100%' : taille" :height="remplir ? '100%' : taille"
    :viewBox="vueBox" :preserveAspectRatio="remplir ? 'xMidYMax meet' : 'xMidYMid meet'" role="img" aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`${id}-peau`" x1="0" y1="0" x2=".45" y2="1"><stop offset="0" stop-color="#f6cfac" /><stop offset="1" stop-color="#d19469" /></linearGradient>
      <linearGradient :id="`${id}-peauF`" x1="0" y1="0" x2=".45" y2="1"><stop offset="0" stop-color="#c99470" /><stop offset="1" stop-color="#9f6a49" /></linearGradient>
      <linearGradient :id="`${id}-maillot`" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#4b8df8" /><stop offset="1" stop-color="#1c48b8" /></linearGradient>
      <linearGradient :id="`${id}-maillotF`" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#2f62bd" /><stop offset="1" stop-color="#16367f" /></linearGradient>
      <linearGradient :id="`${id}-short`" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#3a4252" /><stop offset="1" stop-color="#1a1f28" /></linearGradient>
      <linearGradient :id="`${id}-shortF`" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#262c37" /><stop offset="1" stop-color="#12161c" /></linearGradient>
      <linearGradient :id="`${id}-chaussette`" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" /><stop offset="1" stop-color="#dfe3ea" /></linearGradient>
      <linearGradient :id="`${id}-chaussetteF`" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c3c9d3" /><stop offset="1" stop-color="#a2a9b5" /></linearGradient>
      <linearGradient :id="`${id}-basket`" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" /><stop offset="1" stop-color="#d9dee6" /></linearGradient>
      <linearGradient :id="`${id}-basketF`" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfc5cf" /><stop offset="1" stop-color="#9aa1ad" /></linearGradient>
      <linearGradient :id="`${id}-semelle`" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3f4a" /><stop offset="1" stop-color="#1d2027" /></linearGradient>
      <linearGradient :id="`${id}-cheveux`" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#4a3122" /><stop offset="1" stop-color="#22140c" /></linearGradient>
      <radialGradient :id="`${id}-ombre`"><stop offset="0" stop-color="#000" stop-opacity=".42" /><stop offset=".6" stop-color="#000" stop-opacity=".16" /><stop offset="1" stop-color="#000" stop-opacity="0" /></radialGradient>
      <radialGradient :id="`${id}-ballon`" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".0" /><stop offset=".65" stop-color="#000" stop-opacity=".05" /><stop offset="1" stop-color="#000" stop-opacity=".38" /></radialGradient>
      <linearGradient :id="`${id}-bois`" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--fm-bois-1)" /><stop offset="1" stop-color="var(--fm-bois-2)" /></linearGradient>
      <linearGradient :id="`${id}-ecran`" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cc4ff" /><stop offset="1" stop-color="#2a5ea8" /></linearGradient>
      <linearGradient :id="`${id}-ciel`" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--fm-ciel-1)" /><stop offset="1" stop-color="var(--fm-ciel-2)" /></linearGradient>
      <linearGradient :id="`${id}-murfond`" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--fm-mur-1)" /><stop offset="1" stop-color="var(--fm-mur-2)" /></linearGradient>
      <linearGradient :id="`${id}-solfond`" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--fm-sol-1)" /><stop offset="1" stop-color="var(--fm-sol-2)" /></linearGradient>
      <linearGradient :id="`${id}-herbe`" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--fm-herbe-1)" /><stop offset="1" stop-color="var(--fm-herbe-2)" /></linearGradient>
      <radialGradient :id="`${id}-zone`" r=".62"><stop offset="0" stop-color="var(--fm-zone)" stop-opacity=".95" /><stop offset=".55" stop-color="var(--fm-zone)" stop-opacity=".6" /><stop offset="1" stop-color="var(--fm-zone)" stop-opacity=".05" /></radialGradient>
      <radialGradient :id="`${id}-halo`" r=".6"><stop offset=".3" stop-color="var(--fm-zone)" stop-opacity=".5" /><stop offset="1" stop-color="var(--fm-zone)" stop-opacity="0" /></radialGradient>
      <clipPath :id="`${id}-haut`"><rect x="-40" y="-80" width="80" height="73" /></clipPath>
      <clipPath :id="`${id}-tronc`"><path :d="tronc.contour" /></clipPath>
      <clipPath :id="`${id}-rond`"><circle r="6.8" /></clipPath>
    </defs>

    <g :transform="miroir ? 'translate(200 0) scale(-1 1)' : undefined">
      <!-- Arrière-plan -->
      <g v-if="scene === 'salon'" class="scene">
        <rect x="-400" y="-300" width="1000" :height="SOL + 302" :fill="url('murfond')" />
        <g class="fenetre">
          <rect x="10" y="34" width="50" height="78" rx="2" class="cadre-f" />
          <rect x="14" y="38" width="42" height="70" :fill="url('ciel')" />
          <path d="M35 38 V108 M14 73 H56" class="croisillon" />
          <path d="M14 108 L56 38 L56 60 L27 108Z" class="reflet" />
          <rect x="6" y="111" width="58" height="4" rx="1.5" class="appui" />
        </g>
        <g v-if="!decorProche" class="tableau"><rect x="132" y="52" width="40" height="28" rx="1.5" class="cadre-t" /><path d="M136 76 L148 62 L156 70 L162 64 L168 76Z" class="motif" /><circle cx="160" cy="59" r="3" class="motif2" /></g>
        <rect x="-400" :y="SOL - 6" width="1000" height="7.5" class="plinthe" />
        <g class="plante">
          <path d="M-22 186 L-20 166 H-6 L-4 186Z" class="pot" />
          <path d="M-13 166 C-24 150 -30 140 -26 128 C-18 138 -14 150 -13 166Z M-13 166 C-8 146 -2 136 6 132 C4 146 -4 156 -13 166Z M-13 166 C-16 144 -12 128 -6 118 C-4 134 -8 150 -13 166Z" class="feuille" />
        </g>
        <g class="plante"><path d="M206 186 L208 168 H222 L224 186Z" class="pot" /><path d="M215 168 C204 152 200 140 204 128 C212 140 214 152 215 168Z M215 168 C220 150 226 140 234 136 C232 150 224 158 215 168Z" class="feuille" /></g>
        <rect x="-400" :y="SOL + 1.5" width="1000" height="300" :fill="url('solfond')" />
        <path :d="`M-400 ${SOL + 7} H600 M-400 ${SOL + 15} H600 M-400 ${SOL + 27} H600`" class="lattes" />
      </g>
      <g v-else-if="scene === 'jardin'" class="scene">
        <rect x="-400" y="-300" width="1000" :height="SOL + 302" :fill="url('ciel')" />
        <circle cx="30" cy="38" r="12" class="soleil" />
        <path d="M-400 150 C-300 136 -200 142 -120 138 C-60 128 -10 140 40 134 C90 126 130 138 170 132 C220 126 260 140 600 136 V190 H-400Z" class="colline" />
        <g class="arbre"><rect x="-10" y="120" width="5" height="40" rx="2" class="tronc-a" /><circle cx="-8" cy="112" r="17" class="houppier" /><circle cx="4" cy="124" r="12" class="houppier" /></g>
        <path :d="`M-400 ${SOL - 26} C-200 ${SOL - 32} -100 ${SOL - 24} 0 ${SOL - 28} C80 ${SOL - 31} 140 ${SOL - 24} 260 ${SOL - 29} C400 ${SOL - 33} 500 ${SOL - 27} 600 ${SOL - 28} V${SOL + 2} H-400Z`" class="haie" />
        <g class="but"><path :d="`M150 ${SOL} V${SOL - 46} H214 V${SOL}`" class="poteau" /><path :d="`M154 ${SOL - 42} H210 M154 ${SOL - 32} H210 M154 ${SOL - 22} H210 M154 ${SOL - 12} H210 M162 ${SOL - 46} V${SOL} M174 ${SOL - 46} V${SOL} M186 ${SOL - 46} V${SOL} M198 ${SOL - 46} V${SOL}`" class="filet" /></g>
        <rect x="-400" :y="SOL + 1.5" width="1000" height="300" :fill="url('herbe')" />
        <path :d="`M-400 ${SOL + 1.5} H600`" class="ligne-terrain" />
        <path :d="`M-60 ${SOL + 1.5} L-90 ${SOL + 40} H-30 L-12 ${SOL + 1.5}Z M60 ${SOL + 1.5} L48 ${SOL + 40} H108 L108 ${SOL + 1.5}Z M156 ${SOL + 1.5} L170 ${SOL + 40} H230 L204 ${SOL + 1.5}Z`" class="tonte" />
      </g>
      <g v-else-if="scene === 'bureau'" class="scene">
        <rect x="-400" y="-300" width="1000" :height="SOL + 302" :fill="url('murfond')" />
        <g class="fenetre">
          <rect x="-2" y="30" width="74" height="70" rx="2" class="cadre-f" />
          <rect x="2" y="34" width="66" height="62" :fill="url('ciel')" />
          <path d="M6 96 V70 H14 V58 H22 V76 H30 V50 H40 V66 H48 V60 H56 V80 H64 V96Z" class="ville" />
          <path d="M35 34 V96" class="croisillon" />
        </g>
        <g class="etagere"><rect x="146" y="70" width="56" height="3" class="planche" /><rect x="150" y="56" width="5" height="14" class="livre1" /><rect x="156" y="58" width="4" height="12" class="livre2" /><rect x="161" y="54" width="6" height="16" class="livre3" /><rect x="180" y="60" width="12" height="10" rx="2" class="pot" /></g>
        <rect x="-400" :y="SOL - 6" width="1000" height="7.5" class="plinthe" />
        <rect x="-400" :y="SOL + 1.5" width="1000" height="300" :fill="url('solfond')" />
      </g>
      <line v-else x1="4" :y1="SOL + 1.5" x2="196" :y2="SOL + 1.5" class="sol" />

      <!-- Décor -->
      <g class="decor">
        <template v-for="(d, i) in decors" :key="i">
          <g v-if="d.type === 'chaise'" :transform="`translate(${d.x} 0) scale(${d.sens ?? 1} 1)`">
            <ellipse cx="0" :cy="SOL + 1" rx="20" ry="2.2" class="ombre-d" />
            <rect x="-15.5" :y="SOL - 45" width="3" height="45" rx="1" :fill="url('bois')" class="bord" />
            <rect x="12.5" :y="SOL - 45" width="3" height="45" rx="1" :fill="url('bois')" class="bord" />
            <rect x="-14" :y="SOL - 16" width="28" height="2" rx="1" class="barreau" />
            <rect x="-17.4" :y="SOL - HAUTEUR.dossier" width="3.4" :height="HAUTEUR.dossier - HAUTEUR.chaise" rx="1.4" :fill="url('bois')" class="bord" />
            <rect x="-18.4" :y="SOL - HAUTEUR.dossier + 2" width="5.2" height="17" rx="2" :fill="url('bois')" class="bord" />
            <rect x="-17.5" :y="SOL - HAUTEUR.chaise - 2" width="35" height="4.4" rx="1.6" :fill="url('bois')" class="bord" />
          </g>
          <g v-else-if="d.type === 'mur'">
            <rect :x="d.x > 100 ? d.x : d.x - largeMur(d.x)" :y="haut" :width="largeMur(d.x)" :height="SOL + 1.5 - haut" class="mur" />
            <rect :x="d.x > 100 ? d.x : d.x - 2" :y="haut" width="2" :height="SOL + 1.5 - haut" class="arete" />
            <rect :x="d.x > 100 ? d.x : d.x - 3" :y="SOL - 6" width="3" height="7.5" class="plinthe-m" />
          </g>
          <g v-else-if="d.type === 'marche'">
            <ellipse :cx="d.x" :cy="SOL + 1" rx="26" ry="2.2" class="ombre-d" />
            <rect :x="d.x - 22" :y="SOL - HAUTEUR.marche" width="44" :height="HAUTEUR.marche" rx="1.5" class="pierre bord" />
            <rect :x="d.x - 23.5" :y="SOL - HAUTEUR.marche - 1" width="47" height="4" rx="1.5" :fill="url('bois')" class="bord" />
          </g>
          <g v-else-if="d.type === 'table'">
            <ellipse :cx="d.x" :cy="SOL + 1" rx="30" ry="2.2" class="ombre-d" />
            <rect :x="d.x - 24" :y="SOL - HAUTEUR.table" width="3.4" :height="HAUTEUR.table" rx="1" :fill="url('bois')" class="bord" />
            <rect :x="d.x + 20.6" :y="SOL - HAUTEUR.table" width="3.4" :height="HAUTEUR.table" rx="1" :fill="url('bois')" class="bord" />
            <rect :x="d.x - 25" :y="SOL - HAUTEUR.table + 1" width="50" height="5" class="ceinture" />
            <rect :x="d.x - 29" :y="SOL - HAUTEUR.table - 2.5" width="58" height="4.5" rx="1.6" :fill="url('bois')" class="bord" />
          </g>
          <g v-else-if="d.type === 'bureau'" :transform="`translate(${d.x} 0) scale(${d.sens ?? 1} 1)`">
            <ellipse cx="0" :cy="SOL + 1" rx="34" ry="2.2" class="ombre-d" />
            <rect x="-30" :y="SOL - HAUTEUR.table" width="3.4" :height="HAUTEUR.table" rx="1" class="metal bord" />
            <rect x="8" :y="SOL - HAUTEUR.table + 2" width="20" height="30" rx="1.5" :fill="url('bois')" class="bord" />
            <path :d="`M10 ${SOL - HAUTEUR.table + 16} H26`" class="poignee" />
            <rect x="26.6" :y="SOL - HAUTEUR.table" width="3.4" :height="HAUTEUR.table" rx="1" class="metal bord" />
            <rect x="-33" :y="SOL - HAUTEUR.table - 2.5" width="66" height="4" rx="1.4" :fill="url('bois')" class="bord" />
            <rect x="-22" :y="SOL - HAUTEUR.table - 3.6" width="16" height="1.4" rx=".6" class="clavier" />
            <rect x="12" :y="SOL - HAUTEUR.table - 4.2" width="12" height="1.8" rx=".8" class="metal" />
            <rect x="16.6" :y="SOL - HAUTEUR.table - 14" width="2.6" height="10" class="metal" />
            <g :transform="`rotate(-6 ${17} ${SOL - HAUTEUR.table - 24})`">
              <rect x="15.4" :y="SOL - HAUTEUR.table - 36" width="3.4" height="23" rx="1" class="ecran-dos bord" />
              <rect x="14.2" :y="SOL - HAUTEUR.table - 35" width="1.4" height="21" :fill="url('ecran')" />
            </g>
          </g>
          <g v-else-if="d.type === 'porte'">
            <rect :x="d.x" y="20" width="5" :height="SOL - 20" :fill="url('bois')" class="bord" />
            <rect :x="d.x - 1" y="18" width="26" height="5" rx="1" :fill="url('bois')" class="bord" />
            <rect :x="d.x + 5" y="23" width="20" :height="SOL - 23" class="ouverture" />
          </g>
          <rect v-else-if="d.type === 'tapis'" :x="d.x - 70" :y="SOL - 2.4" width="140" height="3.6" rx="1.8" class="tapis" />
          <g v-else-if="d.type === 'plot'">
            <ellipse :cx="d.x" :cy="SOL + 1" rx="11" ry="1.8" class="ombre-d" />
            <rect :x="d.x - 9" :y="SOL - 2.2" width="18" height="2.6" rx="1" class="plot-base" />
            <path :d="`M${d.x - 6.4} ${SOL - 2} L${d.x - 1.7} ${SOL - 17} Q${d.x} ${SOL - 18.4} ${d.x + 1.7} ${SOL - 17} L${d.x + 6.4} ${SOL - 2}Z`" class="plot-cone" />
            <path :d="`M${d.x - plot(8)} ${SOL - 8} L${d.x - plot(11)} ${SOL - 11} H${d.x + plot(11)} L${d.x + plot(8)} ${SOL - 8}Z`" class="plot-bande" />
            <path :d="`M${d.x - 3.6} ${SOL - 4} L${d.x - 1.2} ${SOL - 15}`" class="plot-reflet" />
          </g>
          <g v-else-if="d.type === 'ballon'">
            <ellipse :cx="d.x" :cy="SOL + 1" :rx="BALLON_R * Math.max(.5, 1.25 - (SOL - BALLON_R - d.y) / 60)" ry="1.8" class="ombre-d" />
            <g :transform="`translate(${d.x.toFixed(2)} ${d.y.toFixed(2)})`">
              <circle :r="BALLON_R" class="ballon" />
              <g :clip-path="url('rond')"><g :transform="`rotate(${d.angle.toFixed(1)})`"><path :d="BALLON.d" class="penta" /><path :d="BALLON.coutures" class="couture" /></g></g>
              <circle :r="BALLON_R" :fill="url('ballon')" class="ballon-contour" />
            </g>
          </g>
        </template>
      </g>

      <!-- Ombre au sol -->
      <ellipse v-if="ombreSol" :cx="ombreSol.cx" :cy="SOL + 1.6" :rx="ombreSol.rx" ry="3.4" :fill="url('ombre')" :opacity="ombreSol.o" />

      <!-- Corps -->
      <g class="corps" :class="{ zoneAnimee: !!zones.length }">
        <path v-for="(c, k) in calques.arriere" :key="'a' + k" :d="c.d" :fill="peinture(c.p)" :class="c.c" />
        <path v-for="(c, k) in calques.cou" :key="'c' + k" :d="c.d" :fill="peinture(c.p)" :class="c.c" />
        <g :transform="posTronc">
          <path :d="tronc.contour" :fill="url('short')" class="contour" />
          <path :d="tronc.contour" :fill="url('maillot')" :clip-path="url('haut')" />
          <path d="M-30 -7 H30" class="ourlet" :clip-path="url('tronc')" />
          <path :d="anim.vue === 'face' ? 'M-5.4 -55 Q0 -49.6 5.4 -55' : 'M4.4 -53.2 Q0.6 -50.6 -3.4 -53.6'" class="col" />
          <path v-if="anim.vue === 'face'" d="M-12 -46 Q-10 -30 -11 -12 M12 -46 Q10 -30 11 -12" class="pli" />
          <path v-else d="M-6 -46 Q-3 -30 -4.6 -14" class="pli" />
          <circle :cx="tronc.logo[0]" :cy="tronc.logo[1]" r="1.7" class="logo" />
          <template v-if="zoneTronc">
            <ellipse :cx="anim.vue === 'face' ? 0 : 2" cy="-25" :rx="anim.vue === 'face' ? 17 : 14" ry="22" :fill="url('halo')" class="zone-halo" />
            <ellipse :cx="anim.vue === 'face' ? 0 : 2.5" cy="-25" :rx="anim.vue === 'face' ? 10 : 7.5" ry="15" :fill="url('zone')" class="zone-coeur" :clip-path="url('tronc')" />
          </template>
        </g>
        <g :transform="posTete">
          <template v-if="anim.vue === 'face'">
            <path :d="tete.oreilles" :fill="url('peau')" class="contour" />
            <path :d="tete.tete" :fill="url('peau')" class="contour" />
            <path :d="tete.cheveux" :fill="url('cheveux')" />
            <path :d="tete.yeux" class="oeil" />
            <path :d="tete.sourcils" class="sourcil" />
            <path :d="tete.nez" class="nez" />
            <path :d="tete.bouche" class="bouche" />
          </template>
          <template v-else>
            <path :d="tete.tete" :fill="url('peau')" class="contour" />
            <path :d="tete.cheveux" :fill="url('cheveux')" />
            <path :d="tete.oreilles" :fill="url('peau')" class="trait" />
            <path :d="tete.nez" class="nez" />
            <path :d="tete.yeux" class="oeil" />
            <path :d="tete.sourcils" class="sourcil" />
            <path :d="tete.bouche" class="bouche" />
          </template>
        </g>
        <path v-for="(c, k) in calques.avant" :key="'v' + k" :d="c.d" :fill="peinture(c.p)" :class="c.c" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.figurine {
  display: block; overflow: visible;
  --fm-zone: var(--flamme-vif, #f97316);
  --fm-bois-1: #c8946a; --fm-bois-2: #9a6a45;
  --fm-mur-1: #eef1ea; --fm-mur-2: #e2e7dd;
  --fm-sol-1: #d9c3a3; --fm-sol-2: #c4a982;
  --fm-ciel-1: #bfe3ff; --fm-ciel-2: #eaf6ff;
  --fm-herbe-1: #5cae3f; --fm-herbe-2: #3d8a2a;
  --fm-trait: rgba(28, 18, 12, .5);
  --fm-murdecor: #d8ddd3;
}
.dark .figurine {
  --fm-bois-1: #8f6545; --fm-bois-2: #5f412b;
  --fm-mur-1: #17211b; --fm-mur-2: #111a15;
  --fm-sol-1: #2a2219; --fm-sol-2: #1a1510;
  --fm-ciel-1: #0f2a3a; --fm-ciel-2: #1d4256;
  --fm-herbe-1: #1f5a2c; --fm-herbe-2: #10361a;
  --fm-trait: rgba(0, 0, 0, .55);
  --fm-murdecor: #2a3730;
}
.figurine.remplir, .figurine.avecScene { overflow: hidden; }

/* Corps */
.contour { stroke: var(--fm-trait); stroke-width: 1.1; stroke-linejoin: round; }
.trait { stroke: var(--fm-trait); stroke-width: .55; stroke-linejoin: round; }
.ourlet { stroke: rgba(10, 20, 50, .45); stroke-width: 1.1; }
.col { fill: none; stroke: #173b94; stroke-width: 1.5; stroke-linecap: round; }
.pli { fill: none; stroke: rgba(10, 25, 70, .22); stroke-width: .9; stroke-linecap: round; }
.logo { fill: var(--volt, #c5f23b); }
.bande { stroke: rgba(255, 255, 255, .55); stroke-width: 1.1; stroke-linecap: round; fill: none; }
.accent-l { fill: none; stroke: var(--volt, #c5f23b); stroke-width: 1.3; stroke-linecap: round; }
.accent-l.fond { stroke: #8fae2c; }
.lacets { fill: none; stroke: #9aa2ae; stroke-width: .8; stroke-dasharray: 1 1; }
.semelle-l { fill: none; stroke: #2b2f38; stroke-width: 1.6; stroke-linecap: round; }
.oeil { fill: #1b120c; }
.sourcil { fill: none; stroke: #2a1a10; stroke-width: .9; stroke-linecap: round; }
.nez { fill: none; stroke: rgba(120, 60, 30, .45); stroke-width: .7; stroke-linecap: round; }
.bouche { fill: none; stroke: #9a4a3c; stroke-width: .75; stroke-linecap: round; }
.zone-halo { opacity: .55; }
.zone-coeur { opacity: .8; }
.zoneAnimee .zone-coeur, .zoneAnimee .zone-halo { animation: pulse 1.8s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .35; } }
@media (prefers-reduced-motion: reduce) { .zoneAnimee .zone-coeur, .zoneAnimee .zone-halo { animation: none; } }

/* Décor */
.sol { stroke: var(--sol, #343a46); stroke-width: 2; stroke-linecap: round; }
.bord { stroke: rgba(0, 0, 0, .28); stroke-width: .6; }
.ombre-d { fill: #000; opacity: .16; }
.barreau, .ceinture { fill: var(--fm-bois-2); }
.mur { fill: var(--fm-murdecor); }
.arete { fill: rgba(0, 0, 0, .12); }
.plinthe-m { fill: color-mix(in srgb, var(--fm-murdecor) 70%, #000); }
.pierre { fill: color-mix(in srgb, var(--fm-murdecor) 80%, #6b6b6b); }
.metal { fill: #8a929e; }
.poignee { stroke: #3b3f46; stroke-width: 1.2; stroke-linecap: round; }
.clavier { fill: #2e333b; }
.ecran-dos { fill: #2b3038; }
.ouverture { fill: rgba(0, 0, 0, .1); }
.tapis { fill: #2bb3a3; }
.dark .tapis { fill: #1f8a7e; }
.plot-base { fill: #e85d0c; }
.plot-cone { fill: #ff7a1a; stroke: rgba(0, 0, 0, .25); stroke-width: .5; }
.plot-bande { fill: #fff; opacity: .92; }
.plot-reflet { stroke: rgba(255, 255, 255, .45); stroke-width: 1.2; stroke-linecap: round; }
.ballon { fill: #fbfbfb; }
.penta { fill: #20242b; }
.couture { fill: none; stroke: #20242b; stroke-width: .5; }
.ballon-contour { stroke: rgba(0, 0, 0, .35); stroke-width: .5; }

/* Arrière-plans (discrets) */
.scene .cadre-f { fill: #fff; opacity: .85; }
.dark .scene .cadre-f { fill: #26332b; opacity: 1; }
.scene .croisillon { stroke: #fff; stroke-width: 2; opacity: .85; }
.dark .scene .croisillon { stroke: #26332b; opacity: 1; }
.scene .reflet { fill: #fff; opacity: .18; }
.scene .appui { fill: #fff; opacity: .9; }
.dark .scene .appui { fill: #2c3a31; }
.scene .cadre-t { fill: #fff; stroke: #c9b597; stroke-width: 1.4; }
.dark .scene .cadre-t { fill: #1c2620; stroke: #3c4a40; }
.scene .motif { fill: #9cc9a4; opacity: .8; }
.scene .motif2 { fill: #f4c66b; opacity: .8; }
.scene .pot { fill: #c46a3f; }
.dark .scene .pot { fill: #7a4329; }
.scene .feuille { fill: #4c9a52; }
.dark .scene .feuille { fill: #24502b; }
.scene .plinthe { fill: #fff; opacity: .7; }
.dark .scene .plinthe { fill: #1e2a23; opacity: 1; }
.scene .lattes { stroke: rgba(0, 0, 0, .08); stroke-width: .8; }
.scene .soleil { fill: #fff6c9; opacity: .9; }
.dark .scene .soleil { fill: #dfe8f0; opacity: .5; }
.scene .colline { fill: #a7d39a; opacity: .7; }
.dark .scene .colline { fill: #173d24; opacity: 1; }
.scene .houppier { fill: #5a9e4a; }
.dark .scene .houppier { fill: #1b4626; }
.scene .tronc-a { fill: #8a6040; }
.dark .scene .tronc-a { fill: #3c2a1d; }
.scene .haie { fill: #3f8a3a; }
.dark .scene .haie { fill: #12371d; }
.scene .poteau { fill: none; stroke: #fff; stroke-width: 2.4; stroke-linejoin: round; }
.dark .scene .poteau { stroke: #d9e2dc; opacity: .7; }
.scene .filet { fill: none; stroke: #fff; stroke-width: .4; opacity: .6; }
.dark .scene .filet { opacity: .3; }
.scene .ligne-terrain { stroke: rgba(255, 255, 255, .5); stroke-width: 1; }
.scene .tonte { fill: rgba(255, 255, 255, .06); }
.scene .ville { fill: #9fb8c9; opacity: .6; }
.dark .scene .ville { fill: #0b1a24; opacity: 1; }
.scene .planche { fill: var(--fm-bois-1); }
.scene .livre1 { fill: #d0573f; } .scene .livre2 { fill: #4a7bd0; } .scene .livre3 { fill: #e5b84a; }
.dark .scene .livre1, .dark .scene .livre2, .dark .scene .livre3 { opacity: .55; }
</style>
