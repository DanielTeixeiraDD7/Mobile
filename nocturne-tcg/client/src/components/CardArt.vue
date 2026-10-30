<script setup lang="ts">
import { FACTION_COLOR, RARITY_COLOR, rarityRank, type CardDTO, type Faction } from '@nocturne/shared';
import { computed, useId } from 'vue';
import { BACKDROPS, DETAILS, MOON, SILHOUETTES } from '@/lib/art';

const props = defineProps<{ card: Pick<CardDTO, 'faction' | 'rarity' | 'silhouette' | 'variant' | 'number' | 'imageUrl' | 'name'>; hq?: boolean }>();
const id = useId().replace(/[^a-zA-Z0-9]/g, '');
const u = (n: string) => `url(#${n}${id})`;

const EYES: Record<Faction, string> = { SANG: '#ff2b4a', CROC: '#ffb02e', ABIME: '#5ff2d2', SPECTRE: '#9fd7ff', ALCHIMIE: '#b6ff5a', CRYPTIDE: '#ff3b3b', MYTHE: '#ffd34d' };
const CLOTH: Record<Faction, string> = { SANG: '#7a0e22', CROC: '#5a3e1e', ABIME: '#0f4a52', SPECTRE: '#3a4a72', ALCHIMIE: '#2e5a22', CRYPTIDE: '#4a2a62', MYTHE: '#7a5a14' };
const PARTICLE: Record<Faction, 'petal' | 'leaf' | 'bubble' | 'wisp' | 'spark' | 'firefly' | 'dust'> = {
  SANG: 'petal', CROC: 'leaf', ABIME: 'bubble', SPECTRE: 'wisp', ALCHIMIE: 'spark', CRYPTIDE: 'firefly', MYTHE: 'dust',
};

const alt = computed(() => props.card.variant === 'ALTERNATE');
const sky = computed(() => (alt.value ? ['#b0233a', '#4a0614', '#12020a'] : [FACTION_COLOR[props.card.faction][0], FACTION_COLOR[props.card.faction][0], FACTION_COLOR[props.card.faction][1]]));
const moon = computed(() => (alt.value ? '#ffcf6a' : MOON[props.card.faction]));
const rank = computed(() => rarityRank(props.card.rarity));
const accent = computed(() => RARITY_COLOR[props.card.rarity]);
const moonPos = computed(() => (alt.value ? { x: 100, y: 64, r: 44 } : { x: 148, y: 46, r: 24 }));

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}
const stars = computed(() => {
  const r = rng(props.card.number);
  return Array.from({ length: 22 }, () => ({ x: r() * 200, y: r() * 110, r: 0.3 + r() * 0.9, o: 0.25 + r() * 0.7 }));
});
const particles = computed(() => {
  const r = rng(props.card.number + 101);
  return Array.from({ length: 9 + rank.value * 2 }, () => ({ x: r() * 200, y: 60 + r() * 175, s: 0.6 + r() * 1.4, a: r() * 360, o: 0.35 + r() * 0.55 }));
});
const kind = computed(() => PARTICLE[props.card.faction]);

function paint(src: string) {
  return src
    .replaceAll('"D2"', '"#261b30"').replaceAll('"D"', `"${u('fig')}"`)
    .replaceAll('"SS"', '"#b49ca2"').replaceAll('"S2"', '"#9fb39a"').replaceAll('"S"', '"#efe0d8"')
    .replaceAll('"H"', '"#150c19"').replaceAll('"C"', `"${CLOTH[props.card.faction]}"`)
    .replaceAll('"P"', '"#e6ecff"').replaceAll('"E"', `"${EYES[props.card.faction]}"`).replaceAll('"A"', `"${accent.value}"`)
    .replaceAll('"L"', `"${moon.value}"`).replaceAll('__W', `w${id}`);
}
const raw = computed(() => SILHOUETTES[props.card.silhouette] ?? SILHOUETTES.ghost!);
const figure = computed(() => paint(raw.value));
const detail = computed(() => paint(DETAILS[props.card.silhouette] ?? ''));
const rays = computed(() => {
  const { x, y } = moonPos.value;
  return [[-40, 30], [-20, 34], [5, 40], [-60, 22]].map(([a, w]) => {
    const rad = ((180 + a! + 25) * Math.PI) / 180, len = 320;
    const ex = x + Math.cos(rad) * len, ey = y - Math.sin(rad) * len;
    const px = Math.sin(rad) * w!, py = Math.cos(rad) * w!;
    return `M${x} ${y} L${ex + px} ${ey + py} L${ex - px} ${ey - py} Z`;
  });
});
</script>

