<script setup lang="ts">
import { HAUTEUR, SOL, image, type Animation, type Segment } from '@/core/figurine';

/** Personnage animé qui montre l'exercice. S'arrête hors écran et si l'utilisateur limite les animations. */
const props = withDefaults(defineProps<{ anim: Animation; taille?: number; joue?: boolean; vitesse?: number; temps?: number | null }>(), { taille: 220, joue: true, vitesse: 1, temps: null });

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
watch(() => [props.joue, props.anim], () => { arreter(); t.value = 0; lancer(); });

const s = computed(() => image(props.anim, props.temps ?? t.value));
const zone = (seg: Segment) => props.anim.zones?.includes(seg);
const fond = (seg: Segment) => props.anim.vue === 'profil' && seg.endsWith('G');
const segments = computed(() => {
  const k = s.value;
  const l = (seg: Segment, a: [number, number], b: [number, number]) => ({ seg, x1: a[0], y1: a[1], x2: b[0], y2: b[1], zone: zone(seg), fond: fond(seg) });
  const tronc = props.anim.vue === 'face'
    ? l('tronc', [(k.hancheG[0] + k.hancheD[0]) / 2, (k.hancheG[1] + k.hancheD[1]) / 2], k.cou)
    : l('tronc', k.hanche, k.cou);
  const membres = [
    l('cuisseG', k.hancheG, k.genouG), l('tibiaG', k.genouG, k.chevilleG), l('brasG', k.epauleG, k.coudeG), l('avbrasG', k.coudeG, k.mainG),
    l('cuisseD', k.hancheD, k.genouD), l('tibiaD', k.genouD, k.chevilleD), l('brasD', k.epauleD, k.coudeD), l('avbrasD', k.coudeD, k.mainD),
  ];
  // Profil : membres du fond derrière le tronc, ceux du devant par-dessus.
  return { fond: membres.filter(m => m.fond), tronc, devant: membres.filter(m => !m.fond) };
});
const pieds = computed(() => [
  { a: s.value.chevilleG, b: s.value.piedG, fond: props.anim.vue === 'profil' },
  { a: s.value.chevilleD, b: s.value.piedD, fond: false },
]);
</script>

<template>
  <svg ref="racine" class="figurine" :width="taille" :height="taille" viewBox="0 0 200 200" role="img" aria-hidden="true">
    <!-- Décor -->
    <g class="decor">
      <line x1="4" :y1="SOL + 1.5" x2="196" :y2="SOL + 1.5" class="sol" />
      <template v-for="(d, i) in anim.decor ?? []" :key="i">
        <g v-if="d.type === 'chaise'" :transform="`translate(${d.x} 0) scale(${d.sens ?? 1} 1)`">
          <path :d="`M-16 ${SOL - HAUTEUR.chaise} h32 M-14 ${SOL - HAUTEUR.chaise} V${SOL} M14 ${SOL - HAUTEUR.chaise} V${SOL} M-16 ${SOL - HAUTEUR.chaise} V${SOL - HAUTEUR.dossier}`" />
        </g>
        <path v-else-if="d.type === 'mur'" :d="`M${d.x} 20 V${SOL}`" class="epais" />
        <rect v-else-if="d.type === 'marche'" :x="d.x - 22" :y="SOL - HAUTEUR.marche" width="44" :height="HAUTEUR.marche" rx="2" />
        <g v-else-if="d.type === 'table'">
          <path :d="`M${d.x - 26} ${SOL - HAUTEUR.table} h52 M${d.x - 22} ${SOL - HAUTEUR.table} V${SOL} M${d.x + 22} ${SOL - HAUTEUR.table} V${SOL}`" class="epais" />
        </g>
        <path v-else-if="d.type === 'porte'" :d="`M${d.x} 26 V${SOL} M${d.x} 26 h18`" class="epais" />
        <rect v-else-if="d.type === 'tapis'" :x="d.x - 70" :y="SOL - 3" width="140" height="4" rx="2" class="tapis" />
      </template>
    </g>
    <!-- Corps -->
    <g class="corps" stroke-linecap="round">
      <line v-for="m in segments.fond" :key="m.seg" :x1="m.x1" :y1="m.y1" :x2="m.x2" :y2="m.y2" :class="['m', 'fond', { zone: m.zone }]" />
      <line v-if="!pieds[0]!.fond" :x1="pieds[0]!.a[0]" :y1="pieds[0]!.a[1]" :x2="pieds[0]!.b[0]" :y2="pieds[0]!.b[1]" class="m pied" />
      <line v-else :x1="pieds[0]!.a[0]" :y1="pieds[0]!.a[1]" :x2="pieds[0]!.b[0]" :y2="pieds[0]!.b[1]" class="m pied fond" />
      <line :x1="segments.tronc.x1" :y1="segments.tronc.y1" :x2="segments.tronc.x2" :y2="segments.tronc.y2" :class="['m', 'tronc', { zone: segments.tronc.zone }]" />
      <line v-if="anim.vue === 'face'" :x1="s.epauleG[0]" :y1="s.epauleG[1]" :x2="s.epauleD[0]" :y2="s.epauleD[1]" class="m epaules" />
      <line v-if="anim.vue === 'face'" :x1="s.hancheG[0]" :y1="s.hancheG[1]" :x2="s.hancheD[0]" :y2="s.hancheD[1]" class="m bassin" />
      <circle :cx="s.tete[0]" :cy="s.tete[1]" r="10" class="tete" />
      <line v-for="m in segments.devant" :key="m.seg" :x1="m.x1" :y1="m.y1" :x2="m.x2" :y2="m.y2" :class="['m', { zone: m.zone }]" />
      <line :x1="pieds[1]!.a[0]" :y1="pieds[1]!.a[1]" :x2="pieds[1]!.b[0]" :y2="pieds[1]!.b[1]" class="m pied" />
    </g>
  </svg>
</template>

<style scoped>
.figurine { display: block; overflow: visible; }
.decor { fill: none; stroke: var(--decor, #4a5160); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.decor rect { fill: color-mix(in srgb, var(--decor, #4a5160) 35%, transparent); }
.decor .epais { stroke-width: 4; }
.decor .tapis { fill: color-mix(in srgb, var(--brand) 30%, transparent); stroke: none; }
.sol { stroke: var(--sol, #343a46); stroke-width: 2; }
.m { stroke: var(--corps, #e8ebf2); stroke-width: 8; }
.m.fond { stroke: var(--corps-fond, #8790a3); }
.m.tronc { stroke-width: 10; }
.m.pied { stroke-width: 6; }
.m.epaules, .m.bassin { stroke-width: 8; }
.m.zone { stroke: var(--zone, #ff6b35); }
.m.fond.zone { stroke: color-mix(in srgb, var(--zone, #ff6b35) 60%, #000); }
.tete { fill: var(--corps, #e8ebf2); }
</style>
