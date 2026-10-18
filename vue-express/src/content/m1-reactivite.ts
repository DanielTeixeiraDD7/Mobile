import { expect } from '@/lib/expect';
import type { Module } from './types';

const SALARIES_LOCAUX = `const salaries = [
  { id: 1, prenom: 'Léa', nom: 'Martin', service: 'Comptabilité' },
  { id: 2, prenom: 'Hugo', nom: 'Bernard', service: 'Informatique' },
  { id: 3, prenom: 'Chloé', nom: 'Petit', service: 'RH' },
  { id: 4, prenom: 'Nathan', nom: 'Durand', service: 'Informatique' },
  { id: 5, prenom: 'Inès', nom: 'Leroy', service: 'Comptabilité' },
]`;

export const m1: Module = {
  id: 1,
  title: 'Réactivité',
  icon: 'pi pi-bolt',
  color: '#42b883',
  summary: "Le cœur de Vue : des variables qui mettent l'écran à jour toutes seules.",
  lessons: [
    {
      id: '1-1',
      title: 'ref et le template',
      minutes: 10,
      goal: 'Créer une valeur réactive et l’afficher, la modifier au clic.',
      blocks: [
        { t: 'p', text: "Dans un composant, tout se passe dans `<script setup>`. On y déclare l'état avec **`ref()`** : une petite boîte qui contient une valeur. Quand la valeur change, Vue met à jour l'affichage tout seul." },
        { t: 'code', lang: 'vue', title: 'Compteur.vue', code: `<script setup>
const total = ref(0)          // pas d'import : auto-importé, comme au travail

function ajouter() {
  total.value++               // dans le script : .value
}
</script>

<template>
  <p>Total : {{ total }}</p>   <!-- dans le template : pas de .value -->
  <button @click="ajouter">+1</button>
  <button @click="total = 0">Remettre à zéro</button>
</template>` },
        { t: 'list', items: [
          "`{{ total }}` affiche une valeur (interpolation).",
          "`@click=\"ajouter\"` appelle une fonction ; on peut aussi écrire une petite instruction : `@click=\"total = 0\"`.",
          "Dans le **script** on écrit `total.value`, dans le **template** juste `total` (Vue « déballe » la boîte).",
        ] },
        { t: 'sql', text: "Une `ref` ressemble à une variable déclarée dans un bloc PL/SQL. La différence : chaque endroit de l'écran qui l'utilise est recalculé automatiquement quand elle change, comme si les `SELECT` affichés se relançaient seuls.", code: `DECLARE
  v_total NUMBER := 0;   -- const total = ref(0)
BEGIN
  v_total := v_total + 1; -- total.value++
END;` },
        { t: 'warn', text: "Une variable normale (`let total = 0`) change bien en mémoire, mais **l'écran ne bouge pas** : Vue ne la surveille pas. C'est l'erreur n°1 des débutants." },
      ],
      exercise: {
        kind: 'build',
        task: "Le compteur d'heures supplémentaires ne réagit pas aux clics. Rends `heures` réactif, puis fais marcher les trois boutons : **+1**, **−1** (sans jamais descendre sous 0) et **Réinitialiser**.",
        open: 'App.vue',
        files: {
          'App.vue': `<script setup>
let heures = 0

function ajouter() {
  heures++
}

function retirer() {
  // à compléter : -1, mais jamais en dessous de 0
}

function reinitialiser() {
  // à compléter
}
</script>

<template>
  <div class="carte">
    <h2>Heures supplémentaires</h2>
    <p class="valeur"><span data-test="valeur">{{ heures }}</span> h</p>
    <div class="actions">
      <button data-test="moins" @click="retirer">−1</button>
      <button data-test="plus" @click="ajouter">+1</button>
      <button data-test="reset" @click="reinitialiser">Réinitialiser</button>
    </div>
  </div>
</template>

<style>
.carte { font-family: system-ui; padding: 16px; }
.valeur { font-size: 32px; font-weight: 800; margin: 8px 0 16px; }
.actions { display: flex; gap: 8px; }
.actions button { padding: 8px 14px; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; }
</style>`,
        },
        solution: {
          'App.vue': `<script setup>
const heures = ref(0)

function ajouter() {
  heures.value++
}

function retirer() {
  if (heures.value > 0) heures.value--
}

function reinitialiser() {
  heures.value = 0
}
</script>

<template>
  <div class="carte">
    <h2>Heures supplémentaires</h2>
    <p class="valeur"><span data-test="valeur">{{ heures }}</span> h</p>
    <div class="actions">
      <button data-test="moins" @click="retirer">−1</button>
      <button data-test="plus" @click="ajouter">+1</button>
      <button data-test="reset" @click="reinitialiser">Réinitialiser</button>
    </div>
  </div>
</template>

<style>
.carte { font-family: system-ui; padding: 16px; }
.valeur { font-size: 32px; font-weight: 800; margin: 8px 0 16px; }
.actions { display: flex; gap: 8px; }
.actions button { padding: 8px 14px; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; }
</style>`,
        },
        tests: [
          { name: 'Affiche 0 au départ', run: w => expect(w.text('[data-test=valeur]'), 'Le compteur').toBe('0') },
          { name: '+1 deux fois affiche 2', run: async w => { await w.click('[data-test=plus]'); await w.click('[data-test=plus]'); expect(w.text('[data-test=valeur]'), 'Après deux clics sur +1, le compteur').toBe('2'); } },
          { name: '−1 ne descend jamais sous 0', run: async w => { await w.click('[data-test=plus]'); await w.click('[data-test=moins]'); await w.click('[data-test=moins]'); expect(w.text('[data-test=valeur]'), 'Après +1, −1, −1, le compteur').toBe('0'); } },
          { name: 'Réinitialiser remet à 0', run: async w => { for (let i = 0; i < 3; i++) await w.click('[data-test=plus]'); await w.click('[data-test=reset]'); expect(w.text('[data-test=valeur]'), 'Après réinitialisation, le compteur').toBe('0'); } },
        ],
        hints: [
          'Remplace `let heures = 0` par `const heures = ref(0)`.',
          'Dans les fonctions, il faut maintenant écrire `heures.value` (et pas `heures`).',
          '`retirer` : `if (heures.value > 0) heures.value--`.',
        ],
      },
      cards: [
        { id: '1-1a', q: 'Comment lire la valeur d’une ref dans le `<script setup>` ?', choices: ['`total`', '`total.value`', '`total()`', '`$total`'], answer: 1, explain: 'Dans le script, une ref est un objet : la valeur est dans `.value`. Le template, lui, la déballe automatiquement.' },
        { id: '1-1b', q: 'Que se passe-t-il à l’écran si on fait `compteur++` sur `let compteur = 0` ?', choices: ["L'écran se met à jour", "Rien ne change à l'écran", 'Une erreur est levée', 'Vue recharge la page'], answer: 1, explain: "La variable change en mémoire, mais Vue ne la surveille pas : il faut `ref()` pour qu'il réagisse." },
        { id: '1-1c', q: 'Dans le template, comment afficher la ref `total` ?', choices: ['`{{ total.value }}`', '`{{ total }}`', '`{ total }`', '`v-text="total.value"`'], answer: 1, explain: 'Le template déballe les refs : `{{ total }}` suffit. `total.value` marcherait aussi mais n’est pas l’usage.' },
      ],
    },

    {
      id: '1-2',
      title: 'computed : les valeurs calculées',
      minutes: 12,
      goal: 'Dériver une liste filtrée et un total d’un état, sans les stocker.',
      blocks: [
        { t: 'p', text: "Un **`computed`** est une valeur calculée à partir d'autres valeurs réactives. Vue la met en **cache** et ne la recalcule que si ses sources changent." },
        { t: 'code', lang: 'vue', code: `<script setup>
const recherche = ref('')
const salaries = ref([...])

const resultats = computed(() =>
  salaries.value.filter(s => s.nom.toLowerCase().includes(recherche.value.toLowerCase()))
)
</script>

<template>
  <input v-model="recherche" placeholder="Rechercher">
  <p>{{ resultats.length }} résultat(s)</p>
  <ul>
    <li v-for="s in resultats" :key="s.id">{{ s.prenom }} {{ s.nom }}</li>
  </ul>
</template>` },
        { t: 'list', items: [
          "`v-model` relie un champ à une ref dans les deux sens.",
          "`v-for` répète un élément ; **`:key`** doit être un identifiant unique et stable (l'`id`, jamais l'index si la liste bouge).",
          "On ne modifie jamais un computed : on modifie ses sources.",
        ] },
        { t: 'sql', text: "Un computed, c'est une **vue SQL** ou une colonne calculée : on décrit le calcul une fois, le résultat suit toujours les données.", code: `CREATE VIEW resultats AS
  SELECT * FROM salaries
  WHERE LOWER(nom) LIKE '%' || LOWER(:recherche) || '%';` },
        { t: 'tip', text: "Au travail, les tableaux de colonnes et les champs de formulaire sont souvent dans un `computed` : ils se recalculent dès que les données changent." },
      ],
      exercise: {
        kind: 'build',
        task: "La recherche ne filtre rien. Crée un `computed` **`resultats`** qui garde les salariés dont le **nom ou le prénom** contient la recherche (sans tenir compte des majuscules), affiche-les, et mets à jour le compteur « N résultat(s) ».",
        open: 'App.vue',
        files: {
          'App.vue': `<script setup>
${SALARIES_LOCAUX}

const recherche = ref('')

// à compléter : const resultats = computed(...)
</script>

<template>
  <div class="page">
    <input data-test="recherche" v-model="recherche" placeholder="Nom ou prénom">
    <p data-test="compte">{{ salaries.length }} résultat(s)</p>
    <ul>
      <li v-for="s in salaries" :key="s.id" data-test="ligne">{{ s.prenom }} {{ s.nom }} · {{ s.service }}</li>
    </ul>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; }
input { padding: 8px 12px; border: 1px solid #ccc; border-radius: 8px; width: 100%; max-width: 320px; }
li { padding: 6px 0; border-bottom: 1px solid #eee; list-style: none; }
ul { padding: 0; }
</style>`,
        },
        solution: {
          'App.vue': `<script setup>
${SALARIES_LOCAUX}

const recherche = ref('')

const resultats = computed(() => {
  const q = recherche.value.trim().toLowerCase()
  return salaries.filter(s => (s.nom + ' ' + s.prenom).toLowerCase().includes(q))
})
</script>

<template>
  <div class="page">
    <input data-test="recherche" v-model="recherche" placeholder="Nom ou prénom">
    <p data-test="compte">{{ resultats.length }} résultat(s)</p>
    <ul>
      <li v-for="s in resultats" :key="s.id" data-test="ligne">{{ s.prenom }} {{ s.nom }} · {{ s.service }}</li>
    </ul>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; }
input { padding: 8px 12px; border: 1px solid #ccc; border-radius: 8px; width: 100%; max-width: 320px; }
li { padding: 6px 0; border-bottom: 1px solid #eee; list-style: none; }
ul { padding: 0; }
</style>`,
        },
        tests: [
          { name: 'Sans recherche : 5 salariés', run: w => { expect(w.findAll('[data-test=ligne]').length, 'Nombre de lignes').toBe(5); expect(w.text('[data-test=compte]')).toBe('5 résultat(s)'); } },
          { name: 'Filtre sur le nom', run: async w => { await w.input('[data-test=recherche]', 'mar'); expect(w.findAll('[data-test=ligne]').length, 'Lignes pour « mar »').toBe(1); expect(w.text('[data-test=ligne]')).toContain('Martin'); } },
          { name: 'Filtre sur le prénom, sans tenir compte des majuscules', run: async w => { await w.input('[data-test=recherche]', 'HUGO'); expect(w.findAll('[data-test=ligne]').length, 'Lignes pour « HUGO »').toBe(1); } },
          { name: 'Le compteur suit le filtre', run: async w => { await w.input('[data-test=recherche]', 'e'); const n = w.findAll('[data-test=ligne]').length; expect(w.text('[data-test=compte]')).toBe(n + ' résultat(s)'); expect(n, 'Lignes pour « e »').toBe(3); await w.input('[data-test=recherche]', 'zz'); expect(w.text('[data-test=compte]')).toBe('0 résultat(s)'); } },
        ],
        hints: [
          '`const resultats = computed(() => salaries.filter(...))`',
          "Compare en minuscules : `(s.nom + ' ' + s.prenom).toLowerCase().includes(recherche.value.toLowerCase())`.",
          'Dans le template, remplace `salaries` par `resultats` (dans le `v-for` et dans le compteur).',
        ],
      },
      cards: [
        { id: '1-2a', q: 'Quand un `computed` est-il recalculé ?', choices: ['À chaque affichage', 'Toutes les secondes', 'Quand une de ses sources réactives change', 'Jamais'], answer: 2, explain: 'Il est mis en cache et recalculé seulement quand une valeur réactive qu’il lit change.' },
        { id: '1-2b', q: 'Quelle `:key` choisir dans un `v-for` sur des salariés ?', choices: ["L'index de la boucle", '`s.id`', '`Math.random()`', 'Aucune'], answer: 1, explain: 'Un identifiant unique et stable. L’index pose problème quand la liste est triée/filtrée ; `Math.random()` recrée tout à chaque rendu.' },
        { id: '1-2c', q: 'Peut-on écrire `resultats.value = []` sur un computed ?', choices: ['Oui, toujours', 'Non : on modifie ses sources', 'Oui si on l’a déclaré avec ref', 'Seulement dans onMounted'], answer: 1, explain: 'Un computed est en lecture seule (sauf getter/setter explicite) : on change les données dont il dépend.' },
      ],
    },

    {
      id: '1-3',
      title: 'watch : réagir à un changement',
      minutes: 12,
      goal: 'Déclencher une action quand une valeur change (remettre la pagination à 1).',
      blocks: [
        { t: 'p', text: "`computed` **calcule** une valeur ; **`watch`** **exécute une action** quand une valeur change : recharger des données, réinitialiser un champ, sauvegarder…" },
        { t: 'code', lang: 'js', code: `const service = ref('Tous')
const page = ref(1)

watch(service, (nouveau, ancien) => {
  page.value = 1                      // nouveau filtre → on revient page 1
})

// Plusieurs sources, ou une propriété d'objet :
watch([service, () => filtres.actif], () => recharger())

// Exécuter aussi tout de suite au montage :
watch(() => route.params.ID, charger, { immediate: true })` },
        { t: 'list', items: [
          'Source = une ref, un tableau de sources, ou une fonction `() => objet.propriete`.',
          "Le callback reçoit `(nouvelle, ancienne)` valeur.",
          "`{ immediate: true }` lance le callback dès le départ ; `{ deep: true }` surveille l'intérieur d'un objet.",
        ] },
        { t: 'sql', text: "`watch` ressemble à un **trigger** : « APRÈS mise à jour de service, remettre page à 1 ». On ne s'en sert pas pour calculer une valeur (ça, c'est `computed`, comme une vue)." },
        { t: 'warn', text: "Ne surveille pas une propriété en écrivant `watch(filtres.actif, …)` : tu passes la *valeur* (true/false), pas la source. Écris `watch(() => filtres.actif, …)`." },
      ],
      exercise: {
        kind: 'build',
        task: "Quand on change de **service**, la liste repart page 1… sauf qu'ici elle reste sur la page en cours (et peut afficher une page vide). Ajoute un `watch` sur `service` qui remet `page` à **1**.",
        open: 'App.vue',
        files: {
          'App.vue': `<script setup>
const TOUS = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  nom: 'Salarié ' + (i + 1),
  service: ['RH', 'Informatique', 'Comptabilité'][i % 3],
}))
const PAR_PAGE = 5

const service = ref('Tous')
const page = ref(1)

const filtres = computed(() => service.value === 'Tous' ? TOUS : TOUS.filter(s => s.service === service.value))
const nbPages = computed(() => Math.max(1, Math.ceil(filtres.value.length / PAR_PAGE)))
const visibles = computed(() => filtres.value.slice((page.value - 1) * PAR_PAGE, page.value * PAR_PAGE))

// à compléter : quand service change, revenir à la page 1
</script>

<template>
  <div class="page">
    <select data-test="service" v-model="service">
      <option>Tous</option><option>RH</option><option>Informatique</option><option>Comptabilité</option>
    </select>
    <ul><li v-for="s in visibles" :key="s.id" data-test="ligne">{{ s.nom }} · {{ s.service }}</li></ul>
    <div class="pager">
      <button data-test="prec" :disabled="page === 1" @click="page--">‹</button>
      <span data-test="page">{{ page }} / {{ nbPages }}</span>
      <button data-test="suiv" :disabled="page === nbPages" @click="page++">›</button>
    </div>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; }
ul { padding: 0; } li { list-style: none; padding: 6px 0; border-bottom: 1px solid #eee; }
.pager { display: flex; gap: 12px; align-items: center; }
</style>`,
        },
        solution: {
          'App.vue': `<script setup>
const TOUS = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  nom: 'Salarié ' + (i + 1),
  service: ['RH', 'Informatique', 'Comptabilité'][i % 3],
}))
const PAR_PAGE = 5

const service = ref('Tous')
const page = ref(1)

const filtres = computed(() => service.value === 'Tous' ? TOUS : TOUS.filter(s => s.service === service.value))
const nbPages = computed(() => Math.max(1, Math.ceil(filtres.value.length / PAR_PAGE)))
const visibles = computed(() => filtres.value.slice((page.value - 1) * PAR_PAGE, page.value * PAR_PAGE))

watch(service, () => {
  page.value = 1
})
</script>

<template>
  <div class="page">
    <select data-test="service" v-model="service">
      <option>Tous</option><option>RH</option><option>Informatique</option><option>Comptabilité</option>
    </select>
    <ul><li v-for="s in visibles" :key="s.id" data-test="ligne">{{ s.nom }} · {{ s.service }}</li></ul>
    <div class="pager">
      <button data-test="prec" :disabled="page === 1" @click="page--">‹</button>
      <span data-test="page">{{ page }} / {{ nbPages }}</span>
      <button data-test="suiv" :disabled="page === nbPages" @click="page++">›</button>
    </div>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; }
ul { padding: 0; } li { list-style: none; padding: 6px 0; border-bottom: 1px solid #eee; }
.pager { display: flex; gap: 12px; align-items: center; }
</style>`,
        },
        tests: [
          { name: 'La pagination fonctionne (5 par page, 5 pages)', run: async w => { expect(w.text('[data-test=page]')).toBe('1 / 5'); await w.click('[data-test=suiv]'); expect(w.text('[data-test=page]')).toBe('2 / 5'); } },
          { name: 'Changer de service revient à la page 1', run: async w => { for (let i = 0; i < 4; i++) await w.click('[data-test=suiv]'); expect(w.text('[data-test=page]')).toBe('5 / 5'); await w.select('[data-test=service]', 'RH'); expect(w.text('[data-test=page]'), 'Page affichée après changement de service').toBe('1 / 2'); expect(w.findAll('[data-test=ligne]').length, 'Lignes visibles').toBe(5); } },
          { name: 'Plusieurs changements de suite', run: async w => { await w.click('[data-test=suiv]'); await w.select('[data-test=service]', 'Informatique'); await w.click('[data-test=suiv]'); await w.select('[data-test=service]', 'Tous'); expect(w.text('[data-test=page]')).toBe('1 / 5'); } },
        ],
        hints: [
          'La forme : `watch(source, () => { ... })`.',
          '`watch(service, () => { page.value = 1 })`',
        ],
      },
      cards: [
        { id: '1-3a', q: 'Pour « remettre la page à 1 quand le filtre change », on utilise…', choices: ['un computed', 'un watch', 'un v-if', 'onMounted'], answer: 1, explain: "C'est une action déclenchée par un changement → `watch`. `computed` sert à calculer une valeur." },
        { id: '1-3b', q: 'Comment surveiller la propriété `actif` de l’objet réactif `filtres` ?', choices: ['`watch(filtres.actif, cb)`', '`watch(() => filtres.actif, cb)`', '`watch("filtres.actif", cb)`', '`watch(actif, cb)`'], answer: 1, explain: "Il faut une source réactive : une fonction qui lit la propriété. `filtres.actif` seul passe juste la valeur du moment." },
        { id: '1-3c', q: 'À quoi sert `{ immediate: true }` ?', choices: ['À exécuter le callback tout de suite, puis à chaque changement', 'À surveiller en profondeur', 'À exécuter une seule fois', 'À accélérer le rendu'], answer: 0, explain: 'Sans `immediate`, le callback attend le premier changement. Pratique pour charger des données au montage ET quand un paramètre change.' },
      ],
    },

    {
      id: '1-4',
      title: 'Piège : la réactivité perdue',
      minutes: 10,
      goal: 'Reconnaître et corriger une déstructuration qui casse la réactivité.',
      blocks: [
        { t: 'p', text: "**`reactive()`** rend tout un objet réactif (pratique pour un formulaire). Mais si tu **déstructures** cet objet, tu récupères de simples copies des valeurs : elles ne suivent plus." },
        { t: 'code', lang: 'js', code: `const form = reactive({ nom: '', jours: 1 })

const { nom } = form          // ❌ nom = '' pour toujours
const { jours } = toRefs(form) // ✅ jours est une ref liée à form.jours

// Le plus simple : utiliser form.nom directement dans le template.` },
        { t: 'list', items: [
          '`ref` : pour une valeur seule (nombre, texte, tableau) → `.value` dans le script.',
          "`reactive` : pour un objet → pas de `.value`, mais ne jamais le déstructurer ni le remplacer entièrement (`form = {...}` casse le lien).",
          'En cas de doute, `ref` partout fonctionne toujours.',
        ] },
        { t: 'sql', text: "Déstructurer, c'est comme faire `SELECT nom INTO v_nom FROM form` : tu obtiens la valeur **à cet instant**, pas un lien vers la ligne." },
      ],
      exercise: {
        kind: 'bug',
        task: "**Trouve le bug.** Dans ce formulaire d'absence, le récapitulatif ne se met jamais à jour quand on tape. Corrige-le sans changer le template du formulaire.",
        open: 'App.vue',
        files: {
          'App.vue': `<script setup>
const form = reactive({
  type: 'Congés payés',
  jours: 1,
  commentaire: '',
})

const { type, jours, commentaire } = form

const resume = computed(() => type + ' · ' + jours + ' jour(s)' + (commentaire ? ' · ' + commentaire : ''))
</script>

<template>
  <div class="page">
    <select data-test="type" v-model="form.type">
      <option>Congés payés</option><option>RTT</option><option>Maladie</option>
    </select>
    <input data-test="jours" type="number" min="1" v-model.number="form.jours">
    <input data-test="commentaire" v-model="form.commentaire" placeholder="Commentaire">
    <p class="resume" data-test="resume">{{ resume }}</p>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; display: grid; gap: 8px; max-width: 360px; }
.resume { font-weight: 700; }
</style>`,
        },
        solution: {
          'App.vue': `<script setup>
const form = reactive({
  type: 'Congés payés',
  jours: 1,
  commentaire: '',
})

const resume = computed(() => form.type + ' · ' + form.jours + ' jour(s)' + (form.commentaire ? ' · ' + form.commentaire : ''))
</script>

<template>
  <div class="page">
    <select data-test="type" v-model="form.type">
      <option>Congés payés</option><option>RTT</option><option>Maladie</option>
    </select>
    <input data-test="jours" type="number" min="1" v-model.number="form.jours">
    <input data-test="commentaire" v-model="form.commentaire" placeholder="Commentaire">
    <p class="resume" data-test="resume">{{ resume }}</p>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; display: grid; gap: 8px; max-width: 360px; }
.resume { font-weight: 700; }
</style>`,
        },
        tests: [
          { name: 'Récapitulatif initial', run: w => expect(w.text('[data-test=resume]')).toBe('Congés payés · 1 jour(s)') },
          { name: 'Suit le type et le nombre de jours', run: async w => { await w.select('[data-test=type]', 'RTT'); await w.input('[data-test=jours]', '3'); expect(w.text('[data-test=resume]'), 'Récapitulatif').toBe('RTT · 3 jour(s)'); } },
          { name: 'Ajoute le commentaire quand il existe', run: async w => { await w.input('[data-test=commentaire]', 'Mariage'); expect(w.text('[data-test=resume]')).toBe('Congés payés · 1 jour(s) · Mariage'); } },
        ],
        hints: [
          'La ligne `const { type, jours, commentaire } = form` copie les valeurs une fois pour toutes.',
          'Supprime cette ligne et utilise `form.type`, `form.jours`, `form.commentaire` dans le computed (ou `toRefs(form)` + `.value`).',
        ],
      },
      cards: [
        { id: '1-4a', q: 'Que donne `const { nom } = reactive({ nom: "" })` ?', choices: ['Une ref liée', 'Une copie figée de la valeur', 'Une erreur', 'Un computed'], answer: 1, explain: 'La déstructuration copie la valeur du moment : plus de lien réactif. Utiliser `obj.nom` ou `toRefs(obj)`.' },
        { id: '1-4b', q: 'Quel outil garde le lien en déstructurant un reactive ?', choices: ['`toRefs()`', '`unref()`', '`JSON.parse`', '`Object.assign`'], answer: 0, explain: '`toRefs(form)` renvoie une ref par propriété, liée à l’objet d’origine.' },
        { id: '1-4c', q: 'Remplacer tout l’objet : `form = { ... }` sur un `const form = reactive(...)`…', choices: ['Fonctionne', 'Casse le lien (et const l’interdit)', 'Recharge la page', 'Vide le formulaire proprement'], answer: 1, explain: 'On modifie les propriétés (`form.nom = …`) ou on utilise `Object.assign(form, nouvelles)`. Avec une `ref`, `form.value = {...}` fonctionne.' },
      ],
    },
  ],
};
