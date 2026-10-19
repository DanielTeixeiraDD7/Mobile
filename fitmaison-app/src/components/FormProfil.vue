<script setup lang="ts">
import type { Profil } from '@/core/etat';

/** Champs du profil (création et modification). */
const p = defineModel<Omit<Profil, 'level' | 'createdAt'>>({ required: true });
const ACTIVITES: [number, string][] = [[1.2, 'Sédentaire (bureau, peu de marche)'], [1.375, 'Légère (marche régulière)'], [1.55, 'Modérée (métier debout)'], [1.725, 'Élevée (métier physique)']];
</script>

<template>
  <div class="stack">
    <label class="field"><span>Prénom</span><input v-model.trim="p.name" class="input" placeholder="Ton prénom" autocomplete="given-name"></label>
    <div class="deux">
      <label class="field"><span>Sexe</span>
        <select v-model="p.sex" class="input"><option value="h">Homme</option><option value="f">Femme</option></select>
      </label>
      <label class="field"><span>Âge</span><input v-model.number="p.age" class="input" type="number" inputmode="numeric" min="14" max="99" required></label>
    </div>
    <div class="deux">
      <label class="field"><span>Taille (cm)</span><input v-model.number="p.height" class="input" type="number" inputmode="numeric" min="120" max="230" required></label>
      <label class="field"><span>Objectif (kg)</span><input v-model.number="p.goalWeight" class="input" type="number" inputmode="decimal" step="0.1" min="40" max="250" required></label>
    </div>
    <label class="field"><span>Poids de départ (kg)</span><input v-model.number="p.startWeight" class="input" type="number" inputmode="decimal" step="0.1" min="40" max="300" required></label>
    <label class="field"><span>Activité au quotidien (hors séances)</span>
      <select v-model.number="p.activity" class="input"><option v-for="[v, l] in ACTIVITES" :key="v" :value="v">{{ l }}</option></select>
    </label>
  </div>
</template>

<style scoped>
.deux { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
</style>
