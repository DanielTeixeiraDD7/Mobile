import { expect } from '@/lib/expect';
import type { Module } from './types';

const FORMULAIRE_AUTO = `<script setup>
// Composant FOURNI : affiche un formulaire à partir d'une liste de champs.
// champ = { name, label, type: 'text'|'date'|'select'|'checkbox', options?, required?, hidden?, disabled? }
const props = defineProps({
  champs: { type: Array, required: true },
  modelValue: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue'])

function maj(name, valeur) {
  emit('update:modelValue', { ...props.modelValue, [name]: valeur })
}
</script>

<template>
  <div class="auto">
    <template v-for="c in champs" :key="c.name">
      <div v-if="!c.hidden" class="champ" :data-field="c.name">
        <label>{{ c.label }}<span v-if="c.required" class="req" data-test="requis"> *</span></label>
        <select v-if="c.type === 'select'" :value="modelValue[c.name]" :disabled="c.disabled" @change="maj(c.name, $event.target.value)">
          <option v-for="o in c.options" :key="o">{{ o }}</option>
        </select>
        <input v-else-if="c.type === 'checkbox'" type="checkbox" :checked="modelValue[c.name]" :disabled="c.disabled" @change="maj(c.name, $event.target.checked)">
        <input v-else :type="c.type" :value="modelValue[c.name]" :disabled="c.disabled" @input="maj(c.name, $event.target.value)">
      </div>
    </template>
  </div>
</template>

<style>
.auto { display: grid; gap: 10px; max-width: 340px; font-family: system-ui; }
.champ { display: grid; gap: 4px; }
.champ label { font-size: 13px; font-weight: 600; color: #475569; }
.req { color: #dc2626; }
.champ input, .champ select { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 8px; }
.champ input:disabled { background: #f1f5f9; }
</style>`;

const TABLEAU = `<script setup>
// Composant FOURNI : tableau piloté par une liste de colonnes { field, header }.
defineProps({ colonnes: Array, lignes: Array })
</script>

<template>
  <table class="t">
    <thead><tr><th v-for="c in colonnes" :key="c.field" data-test="entete">{{ c.header }}</th></tr></thead>
    <tbody>
      <tr v-for="row in lignes" :key="row.id" data-test="ligne">
        <td v-for="c in colonnes" :key="c.field" :data-test="'cell-' + c.field">
          <slot :name="'cell-' + c.field" :row="row">{{ row[c.field] }}</slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style>
.t { border-collapse: collapse; width: 100%; font-family: system-ui; font-size: 14px; }
.t th, .t td { text-align: left; padding: 7px; border-bottom: 1px solid #eee; }
</style>`;

const champsVisibles = (w: { findAll(s: string): HTMLElement[] }) => w.findAll('[data-field]').map(e => e.dataset.field);

