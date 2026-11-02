<script setup lang="ts">
import type { Profil } from '@/core/etat';

/** Champs du profil (création et modification). `partie` limite aux champs d'une étape de l'accueil. */
const p = defineModel<Omit<Profil, 'level' | 'createdAt'>>({ required: true });
const props = defineProps<{ partie?: 'identite' | 'corps' }>();
const voir = (x: 'identite' | 'corps') => !props.partie || props.partie === x;
const ACTIVITES: [number, string, string][] = [
  [1.2, 'Sédentaire', 'Bureau, peu de marche'], [1.375, 'Légère', 'Marche régulière'],
  [1.55, 'Modérée', 'Métier debout'], [1.725, 'Élevée', 'Métier physique'],
];
</script>

<template>
  <div class="stack form">
    <template v-if="voir('identite')">
      <label class="field"><span>Prénom</span><input v-model.trim="p.name" class="input" placeholder="Ton prénom" autocomplete="given-name" maxlength="30"></label>
      <div class="deux">
        <div class="field">
          <span id="lbl-sexe">Sexe</span>
          <div class="seg" role="radiogroup" aria-labelledby="lbl-sexe">
            <button type="button" role="radio" :aria-checked="p.sex === 'h'" :class="{ on: p.sex === 'h' }" @click="p.sex = 'h'">Homme</button>
            <button type="button" role="radio" :aria-checked="p.sex === 'f'" :class="{ on: p.sex === 'f' }" @click="p.sex = 'f'">Femme</button>
          </div>
        </div>
        <label class="field"><span>Âge</span><input v-model.number="p.age" class="input num" type="number" inputmode="numeric" min="14" max="99" required></label>
      </div>
    </template>
    <template v-if="voir('corps')">
      <div class="deux">
        <label class="field"><span>Taille (cm)</span><input v-model.number="p.height" class="input num" type="number" inputmode="numeric" min="120" max="230" required></label>
        <label class="field"><span>Poids de départ (kg)</span><input v-model.number="p.startWeight" class="input num" type="number" inputmode="decimal" step="0.1" min="40" max="300" required></label>
      </div>
      <label class="field"><span>Objectif (kg)</span><input v-model.number="p.goalWeight" class="input num" type="number" inputmode="decimal" step="0.1" min="40" max="250" required></label>
      <fieldset class="field activite">
        <legend>Activité au quotidien (hors séances)</legend>
        <label v-for="[v, l, d] in ACTIVITES" :key="v" class="opt" :class="{ on: p.activity === v }">
          <input v-model.number="p.activity" type="radio" name="activite" :value="v" class="sr-only">
          <b>{{ l }}</b><small>{{ d }}</small>
        </label>
      </fieldset>
    </template>
  </div>
</template>

<style scoped>
.form { gap: 14px; }
.deux { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.seg button { min-height: 42px; }
.activite { border: 0; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.activite legend { padding: 0; margin-bottom: 6px; font-size: var(--fs-sm); font-weight: 800; color: var(--muted); }
.activite > .opt { color: var(--text); font-size: inherit; }
.opt { display: grid; gap: 1px; padding: 10px 12px; border-radius: 14px; border: 1.5px solid var(--border-2); background: var(--surface-2); cursor: pointer; transition: border-color .15s, background .15s; }
.opt b { font-size: 14.5px; font-weight: 800; }
.opt small { font-size: 12px; color: var(--muted); }
.opt.on { border-color: var(--accent); background: var(--brand-soft); }
.opt:focus-within { outline: 2.5px solid var(--accent); outline-offset: 2px; }
</style>