<template>
  <img v-if="card.imageUrl" class="art-img" :src="card.imageUrl" :alt="card.name" loading="lazy" />
  <svg v-else class="art-svg" viewBox="0 0 200 240" preserveAspectRatio="xMidYMid slice" role="img" :aria-label="card.name">
    <defs>
      <linearGradient :id="`sky${id}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="sky[2]" />
        <stop offset=".45" :stop-color="sky[0]" />
        <stop offset="1" :stop-color="sky[2]" />
      </linearGradient>
      <radialGradient :id="`moon${id}`" cx="40%" cy="38%" r="70%">
        <stop offset="0" stop-color="#fffaf0" />
        <stop offset=".55" :stop-color="moon" />
        <stop offset="1" :stop-color="moon" stop-opacity=".75" />
      </radialGradient>
      <linearGradient :id="`fig${id}`" gradientUnits="userSpaceOnUse" x1="170" y1="40" x2="40" y2="240">
        <stop offset="0" stop-color="#2a1e34" />
        <stop offset=".45" stop-color="#120b18" />
        <stop offset="1" stop-color="#040205" />
      </linearGradient>
      <radialGradient :id="`aura${id}`" cx="50%" cy="58%" r="50%">
        <stop offset="0" :stop-color="accent" :stop-opacity="0.12 + rank * 0.08" />
        <stop offset="1" :stop-color="accent" stop-opacity="0" />
      </radialGradient>
      <radialGradient :id="`vig${id}`" cx="50%" cy="45%" r="72%">
        <stop offset=".6" stop-color="#000" stop-opacity="0" />
        <stop offset="1" stop-color="#000" stop-opacity=".7" />
      </radialGradient>
      <linearGradient :id="`fade${id}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".9" />
        <stop offset=".7" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
      <linearGradient :id="`shade${id}`" gradientUnits="userSpaceOnUse" x1="160" y1="60" x2="50" y2="230">
        <stop offset="0" stop-color="#000" stop-opacity="0" />
        <stop offset=".55" stop-color="#000" stop-opacity=".12" />
        <stop offset="1" stop-color="#000" stop-opacity=".55" />
      </linearGradient>
      <pattern :id="`hatch${id}`" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
        <line x1="0" y1="0" x2="0" y2="3.2" stroke="#000" stroke-width=".9" />
      </pattern>
      <filter :id="`blur${id}`" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
      <filter :id="`soft${id}`" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" /></filter>
      <filter :id="`back${id}`" x="-30%" y="-30%" width="160%" height="160%">
        <feFlood :flood-color="moon" result="c" />
        <feComposite in="c" in2="SourceAlpha" operator="in" />
        <feGaussianBlur stdDeviation="5" />
      </filter>
      <filter :id="`lit${id}`" x="-10%" y="-10%" width="120%" height="120%">
        <feOffset in="SourceAlpha" dx="-1.6" dy="1.6" result="off" />
        <feComposite in="SourceAlpha" in2="off" operator="out" result="rim" />
        <feGaussianBlur in="rim" stdDeviation=".45" result="rimb" />
        <feFlood :flood-color="moon" flood-opacity=".95" result="c" />
        <feComposite in="c" in2="rimb" operator="in" result="rimc" />
        <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="rimc" /></feMerge>
      </filter>
      <filter :id="`white${id}`">
        <feFlood flood-color="#fff" result="w" />
        <feComposite in="w" in2="SourceAlpha" operator="in" />
      </filter>
      <linearGradient :id="`sm${id}`" gradientUnits="userSpaceOnUse" x1="150" y1="70" x2="60" y2="230">
        <stop offset=".35" stop-color="#000" />
        <stop offset="1" stop-color="#fff" />
      </linearGradient>
      <mask :id="`smask${id}`" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="240"><rect width="200" height="240" :fill="u('sm')" /></mask>
      <mask :id="`mask${id}`" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="240">
        <g :filter="u('white')" v-html="figure" />
      </mask>
      <template v-if="hq">
        <filter :id="`cloud${id}`" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.04" numOctaves="4" :seed="card.number" />
          <feColorMatrix type="matrix" :values="`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.8 0 0 0 -0.82`" />
        </filter>
        <filter :id="`grain${id}`" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.25" />
        </filter>
        <mask :id="`cm${id}`"><rect width="200" height="150" :fill="u('fade')" /></mask>
      </template>
    </defs>

    <rect width="200" height="240" :fill="u('sky')" />
    <circle v-for="(s, i) in stars" :key="i" :cx="s.x" :cy="s.y" :r="s.r" fill="#fff" :opacity="s.o" />

    <g v-if="rank >= 3" :filter="u('soft')" opacity=".16">
      <path v-for="(r, i) in rays" :key="i" :d="r" :fill="moon" />
    </g>
    <circle :cx="moonPos.x" :cy="moonPos.y" :r="moonPos.r * 1.7" :fill="moon" opacity=".45" :filter="u('blur')" />
    <circle :cx="moonPos.x" :cy="moonPos.y" :r="moonPos.r" :fill="u('moon')" />
    <g :fill="sky[2]" opacity=".18">
      <circle :cx="moonPos.x - moonPos.r * 0.3" :cy="moonPos.y - moonPos.r * 0.2" :r="moonPos.r * 0.22" />
      <circle :cx="moonPos.x + moonPos.r * 0.35" :cy="moonPos.y + moonPos.r * 0.25" :r="moonPos.r * 0.15" />
      <circle :cx="moonPos.x + moonPos.r * 0.1" :cy="moonPos.y - moonPos.r * 0.5" :r="moonPos.r * 0.1" />
      <circle :cx="moonPos.x - moonPos.r * 0.45" :cy="moonPos.y + moonPos.r * 0.4" :r="moonPos.r * 0.12" />
    </g>

    <g v-if="hq" :mask="u('cm')">
      <rect width="200" height="150" :filter="u('cloud')" :fill="moon" opacity=".22" />
    </g>
    <g v-else :filter="u('blur')" :fill="moon" opacity=".14">
      <ellipse cx="40" cy="70" rx="60" ry="9" /><ellipse cx="150" cy="96" rx="70" ry="8" /><ellipse cx="90" cy="38" rx="50" ry="6" />
    </g>

    <path :d="BACKDROPS[card.faction]" :fill="sky[0]" opacity=".55" transform="translate(-30 -18) scale(1.15 1)" />
    <path :d="BACKDROPS[card.faction]" fill="#05030a" opacity=".75" />
    <ellipse cx="100" cy="212" rx="150" ry="18" fill="#d0c6ea" opacity=".14" :filter="u('blur')" />

    <rect v-if="hq" width="200" height="240" :filter="u('grain')" opacity=".14" />
    <ellipse v-if="rank >= 2" cx="100" cy="150" rx="100" ry="112" :fill="u('aura')" />
    <g :filter="u('back')" opacity=".55" v-html="figure" />
    <g :filter="u('lit')" v-html="figure" />
    <g v-html="detail" />
    <g :mask="u('mask')">
      <rect width="200" height="240" :fill="u('shade')" />
      <rect width="200" height="240" :fill="u('hatch')" opacity=".35" :mask="u('smask')" />
    </g>

    <g class="particles">
      <template v-for="(p, i) in particles" :key="i">
        <path v-if="kind === 'petal'" :transform="`translate(${p.x} ${p.y}) rotate(${p.a}) scale(${p.s})`" d="M0 0 Q2 -3 4 0 Q2 2 0 0 Z" fill="#c4122e" :opacity="p.o" />
        <path v-else-if="kind === 'leaf'" :transform="`translate(${p.x} ${p.y}) rotate(${p.a}) scale(${p.s})`" d="M0 0 Q3 -3 6 0 Q3 3 0 0 Z" fill="#8a5a24" :opacity="p.o" />
        <circle v-else-if="kind === 'bubble'" :cx="p.x" :cy="p.y" :r="p.s * 1.4" fill="none" :stroke="moon" stroke-width=".5" :opacity="p.o" />
        <circle v-else-if="kind === 'wisp'" :cx="p.x" :cy="p.y" :r="p.s * 1.2" fill="#9fd7ff" :opacity="p.o * 0.8" :filter="u('soft')" />
        <circle v-else-if="kind === 'firefly'" :cx="p.x" :cy="p.y" :r="p.s * 0.8" fill="#f6ff8a" :opacity="p.o" />
        <path v-else-if="kind === 'spark'" :transform="`translate(${p.x} ${p.y}) scale(${p.s})`" d="M0 -2 L.5 -.5 L2 0 L.5 .5 L0 2 L-.5 .5 L-2 0 L-.5 -.5 Z" fill="#b6ff5a" :opacity="p.o" />
        <circle v-else :cx="p.x" :cy="p.y" :r="p.s * 0.6" fill="#ffd98a" :opacity="p.o" />
      </template>
    </g>

    <path d="M0 240 L0 220 Q14 210 28 222 Q40 212 52 226 Q60 220 70 240 Z M200 240 L200 216 Q186 208 172 220 Q160 212 150 226 Q140 222 132 240 Z" fill="#030205" />
    <ellipse cx="100" cy="238" rx="120" ry="14" fill="#e0d8f2" opacity=".1" :filter="u('blur')" />
    <rect width="200" height="240" :fill="u('vig')" />
    <rect v-if="alt" x="4" y="4" width="192" height="232" fill="none" stroke="#ffcf6a" stroke-width="1.2" opacity=".7" rx="4" />
  </svg>
</template>

<style scoped>
.art-svg, .art-img { display: block; width: 100%; height: 100%; object-fit: cover; }
</style>
