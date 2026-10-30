<script setup lang="ts">
import { computed, useId } from 'vue';
import { themeOf } from '@/lib/themes';

const props = defineProps<{ theme: string; name: string }>();
const id = useId().replace(/[^a-zA-Z0-9]/g, '');
const t = computed(() => themeOf(props.theme));
</script>

<template>
  <svg viewBox="0 0 200 300" class="pack">
    <defs>
      <linearGradient :id="`p${id}`" x1="0" y1="0" x2="1" y2="1"><stop offset="0" :stop-color="t.from" /><stop offset=".55" :stop-color="t.to" /><stop offset="1" :stop-color="t.from" /></linearGradient>
      <linearGradient :id="`s${id}`" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset=".5" stop-color="#fff" stop-opacity=".35" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></linearGradient>
    </defs>
    <path d="M14 22 L22 10 L30 22 L38 10 L46 22 L54 10 L62 22 L70 10 L78 22 L86 10 L94 22 L102 10 L110 22 L118 10 L126 22 L134 10 L142 22 L150 10 L158 22 L166 10 L174 22 L182 10 L186 22 L186 278 L178 290 L170 278 L162 290 L154 278 L146 290 L138 278 L130 290 L122 278 L114 290 L106 278 L98 290 L90 278 L82 290 L74 278 L66 290 L58 278 L50 290 L42 278 L34 290 L26 278 L18 290 L14 278 Z" :fill="`url(#p${id})`" stroke="#000" stroke-opacity=".5" />
    <rect x="14" y="22" width="172" height="256" :fill="`url(#s${id})`" opacity=".5" />
    <circle cx="100" cy="128" r="54" :fill="t.glow" opacity=".25" />
    <circle cx="112" cy="116" r="36" fill="#f4e6c8" opacity=".9" />
    <circle cx="126" cy="106" r="34" :fill="t.to" />
    <path :fill="t.glow" d="M100 150 C88 136 66 128 42 132 C52 140 52 148 48 156 C62 152 74 156 82 164 C88 156 94 156 100 160 C106 156 112 156 118 164 C126 156 138 152 152 156 C148 148 148 140 158 132 C134 128 112 136 100 150 Z" />
    <text x="100" y="214" text-anchor="middle" fill="#f6e9d0" font-family="Cinzel Decorative, Cinzel, serif" font-size="20" font-weight="700">Nocturne</text>
    <text x="100" y="238" text-anchor="middle" fill="#f6e9d0" opacity=".8" font-family="Cinzel, serif" font-size="11" letter-spacing="2">{{ name.toUpperCase() }}</text>
    <text x="100" y="262" text-anchor="middle" :fill="t.glow" font-family="Inter, sans-serif" font-size="9" letter-spacing="3">5 CARTES</text>
  </svg>
</template>

<style scoped>
.pack { display: block; width: 100%; height: auto; filter: drop-shadow(0 18px 30px #000c); }
</style>
