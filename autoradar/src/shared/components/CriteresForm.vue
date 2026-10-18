<script setup lang="ts">
import type { Criteres, Pays } from '@/lib/types';
import { DRAPEAU, NOM_PAYS } from '@/lib/types';
import { MODELES } from '@/lib/modeles';

/** Formulaire des critères (v-model sur les critères et les pays). */
const criteres = defineModel<Criteres>('criteres', { required: true });
const pays = defineModel<Pays[]>('pays', { required: true });
const nom = defineModel<string>('nom', { required: true });

const annees = computed(() => {
  const n = new Date().getFullYear();
  return [{ label: 'Peu importe', value: null }, ...Array.from({ length: n - 2019 }, (_, i) => ({ label: `${2020 + i} ou plus récent`, value: 2020 + i }))];
});
const optionsPays = (['PT', 'FR', 'DE', 'BE'] as Pays[]).map(p => ({ label: `${DRAPEAU[p]} ${NOM_PAYS[p]}`, value: p }));
const tris = [{ label: 'Plus récentes', value: 'recent' }, { label: 'Prix croissant', value: 'prix' }];
</script>

<template>
  <div class="grid-form">
    <div class="field full">
      <label for="cf-nom">Nom de la recherche</label>
      <InputText id="cf-nom" v-model="nom" placeholder="Ex. e-2008 pas cher" />
    </div>
    <div class="field full">
      <label for="cf-mod">Modèle</label>
      <Select input-id="cf-mod" v-model="criteres.modele" :options="MODELES" :option-label="(m: any) => `${m.marque} ${m.nom}`" option-value="id" />
    </div>
    <div class="field">
      <label for="cf-prix">Prix maximum</label>
      <InputNumber input-id="cf-prix" v-model="criteres.prixMax" mode="currency" currency="EUR" locale="fr-FR" :max-fraction-digits="0" :step="500" placeholder="Sans limite" :min="0" />
    </div>
    <div class="field">
      <label for="cf-km">Kilométrage maximum</label>
      <InputNumber input-id="cf-km" v-model="criteres.kmMax" suffix=" km" locale="fr-FR" :step="5000" placeholder="Sans limite" :min="0" />
    </div>
    <div class="field">
      <label for="cf-an">Année minimum</label>
      <Select input-id="cf-an" v-model="criteres.anneeMin" :options="annees" option-label="label" option-value="value" />
    </div>
    <div class="field">
      <label for="cf-tri">Tri</label>
      <Select input-id="cf-tri" v-model="criteres.tri" :options="tris" option-label="label" option-value="value" />
    </div>
    <div class="field full">
      <label>Pays</label>
      <SelectButton v-model="pays" :options="optionsPays" option-label="label" option-value="value" multiple class="pays" />
    </div>
  </div>
</template>

<style scoped>
.grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.full { grid-column: 1 / -1; }
.pays { display: flex; flex-wrap: wrap; }
.pays :deep(.p-togglebutton) { flex: 1 1 45%; }
@media (max-width: 520px) { .grid-form { grid-template-columns: 1fr; } }
</style>
