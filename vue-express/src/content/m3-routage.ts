import { expect } from '@/lib/expect';
import type { Module } from './types';

const DONNEES = `export const salaries = [
  { id: 1, prenom: 'Léa', nom: 'Martin', service: 'Comptabilité', poste: 'Comptable' },
  { id: 2, prenom: 'Hugo', nom: 'Bernard', service: 'Informatique', poste: 'Développeur' },
  { id: 3, prenom: 'Chloé', nom: 'Petit', service: 'RH', poste: 'Chargée RH' },
]`;

const LAYOUT = (inner: string) => `<template>
  <div class="layout">
    <nav class="menu">
${inner}
    </nav>
    <main class="contenu">
      <router-view />
    </main>
  </div>
</template>

<style>
.layout { font-family: system-ui; }
.menu { display: flex; gap: 12px; padding: 10px; background: #f4f4f5; border-radius: 10px; }
.menu a { color: #334155; text-decoration: none; font-weight: 600; }
.menu a.router-link-active { color: #42b883; }
.contenu { padding: 12px 4px; }
</style>`;

export const m3: Module = {
  id: 3,
  title: 'Routage par fichiers',
  icon: 'pi pi-directions',
  color: '#a855f7',
  summary: 'Un fichier = une URL : pages, paramètres _ID, navigation.',
  lessons: [
    {
      id: '3-1',
      title: 'pages/, router-link et router-view',
      minutes: 12,
      goal: 'Ajouter une page en créant un fichier, et naviguer entre les pages.',
      blocks: [
        { t: 'p', text: "Avec le **routage par fichiers**, tu ne déclares pas les routes à la main : chaque fichier de `pages/` devient une URL." },
        { t: 'code', lang: 'js', title: 'Correspondance fichiers → URL', code: `pages/index.vue                 → /
pages/salaries/index.vue        → /salaries
pages/salaries/_ID.vue          → /salaries/123      (paramètre ID)
pages/salaries/_ID/detail.vue   → /salaries/123/detail
pages/salaries/components/…     → aucune URL (composants de la page)` },
        { t: 'code', lang: 'vue', title: 'App.vue : le layout', code: `<template>
  <nav>
    <router-link to="/">Accueil</router-link>
    <router-link to="/salaries">Salariés</router-link>
  </nav>
  <router-view />   <!-- la page de l'URL courante s'affiche ici -->
</template>` },
        { t: 'list', items: [
          '`<router-link>` génère un lien qui change de page **sans recharger** l’application.',
          'Le lien actif reçoit la classe `router-link-active` (pratique pour le menu).',
          '`<router-view />` est l’emplacement où la page courante s’affiche.',
        ] },
        { t: 'tip', text: "Dans cet exercice, utilise le bouton **＋ Fichier** de l'éditeur pour créer la nouvelle page." },
      ],
      exercise: {
        kind: 'build',
        task: "Le menu affiche des liens mais aucune page ne s'affiche. 1) Dans `App.vue`, transforme les liens en `<router-link>` et ajoute **`<router-view />`**. 2) **Crée** la page `pages/absences/index.vue` qui affiche un titre `<h1>Absences</h1>`.",
        open: 'App.vue',
        files: {
          'App.vue': `<template>
  <div class="layout">
    <nav class="menu">
      <a href="#" data-test="lien-accueil">Accueil</a>
      <a href="#" data-test="lien-salaries">Salariés</a>
      <a href="#" data-test="lien-absences">Absences</a>
    </nav>
    <main class="contenu">
      <!-- à compléter : la page courante doit s'afficher ici -->
    </main>
  </div>
</template>

<style>
.layout { font-family: system-ui; }
.menu { display: flex; gap: 12px; padding: 10px; background: #f4f4f5; border-radius: 10px; }
.menu a { color: #334155; text-decoration: none; font-weight: 600; }
.menu a.router-link-active { color: #42b883; }
.contenu { padding: 12px 4px; }
</style>`,
          'pages/index.vue': `<template>
  <h1>Tableau de bord</h1>
</template>`,
          'pages/salaries/index.vue': `<template>
  <h1>Salariés</h1>
</template>`,
        },
        solution: {
          'App.vue': LAYOUT(`      <router-link to="/" data-test="lien-accueil">Accueil</router-link>
      <router-link to="/salaries" data-test="lien-salaries">Salariés</router-link>
      <router-link to="/absences" data-test="lien-absences">Absences</router-link>`),
          'pages/absences/index.vue': `<template>
  <h1>Absences</h1>
</template>`,
        },
        tests: [
          { name: 'La page d’accueil s’affiche', run: w => expect(w.text('h1'), 'Titre de la page /').toBe('Tableau de bord') },
          { name: 'Le lien Salariés affiche la page salariés', run: async w => { await w.click('[data-test=lien-salaries]'); await w.flush(); expect(w.text('h1'), 'Titre après clic sur Salariés').toBe('Salariés'); } },
          { name: 'La page /absences existe', run: async w => { await w.click('[data-test=lien-absences]'); await w.flush(); expect(w.router?.currentRoute.value.path, 'URL').toBe('/absences'); expect(w.text('h1'), 'Titre de la page /absences').toBe('Absences'); } },
          { name: 'Les liens sont des router-link (classe active)', run: async w => { await w.click('[data-test=lien-salaries]'); await w.flush(); expect(w.get('[data-test=lien-salaries]').classList.contains('router-link-active'), 'Classe router-link-active sur le lien Salariés').toBeTruthy(); } },
        ],
        hints: [
          'Remplace chaque `<a href="#">` par `<router-link to="/...">` (garde les `data-test`).',
          'Mets `<router-view />` dans `<main>`.',
          'Crée le fichier `pages/absences/index.vue` avec `<template><h1>Absences</h1></template>`.',
        ],
      },
      cards: [
        { id: '3-1a', q: 'Quelle URL donne le fichier `pages/conges/index.vue` ?', choices: ['/conges/index', '/conges', '/pages/conges', '/index/conges'], answer: 1, explain: '`index.vue` correspond à la racine de son dossier : `/conges`.' },
        { id: '3-1b', q: 'À quoi sert `<router-view />` ?', choices: ['À créer un lien', 'À afficher la page correspondant à l’URL courante', 'À déclarer une route', 'À recharger la page'], answer: 1, explain: 'C’est l’emplacement où le routeur affiche le composant de la page active.' },
        { id: '3-1c', q: 'Un fichier dans `pages/salaries/components/` a-t-il une URL ?', choices: ['Oui', 'Non : ce sont des composants de la page', 'Seulement s’il s’appelle index.vue', 'Oui, /components'], answer: 1, explain: 'Les dossiers `components/` sont exclus du routage : ils contiennent les briques de la page.' },
      ],
    },

    {
      id: '3-2',
      title: '_ID.vue et useRoute',
      minutes: 14,
      goal: 'Créer une page détail qui lit le paramètre de l’URL.',
      blocks: [
        { t: 'p', text: "Un fichier `_ID.vue` crée une route **dynamique** : `/salaries/1`, `/salaries/2`… La valeur est lue avec **`useRoute()`** dans `route.params.ID`." },
        { t: 'code', lang: 'vue', title: 'pages/salaries/_ID.vue', code: `<script setup>
const route = useRoute()
const id = computed(() => Number(route.params.ID))   // les paramètres sont des textes
const salarie = computed(() => salaries.find(s => s.id === id.value))
</script>

<template>
  <h1 v-if="salarie">{{ salarie.prenom }} {{ salarie.nom }}</h1>
  <p v-else>Salarié introuvable</p>
</template>` },
        { t: 'code', lang: 'vue', title: 'Lien vers une fiche', code: `<router-link :to="'/salaries/' + s.id">{{ s.nom }}</router-link>` },
        { t: 'warn', text: "`route.params.ID` est **toujours une chaîne** (`'2'`). Comparer avec `===` à un nombre échoue : convertis avec `Number(...)`." },
        { t: 'sql', text: "C'est le `WHERE id = :ID` de ta page : le paramètre arrive dans l'URL au lieu d'une variable de liaison." },
      ],
      exercise: {
        kind: 'build',
        task: "1) Dans la liste, chaque nom doit être un lien vers `/salaries/<id>`. 2) Dans `_ID.vue`, affiche le salarié correspondant au paramètre **ID** (prénom nom, poste) et « Salarié introuvable » si l’ID n’existe pas.",
        open: 'pages/salaries/_ID.vue',
        readonly: ['App.vue', 'lib/donnees.js'],
        files: {
          'App.vue': `<template><router-view /></template>`,
          'lib/donnees.js': DONNEES,
          'pages/salaries/index.vue': `<script setup>
import { salaries } from '@/lib/donnees'
</script>

<template>
  <h1>Salariés</h1>
  <ul>
    <li v-for="s in salaries" :key="s.id">
      <span data-test="lien">{{ s.prenom }} {{ s.nom }}</span>
    </li>
  </ul>
</template>`,
          'pages/salaries/_ID.vue': `<script setup>
import { salaries } from '@/lib/donnees'
// à compléter : lire le paramètre ID et retrouver le salarié
</script>

<template>
  <h1 data-test="titre">Fiche salarié</h1>
  <p data-test="poste"></p>
</template>`,
          'pages/index.vue': `<template><router-link to="/salaries">Voir les salariés</router-link></template>`,
        },
        solution: {
          'pages/salaries/index.vue': `<script setup>
import { salaries } from '@/lib/donnees'
</script>

<template>
  <h1>Salariés</h1>
  <ul>
    <li v-for="s in salaries" :key="s.id">
      <router-link :to="'/salaries/' + s.id" data-test="lien">{{ s.prenom }} {{ s.nom }}</router-link>
    </li>
  </ul>
</template>`,
          'pages/salaries/_ID.vue': `<script setup>
import { salaries } from '@/lib/donnees'

const route = useRoute()
const salarie = computed(() => salaries.find(s => s.id === Number(route.params.ID)))
</script>

<template>
  <template v-if="salarie">
    <h1 data-test="titre">{{ salarie.prenom }} {{ salarie.nom }}</h1>
    <p data-test="poste">{{ salarie.poste }}</p>
  </template>
  <p v-else data-test="introuvable">Salarié introuvable</p>
</template>`,
        },
        tests: [
          { name: 'Accès direct à /salaries/3', run: async w => { await w.go('/salaries/3'); expect(w.text('[data-test=titre]'), 'Titre de la fiche 3').toBe('Chloé Petit'); expect(w.text('[data-test=poste]')).toBe('Chargée RH'); } },
          { name: 'Clic sur un nom de la liste', run: async w => { await w.go('/salaries'); const liens = w.findAll('[data-test=lien]'); expect(liens.length, 'Liens').toBe(3); liens[1]!.click(); await w.flush(); await w.flush(); expect(w.router?.currentRoute.value.path, 'URL après clic sur Hugo').toBe('/salaries/2'); expect(w.text('[data-test=titre]')).toBe('Hugo Bernard'); } },
          { name: 'ID inconnu → « Salarié introuvable »', run: async w => { await w.go('/salaries/99'); expect(w.text(), 'Page /salaries/99').toContain('Salarié introuvable'); } },
        ],
        hints: [
          'Dans `_ID.vue` : `const route = useRoute()` puis `computed(() => salaries.find(s => s.id === Number(route.params.ID)))`.',
          "Lien : `<router-link :to=\"'/salaries/' + s.id\" data-test=\"lien\">`.",
          'Utilise `v-if="salarie"` / `v-else` pour le cas introuvable.',
        ],
      },
      cards: [
        { id: '3-2a', q: 'Quelle URL correspond à `pages/conges/_ID.vue` ?', choices: ['/conges/_ID', '/conges/:ID (ex. /conges/42)', '/conges?ID=', '/_ID/conges'], answer: 1, explain: 'Le préfixe `_` crée un paramètre dynamique nommé ID.' },
        { id: '3-2b', q: 'Que vaut `route.params.ID` pour l’URL `/salaries/7` ?', choices: ['`7` (nombre)', "`'7'` (chaîne)", '`undefined`', '`[7]`'], answer: 1, explain: 'Les paramètres d’URL sont des chaînes : `Number(route.params.ID)` pour comparer avec un id numérique.' },
        { id: '3-2c', q: 'Comment faire un lien vers la fiche `s.id` ?', choices: ['`<router-link to="/salaries/s.id">`', "`<router-link :to=\"'/salaries/' + s.id\">`", '`<a href="/salaries/{s.id}">`', '`<router-view :to="s.id">`'], answer: 1, explain: '`:to` (avec deux-points) évalue l’expression ; sans `:`, `s.id` serait du texte.' },
      ],
    },

    {
      id: '3-3',
      title: 'router.push, sous-pages et <route>',
      minutes: 14,
      goal: 'Naviguer par code, créer une sous-page _ID/detail et utiliser la meta de route.',
      blocks: [
        { t: 'p', text: "Pour naviguer **depuis le code** (après un enregistrement, sur un clic de ligne…), on utilise **`useRouter()`** et `router.push(...)`." },
        { t: 'code', lang: 'js', code: `const router = useRouter()
const route = useRoute()

function voirDetail() {
  router.push('/salaries/' + route.params.ID + '/detail')
}
// router.back()  → page précédente
// router.replace(...) → sans ajouter à l'historique` },
        { t: 'p', text: "Le bloc **`<route>`** d'un fichier de page ajoute des **méta-données** à sa route (titre, droits, onglet du menu…). Le layout peut les lire via `route.meta`." },
        { t: 'code', lang: 'vue', title: 'pages/salaries/_ID/detail.vue', code: `<template>…</template>

<route>
{ "meta": { "titre": "Détail du salarié" } }
</route>` },
        { t: 'list', items: [
          '`useRoute()` = l’URL **courante** (lecture : params, query, meta).',
          '`useRouter()` = le **routeur** (actions : push, back, replace).',
          'Dans un template, `$route` et `$router` sont aussi disponibles.',
        ] },
      ],
      exercise: {
        kind: 'build',
        task: "1) Sur la fiche `_ID.vue`, le bouton **Voir le détail** doit aller à `/salaries/<ID>/detail` avec `router.push`. 2) Dans `detail.vue`, ajoute un bloc `<route>` avec `meta.titre` = **« Détail du salarié »** (le layout l'affiche dans l'en-tête). 3) Le bouton **Retour** revient à la fiche.",
        open: 'pages/salaries/_ID.vue',
        readonly: ['App.vue', 'lib/donnees.js'],
        files: {
          'App.vue': `<script setup>
const route = useRoute()
</script>

<template>
  <header class="entete" data-test="entete">{{ route.meta.titre || 'Application' }}</header>
  <router-view />
</template>

<style>
.entete { font: 700 18px system-ui; padding: 10px; border-bottom: 1px solid #eee; }
</style>`,
          'lib/donnees.js': DONNEES,
          'pages/index.vue': `<template><router-link to="/salaries/2">Fiche de Hugo</router-link></template>`,
          'pages/salaries/_ID.vue': `<script setup>
import { salaries } from '@/lib/donnees'

const route = useRoute()
const salarie = computed(() => salaries.find(s => s.id === Number(route.params.ID)))

function voirDetail() {
  // à compléter
}
</script>

<template>
  <h1 data-test="titre">{{ salarie?.prenom }} {{ salarie?.nom }}</h1>
  <button data-test="detail" @click="voirDetail">Voir le détail</button>
</template>

<route>
{ "meta": { "titre": "Fiche salarié" } }
</route>`,
          'pages/salaries/_ID/detail.vue': `<script setup>
import { salaries } from '@/lib/donnees'

const route = useRoute()
const salarie = computed(() => salaries.find(s => s.id === Number(route.params.ID)))

function retour() {
  // à compléter : revenir à la fiche /salaries/<ID>
}
</script>

<template>
  <p data-test="info">{{ salarie?.prenom }} · {{ salarie?.service }} · {{ salarie?.poste }}</p>
  <button data-test="retour" @click="retour">Retour</button>
</template>`,
        },
        solution: {
          'pages/salaries/_ID.vue': `<script setup>
import { salaries } from '@/lib/donnees'

const route = useRoute()
const router = useRouter()
const salarie = computed(() => salaries.find(s => s.id === Number(route.params.ID)))

function voirDetail() {
  router.push('/salaries/' + route.params.ID + '/detail')
}
</script>

<template>
  <h1 data-test="titre">{{ salarie?.prenom }} {{ salarie?.nom }}</h1>
  <button data-test="detail" @click="voirDetail">Voir le détail</button>
</template>

<route>
{ "meta": { "titre": "Fiche salarié" } }
</route>`,
          'pages/salaries/_ID/detail.vue': `<script setup>
import { salaries } from '@/lib/donnees'

const route = useRoute()
const router = useRouter()
const salarie = computed(() => salaries.find(s => s.id === Number(route.params.ID)))

function retour() {
  router.push('/salaries/' + route.params.ID)
}
</script>

<template>
  <p data-test="info">{{ salarie?.prenom }} · {{ salarie?.service }} · {{ salarie?.poste }}</p>
  <button data-test="retour" @click="retour">Retour</button>
</template>

<route>
{ "meta": { "titre": "Détail du salarié" } }
</route>`,
        },
        tests: [
          { name: 'Voir le détail navigue vers /salaries/2/detail', run: async w => { await w.go('/salaries/2'); await w.click('[data-test=detail]'); await w.flush(); expect(w.router?.currentRoute.value.path, 'URL').toBe('/salaries/2/detail'); expect(w.text('[data-test=info]')).toBe('Hugo · Informatique · Développeur'); } },
          { name: 'L’en-tête affiche la meta de la sous-page', run: async w => { await w.go('/salaries/2/detail'); expect(w.text('[data-test=entete]'), 'En-tête sur la page détail').toBe('Détail du salarié'); } },
          { name: 'Retour ramène à la fiche', run: async w => { await w.go('/salaries/1/detail'); await w.click('[data-test=retour]'); await w.flush(); expect(w.router?.currentRoute.value.path).toBe('/salaries/1'); expect(w.text('[data-test=entete]')).toBe('Fiche salarié'); } },
        ],
        hints: [
          '`const router = useRouter()` puis `router.push(\'/salaries/\' + route.params.ID + \'/detail\')`.',
          "Ajoute en bas de `detail.vue` : `<route>{ \"meta\": { \"titre\": \"Détail du salarié\" } }</route>`.",
          "`retour()` : `router.push('/salaries/' + route.params.ID)`.",
        ],
      },
      cards: [
        { id: '3-3a', q: 'Pour naviguer après un enregistrement, on utilise…', choices: ['`useRoute().push()`', '`useRouter().push()`', '`window.location = …`', '`<router-view>`'], answer: 1, explain: '`useRouter()` donne le routeur (actions). `useRoute()` donne l’URL courante (lecture).' },
        { id: '3-3b', q: 'À quoi sert le bloc `<route>` dans un fichier de page ?', choices: ['À écrire du CSS', 'À ajouter des méta-données à la route (titre, droits…)', 'À importer le routeur', 'À créer un sous-composant'], answer: 1, explain: 'Son contenu (JSON) est fusionné dans la définition de la route ; `meta` est lisible via `route.meta`.' },
        { id: '3-3c', q: 'Quelle URL pour `pages/salaries/_ID/detail.vue` ?', choices: ['/salaries/detail', '/salaries/:ID/detail', '/detail/:ID', '/salaries/_ID/detail'], answer: 1, explain: 'Le dossier `_ID` donne le paramètre, `detail.vue` la sous-page.' },
      ],
    },
  ],
};
