<script setup lang="ts">
import type { ChampsAnnonce, Pays, Vendeur } from '@/lib/types';
import { DRAPEAU, NOM_PAYS } from '@/lib/types';
import { siteDepuisUrl } from '@/lib/sites';

/** Saisie d'une annonce : le lien suffit pour commencer, le reste se complète en lisant l'annonce. */
const a = defineModel<ChampsAnnonce>({ required: true });

const site = computed(() => siteDepuisUrl(a.value.url));
// Le domaine donne le pays : on le préremplit.
watch(site, s => { if (s) a.value.pays = s.pays; });

const optionsPays = (['PT', 'FR', 'DE', 'BE'] as Pays[]).map(p => ({ label: `${DRAPEAU[p]} ${NOM_PAYS[p]}`, value: p }));
const vendeurs: { label: string; value: Vendeur }[] = [{ label: 'Pro', value: 'pro' }, { label: 'Particulier', value: 'particulier' }, { label: '?', value: 'inconnu' }];
const ouiNon = [{ label: 'Oui', value: true }, { label: 'Non', value: false }, { label: '?', value: null }];
</script>

<template>
  <div class="grid-form">
    <div class="field full">
      <label for="af-url">Lien de l'annonce</label>
      <InputText id="af-url" v-model.trim="a.url" type="url" inputmode="url" placeholder="https://www.standvirtual.com/…" autocomplete="off" />
      <small v-if="site" class="ok"><i class="pi pi-check-circle" /> {{ site.nom }} · {{ DRAPEAU[site.pays] }} {{ NOM_PAYS[site.pays] }}</small>
    </div>
    <div class="field full">
      <label for="af-titre">Titre</label>
      <InputText id="af-titre" v-model="a.titre" placeholder="Ex. e-2008 GT 54 kWh" />
    </div>
    <div class="field">
      <label for="af-prix">Prix</label>
      <InputNumber input-id="af-prix" v-model="a.prix" mode="currency" currency="EUR" locale="fr-FR" :max-fraction-digits="0" :min="0" />
    </div>
    <div class="field">
      <label for="af-km">Kilométrage</label>
      <InputNumber input-id="af-km" v-model="a.km" suffix=" km" locale="fr-FR" :min="0" />
    </div>
    <div class="field">
      <label for="af-an">Année (1re immatriculation)</label>
      <InputNumber input-id="af-an" v-model="a.annee" :use-grouping="false" :min="2019" :max="2030" />
    </div>
    <div class="field">
      <label for="af-pays">Pays</label>
      <Select input-id="af-pays" v-model="a.pays" :options="optionsPays" option-label="label" option-value="value" />
    </div>
    <div class="field">
      <label for="af-bat">Batterie (kWh brut)</label>
      <Select input-id="af-bat" v-model="a.batterieKwh" :options="[{ l: 'Inconnue', v: null }, { l: '50 kWh', v: 50 }, { l: '54 kWh', v: 54 }]" option-label="l" option-value="v" />
    </div>
    <div class="field">
      <label for="af-soh">État batterie (SoH)</label>
      <InputNumber input-id="af-soh" v-model="a.soh" suffix=" %" :min="50" :max="100" placeholder="Certificat" />
    </div>
    <div class="field full">
      <label>Vendeur</label>
      <SelectButton v-model="a.vendeur" :options="vendeurs" option-label="label" option-value="value" :allow-empty="false" class="sb" />
    </div>
    <div class="field">
      <label>Pompe à chaleur</label>
      <SelectButton v-model="a.pompeAChaleur" :options="ouiNon" option-label="label" option-value="value" :allow-empty="false" class="sb" />
    </div>
    <div class="field">
      <label>Chargeur 11 kW</label>
      <SelectButton v-model="a.chargeur11kw" :options="ouiNon" option-label="label" option-value="value" :allow-empty="false" class="sb" />
    </div>
    <div class="field full">
      <label for="af-notes">Notes</label>
      <Textarea id="af-notes" v-model="a.notes" rows="3" auto-resize placeholder="Contact, défauts vus, questions à poser…" />
    </div>
  </div>
</template>

<style scoped>
.grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.full { grid-column: 1 / -1; }
.ok { color: var(--ar-good); font-weight: 700; }
.sb { display: flex; } .sb :deep(.p-togglebutton) { flex: 1; }
.field :deep(textarea) { width: 100%; }
@media (max-width: 520px) { .grid-form { grid-template-columns: 1fr; } }
</style>
