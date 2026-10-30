<script setup lang="ts">
import { FACTION_COLOR, RARITY_COLOR, rarityRank, type CardDTO, type Faction } from '@nocturne/shared';
import { computed, useId } from 'vue';
import { BACKDROPS, MOON, SILHOUETTES } from '@/lib/art';

const props = defineProps<{ card: Pick<CardDTO, 'faction' | 'rarity' | 'silhouette' | 'variant' | 'number' | 'imageUrl' | 'name'> }>();
const id = useId().replace(/[^a-zA-Z0-9]/g, '');

const EYES: Record<Faction, string> = { SANG: '#ff2b4a', CROC: '#ffb02e', ABIME: '#5ff2d2', SPECTRE: '#9fd7ff', ALCHIMIE: '#b6ff5a', CRYPTIDE: '#ff3b3b', MYTHE: '#ffd34d' };

const alt = computed(() => props.card.variant === 'ALTERNATE');
const colors = computed(() => (alt.value ? ['#6a0a1c', '#12020a'] : FACTION_COLOR[props.card.faction]));
const moon = computed(() => (alt.value ? '#ffcf6a' : MOON[props.card.faction]));
const rank = computed(() => rarityRank(props.card.rarity));
const accent = computed(() => RARITY_COLOR[props.card.rarity]);

const stars = computed(() => {
  let s = props.card.number * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: 14 }, () => ({ x: rnd() * 200, y: rnd() * 120, r: 0.4 + rnd() * 0.9, o: 0.3 + rnd() * 0.6 }));
});

const figure = computed(() =>
  (SILHOUETTES[props.card.silhouette] ?? SILHOUETTES.ghost!)
    .replaceAll('fill="D"', 'fill="#07040b"').replaceAll('stroke="D"', 'stroke="#07040b"')
    .replaceAll('"P"', '"#e6ecff"').replaceAll('"E"', `"${EYES[props.card.faction]}"`).replaceAll('"A"', `"${accent.value}"`)
    .replaceAll('__W', `w${id}`),
);
</script>

<template>
  <img v-if="card.imageUrl" class="art-img" :src="card.imageUrl" :alt="card.name" loading="lazy" />
  <svg v-else class="art-svg" viewBox="0 0 200 240" preserveAspectRatio="xMidYMid slice" role="img" :aria-label="card.name">
    <defs>
      <linearGradient :id="`bg${id}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="colors[0]" />
        <stop offset="1" :stop-color="colors[1]" />
      </linearGradient>
      <radialGradient :id="`aura${id}`" cx="50%" cy="60%" r="50%">
        <stop offset="0" :stop-color="accent" :stop-opacity="0.15 + rank * 0.1" />
        <stop offset="1" :stop-color="accent" stop-opacity="0" />
      </radialGradient>
      <filter :id="`blur${id}`" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
    </defs>
    <rect width="200" height="240" :fill="`url(#bg${id})`" />
    <circle v-for="(s, i) in stars" :key="i" :cx="s.x" :cy="s.y" :r="s.r" fill="#fff" :opacity="s.o" />
    <circle :cx="alt ? 100 : 150" :cy="alt ? 70 : 48" :r="alt ? 60 : 34" :fill="moon" opacity=".55" :filter="`url(#blur${id})`" />
    <circle :cx="alt ? 100 : 150" :cy="alt ? 70 : 48" :r="alt ? 46 : 24" :fill="moon" :opacity="alt ? 0.9 : 0.85" />
    <path :d="BACKDROPS[card.faction]" fill="#000" opacity=".45" />
    <ellipse cx="100" cy="226" rx="140" ry="22" fill="#cfc6e6" opacity=".12" :filter="`url(#blur${id})`" />
    <ellipse v-if="rank >= 2" cx="100" cy="150" rx="96" ry="110" :fill="`url(#aura${id})`" />
    <g v-html="figure" />
    <ellipse cx="60" cy="236" rx="80" ry="12" fill="#d8d0ee" opacity=".1" :filter="`url(#blur${id})`" />
    <rect v-if="alt" x="4" y="4" width="192" height="232" fill="none" stroke="#ffcf6a" stroke-width="1.5" opacity=".7" rx="4" />
  </svg>
</template>

<style scoped>
.art-svg, .art-img { display: block; width: 100%; height: 100%; object-fit: cover; }
</style>
