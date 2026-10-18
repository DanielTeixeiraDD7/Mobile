<script setup lang="ts">
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { lessonById, moduleOf, nextLesson } from '@/content';
import { inline } from '@/lib/highlight';
import { runTests, type RunReport } from '@/lib/testing';
import type { Files } from '@/lib/runtime';
import { PRIMEVUE_CONFIG } from '@/lib/theme';
import { lireBrouillon, ecrireBrouillon, effacerBrouillon } from '@/lib/brouillons';
import { useEcran } from '@/composables/useEcran';
import { useProgressionStore } from '@/stores/progression';
import CodeEditor from '@/shared/components/CodeEditor.vue';
import Celebration from '@/shared/components/Celebration.vue';
import PreviewPane from './components/PreviewPane.vue';
import TestsPanel from './components/TestsPanel.vue';

defineProps<{ ID?: string }>(); // passé par le routeur (props: true) ; on lit useRoute()
const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const progression = useProgressionStore();
const { estMobile } = useEcran();

const id = computed(() => String(route.params.ID));
const lecon = computed(() => lessonById(id.value));
const module = computed(() => moduleOf(id.value));
const ex = computed(() => lecon.value?.exercise ?? null);
const suivante = computed(() => nextLesson(id.value));

const files = ref<Files>({});
const actif = ref('');
const rapport = ref<RunReport | null>(null);
const enCours = ref(false);
const indicesVus = ref(0);
const fete = ref(false);
const gain = ref(0);
// Mobile : un onglet à la fois. Bureau : code à gauche, aperçu / tests à droite.
const onglet = ref<'consigne' | 'code' | 'apercu' | 'tests'>('consigne');
const panneau = ref<'apercu' | 'tests'>('apercu');

const apercu = useTemplateRef<InstanceType<typeof PreviewPane>>('apercu');

const lectureSeule = (f: string) => !!ex.value?.readonly?.includes(f);
const ajoute = (f: string) => !!ex.value && !(f in ex.value.files) && !(f in ex.value.solution);

// Onglets : App.vue d'abord, puis l'arborescence dans l'ordre alphabétique.
const fichiers = computed(() => Object.keys(files.value).sort((a, b) => (a === 'App.vue' ? -1 : b === 'App.vue' ? 1 : a.localeCompare(b))));

const contenuActif = computed({
  get: () => files.value[actif.value] ?? '',
  set: v => { if (!lectureSeule(actif.value)) files.value = { ...files.value, [actif.value]: v }; },
});

// Consigne « 1) … 2) … » découpée en étapes (numéros consécutifs depuis 1 uniquement).
const consigne = computed(() => {
  const t = ex.value?.task ?? '';
  const coupes: number[] = [];
  let attendu = 1;
  for (const m of t.matchAll(/(^|\s)(\d)\)\s/g)) {
    if (Number(m[2]) !== attendu) continue;
    coupes.push(m.index! + m[1]!.length);
    attendu++;
  }
  if (coupes.length < 2) return { intro: t, etapes: [] as string[] };
  return {
    intro: t.slice(0, coupes[0]).trim(),
    etapes: coupes.map((c, i) => t.slice(c, coupes[i + 1]).replace(/^\d\)\s*/, '').trim()),
  };
});

// Leçon dont les fichiers sont chargés : à la navigation, la route change AVANT le démontage,
// il ne faut pas enregistrer le code de cette leçon sous l'ID de la suivante.
let idCharge = '';
// Fichiers remplacés par charger() : l'aperçu est déjà relancé, pas de 2e exécution.
let chargement = false;

function charger() {
  if (!ex.value) return;
  idCharge = id.value;
  chargement = true;
  nextTick(() => { chargement = false; });
  const brouillon = lireBrouillon(id.value);
  const depart = { ...ex.value.files, ...(brouillon ?? {}) };
  // Les fichiers fournis restent ceux de l'exercice, quoi qu'il y ait dans le brouillon.
  for (const f of ex.value.readonly ?? []) depart[f] = ex.value.files[f]!;
  files.value = depart;
  actif.value = ex.value.open in depart ? ex.value.open : fichiers.value[0]!;
  rapport.value = null;
  indicesVus.value = Math.min(progression.state(id.value).hints, ex.value.hints.length);
  onglet.value = 'consigne';
  panneau.value = 'apercu';
  // Avant le montage (transition de page en cours), c'est onMounted qui lance l'aperçu.
  if (monte) nextTick(() => apercu.value?.executer());
}
let monte = false;
onMounted(() => { monte = true; apercu.value?.executer(); });
watch(id, charger, { immediate: true });

