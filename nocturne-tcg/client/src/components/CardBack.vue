<script setup lang="ts">
import { computed, useId } from 'vue';

const props = defineProps<{ back?: string | null; glow?: string | null }>();
const id = useId().replace(/[^a-zA-Z0-9]/g, '');
const THEMES: Record<string, [string, string, string]> = {
  BACK_CLASSIC: ['#2a1630', '#0d0712', '#b89a6a'],
  BACK_MOON: ['#5a0b1c', '#14030a', '#e0315a'],
  BACK_ABYSS: ['#0b3a4a', '#02090f', '#5ff2d2'],
  BACK_NOCTURNE: ['#2c1a52', '#09051a', '#f0b43c'],
};
const t = computed(() => THEMES[props.back ?? 'BACK_CLASSIC'] ?? THEMES.BACK_CLASSIC!);
</script>

<template>
  <div class="back" :style="{ '--glow': glow ?? 'transparent' }">
    <svg viewBox="0 0 200 280" preserveAspectRatio="none">
      <defs>
        <radialGradient :id="`b${id}`" cx="50%" cy="45%" r="70%"><stop offset="0" :stop-color="t[0]" /><stop offset="1" :stop-color="t[1]" /></radialGradient>
      </defs>
      <rect width="200" height="280" rx="12" :fill="`url(#b${id})`" />
      <rect x="10" y="10" width="180" height="260" rx="8" fill="none" :stroke="t[2]" stroke-width="2" opacity=".8" />
      <rect x="16" y="16" width="168" height="248" rx="6" fill="none" :stroke="t[2]" stroke-width=".8" opacity=".5" />
      <g :stroke="t[2]" fill="none" stroke-width="1.2" opacity=".85">
        <circle cx="100" cy="132" r="46" />
        <circle cx="100" cy="132" r="38" opacity=".6" />
        <path d="M100 74 L100 190 M42 132 L158 132 M60 92 L140 172 M140 92 L60 172" opacity=".35" />
      </g>
      <circle cx="112" cy="122" r="22" :fill="t[2]" opacity=".9" />
      <circle cx="122" cy="114" r="20" :fill="t[1]" />
      <path :fill="t[2]" d="M100 148 C90 136 74 130 56 132 C64 138 64 144 62 150 C72 148 80 150 86 156 C90 150 96 150 100 154 C104 150 110 150 114 156 C120 150 128 148 138 150 C136 144 136 138 144 132 C126 130 110 136 100 148 Z" />
      <text x="100" y="234" text-anchor="middle" :fill="t[2]" font-family="Cinzel, serif" font-size="15" letter-spacing="4">NOCTURNE</text>
      <path :stroke="t[2]" stroke-width="1" d="M30 30 L50 30 M30 30 L30 50 M170 30 L150 30 M170 30 L170 50 M30 250 L50 250 M30 250 L30 230 M170 250 L150 250 M170 250 L170 230" />
    </svg>
  </div>
</template>

<style scoped>
.back { width: 100%; height: 100%; border-radius: 6% / 4.5%; overflow: hidden; box-shadow: 0 0 0 1px #0008, 0 0 24px var(--glow), 0 8px 24px #0009; }
svg { display: block; width: 100%; height: 100%; }
</style>
