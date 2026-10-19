<script setup lang="ts">
import type { Category } from '@/core/types';
import { iconeCategorie } from '@/lib/categories';
import { categoryName } from '@/core/i18n.js';
import Icone from './Icone.vue';

/** Rond coloré avec l'icône (ou l'initiale) d'une catégorie. */
const props = withDefaults(defineProps<{ cat: Category; taille?: number }>(), { taille: 42 });
const icone = computed(() => iconeCategorie(props.cat));
const initiale = computed(() => categoryName(props.cat).trim().charAt(0).toUpperCase());
</script>

<template>
  <span class="pc" :style="{ '--c': cat.color, width: taille + 'px', height: taille + 'px', borderRadius: taille * 0.34 + 'px' }">
    <Icone v-if="icone" :nom="icone" :taille="Math.round(taille * 0.5)" />
    <b v-else :style="{ fontSize: taille * 0.42 + 'px' }">{{ initiale }}</b>
  </span>
</template>

<style scoped>
.pc { flex: none; display: grid; place-items: center; color: var(--c); background: color-mix(in srgb, var(--c) 15%, transparent); }
.dark .pc { background: color-mix(in srgb, var(--c) 24%, transparent); color: color-mix(in srgb, var(--c) 70%, white); }
b { font-weight: 800; line-height: 1; }
</style>
