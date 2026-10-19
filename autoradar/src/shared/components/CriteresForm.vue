<script setup lang="ts">
import AutoComplete from 'primevue/autocomplete';
import type { Criteres, Energie, Pays } from '@/lib/types';
import { DRAPEAU, NOM_PAYS } from '@/lib/types';
import { MARQUES, modeleDuCatalogue, nomsModeles, slug } from '@/lib/catalogue';

/** Formulaire des critères (v-model sur les critères et les pays). */
const criteres = defineModel<Criteres>('criteres', { required: true });
const pays = defineModel<Pays[]>('pays', { required: true });
const nom = defineModel<string>('nom', { required: true });

const annees = computed(() => {
  const n = new Date().getFullYear();
  return [{ label: 'Peu importe', value: null }, ...Array.from({ length: n - 2004 }, (_, i) => ({ label: `${n - i} ou plus récent`, value: n - i }))];
});

// Marque et modèle : liste relevée sur les sites, ou saisie libre.
const sansAccent = (s: string) => slug(s).replace(/-/g, '');
const filtrer = (liste: string[], texte: string) => {
  const t = sansAccent(texte ?? '');
  return t ? liste.filter(x => sansAccent(x).includes(t)) : [...liste];
};
const sugMarques = ref<string[]>([]);
const sugModeles = ref<string[]>([]);
const chercherMarque = (e: { query: string }) => { sugMarques.value = filtrer(MARQUES.map(m => m.nom), e.query); };
const chercherModele = (e: { query: string }) => { sugModeles.value = filtrer(nomsModeles(criteres.value.marque), e.query); };
// Nouvelle marque : on vide un modèle qui n'existe pas chez elle.
watch(() => criteres.value.marque, m => {
  if (criteres.value.modele && nomsModeles(m).length && !modeleDuCatalogue(m, criteres.value.modele)) criteres.value.modele = '';
});
const modeleConnu = computed(() => modeleDuCatalogue(criteres.value.marque, criteres.value.modele));
const toutElectrique = computed(() => !!modeleConnu.value?.codes.elec);

const energies: { label: string; value: Energie }[] = [
  { label: 'Toutes', value: 'tous' }, { label: 'Électrique', value: 'electrique' }, { label: 'Hybride', value: 'hybride' },
  { label: 'Essence', value: 'essence' }, { label: 'Diesel', value: 'diesel' },
];
const optionsPays = (['PT', 'FR', 'DE', 'BE'] as Pays[]).map(p => ({ label: `${DRAPEAU[p]} ${NOM_PAYS[p]}`, value: p }));
const tris = [{ label: 'Plus récentes', value: 'recent' }, { label: 'Prix croissant', value: 'prix' }];
</script>

<template>
  <div class="grid-form">
    <div class="field full">
      <label for="cf-nom">Nom de la recherche</label>
      <InputText id="cf-nom" v-model="nom" placeholder="Facultatif (ex. Citadine pas chère)" />
    </div>
    <div class="field">
      <label for="cf-marque">Marque</label>
      <AutoComplete v-model="criteres.marque" input-id="cf-marque" :suggestions="sugMarques" dropdown complete-on-focus placeholder="Toutes les marques" fluid @complete="chercherMarque" />
    </div>
    <div class="field">
      <label for="cf-mod">Modèle</label>
      <AutoComplete v-model="criteres.modele" input-id="cf-mod" :suggestions="sugModeles" dropdown complete-on-focus placeholder="Tous les modèles" fluid @complete="chercherModele" />
    </div>
    <small v-if="criteres.modele.trim() && !modeleConnu" class="full aide"><i class="pi pi-info-circle" /> Modèle hors liste : cherché par mot-clé sur les sites qui le permettent, à choisir sur la page pour les autres.</small>
    <div class="field full">
      <label>Énergie</label>
      <SelectButton v-model="criteres.energie" :options="energies" option-label="label" option-value="value" :allow-empty="false" class="energies" />
      <small v-if="toutElectrique && criteres.energie !== 'electrique'" class="aide"><i class="pi pi-bolt" /> {{ modeleConnu?.nom }} est 100 % électrique : seules les versions électriques seront cherchées.</small>
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
.energies { display: flex; flex-wrap: wrap; }
.energies :deep(.p-togglebutton) { flex: 1 1 30%; }
.aide { color: var(--ar-muted); font-size: 12.5px; display: flex; gap: 6px; align-items: baseline; margin-top: -6px; }
.field .aide { margin-top: 6px; }
@media (max-width: 520px) { .grid-form { grid-template-columns: 1fr; } }
</style>
