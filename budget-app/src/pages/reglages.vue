<script setup lang="ts">
import type { Category, Kind } from '@/core/types';
import { categoriesOf, PALETTE } from '@/core/store.js';
import { toCSV, importCSV } from '@/core/csv.js';
import { toJSON, restoreJSON } from '@/core/backup.js';
import { today } from '@/core/format.js';
import { useBudgetStore } from '@/stores/budget';
import type { Theme } from '@/composables/useTheme';
import { toast } from '@/composables/useToast';
import { confirmer } from '@/composables/useConfirm';
import { partagerOuTelecharger, lireFichier } from '@/lib/fichiers';
import { useT } from '@/lib/t';
import Icone from '@/components/Icone.vue';
import PartageCompte from '@/components/PartageCompte.vue';
import EditeurCategorie from '@/components/EditeurCategorie.vue';
import PastilleCategorie from '@/components/PastilleCategorie.vue';

const budget = useBudgetStore();
const { t, nomCat } = useT();
const DEVISES = ['EUR', 'USD', 'GBP', 'CHF', 'BRL', 'CAD', 'AOA', 'CVE', 'MZN', 'XOF', 'MAD', 'JPY'];
const devises = computed(() => [...new Set([budget.settings.currency, ...DEVISES])]);
const themes: { v: Theme; icone: string }[] = [{ v: 'auto', icone: 'eclair' }, { v: 'clair', icone: 'soleil' }, { v: 'sombre', icone: 'lune' }];
const theme = computed(() => (budget.settings.theme as Theme | undefined) ?? 'auto');
const partage = computed(() => !!budget.etatSync.householdId);
const cats = (k: Kind) => (budget.tick, categoriesOf(k));

const editee = ref<(Partial<Category> & Pick<Category, 'kind' | 'color'>) | null>(null);
const nouvelle = (kind: Kind) => { editee.value = { kind, color: PALETTE[budget.categories.length % PALETTE.length]! }; };

// ----- Données -----
const exporterCsv = () => partagerOuTelecharger(`budget-${today()}.csv`, new Blob([toCSV()], { type: 'text/csv;charset=utf-8' }));
const exporterJson = () => partagerOuTelecharger(`budget-${today()}.json`, new Blob([toJSON()], { type: 'application/json' }));
async function fichier(e: Event, traiter: (texte: string) => Promise<void>) {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0];
  input.value = '';
  if (!f) return;
  try { await traiter(await lireFichier(f)); } catch { toast(t('settings.badFile'), { type: 'danger' }); }
  budget.bump();
}
const importerCsv = (e: Event) => fichier(e, async texte => {
  const r = await budget.ecrire(importCSV)(texte);
  toast(t('settings.imported', r), { type: 'ok' });
});
const restaurerJson = (e: Event) => fichier(e, async texte => {
  JSON.parse(texte);
  if (partage.value) { toast(t('share.blocked'), { type: 'warn' }); return; }
  if (!(await confirmer(t('settings.restoreConfirm'), { ok: t('settings.importJson'), annuler: t('cancel') }))) return;
  await budget.ecrire(restoreJSON)(texte);
  document.documentElement.lang = budget.settings.lang;
  toast(t('settings.restored'), { type: 'ok' });
});
async function toutEffacer() {
  if (partage.value) { toast(t('share.blocked'), { type: 'warn' }); return; }
  if (!(await confirmer(t('settings.resetConfirm'), { ok: t('settings.reset'), annuler: t('cancel') }))) return;
  await budget.toutRemplacer({ settings: { lang: budget.settings.lang } });
  toast(t('settings.resetDone'));
}
</script>