// Brouillon + aperçu relancé peu après la frappe.
let tSave: number | undefined;
let tRun: number | undefined;
watch(files, f => {
  if (!idCharge) return;
  if (chargement) return;
  window.clearTimeout(tSave); window.clearTimeout(tRun);
  const cible = idCharge;
  tSave = window.setTimeout(() => { tSave = undefined; ecrireBrouillon(cible, f); }, 400);
  tRun = window.setTimeout(() => apercu.value?.executer(), 800);
});
onBeforeUnmount(() => {
  window.clearTimeout(tRun);
  if (tSave !== undefined) { window.clearTimeout(tSave); ecrireBrouillon(idCharge, files.value); }
});

async function lancerTests() {
  if (!ex.value || enCours.value) return;
  enCours.value = true;
  window.clearTimeout(tRun);
  // L'aperçu partage les services PrimeVue : on le coupe le temps des tests.
  apercu.value?.arreter();
  progression.recordAttempt(id.value);
  try {
    rapport.value = await runTests(files.value, ex.value.tests, { messages: ex.value.messages, primevue: PRIMEVUE_CONFIG });
  } finally {
    enCours.value = false;
    apercu.value?.executer();
  }
  if (estMobile.value) onglet.value = 'tests'; else panneau.value = 'tests';
  if (rapport.value.passed) {
    gain.value = progression.complete(id.value);
    fete.value = false;
    nextTick(() => (fete.value = true));
    toast.add({ group: 'app', severity: 'success', summary: 'Exercice réussi !', detail: gain.value ? `+${gain.value} XP` : 'Déjà validé, bien joué.', life: 3000 });
  }
}

function indice() {
  if (!ex.value || indicesVus.value >= ex.value.hints.length) return;
  indicesVus.value++;
  progression.recordHint(id.value);
  if (estMobile.value) onglet.value = 'consigne';
}

