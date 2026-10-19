<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { EXERCICES } from '@/core/exercices';
import FormProfil from './FormProfil.vue';
import Figurine from './Figurine.vue';

/** Premier lancement : présentation et création du profil. */
const fit = useFit();
const p = ref({ name: '', sex: 'h' as const, age: 30, height: 178, goalWeight: 99, startWeight: 125, activity: 1.2 });
const valide = computed(() => p.value.age >= 14 && p.value.height >= 120 && p.value.goalWeight >= 40 && p.value.startWeight >= 40);
function creer() { if (valide.value) fit.creerProfil(p.value); }
</script>

<template>
  <main class="bienvenue">
    <div class="hero">
      <Figurine :anim="EXERCICES.squat_chaise!.anim" :taille="170" />
      <h1>FitMaison</h1>
      <p>Perds du poids avec des séances au poids du corps, à la maison ou au jardin. Sans matériel, sans saut, et chaque exercice est montré et expliqué.</p>
    </div>
    <form class="card pad stack" @submit.prevent="creer">
      <h2>Faisons connaissance</h2>
      <FormProfil v-model="p" />
      <button class="btn primary full" type="submit" :disabled="!valide">C’est parti 🚀</button>
      <p class="tiny muted">Demande l’avis de ton médecin avant de commencer si tu as des problèmes de santé (cœur, tension, articulations). Tes données restent uniquement sur ton téléphone.</p>
    </form>
  </main>
</template>

<style scoped>
.bienvenue { max-width: 520px; margin: 0 auto; padding: calc(var(--safe-t) + 20px) 16px calc(var(--safe-b) + 24px); }
.hero { display: grid; justify-items: center; text-align: center; gap: 6px; margin-bottom: 16px; }
.hero h1 { margin: 0; font-size: 34px; letter-spacing: -.04em; background: var(--brand-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
.hero p { margin: 0; color: var(--muted); max-width: 36ch; }
h2 { margin: 0; font-size: 21px; }
</style>
