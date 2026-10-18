import { expect } from '@/lib/expect';
import type { Module } from './types';

const CSS_CARTE = `<style>
.carte { border: 1px solid #e3e3e3; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; font-family: system-ui; }
.carte h3 { margin: 0; font-size: 16px; }
.carte p { margin: 4px 0 0; color: #666; font-size: 14px; }
</style>`;

export const m2: Module = {
  id: 2,
  title: 'Composants',
  icon: 'pi pi-th-large',
  color: '#3b82f6',
  summary: 'Découper l’écran en briques réutilisables qui communiquent.',
  lessons: [
    {
      id: '2-1',
      title: 'Props : passer des données',
      minutes: 12,
      goal: 'Créer un composant réutilisable qui reçoit ses données par props.',
      blocks: [
        { t: 'p', text: 'Un composant reçoit des données de son parent via des **props**, déclarées avec `defineProps`. Les props sont en **lecture seule** pour l’enfant.' },
        { t: 'code', lang: 'vue', title: 'components/CarteSalarie.vue', code: `<script setup>
const props = defineProps({
  salarie: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <div class="carte">
    <h3>{{ salarie.prenom }} {{ salarie.nom }}</h3>
    <p v-if="!compact">{{ salarie.service }}</p>
  </div>
</template>` },
        { t: 'code', lang: 'vue', title: 'Parent', code: `<CarteSalarie v-for="s in salaries" :key="s.id" :salarie="s" compact />` },
        { t: 'list', items: [
          '`:salarie="s"` (avec `:`, raccourci de `v-bind`) passe une **expression** JavaScript ; `titre="Bonjour"` (sans `:`) passe un **texte**.',
          'Un booléen écrit seul (`compact`) vaut `true`.',
          'Dans le template, les props sont accessibles directement ; dans le script, via `props.salarie`.',
        ] },
        { t: 'sql', text: 'Les props sont les **paramètres IN** d’une procédure : l’appelant les fournit, la procédure les lit mais ne les modifie pas.', code: 'PROCEDURE afficher_carte(p_salarie IN t_salarie, p_compact IN BOOLEAN DEFAULT FALSE);' },
      ],
      exercise: {
        kind: 'build',
        task: '`CarteSalarie.vue` affiche toujours « Prénom Nom ». Déclare les props **`salarie`** (objet, requis) et **`compact`** (booléen, `false` par défaut), affiche le vrai salarié, et masque le service quand `compact` est vrai. Dans `App.vue`, passe chaque salarié à la carte.',
        open: 'components/CarteSalarie.vue',
        files: {
          'components/CarteSalarie.vue': `<script setup>
// à compléter : defineProps(...)
</script>

<template>
  <div class="carte" data-test="carte">
    <h3 data-test="nom">Prénom Nom</h3>
    <p data-test="service">Service</p>
  </div>
</template>

${CSS_CARTE}`,
          'App.vue': `<script setup>
import CarteSalarie from './components/CarteSalarie.vue'

const salaries = [
  { id: 1, prenom: 'Léa', nom: 'Martin', service: 'Comptabilité' },
  { id: 2, prenom: 'Hugo', nom: 'Bernard', service: 'Informatique' },
  { id: 3, prenom: 'Chloé', nom: 'Petit', service: 'RH' },
]
const compact = ref(false)
</script>

<template>
  <label><input type="checkbox" data-test="compact" v-model="compact"> Vue compacte</label>
  <CarteSalarie v-for="s in salaries" :key="s.id" />
</template>`,
        },
        solution: {
          'components/CarteSalarie.vue': `<script setup>
defineProps({
  salarie: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <div class="carte" data-test="carte">
    <h3 data-test="nom">{{ salarie.prenom }} {{ salarie.nom }}</h3>
    <p v-if="!compact" data-test="service">{{ salarie.service }}</p>
  </div>
</template>

${CSS_CARTE}`,
          'App.vue': `<script setup>
import CarteSalarie from './components/CarteSalarie.vue'

const salaries = [
  { id: 1, prenom: 'Léa', nom: 'Martin', service: 'Comptabilité' },
  { id: 2, prenom: 'Hugo', nom: 'Bernard', service: 'Informatique' },
  { id: 3, prenom: 'Chloé', nom: 'Petit', service: 'RH' },
]
const compact = ref(false)
</script>

<template>
  <label><input type="checkbox" data-test="compact" v-model="compact"> Vue compacte</label>
  <CarteSalarie v-for="s in salaries" :key="s.id" :salarie="s" :compact="compact" />
</template>`,
        },
        tests: [
          { name: 'Une carte par salarié, avec son nom', run: w => { const noms = w.findAll('[data-test=nom]').map(e => e.textContent?.trim()); expect(noms, 'Noms affichés').toEqual(['Léa Martin', 'Hugo Bernard', 'Chloé Petit']); } },
          { name: 'Le service est affiché par défaut', run: w => expect(w.findAll('[data-test=service]').map(e => e.textContent?.trim()), 'Services').toEqual(['Comptabilité', 'Informatique', 'RH']) },
          { name: 'Vue compacte : services masqués', run: async w => { await w.check('[data-test=compact]'); expect(w.findAll('[data-test=service]').length, 'Services visibles en vue compacte').toBe(0); } },
          { name: 'Pas d’avertissement de props manquantes', run: w => expect(w.warnings.filter(x => x.includes('Missing required prop')).length, 'Avertissements « prop requise manquante »').toBe(0) },
        ],
        hints: [
          "Dans l'enfant : `defineProps({ salarie: { type: Object, required: true }, compact: { type: Boolean, default: false } })`.",
          'Template de la carte : `{{ salarie.prenom }} {{ salarie.nom }}` et `v-if="!compact"` sur le service.',
          'Dans App.vue : `<CarteSalarie ... :salarie="s" :compact="compact" />`.',
        ],
      },
      cards: [
        { id: '2-1a', q: 'Différence entre `titre="total"` et `:titre="total"` ?', choices: ['Aucune', 'Le premier passe le texte « total », le second la valeur de la variable total', 'Le premier est réactif, pas le second', 'Le second est interdit'], answer: 1, explain: 'Le `:` (v-bind) évalue une expression JavaScript. Sans `:`, c’est une chaîne littérale.' },
        { id: '2-1b', q: 'Un enfant peut-il modifier une prop (`props.salarie = …`) ?', choices: ['Oui', 'Non : les props sont en lecture seule (il faut émettre un événement)', 'Seulement les objets', 'Seulement dans onMounted'], answer: 1, explain: 'Flux de données à sens unique : le parent possède la donnée. L’enfant demande un changement via `emit`.' },
        { id: '2-1c', q: '`<Carte compact />` passe quelle valeur à une prop Boolean ?', choices: ['`""`', '`true`', '`"compact"`', '`undefined`'], answer: 1, explain: 'Pour une prop de type Boolean, l’attribut présent sans valeur vaut `true`.' },
      ],
    },

    {
      id: '2-2',
      title: 'Emits et v-model sur un composant',
      minutes: 14,
      goal: 'Faire remonter une action au parent et créer un champ compatible v-model.',
      blocks: [
        { t: 'p', text: "L'enfant ne modifie pas les props : il **émet un événement**, le parent décide. Pour un champ réutilisable, la convention `v-model` = prop **`modelValue`** + événement **`update:modelValue`**." },
        { t: 'code', lang: 'vue', title: 'components/ChampJours.vue', code: `<script setup>
const props = defineProps({ modelValue: { type: Number, default: 0 } })
const emit = defineEmits(['update:modelValue', 'valider'])

function plus() { emit('update:modelValue', props.modelValue + 1) }
</script>

<template>
  <button @click="plus">+</button> {{ modelValue }}
  <button @click="emit('valider')">Valider</button>
</template>` },
        { t: 'code', lang: 'vue', title: 'Parent', code: `<ChampJours v-model="jours" @valider="enregistrer" />
<!-- équivaut à : :modelValue="jours" @update:modelValue="v => jours = v" -->` },
        { t: 'tip', text: "Depuis Vue 3.4, `const modele = defineModel()` fait les deux d'un coup : `modele.value++` émet automatiquement l'événement. Au travail tu verras surtout la forme `modelValue` + `emit`, mais les deux sont valables." },
        { t: 'sql', text: "C'est le principe d'un paramètre **IN OUT** : la valeur entre, l'enfant propose la nouvelle valeur, et c'est l'appelant qui la récupère." },
      ],
      exercise: {
        kind: 'build',
        task: "Termine `ChampJours.vue` pour qu'il marche avec `v-model` : les boutons **−** et **+** émettent `update:modelValue` (minimum 0, maximum `max`), et **Valider** émet `valider`. Le parent est déjà prêt.",
        open: 'components/ChampJours.vue',
        readonly: ['App.vue'],
        files: {
          'components/ChampJours.vue': `<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  max: { type: Number, default: 25 },
})
// à compléter : defineEmits + fonctions moins / plus
</script>

<template>
  <div class="champ">
    <button data-test="moins">−</button>
    <strong data-test="valeur">{{ modelValue }}</strong>
    <button data-test="plus">+</button>
    <button data-test="valider" class="ok">Valider</button>
  </div>
</template>

<style>
.champ { display: flex; gap: 10px; align-items: center; font-family: system-ui; }
.champ button { padding: 6px 12px; border-radius: 8px; border: 1px solid #ccc; background: #fff; }
.champ .ok { background: #42b883; color: #fff; border-color: transparent; }
</style>`,
          'App.vue': `<script setup>
import ChampJours from './components/ChampJours.vue'

const jours = ref(2)
const message = ref('')

function enregistrer() {
  message.value = 'Demande de ' + jours.value + ' jour(s) enregistrée'
}
</script>

<template>
  <p>Jours demandés : <span data-test="parent">{{ jours }}</span></p>
  <ChampJours v-model="jours" :max="5" @valider="enregistrer" />
  <p data-test="message">{{ message }}</p>
</template>`,
        },
        solution: {
          'components/ChampJours.vue': `<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  max: { type: Number, default: 25 },
})
const emit = defineEmits(['update:modelValue', 'valider'])

function moins() {
  if (props.modelValue > 0) emit('update:modelValue', props.modelValue - 1)
}
function plus() {
  if (props.modelValue < props.max) emit('update:modelValue', props.modelValue + 1)
}
</script>

<template>
  <div class="champ">
    <button data-test="moins" @click="moins">−</button>
    <strong data-test="valeur">{{ modelValue }}</strong>
    <button data-test="plus" @click="plus">+</button>
    <button data-test="valider" class="ok" @click="emit('valider')">Valider</button>
  </div>
</template>

<style>
.champ { display: flex; gap: 10px; align-items: center; font-family: system-ui; }
.champ button { padding: 6px 12px; border-radius: 8px; border: 1px solid #ccc; background: #fff; }
.champ .ok { background: #42b883; color: #fff; border-color: transparent; }
</style>`,
        },
        tests: [
          { name: '+ met à jour le parent (v-model)', run: async w => { await w.click('[data-test=plus]'); expect(w.text('[data-test=parent]'), 'Valeur dans le parent').toBe('3'); expect(w.text('[data-test=valeur]'), 'Valeur affichée par le champ').toBe('3'); } },
          { name: '− met à jour le parent, jamais sous 0', run: async w => { for (let i = 0; i < 4; i++) await w.click('[data-test=moins]'); expect(w.text('[data-test=parent]')).toBe('0'); } },
          { name: 'Respecte le maximum (5)', run: async w => { for (let i = 0; i < 6; i++) await w.click('[data-test=plus]'); expect(w.text('[data-test=parent]')).toBe('5'); } },
          { name: 'Valider prévient le parent', run: async w => { await w.click('[data-test=plus]'); await w.click('[data-test=valider]'); expect(w.text('[data-test=message]')).toBe('Demande de 3 jour(s) enregistrée'); } },
        ],
        hints: [
          "`const emit = defineEmits(['update:modelValue', 'valider'])`",
          "`function plus() { if (props.modelValue < props.max) emit('update:modelValue', props.modelValue + 1) }`",
          "Branche les boutons : `@click=\"plus\"`, `@click=\"moins\"`, `@click=\"emit('valider')\"`.",
        ],
      },
      cards: [
        { id: '2-2a', q: '`v-model="jours"` sur un composant correspond à…', choices: ['`:value` + `@input`', '`:modelValue` + `@update:modelValue`', '`:jours` + `@jours`', '`v-bind` seul'], answer: 1, explain: 'Sur un composant Vue 3, v-model = prop `modelValue` + événement `update:modelValue`.' },
        { id: '2-2b', q: 'Comment un enfant prévient-il son parent d’une action ?', choices: ['En modifiant une prop', '`emit("nom", données)`', 'Avec `window.parent`', 'Avec `return`'], answer: 1, explain: 'On déclare l’événement avec `defineEmits` et on l’émet ; le parent écoute avec `@nom`.' },
        { id: '2-2c', q: 'Que fait `defineModel()` (Vue 3.4+) ?', choices: ['Crée un store', 'Déclare la prop modelValue et émet update:modelValue automatiquement', 'Valide un formulaire', 'Remplace Pinia'], answer: 1, explain: 'Raccourci : `const m = defineModel()` puis `m.value = …` émet la mise à jour vers le v-model du parent.' },
      ],
    },

    {
      id: '2-3',
      title: 'Slots nommés et à portée',
      minutes: 15,
      goal: 'Personnaliser une cellule de tableau avec #cell-nom="{ row }".',
      blocks: [
        { t: 'p', text: "Un **slot** est un emplacement que le parent remplit. Un slot **nommé** a un nom (`<slot name=\"pied\">`). Un slot **à portée** renvoie des données au parent (`<slot :row=\"ligne\">`) : c'est ce qui permet `#cell-nom=\"{ row }\"`." },
        { t: 'code', lang: 'vue', title: 'Tableau.vue (enfant)', code: `<tr v-for="row in lignes" :key="row.id">
  <td v-for="col in colonnes" :key="col.field">
    <!-- slot dynamique « cell-<champ> », avec la ligne en paramètre -->
    <slot :name="'cell-' + col.field" :row="row">
      {{ row[col.field] }}   <!-- contenu par défaut -->
    </slot>
  </td>
</tr>` },
        { t: 'code', lang: 'vue', title: 'Parent', code: `<Tableau :colonnes="colonnes" :lignes="salaries">
  <template #cell-statut="{ row }">
    <span :class="row.actif ? 'ok' : 'off'">{{ row.actif ? 'Actif' : 'Sorti' }}</span>
  </template>
</Tableau>` },
        { t: 'list', items: [
          '`#nom` est le raccourci de `v-slot:nom`.',
          '`{ row }` déstructure les données envoyées par l’enfant (ici `:row="row"`).',
          'Sans template `#cell-x` fourni, c’est le contenu par défaut qui s’affiche.',
        ] },
        { t: 'sql', text: "C'est comme un **curseur** que l'enfant parcourt en te laissant décider du rendu de chaque colonne : l'enfant fait la boucle, toi tu fournis le « format » de la cellule." },
      ],
      exercise: {
        kind: 'build',
        task: "Dans `TableauSimple.vue`, chaque cellule doit proposer un **slot à portée** nommé `cell-<champ>` qui reçoit la ligne (`row`), avec la valeur brute par défaut. Puis dans `App.vue`, utilise `#cell-actif` pour afficher un badge **« Actif »** / **« Sorti »** au lieu de true/false.",
        open: 'components/TableauSimple.vue',
        files: {
          'components/TableauSimple.vue': `<script setup>
defineProps({
  colonnes: { type: Array, required: true }, // [{ field, label }]
  lignes: { type: Array, required: true },
})
</script>

<template>
  <table class="tableau">
    <thead>
      <tr><th v-for="col in colonnes" :key="col.field">{{ col.label }}</th></tr>
    </thead>
    <tbody>
      <tr v-for="row in lignes" :key="row.id" data-test="ligne">
        <td v-for="col in colonnes" :key="col.field" :data-test="'cell-' + col.field">
          {{ row[col.field] }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style>
.tableau { border-collapse: collapse; font-family: system-ui; width: 100%; }
.tableau th, .tableau td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
.badge { padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge.ok { background: #dcfce7; color: #166534; } .badge.off { background: #f3f4f6; color: #6b7280; }
</style>`,
          'App.vue': `<script setup>
import TableauSimple from './components/TableauSimple.vue'

const colonnes = [
  { field: 'nom', label: 'Nom' },
  { field: 'service', label: 'Service' },
  { field: 'actif', label: 'Statut' },
]
const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité', actif: true },
  { id: 2, nom: 'Durand', service: 'Informatique', actif: false },
  { id: 3, nom: 'Petit', service: 'RH', actif: true },
]
</script>

<template>
  <TableauSimple :colonnes="colonnes" :lignes="salaries">
    <!-- à compléter : #cell-actif="{ row }" -->
  </TableauSimple>
</template>`,
        },
        solution: {
          'components/TableauSimple.vue': `<script setup>
defineProps({
  colonnes: { type: Array, required: true }, // [{ field, label }]
  lignes: { type: Array, required: true },
})
</script>

<template>
  <table class="tableau">
    <thead>
      <tr><th v-for="col in colonnes" :key="col.field">{{ col.label }}</th></tr>
    </thead>
    <tbody>
      <tr v-for="row in lignes" :key="row.id" data-test="ligne">
        <td v-for="col in colonnes" :key="col.field" :data-test="'cell-' + col.field">
          <slot :name="'cell-' + col.field" :row="row">{{ row[col.field] }}</slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style>
.tableau { border-collapse: collapse; font-family: system-ui; width: 100%; }
.tableau th, .tableau td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
.badge { padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge.ok { background: #dcfce7; color: #166534; } .badge.off { background: #f3f4f6; color: #6b7280; }
</style>`,
          'App.vue': `<script setup>
import TableauSimple from './components/TableauSimple.vue'

const colonnes = [
  { field: 'nom', label: 'Nom' },
  { field: 'service', label: 'Service' },
  { field: 'actif', label: 'Statut' },
]
const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité', actif: true },
  { id: 2, nom: 'Durand', service: 'Informatique', actif: false },
  { id: 3, nom: 'Petit', service: 'RH', actif: true },
]
</script>

<template>
  <TableauSimple :colonnes="colonnes" :lignes="salaries">
    <template #cell-actif="{ row }">
      <span class="badge" :class="row.actif ? 'ok' : 'off'">{{ row.actif ? 'Actif' : 'Sorti' }}</span>
    </template>
  </TableauSimple>
</template>`,
        },
        tests: [
          { name: 'Les autres colonnes gardent la valeur par défaut', run: w => { expect(w.findAll('[data-test=cell-nom]').map(e => e.textContent?.trim()), 'Colonne Nom').toEqual(['Martin', 'Durand', 'Petit']); } },
          { name: 'La colonne Statut affiche Actif / Sorti', run: w => expect(w.findAll('[data-test=cell-actif]').map(e => e.textContent?.trim()), 'Colonne Statut').toEqual(['Actif', 'Sorti', 'Actif']) },
          { name: 'Le badge est un élément .badge fourni par le parent', run: w => expect(w.findAll('[data-test=cell-actif] .badge').length, 'Badges').toBe(3) },
        ],
        hints: [
          "Dans la cellule de l'enfant : `<slot :name=\"'cell-' + col.field\" :row=\"row\">{{ row[col.field] }}</slot>`.",
          'Dans App.vue : `<template #cell-actif="{ row }"> ... </template>` à l’intérieur de `<TableauSimple>`.',
          "Le badge : `<span class=\"badge\" :class=\"row.actif ? 'ok' : 'off'\">{{ row.actif ? 'Actif' : 'Sorti' }}</span>`.",
        ],
      },
      cards: [
        { id: '2-3a', q: 'Dans `<template #cell-nom="{ row }">`, d’où vient `row` ?', choices: ['Du parent', "De l'enfant, via `<slot :row=\"...\">`", 'De Pinia', 'Du routeur'], answer: 1, explain: "C'est un slot à portée : l’enfant passe des données au contenu fourni par le parent." },
        { id: '2-3b', q: 'Que s’affiche-t-il si le parent ne fournit pas `#cell-service` ?', choices: ['Rien', 'Une erreur', 'Le contenu par défaut placé entre `<slot>` et `</slot>`', '`undefined`'], answer: 2, explain: 'Le contenu à l’intérieur de la balise `<slot>` est le rendu par défaut.' },
        { id: '2-3c', q: 'Que signifie `#pied` ?', choices: ['Un id CSS', 'Le raccourci de `v-slot:pied`', 'Une ancre de lien', 'Un commentaire'], answer: 1, explain: '`#` est le raccourci de `v-slot:`.' },
      ],
    },

    {
      id: '2-4',
      title: 'Refs de template et defineExpose',
      minutes: 12,
      goal: 'Accéder à un élément du DOM et appeler une méthode d’un composant enfant.',
      blocks: [
        { t: 'p', text: "Une **ref de template** donne accès à un élément HTML ou à un composant : on déclare `const champ = ref(null)` et on met `ref=\"champ\"` sur la balise. Elle est remplie **après le montage**." },
        { t: 'code', lang: 'vue', code: `<script setup>
const champ = ref(null)
onMounted(() => champ.value.focus())   // élément HTML
</script>
<template><input ref="champ"></template>` },
        { t: 'p', text: "Par défaut, un composant `<script setup>` est **fermé** : le parent ne voit rien de l'intérieur. Pour lui ouvrir des méthodes, on utilise **`defineExpose`**." },
        { t: 'code', lang: 'vue', code: `<!-- Formulaire.vue -->
<script setup>
const nom = ref('')
function reinitialiser() { nom.value = '' }
defineExpose({ reinitialiser })
</script>

<!-- Parent -->
<script setup>
const formulaire = ref(null)
</script>
<template>
  <Formulaire ref="formulaire" />
  <button @click="formulaire.reinitialiser()">Effacer</button>
</template>` },
        { t: 'tip', text: "À utiliser avec modération : la plupart du temps, props + emits suffisent. `defineExpose` sert pour des actions impératives (réinitialiser, valider, donner le focus)." },
      ],
      exercise: {
        kind: 'build',
        task: "1) `FormulaireConge.vue` doit **exposer** `reinitialiser()` et `focus()`. 2) Dans `App.vue`, crée la ref de template et branche les boutons **Effacer** (réinitialise le formulaire) et **Saisir** (donne le focus au champ motif).",
        open: 'components/FormulaireConge.vue',
        files: {
          'components/FormulaireConge.vue': `<script setup>
const motif = ref('')
const jours = ref(1)
const champMotif = ref(null)

function reinitialiser() {
  motif.value = ''
  jours.value = 1
}

function focus() {
  champMotif.value.focus()
}
// à compléter : exposer reinitialiser et focus
</script>

<template>
  <div class="form">
    <input ref="champMotif" data-test="motif" v-model="motif" placeholder="Motif">
    <input data-test="jours" type="number" v-model.number="jours">
    <p data-test="apercu">{{ motif || '—' }} · {{ jours }} j</p>
  </div>
</template>

<style>
.form { display: grid; gap: 8px; max-width: 320px; font-family: system-ui; }
</style>`,
          'App.vue': `<script setup>
import FormulaireConge from './components/FormulaireConge.vue'
// à compléter : ref de template
</script>

<template>
  <FormulaireConge />
  <div style="display:flex; gap:8px; margin-top:8px">
    <button data-test="effacer">Effacer</button>
    <button data-test="saisir">Saisir</button>
  </div>
</template>`,
        },
        solution: {
          'components/FormulaireConge.vue': `<script setup>
const motif = ref('')
const jours = ref(1)
const champMotif = ref(null)

function reinitialiser() {
  motif.value = ''
  jours.value = 1
}

function focus() {
  champMotif.value.focus()
}
defineExpose({ reinitialiser, focus })
</script>

<template>
  <div class="form">
    <input ref="champMotif" data-test="motif" v-model="motif" placeholder="Motif">
    <input data-test="jours" type="number" v-model.number="jours">
    <p data-test="apercu">{{ motif || '—' }} · {{ jours }} j</p>
  </div>
</template>

<style>
.form { display: grid; gap: 8px; max-width: 320px; font-family: system-ui; }
</style>`,
          'App.vue': `<script setup>
import FormulaireConge from './components/FormulaireConge.vue'
const formulaire = ref(null)
</script>

<template>
  <FormulaireConge ref="formulaire" />
  <div style="display:flex; gap:8px; margin-top:8px">
    <button data-test="effacer" @click="formulaire.reinitialiser()">Effacer</button>
    <button data-test="saisir" @click="formulaire.focus()">Saisir</button>
  </div>
</template>`,
        },
        tests: [
          { name: 'Effacer réinitialise le formulaire de l’enfant', run: async w => { await w.input('[data-test=motif]', 'Déménagement'); await w.input('[data-test=jours]', '3'); expect(w.text('[data-test=apercu]')).toBe('Déménagement · 3 j'); await w.click('[data-test=effacer]'); expect(w.text('[data-test=apercu]'), 'Aperçu après Effacer').toBe('— · 1 j'); } },
          { name: 'Saisir donne le focus au champ motif', run: async w => { (document.activeElement as HTMLElement | null)?.blur?.(); await w.click('[data-test=saisir]'); expect(document.activeElement === w.find('[data-test=motif]'), 'Le champ motif a le focus').toBeTruthy(); } },
        ],
        hints: [
          "Dans l'enfant : `defineExpose({ reinitialiser, focus })`.",
          'Dans App.vue : `const formulaire = ref(null)` et `<FormulaireConge ref="formulaire" />`.',
          'Boutons : `@click="formulaire.reinitialiser()"` et `@click="formulaire.focus()"`.',
        ],
      },
      cards: [
        { id: '2-4a', q: 'Quand une ref de template est-elle remplie ?', choices: ['Dès la déclaration', 'Après le montage (onMounted)', 'Avant le setup', 'Jamais automatiquement'], answer: 1, explain: "L'élément n'existe qu'une fois rendu : avant `onMounted`, la ref vaut `null`." },
        { id: '2-4b', q: 'Sans `defineExpose`, que voit le parent d’un composant `<script setup>` ?', choices: ['Toutes ses variables', 'Rien de son état interne', 'Seulement ses props', 'Seulement ses refs'], answer: 1, explain: 'Les composants `<script setup>` sont fermés par défaut : on choisit explicitement ce qu’on expose.' },
        { id: '2-4c', q: 'Quand préférer props/emits à defineExpose ?', choices: ['Jamais', 'Presque toujours : defineExpose sert aux actions impératives (focus, reset)', 'Seulement avec Pinia', 'Pour les listes'], answer: 1, explain: 'Les données circulent normalement par props/emits ; `defineExpose` est une porte de service.' },
      ],
    },
  ],
};
