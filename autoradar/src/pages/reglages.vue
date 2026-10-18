<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useReglagesStore, type Theme } from '@/stores/reglages';
import { useAnnoncesStore } from '@/stores/annonces';
import { useRecherchesStore } from '@/stores/recherches';
import { useHypothesesStore } from '@/stores/hypotheses';

const reglages = useReglagesStore();
const annonces = useAnnoncesStore();
const recherches = useRecherchesStore();
const hypotheses = useHypothesesStore();
const toast = useToast();
const confirm = useConfirm();

const themes: { label: string; value: Theme; icon: string }[] = [
  { label: 'Auto', value: 'auto', icon: 'pi pi-desktop' },
  { label: 'Clair', value: 'clair', icon: 'pi pi-sun' },
  { label: 'Sombre', value: 'sombre', icon: 'pi pi-moon' },
];

function exporter() {
  const data = { app: 'autoradar', version: 1, exportedAt: new Date().toISOString(), annonces: annonces.liste, recherches: recherches.liste, hypotheses: hypotheses.valeurs, checklist: reglages.checklist };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
  a.download = `autoradar-${new Date().toLocaleDateString('sv-SE')}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const fichier = useTemplateRef<HTMLInputElement>('fichier');
async function importer(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (d?.app !== 'autoradar' || !Array.isArray(d.annonces)) throw new Error();
    annonces.liste = d.annonces;
    if (Array.isArray(d.recherches) && d.recherches.length) { recherches.liste = d.recherches; recherches.activeId = d.recherches[0].id; }
    if (d.hypotheses) hypotheses.valeurs = { ...hypotheses.valeurs, ...d.hypotheses };
    if (d.checklist) reglages.checklist = d.checklist;
    toast.add({ severity: 'success', summary: 'Sauvegarde restaurée', detail: `${d.annonces.length} annonce(s)`, life: 3000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Fichier non reconnu', detail: "Ce n'est pas une sauvegarde AutoRadar.", life: 3500 });
  }
  if (fichier.value) fichier.value.value = '';
}

function toutEffacer() {
  confirm.require({
    header: 'Tout effacer ?',
    message: 'Annonces, recherches et cases cochées seront supprimées de cet appareil. Exporte avant si besoin.',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Annuler', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Tout effacer', severity: 'danger' },
    accept: () => {
      try { Object.keys(localStorage).filter(k => k.startsWith('autoradar:')).forEach(k => localStorage.removeItem(k)); } catch { /* ignoré */ }
      location.reload();
    },
  });
}
</script>

<template>
  <div class="page reg">
    <h1 class="h-title">Réglages</h1>
    <p class="h-sub">Tout reste sur cet appareil : aucun compte, aucun serveur.</p>
    <div class="card settings">
      <div class="row">
        <span><b>Thème</b><small class="muted">Suit ton système en mode Auto.</small></span>
        <SelectButton v-model="reglages.theme" :options="themes" option-label="label" option-value="value" :allow-empty="false" aria-label="Thème">
          <template #option="{ option }"><i :class="option.icon" /><span class="ml-2">{{ option.label }}</span></template>
        </SelectButton>
      </div>
      <div class="row">
        <span><b>Sauvegarde</b><small class="muted">Pour passer du téléphone à l'ordinateur, ou garder une copie.</small></span>
        <span class="flex gap-2 flex-wrap justify-content-end">
          <Button label="Exporter" icon="pi pi-download" severity="secondary" outlined size="small" @click="exporter" />
          <Button label="Importer" icon="pi pi-upload" severity="secondary" outlined size="small" @click="fichier?.click()" />
          <input ref="fichier" type="file" accept="application/json,.json" class="sr-only" @change="importer">
        </span>
      </div>
      <div class="row">
        <span><b>Frais estimés</b><small class="muted">Transport, plaques… utilisés pour le coût total.</small></span>
        <Button label="Valeurs par défaut" icon="pi pi-replay" severity="secondary" text size="small" @click="hypotheses.reinitialiser(); toast.add({ severity: 'info', summary: 'Frais réinitialisés', life: 2000 })" />
      </div>
      <div class="row">
        <span><b>Réinitialiser</b><small class="muted">Efface toutes les données de l'app.</small></span>
        <Button label="Tout effacer" icon="pi pi-trash" severity="danger" text size="small" @click="toutEffacer" />
      </div>
    </div>
    <h2 class="section-title">À propos</h2>
    <div class="card pad small muted">
      <p class="mt-0"><b style="color: var(--ar-text)">AutoRadar</b> ne copie aucune annonce : il ouvre les pages de résultats des sites officiels avec tes filtres, et t'aide à comparer et à calculer l'import.</p>
      <p class="mb-0">Les montants officiels (taxes, frais d'immatriculation) viennent des sources citées dans le calculateur. Vérifie-les avant d'acheter : les barèmes changent chaque année.</p>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Réglages" } }
</route>

<style scoped>
.reg { max-width: 760px; }
.settings { padding: 4px 18px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; }
.row + .row { border-top: 1px solid var(--ar-border); }
.row > span:first-child { display: grid; min-width: 0; }
.row small { font-size: 12.5px; }
@media (max-width: 560px) {
  .row { flex-direction: column; align-items: stretch; }
  .row :deep(.p-selectbutton) { display: flex; } .row :deep(.p-togglebutton) { flex: 1; }
}
</style>
