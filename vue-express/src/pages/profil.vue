<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { LESSONS, MODULES } from '@/content';
import ProgressRing from '@/shared/components/ProgressRing.vue';
import { useProgressionStore } from '@/stores/progression';
import { useReglagesStore, type Theme } from '@/stores/reglages';

const progression = useProgressionStore();
const reglages = useReglagesStore();
const toast = useToast();
const confirm = useConfirm();

const themes: { label: string; value: Theme; icon: string }[] = [
  { label: 'Auto', value: 'auto', icon: 'pi pi-desktop' },
  { label: 'Clair', value: 'clair', icon: 'pi pi-sun' },
  { label: 'Sombre', value: 'sombre', icon: 'pi pi-moon' },
];
const taille = (d: number) => { reglages.taillePolice = Math.min(18, Math.max(12, reglages.taillePolice + d)); };

const sansSolution = computed(() => LESSONS.filter(l => progression.state(l.id).done && !progression.state(l.id).solution).length);
const tentatives = computed(() => Object.values(progression.lessons).reduce((n, s) => n + s.attempts, 0));
const niveau = computed(() => Math.floor(progression.xp / 250) + 1);
const versNiveau = computed(() => Math.round(((progression.xp % 250) / 250) * 100));

function exporter() {
  const blob = new Blob([progression.exportData()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vue-express-${new Date().toLocaleDateString('sv-SE')}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const fichier = useTemplateRef<HTMLInputElement>('fichier');
async function importer(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  const r = progression.importData(await f.text());
  toast.add({ group: 'app', severity: r.ok ? 'success' : 'error', summary: r.ok ? 'Import réussi' : 'Import impossible', detail: r.message, life: 3500 });
  if (fichier.value) fichier.value.value = '';
}

function effacer() {
  confirm.require({
    group: 'app',
    appendTo: '#app-overlays',
    header: 'Tout effacer ?',
    message: 'Progression, XP et cartes de révision seront supprimées de cet appareil. Pense à exporter avant.',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Annuler', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Tout effacer', severity: 'danger' },
    accept: () => {
      progression.reset();
      try { Object.keys(localStorage).filter(k => k.startsWith('vue-express:brouillon:')).forEach(k => localStorage.removeItem(k)); } catch { /* ignoré */ }
      toast.add({ group: 'app', severity: 'info', summary: 'Progression effacée', life: 2500 });
    },
  });
}
</script>

<template>
  <div class="page prof">
    <section class="me card">
      <ProgressRing :value="versNiveau" :size="96" :stroke="9" color="#42b883">
        <b class="lvl">{{ niveau }}</b>
      </ProgressRing>
      <div class="grow">
        <small class="dim">Niveau {{ niveau }} · {{ progression.xp % 250 }}/250 XP</small>
        <h1 class="h-title">{{ niveau < 3 ? 'Apprenti Vue' : niveau < 6 ? 'Développeur Vue' : 'Expert Vue' }}</h1>
        <div class="flex gap-2 flex-wrap">
          <span class="pill green"><i class="pi pi-star-fill" /> {{ progression.xp }} XP</span>
          <span class="pill">🔥 {{ progression.streak }} j</span>
          <span class="pill"><i class="pi pi-calendar" /> {{ progression.days.length }} jours actifs</span>
        </div>
      </div>
    </section>

    <section class="grid4">
      <div class="card stat"><b>{{ progression.doneCount }}<small>/{{ LESSONS.length }}</small></b><span>leçons validées</span></div>
      <div class="card stat"><b>{{ sansSolution }}</b><span>sans la solution</span></div>
      <div class="card stat"><b>{{ tentatives }}</b><span>lancements de tests</span></div>
      <div class="card stat"><b>{{ progression.mastered }}</b><span>notions maîtrisées</span></div>
    </section>

    <h2 class="section-title">Modules</h2>
    <div class="card pad mods">
      <div v-for="m in MODULES" :key="m.id" class="mrow">
        <span class="mi" :style="{ color: m.color, background: `color-mix(in srgb, ${m.color} 14%, transparent)` }"><i :class="m.icon" /></span>
        <span class="mt">{{ m.title }}</span>
        <span class="bar"><i :style="{ width: progression.moduleProgress(m.id).percent + '%', background: m.color }" /></span>
        <b class="small">{{ progression.moduleProgress(m.id).done }}/{{ m.lessons.length }}</b>
      </div>
    </div>

    <h2 class="section-title">Réglages</h2>
    <div class="card settings">
      <div class="row">
        <span><b>Thème</b><small class="muted">Suit ton système en mode Auto.</small></span>
        <SelectButton v-model="reglages.theme" :options="themes" option-label="label" option-value="value" :allow-empty="false" aria-label="Thème">
          <template #option="{ option }"><i :class="option.icon" /><span class="ml-2 opt">{{ option.label }}</span></template>
        </SelectButton>
      </div>
      <div class="row">
        <span><b>Taille du code</b><small class="muted">Éditeur et exemples.</small></span>
        <span class="flex align-items-center gap-2">
          <Button icon="pi pi-minus" rounded outlined size="small" aria-label="Réduire" :disabled="reglages.taillePolice <= 12" @click="taille(-1)" />
          <code class="size">{{ reglages.taillePolice }} px</code>
          <Button icon="pi pi-plus" rounded outlined size="small" aria-label="Agrandir" :disabled="reglages.taillePolice >= 18" @click="taille(1)" />
        </span>
      </div>
      <div class="row">
        <span><b>Sauvegarde</b><small class="muted">Ta progression reste sur cet appareil. Exporte-la pour la transférer.</small></span>
        <span class="flex gap-2 flex-wrap justify-content-end">
          <Button label="Exporter" icon="pi pi-download" severity="secondary" outlined size="small" @click="exporter" />
          <Button label="Importer" icon="pi pi-upload" severity="secondary" outlined size="small" @click="fichier?.click()" />
          <input ref="fichier" type="file" accept="application/json,.json" class="sr-only" @change="importer">
        </span>
      </div>
      <div class="row">
        <span><b>Réinitialiser</b><small class="muted">Efface progression, cartes et brouillons.</small></span>
        <Button label="Tout effacer" icon="pi pi-trash" severity="danger" text size="small" @click="effacer" />
      </div>
    </div>

    <h2 class="section-title">À propos</h2>
    <div class="card pad about small muted">
      <p class="mt-0"><b class="text-color">Vue Express</b> apprend Vue 3 par la pratique, avec les outils d'un vrai projet : <code>&lt;script setup&gt;</code>, routage par fichiers, Pinia, PrimeVue, i18n.</p>
      <p>Les exercices sont compilés et testés <b class="text-color">dans ton navigateur</b> : aucun serveur, aucun compte, aucun suivi. Les données des exercices (salariés, absences) sont fictives.</p>
      <p class="mb-0">Fonctionne hors-ligne une fois chargée. Ajoute-la à l'écran d'accueil pour l'ouvrir comme une app.</p>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Profil" } }
</route>

<style scoped>
.prof { max-width: 820px; }
.grow { flex: 1; min-width: 0; }
.me { display: flex; align-items: center; gap: 20px; padding: 22px; }
.me .h-title { margin: 2px 0 10px; font-size: 26px; }
.lvl { font-size: 28px; letter-spacing: -.03em; }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 14px; }
.stat { padding: 14px 16px; display: grid; }
.stat b { font-size: 24px; letter-spacing: -.02em; } .stat b small { font-size: 14px; color: var(--ve-dim); }
.stat span { font-size: 12.5px; color: var(--ve-muted); }
.mods { display: grid; gap: 12px; }
.mrow { display: grid; grid-template-columns: 34px minmax(0, 170px) 1fr 40px; align-items: center; gap: 12px; }
.mi { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; }
.mt { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mrow b { text-align: right; color: var(--ve-muted); }
.settings { padding: 4px 18px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; }
.row + .row { border-top: 1px solid var(--ve-border); }
.row > span:first-child { display: grid; min-width: 0; }
.row small { font-size: 12.5px; }
.size { min-width: 48px; text-align: center; font-weight: 700; }
.about code { font-size: 12.5px; }
@media (max-width: 991px) {
  .grid4 { grid-template-columns: repeat(2, 1fr); }
  .me { gap: 14px; padding: 18px; }
  .me .h-title { font-size: 21px; }
  .mrow { grid-template-columns: 34px minmax(0, 1fr) 70px 36px; }
}
@media (max-width: 560px) {
  .row { flex-direction: column; align-items: stretch; }
  .row :deep(.p-selectbutton) { display: flex; }
  .row :deep(.p-togglebutton) { flex: 1; }
}
</style>
