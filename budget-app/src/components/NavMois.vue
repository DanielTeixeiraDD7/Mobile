<script setup lang="ts">
import { addMonths, currentMonth, monthLabel } from '@/core/format.js';
import { useBudgetStore } from '@/stores/budget';
import Icone from './Icone.vue';

/** Sélecteur de mois (partagé entre les écrans). */
const budget = useBudgetStore();
const libelle = computed(() => (budget.tick, monthLabel(budget.mois)));
const dernier = computed(() => budget.mois >= currentMonth());
</script>

<template>
  <div class="nav-mois">
    <button type="button" class="icon-btn" :aria-label="$t('v2.month.prev')" @click="budget.mois = addMonths(budget.mois, -1)"><Icone nom="gauche" /></button>
    <button type="button" class="titre" :disabled="dernier" @click="budget.mois = currentMonth()">{{ libelle }}</button>
    <button type="button" class="icon-btn" :aria-label="$t('v2.month.next')" :disabled="dernier" @click="budget.mois = addMonths(budget.mois, 1)"><Icone nom="droite" /></button>
  </div>
</template>

<style scoped>
.nav-mois { display: flex; align-items: center; gap: 8px; }
.titre { flex: 1; border: 0; background: none; font-size: 19px; font-weight: 800; letter-spacing: -.02em; text-transform: capitalize; color: var(--text); padding: 0; }
.titre:disabled { cursor: default; opacity: 1; }
</style>