function voirSolution() {
  confirm.require({
    group: 'app',
    appendTo: '#app-overlays',
    header: 'Afficher la solution ?',
    message: 'Ton code sera remplacé par la correction (tu peux toujours la modifier). L’exercice rapportera moins d’XP.',
    icon: 'pi pi-eye',
    rejectProps: { label: 'Je cherche encore', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Voir la solution' },
    accept: () => {
      files.value = { ...files.value, ...ex.value!.solution };
      progression.recordSolution(id.value);
      actif.value = Object.keys(ex.value!.solution)[0] ?? actif.value;
      onglet.value = 'code';
      toast.add({ group: 'app', severity: 'info', summary: 'Solution chargée', detail: 'Lis-la, puis lance les tests.', life: 3000 });
    },
  });
}

function reinitialiser() {
  confirm.require({
    group: 'app',
    appendTo: '#app-overlays',
    header: 'Repartir de zéro ?',
    message: 'Ton code pour cet exercice sera effacé.',
    icon: 'pi pi-refresh',
    rejectProps: { label: 'Annuler', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Effacer', severity: 'danger' },
    accept: () => { effacerBrouillon(id.value); files.value = {}; charger(); onglet.value = 'code'; },
  });
}

// Nouveau fichier (ex. créer une page dans pages/).
const dialogue = ref(false);
const nomFichier = ref('');
const erreurNom = computed(() => {
  const n = nomFichier.value.trim();
  if (!n) return '';
  if (!/^[\w-]+(\/[\w-]+)*\.(vue|js)$/.test(n)) return 'Chemin attendu, par ex. pages/absences/index.vue';
  if (n in files.value) return 'Ce fichier existe déjà.';
  return '';
});
function creerFichier() {
  const n = nomFichier.value.trim();
  if (!n || erreurNom.value) return;
  // Balises de fermeture découpées : écrites telles quelles, elles fermeraient le bloc script de ce fichier.
  const vide = ['<script setup>', '', '</' + 'script>', '', '<template>', '  <div>', '', '  </div>', '</' + 'template>', ''].join('\n');
  files.value = { ...files.value, [n]: n.endsWith('.vue') ? vide : `// ${n}\n` };
  actif.value = n;
  dialogue.value = false;
  nomFichier.value = '';
}
function supprimerFichier(f: string) {
  const { [f]: _, ...reste } = files.value;
  files.value = reste;
  if (actif.value === f) actif.value = fichiers.value[0]!;
}

const nomCourt = (f: string) => f.split('/').pop()!;
const dossier = (f: string) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/') + 1) : '');

const ongletsMobile = computed(() => {
  const base = [
    { id: 'consigne' as const, label: 'Consigne', icon: 'pi pi-flag' },
    { id: 'code' as const, label: 'Code', icon: 'pi pi-code' },
    { id: 'apercu' as const, label: 'Aperçu', icon: 'pi pi-eye' },
    { id: 'tests' as const, label: 'Tests', icon: 'pi pi-check-square' },
  ];
  return base;
});
</script>

<template>
  <div v-if="lecon && ex && module" class="ex" :style="{ '--c': module.color }">
    <header class="ex-head">
      <router-link :to="'/lecon/' + lecon.id" class="back" aria-label="Retour à la leçon"><i class="pi pi-arrow-left" /></router-link>
      <div class="grow">
        <small>{{ lecon.id }} · {{ ex.kind === 'bug' ? 'Chasse au bug' : 'Exercice' }}</small>
        <h1>{{ lecon.title }}</h1>
      </div>
      <div class="actions">
        <Button v-tooltip.bottom="'Indice'" icon="pi pi-lightbulb" text rounded :badge="ex.hints.length - indicesVus ? String(ex.hints.length - indicesVus) : undefined" badge-severity="warn"
          :disabled="indicesVus >= ex.hints.length" aria-label="Indice" @click="indice" />
        <Button v-tooltip.bottom="'Voir la solution'" icon="pi pi-eye" text rounded aria-label="Voir la solution" @click="voirSolution" />
        <Button v-tooltip.bottom="'Repartir de zéro'" icon="pi pi-replay" text rounded aria-label="Repartir de zéro" @click="reinitialiser" />
        <Button :label="estMobile ? 'Tester' : $t('exercice.executer')" icon="pi pi-play" :loading="enCours" @click="lancerTests" />
      </div>
    </header>

    <nav v-if="estMobile" class="seg" role="tablist">
      <button v-for="o in ongletsMobile" :key="o.id" role="tab" type="button" :aria-selected="onglet === o.id" :class="{ on: onglet === o.id }" @click="onglet = o.id">
        <i :class="o.icon" /> {{ o.label }}
        <span v-if="o.id === 'tests' && rapport" class="mini" :class="rapport.passed ? 'ok' : 'ko'" />
      </button>
    </nav>

    <section v-show="!estMobile || onglet === 'consigne'" class="consigne card">
      <div v-if="rapport?.passed" class="win">
        <span class="win-icon"><i class="pi pi-trophy" /></span>
        <span class="grow"><b>{{ $t('exercice.reussi') }}</b><small v-if="gain">+{{ gain }} XP</small></span>
        <Button v-if="suivante" :label="$t('exercice.suivante')" icon="pi pi-arrow-right" icon-pos="right" size="small" @click="router.push('/lecon/' + suivante.id)" />
        <Button v-else label="Tableau de bord" size="small" @click="router.push('/')" />
      </div>
      <h3 v-if="estMobile" class="m-title">{{ lecon.title }}</h3>
      <h2><i class="pi pi-flag" /> {{ $t('exercice.consigne') }}</h2>
      <p v-if="consigne.intro" class="inline-code" v-html="inline(consigne.intro)" />
      <ol v-if="consigne.etapes.length" class="etapes">
        <li v-for="(e, i) in consigne.etapes" :key="i" class="inline-code" v-html="inline(e)" />
      </ol>
      <div v-for="(h, i) in ex.hints.slice(0, indicesVus)" :key="'h' + i" class="hint inline-code">
        <i class="pi pi-lightbulb" /><span><b>Indice {{ i + 1 }}</b> <span v-html="inline(h)" /></span>
      </div>
      <p class="kbd muted" v-if="!estMobile"><kbd>Ctrl</kbd> + <kbd>Entrée</kbd> lance les tests · l'aperçu se met à jour pendant que tu tapes.</p>
      <Button v-if="estMobile" label="Ouvrir le code" icon="pi pi-code" outlined class="w-full mt-2" @click="onglet = 'code'" />
    </section>

    <section v-show="!estMobile || onglet === 'code'" class="editor card">
      <div class="tabs" role="tablist" aria-label="Fichiers">
        <button v-for="f in fichiers" :key="f" type="button" role="tab" class="tab" :class="{ on: f === actif }" :aria-selected="f === actif" :title="f" @click="actif = f">
          <i :class="f.endsWith('.vue') ? 'pi pi-box' : 'pi pi-file'" />
          <span class="dim">{{ dossier(f) }}</span>{{ nomCourt(f) }}
          <i v-if="lectureSeule(f)" class="pi pi-lock lock" v-tooltip.bottom="'Fichier fourni, non modifiable'" />
          <i v-else-if="ajoute(f)" class="pi pi-times close" role="button" aria-label="Supprimer le fichier" @click.stop="supprimerFichier(f)" />
        </button>
        <button type="button" class="tab add" @click="dialogue = true"><i class="pi pi-plus" /> {{ $t('exercice.nouveauFichier') }}</button>
      </div>
      <div class="cm">
        <CodeEditor v-model="contenuActif" :file-key="id + ':' + actif" :readonly="lectureSeule(actif)" @run="lancerTests" />
      </div>
    </section>

    <section v-show="!estMobile || onglet === 'apercu' || onglet === 'tests'" class="right">
      <div v-if="!estMobile" class="switch">
        <button type="button" :class="{ on: panneau === 'apercu' }" @click="panneau = 'apercu'"><i class="pi pi-eye" /> {{ $t('exercice.apercu') }}</button>
        <button type="button" :class="{ on: panneau === 'tests' }" @click="panneau = 'tests'">
          <i class="pi pi-check-square" /> {{ $t('exercice.tests') }}
          <span v-if="rapport" class="mini" :class="rapport.passed ? 'ok' : 'ko'" />
        </button>
      </div>
      <div class="panel">
        <PreviewPane v-show="estMobile ? onglet === 'apercu' : panneau === 'apercu'" ref="apercu" :files="files" :messages="ex.messages" />
        <TestsPanel v-show="estMobile ? onglet === 'tests' : panneau === 'tests'" :tests="ex.tests" :rapport="rapport" :en-cours="enCours" @lancer="lancerTests" />
      </div>
    </section>

    <Dialog v-model:visible="dialogue" modal append-to="#app-overlays" header="Nouveau fichier" :style="{ width: 'min(440px, calc(100vw - 32px))' }">
      <form @submit.prevent="creerFichier">
        <label for="nf" class="block mb-2 muted small">Chemin dans le projet</label>
        <InputText id="nf" v-model="nomFichier" class="w-full" placeholder="pages/absences/index.vue" autocomplete="off" autocapitalize="off" spellcheck="false" autofocus />
        <small v-if="erreurNom" class="block mt-2" style="color:#dc2626">{{ erreurNom }}</small>
        <small v-else class="block mt-2 dim">Un fichier dans <code>pages/</code> devient une route ; dans <code>components/</code>, non.</small>
        <div class="flex justify-content-end gap-2 mt-4">
          <Button label="Annuler" severity="secondary" text type="button" @click="dialogue = false" />
          <Button label="Créer" icon="pi pi-plus" type="submit" :disabled="!nomFichier.trim() || !!erreurNom" />
        </div>
      </form>
    </Dialog>
    <Celebration :active="fete" />
  </div>
</template>

<route>
{ "meta": { "titre": "Exercice", "large": true } }
</route>

<style scoped>
.ex {
  display: grid; gap: 14px; height: calc(100dvh - 42px);
  grid-template-columns: minmax(0, 1.12fr) minmax(0, 1fr);
  grid-template-rows: auto minmax(0, auto) minmax(0, 1fr);
  grid-template-areas: "head head" "editor consigne" "editor right";
}
.ex-head { grid-area: head; display: flex; align-items: center; gap: 12px; }
.back { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: 12px; background: var(--ve-surface); border: 1px solid var(--ve-border); color: var(--ve-text); text-decoration: none; }
.grow { flex: 1; min-width: 0; }
.ex-head small { color: var(--c); font-weight: 800; font-size: 12px; letter-spacing: .02em; }
.ex-head h1 { margin: 0; font-size: 20px; letter-spacing: -.015em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.actions { display: flex; align-items: center; gap: 2px; }
.actions :deep(.p-button:last-child) { margin-left: 8px; }

.consigne { grid-area: consigne; padding: 16px 18px; overflow: auto; max-height: 38vh; }
.consigne h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .07em; color: var(--c); margin: 0 0 8px; display: flex; gap: 8px; align-items: center; }
.consigne p { margin: 0 0 10px; }
.etapes { margin: 0 0 10px; padding: 0; list-style: none; counter-reset: e; display: grid; gap: 8px; }
.etapes li { counter-increment: e; position: relative; padding-left: 34px; }
.etapes li::before { content: counter(e); position: absolute; left: 0; top: 0; width: 24px; height: 24px; border-radius: 8px; display: grid; place-items: center; font-weight: 800; font-size: 12.5px; background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
.hint { display: flex; gap: 10px; padding: 10px 12px; border-radius: 12px; margin-top: 8px; background: color-mix(in srgb, #f5b301 11%, var(--ve-surface)); border: 1px solid color-mix(in srgb, #f5b301 30%, transparent); font-size: 14px; animation: pop .25s; }
.hint > i { color: #d97706; margin-top: 3px; }
.kbd { font-size: 12.5px; margin: 10px 0 0; }
kbd { font: 600 11px "JetBrains Mono", monospace; padding: 1px 6px; border-radius: 6px; border: 1px solid var(--ve-border); background: var(--ve-surface-2); }
.win { display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin: -4px -6px 14px; border-radius: 14px; background: linear-gradient(120deg, color-mix(in srgb, #22c55e 16%, var(--ve-surface)), color-mix(in srgb, var(--c) 10%, var(--ve-surface))); animation: pop .35s; }
.win .grow { display: grid; } .win small { color: #16a34a; font-weight: 800; }
.win-icon { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; background: #f5b301; color: #fff; font-size: 17px; }

.editor { grid-area: editor; display: flex; flex-direction: column; overflow: hidden; background: var(--ve-code-bg); border-color: #1d2b27; }
.tabs { display: flex; gap: 2px; padding: 6px 6px 0; background: #13211d; overflow-x: auto; scrollbar-width: none; flex: none; }
.tabs::-webkit-scrollbar { display: none; }
.tab { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border: 0; border-radius: 10px 10px 0 0; background: transparent; color: #8fb3a5; font: 600 12.5px "JetBrains Mono", ui-monospace, monospace; cursor: pointer; white-space: nowrap; }
.tab .dim { color: #557167; }
.tab:hover { color: #d7e7e1; }
.tab.on { background: var(--ve-code-bg); color: #e7f1ed; box-shadow: inset 0 2px 0 var(--ve-green); }
.tab .lock { font-size: 10px; color: #f5b301; }
.tab .close { font-size: 10px; opacity: .6; } .tab .close:hover { opacity: 1; }
.tab.add { color: var(--ve-green); }
.cm { flex: 1; min-height: 0; }

.right { grid-area: right; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.switch { display: inline-flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--ve-surface-2); align-self: flex-start; }
.switch button, .seg button { position: relative; display: flex; align-items: center; gap: 7px; border: 0; background: none; padding: 7px 14px; border-radius: 9px; font: 700 13px Inter, sans-serif; color: var(--ve-muted); cursor: pointer; }
.switch button.on, .seg button.on { background: var(--ve-surface); color: var(--ve-text); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.mini { width: 8px; height: 8px; border-radius: 50%; } .mini.ok { background: #22c55e; } .mini.ko { background: #ef4444; }
.panel { flex: 1; min-height: 0; display: grid; }
.panel > * { grid-area: 1 / 1; min-height: 0; }
@keyframes pop { from { opacity: 0; transform: translateY(4px); } }

@media (max-width: 991px) {
  .ex { display: flex; flex-direction: column; gap: 10px; height: calc(100dvh - var(--safe-t) - 64px - var(--ve-tab-h) - var(--safe-b) - 24px); min-height: 420px; }
  .ex-head .grow { visibility: hidden; }
  .m-title { margin: 0 0 12px; font-size: 19px; letter-spacing: -.015em; }
  .back { width: 36px; height: 36px; }
  .actions :deep(.p-button:last-child) { margin-left: 4px; }
  .seg { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; padding: 4px; border-radius: 13px; background: var(--ve-surface-2); flex: none; }
  .seg button { justify-content: center; padding: 8px 4px; font-size: 12.5px; gap: 5px; }
  .seg .mini { position: absolute; top: 5px; right: 6px; }
  .consigne { max-height: none; flex: 1; }
  .editor, .right { flex: 1; min-height: 0; }
}
@media (max-width: 380px) { .seg button i { display: none; } }
</style>
