<script setup lang="ts">
import { TYPE_LABELS } from '@/domain/labels';
import type { MediaType } from '@/domain/types';
import Icone from './Icone.vue';
defineProps<{ type: MediaType; court?: boolean }>();
</script>

<template>
  <span class="badge" :style="{ color: TYPE_LABELS[type].couleur, background: `color-mix(in srgb, ${TYPE_LABELS[type].couleur} 15%, transparent)` }">
    <Icone :nom="TYPE_LABELS[type].icone" :taille="12" :epaisseur="2.4" />
    <template v-if="!court">{{ TYPE_LABELS[type].un }}</template>
  </span>
</template>

<style scoped>
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px 2px 6px; border-radius: 99px; font-size: 11.5px; font-weight: 800; letter-spacing: .01em; white-space: nowrap; }
</style>