<template>
  <div class="page">
    <h1 class="page-title">{{ $t('tab.settings') }}</h1>

    <section class="section">
      <div class="section-head"><h2>{{ $t('share.title') }}</h2></div>
      <PartageCompte />
    </section>

    <section class="section">
      <div class="section-head"><h2>{{ $t('v2.settings.display') }}</h2></div>
      <div class="card lignes">
        <div class="ligne">
          <span class="ic"><Icone nom="langue" :taille="18" /></span><span class="grow">{{ $t('settings.language') }}</span>
          <div class="seg petit">
            <button v-for="[v, l] in [['fr', 'Français'], ['pt', 'Português']]" :key="v" type="button" :class="{ on: budget.settings.lang === v }" @click="budget.reglage('lang', v)">{{ l }}</button>
          </div>
        </div>
        <label class="ligne">
          <span class="ic"><Icone nom="pieces" :taille="18" /></span><span class="grow">{{ $t('settings.currency') }}</span>
          <select class="input court" :value="budget.settings.currency" @change="budget.reglage('currency', ($event.target as HTMLSelectElement).value)">
            <option v-for="d in devises" :key="d" :value="d">{{ d }}</option>
          </select>
        </label>
        <div class="ligne">
          <span class="ic"><Icone nom="lune" :taille="18" /></span><span class="grow">{{ $t('v2.settings.theme') }}</span>
          <div class="seg petit">
            <button v-for="th in themes" :key="th.v" type="button" :class="{ on: theme === th.v }" :aria-label="$t('v2.theme.' + th.v)" @click="budget.reglage('theme', th.v)"><Icone :nom="th.icone" :taille="16" /></button>
          </div>
        </div>
      </div>
    </section>

    <section v-for="k in (['expense', 'income'] as const)" :key="k" class="section">
      <div class="section-head"><h2>{{ $t('settings.categories') }} · {{ $t('sum.' + k) }}</h2></div>
      <div class="card lignes">
        <button v-for="c in cats(k)" :key="c.id" type="button" class="ligne cat" @click="editee = { ...c }">
          <PastilleCategorie :cat="c" :taille="34" /><span class="grow">{{ nomCat(c) }}</span><Icone nom="droite" :taille="18" class="dim" />
        </button>
        <button type="button" class="ligne ajout" @click="nouvelle(k)"><span class="ic"><Icone nom="plus" :taille="18" /></span>{{ $t('settings.addCategory') }}</button>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2>{{ $t('settings.data') }}</h2></div>
      <div class="card pad donnees">
        <p class="small muted m0">{{ $t(partage ? 'settings.dataHelpShared' : 'settings.dataHelp') }}</p>
        <div class="grille">
          <button type="button" class="btn" @click="exporterCsv"><Icone nom="telecharger" :taille="18" /> {{ $t('settings.exportCsv') }}</button>
          <label class="btn"><Icone nom="envoyer" :taille="18" /> {{ $t('settings.importCsv') }}<input type="file" accept=".csv,text/csv,text/plain" hidden @change="importerCsv"></label>
          <button type="button" class="btn" @click="exporterJson"><Icone nom="telecharger" :taille="18" /> {{ $t('settings.exportJson') }}</button>
          <label class="btn"><Icone nom="envoyer" :taille="18" /> {{ $t('settings.importJson') }}<input type="file" accept=".json,application/json" hidden @change="restaurerJson"></label>
        </div>
        <button type="button" class="btn danger full" @click="toutEffacer"><Icone nom="poubelle" :taille="18" /> {{ $t('settings.reset') }}</button>
      </div>
    </section>

    <section class="section">
      <div class="card pad small">
        <b>{{ $t('settings.install') }}</b>
        <p class="muted">{{ $t('settings.installHelp') }}</p>
        <p class="muted m0">{{ $t('v2.settings.v1') }} <a href="../budget-v1/">{{ $t('v2.settings.v1Link') }}</a></p>
      </div>
      <p class="center dim tiny">Budget v2</p>
    </section>

    <EditeurCategorie v-model="editee" />
  </div>
</template>

<route>
{ "meta": { "titre": "Réglages" } }
</route>

<style scoped>
.page { max-width: 720px; margin: 0 auto; }
.lignes { padding: 4px 14px; }
.ligne { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 0; border: 0; background: none; color: var(--text); font-weight: 600; text-align: left; }
.ligne + .ligne { border-top: 1px solid var(--border); }
.ic { width: 34px; height: 34px; flex: none; border-radius: 11px; display: grid; place-items: center; background: var(--surface-2); color: var(--muted); }
.ajout { color: var(--brand-2); font-weight: 800; }
.dark .ajout { color: var(--brand); }
.ajout .ic { background: var(--brand-soft); color: inherit; }
.petit { padding: 3px; } .petit button { min-height: 32px; padding: 0 12px; font-size: 13.5px; }
.court { width: 110px; min-height: 40px; }
.donnees { display: grid; gap: 12px; }
.grille { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.grille .btn { font-size: 14px; padding: 0 10px; }
.m0 { margin: 0; }
</style>