export const m5: Module = {
  id: 5,
  title: 'Interface déclarative',
  icon: 'pi pi-sliders-h',
  color: '#ec4899',
  summary: 'Décrire formulaires et tableaux avec des objets de config calculés.',
  lessons: [
    {
      id: '5-1',
      title: 'Formulaire piloté par une config',
      minutes: 16,
      goal: 'Calculer hidden / required / disabled selon les données saisies.',
      blocks: [
        { t: 'p', text: "Plutôt que d'écrire chaque champ dans le template avec des `v-if`, on **décrit** le formulaire : une liste d'objets (nom, libellé, type, règles). Un composant générique l'affiche. La liste est un **`computed`** : quand les données changent, les règles se recalculent." },
        { t: 'code', lang: 'js', code: `const form = ref({ type: 'Congés payés', debut: '', fin: '', demiJournee: false, justificatif: '' })

const champs = computed(() => {
  const base = [
    { name: 'type', label: 'Type', type: 'select', options: TYPES, required: true },
    { name: 'debut', label: 'Du', type: 'date', required: true },
    { name: 'fin', label: 'Au', type: 'date', required: true, disabled: form.value.demiJournee },
    { name: 'demiJournee', label: 'Demi-journée', type: 'checkbox' },
  ]
  if (form.value.type === 'Maladie') {
    base.push({ name: 'justificatif', label: 'N° d’arrêt', type: 'text', required: true })
  }
  return base
})` },
        { t: 'list', items: [
          '**Ajouter conditionnellement** : `const base = [...]` puis `if (...) base.push(...)`.',
          '**Masquer** un champ toujours présent dans la liste : `hidden: condition`.',
          '`required` / `disabled` sont de simples booléens **calculés** à partir de `form`.',
        ] },
        { t: 'sql', text: "C'est l'équivalent d'un formulaire décrit par une **table de paramétrage** (une ligne par champ, des colonnes visible/obligatoire/modifiable) lue avec un `CASE WHEN`." },
        { t: 'tip', text: "Avantage : les règles métier sont au même endroit, lisibles comme une liste, et faciles à tester." },
      ],
      exercise: {
        kind: 'build',
        task: "Complète le `computed` **`champs`** : 1) le champ **N° d'arrêt** (`justificatif`) n'existe que si le type est **Maladie** (et il est obligatoire) ; 2) **Au** (`fin`) est **désactivé** quand **Demi-journée** est cochée ; 3) le **Commentaire** est **obligatoire** quand le type est **Autre**.",
        open: 'App.vue',
        readonly: ['components/FormulaireAuto.vue'],
        files: {
          'components/FormulaireAuto.vue': FORMULAIRE_AUTO,
          'App.vue': `<script setup>
import FormulaireAuto from './components/FormulaireAuto.vue'

const TYPES = ['Congés payés', 'RTT', 'Maladie', 'Autre']
const form = ref({ type: 'Congés payés', debut: '', fin: '', demiJournee: false, justificatif: '', commentaire: '' })

const champs = computed(() => {
  const base = [
    { name: 'type', label: 'Type', type: 'select', options: TYPES, required: true },
    { name: 'debut', label: 'Du', type: 'date', required: true },
    { name: 'fin', label: 'Au', type: 'date', required: true },
    { name: 'demiJournee', label: 'Demi-journée', type: 'checkbox' },
  ]
  // à compléter : justificatif si Maladie

  base.push({ name: 'commentaire', label: 'Commentaire', type: 'text' })
  return base
})
</script>

<template>
  <FormulaireAuto v-model="form" :champs="champs" />
</template>`,
        },
        solution: {
          'App.vue': `<script setup>
import FormulaireAuto from './components/FormulaireAuto.vue'

const TYPES = ['Congés payés', 'RTT', 'Maladie', 'Autre']
const form = ref({ type: 'Congés payés', debut: '', fin: '', demiJournee: false, justificatif: '', commentaire: '' })

const champs = computed(() => {
  const base = [
    { name: 'type', label: 'Type', type: 'select', options: TYPES, required: true },
    { name: 'debut', label: 'Du', type: 'date', required: true },
    { name: 'fin', label: 'Au', type: 'date', required: true, disabled: form.value.demiJournee },
    { name: 'demiJournee', label: 'Demi-journée', type: 'checkbox' },
  ]
  if (form.value.type === 'Maladie') {
    base.push({ name: 'justificatif', label: 'N° d’arrêt', type: 'text', required: true })
  }
  base.push({ name: 'commentaire', label: 'Commentaire', type: 'text', required: form.value.type === 'Autre' })
  return base
})
</script>

<template>
  <FormulaireAuto v-model="form" :champs="champs" />
</template>`,
        },
        tests: [
          { name: 'Champs de départ', run: w => expect(champsVisibles(w), 'Champs affichés').toEqual(['type', 'debut', 'fin', 'demiJournee', 'commentaire']) },
          { name: 'Maladie : le N° d’arrêt apparaît, obligatoire', run: async w => { await w.select('[data-field=type] select', 'Maladie'); expect(champsVisibles(w), 'Champs pour Maladie').toEqual(['type', 'debut', 'fin', 'demiJournee', 'justificatif', 'commentaire']); expect(w.exists('[data-field=justificatif] [data-test=requis]'), 'Astérisque sur N° d’arrêt').toBeTruthy(); await w.select('[data-field=type] select', 'RTT'); expect(w.exists('[data-field=justificatif]'), 'N° d’arrêt pour RTT').toBeFalsy(); } },
          { name: 'Demi-journée désactive « Au »', run: async w => { expect((w.get('[data-field=fin] input') as HTMLInputElement).disabled, '« Au » au départ').toBe(false); await w.check('[data-field=demiJournee] input'); expect((w.get('[data-field=fin] input') as HTMLInputElement).disabled, '« Au » avec demi-journée').toBe(true); } },
          { name: 'Commentaire obligatoire pour « Autre »', run: async w => { expect(w.exists('[data-field=commentaire] [data-test=requis]'), 'Astérisque commentaire (Congés payés)').toBeFalsy(); await w.select('[data-field=type] select', 'Autre'); expect(w.exists('[data-field=commentaire] [data-test=requis]'), 'Astérisque commentaire (Autre)').toBeTruthy(); } },
        ],
        hints: [
          "`if (form.value.type === 'Maladie') base.push({ name: 'justificatif', label: 'N° d’arrêt', type: 'text', required: true })`",
          'Sur le champ fin : `disabled: form.value.demiJournee`.',
          "Sur le commentaire : `required: form.value.type === 'Autre'`.",
        ],
      },
      cards: [
        { id: '5-1a', q: 'Pourquoi mettre la config des champs dans un `computed` ?', choices: ['Pour la performance uniquement', 'Pour que hidden/required/disabled se recalculent quand les données changent', 'Parce que c’est obligatoire', 'Pour la traduire'], answer: 1, explain: 'Les règles lisent `form` : le computed les réévalue automatiquement à chaque modification.' },
        { id: '5-1b', q: 'Ajouter une colonne/un champ selon une condition :', choices: ['`base.splice()` dans le template', '`const base = [...]; if (cond) base.push(...)`', 'Un v-if dans la config', 'Un watch'], answer: 1, explain: 'Le motif classique : tableau de base puis ajouts conditionnels, dans le computed.' },
        { id: '5-1c', q: '`hidden: true` vs ne pas ajouter le champ :', choices: ['Identiques dans tous les cas', 'hidden garde le champ dans la config (ordre, valeur) mais ne l’affiche pas', 'hidden supprime la valeur', 'hidden lève une erreur'], answer: 1, explain: 'Les deux masquent ; `hidden` est pratique quand le champ doit rester déclaré au même endroit.' },
      ],
    },

    {
      id: '5-2',
      title: 'Tableau piloté par des colonnes',
      minutes: 14,
      goal: 'Construire une liste de colonnes conditionnelles et formater une cellule.',
      blocks: [
        { t: 'p', text: "Même idée pour les listes : les **colonnes** sont un tableau d'objets `{ field, header }`, construit dans un `computed`, avec des colonnes ajoutées selon les droits, l'écran ou une option." },
        { t: 'code', lang: 'js', code: `const colonnes = computed(() => {
  const base = [
    { field: 'nom', header: 'Nom' },
    { field: 'service', header: 'Service' },
  ]
  if (session.peutVoirSalaires) base.push({ field: 'salaire', header: 'Salaire' })
  if (!mobile.value) base.push({ field: 'entree', header: 'Entrée' })
  return base
})` },
        { t: 'code', lang: 'vue', code: `<Tableau :colonnes="colonnes" :lignes="salaries">
  <template #cell-salaire="{ row }">{{ formatEuros(row.salaire) }}</template>
</Tableau>` },
        { t: 'tip', text: "Le formatage (montants, dates) se fait dans le slot de la cellule ou avec une fonction de `lib/` : la donnée reste brute, seul l'affichage change." },
      ],
      exercise: {
        kind: 'build',
        task: "Construis le `computed` **`colonnes`** : toujours **Nom** et **Service** ; **Salaire** seulement si « Afficher les salaires » est coché ; **Date d'entrée** seulement si on n'est **pas** en vue compacte. Puis formate la cellule salaire avec `formatEuros(row.salaire)` (via `#cell-salaire`).",
        open: 'App.vue',
        readonly: ['components/Tableau.vue', 'lib/format.js'],
        files: {
          'components/Tableau.vue': TABLEAU,
          'lib/format.js': `export function formatEuros(n) {
  return String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' ') + ' €'
}`,
          'App.vue': `<script setup>
import Tableau from './components/Tableau.vue'
import { formatEuros } from '@/lib/format'

const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité', salaire: 2450, entree: '2019-03-04' },
  { id: 2, nom: 'Bernard', service: 'Informatique', salaire: 3180, entree: '2021-09-01' },
]
const voirSalaires = ref(false)
const compact = ref(false)

const colonnes = computed(() => {
  // à compléter
  return [
    { field: 'nom', header: 'Nom' },
    { field: 'service', header: 'Service' },
  ]
})
</script>

<template>
  <label><input type="checkbox" data-test="salaires" v-model="voirSalaires"> Afficher les salaires</label>
  <label><input type="checkbox" data-test="compact" v-model="compact"> Vue compacte</label>
  <Tableau :colonnes="colonnes" :lignes="salaries" />
</template>`,
        },
        solution: {
          'App.vue': `<script setup>
import Tableau from './components/Tableau.vue'
import { formatEuros } from '@/lib/format'

const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité', salaire: 2450, entree: '2019-03-04' },
  { id: 2, nom: 'Bernard', service: 'Informatique', salaire: 3180, entree: '2021-09-01' },
]
const voirSalaires = ref(false)
const compact = ref(false)

const colonnes = computed(() => {
  const base = [
    { field: 'nom', header: 'Nom' },
    { field: 'service', header: 'Service' },
  ]
  if (voirSalaires.value) base.push({ field: 'salaire', header: 'Salaire' })
  if (!compact.value) base.push({ field: 'entree', header: "Date d'entrée" })
  return base
})
</script>

<template>
  <label><input type="checkbox" data-test="salaires" v-model="voirSalaires"> Afficher les salaires</label>
  <label><input type="checkbox" data-test="compact" v-model="compact"> Vue compacte</label>
  <Tableau :colonnes="colonnes" :lignes="salaries">
    <template #cell-salaire="{ row }">{{ formatEuros(row.salaire) }}</template>
  </Tableau>
</template>`,
        },
        tests: [
          { name: 'Colonnes par défaut', run: w => expect(w.findAll('[data-test=entete]').map(e => e.textContent?.trim()), 'En-têtes').toEqual(['Nom', 'Service', "Date d'entrée"]) },
          { name: 'Salaire ajouté et formaté', run: async w => { await w.check('[data-test=salaires]'); expect(w.findAll('[data-test=entete]').map(e => e.textContent?.trim())).toEqual(['Nom', 'Service', 'Salaire', "Date d'entrée"]); expect(w.findAll('[data-test=cell-salaire]').map(e => e.textContent?.trim()), 'Cellules salaire').toEqual(['2 450 €', '3 180 €']); } },
          { name: 'Vue compacte : pas de date d’entrée', run: async w => { await w.check('[data-test=compact]'); expect(w.findAll('[data-test=entete]').map(e => e.textContent?.trim())).toEqual(['Nom', 'Service']); } },
        ],
        hints: [
          'Commence par `const base = [ ...Nom, ...Service ]`.',
          "`if (voirSalaires.value) base.push({ field: 'salaire', header: 'Salaire' })` et `if (!compact.value) base.push({ field: 'entree', header: \"Date d'entrée\" })`, puis `return base`.",
          'Dans `<Tableau>` : `<template #cell-salaire="{ row }">{{ formatEuros(row.salaire) }}</template>`.',
        ],
      },
      cards: [
        { id: '5-2a', q: 'Où mettre la condition « colonne Salaire seulement si autorisé » ?', choices: ['Dans le composant Tableau', 'Dans le computed `colonnes` (base.push conditionnel)', 'Dans le CSS', 'Dans un watch'], answer: 1, explain: 'La config est calculée par la page ; le tableau générique ne connaît pas les règles métier.' },
        { id: '5-2b', q: 'Comment formater une seule colonne d’un tableau générique ?', choices: ['Modifier les données', 'Un slot de cellule `#cell-champ="{ row }"`', 'Un filtre global', 'Une nouvelle colonne'], answer: 1, explain: 'La donnée reste brute ; le slot de la cellule décide de l’affichage.' },
        { id: '5-2c', q: 'Dans un computed, `if (voirSalaires) base.push(...)` (sans .value) sur une ref…', choices: ['Fonctionne', 'Est toujours vrai (une ref est un objet) : il faut `.value`', 'Lève une erreur', 'Est toujours faux'], answer: 1, explain: 'Dans le script, une ref est un objet (toujours « vrai ») : la valeur est dans `.value`.' },
      ],
    },
  ],
};
