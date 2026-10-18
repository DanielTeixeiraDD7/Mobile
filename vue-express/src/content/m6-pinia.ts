import { expect } from '@/lib/expect';
import type { Module } from './types';

export const m6: Module = {
  id: 6,
  title: 'Pinia : l’état global',
  icon: 'pi pi-database',
  color: '#eab308',
  summary: 'Partager la session et les paramètres entre toutes les pages.',
  lessons: [
    {
      id: '6-1',
      title: 'Un store de session',
      minutes: 14,
      goal: 'Créer un store (state, getters, actions) et l’utiliser dans plusieurs composants.',
      blocks: [
        { t: 'p', text: "Quand plusieurs pages ont besoin de la **même donnée** (utilisateur connecté, paramètres, droits), on la met dans un **store Pinia** plutôt que de la passer de props en props." },
        { t: 'code', lang: 'js', title: 'stores/session.js (syntaxe « setup »)', code: `export const useSessionStore = defineStore('session', () => {
  // state
  const utilisateur = ref(null)
  // getters
  const estConnecte = computed(() => utilisateur.value !== null)
  const estGestionnaire = computed(() => utilisateur.value?.role === 'gestionnaire')
  // actions
  function connecter(nom, role) { utilisateur.value = { nom, role } }
  function deconnecter() { utilisateur.value = null }

  return { utilisateur, estConnecte, estGestionnaire, connecter, deconnecter }
})` },
        { t: 'code', lang: 'vue', title: 'Dans n’importe quel composant', code: `<script setup>
import { useSessionStore } from '@/stores/session'
const session = useSessionStore()
</script>

<template>
  <p v-if="session.estConnecte">Bonjour {{ session.utilisateur.nom }}</p>
  <button @click="session.deconnecter()">Déconnexion</button>
</template>` },
        { t: 'list', items: [
          'Un store = **une seule instance** partagée : tous les composants voient la même valeur.',
          'Dans le template et le script, pas de `.value` sur `session.utilisateur` : le store déballe les refs.',
          'Le nom (`\'session\'`) doit être unique dans l’application.',
        ] },
        { t: 'sql', text: "Un store ressemble à une **variable de package PL/SQL** : déclarée une fois, visible et partagée par toutes les procédures de la session, avec des fonctions (getters) et procédures (actions) pour la lire et la modifier." },
      ],
      exercise: {
        kind: 'build',
        task: "Complète `stores/session.js` : un getter **`estConnecte`**, un getter **`estGestionnaire`** (rôle « gestionnaire »), et les actions **`connecter(nom, role)`** / **`deconnecter()`**. L'en-tête et la page utilisent déjà le store.",
        open: 'stores/session.js',
        readonly: ['App.vue', 'components/EnTete.vue'],
        files: {
          'stores/session.js': `export const useSessionStore = defineStore('session', () => {
  const utilisateur = ref(null)

  // à compléter : estConnecte, estGestionnaire, connecter, deconnecter

  return { utilisateur }
})`,
          'components/EnTete.vue': `<script setup>
import { useSessionStore } from '@/stores/session'
const session = useSessionStore()
</script>

<template>
  <header class="entete">
    <span v-if="session.estConnecte" data-test="bonjour">Bonjour {{ session.utilisateur.nom }}</span>
    <span v-else data-test="invite">Non connecté</span>
    <button v-if="session.estConnecte" data-test="deconnexion" @click="session.deconnecter()">Déconnexion</button>
  </header>
</template>

<style>
.entete { display: flex; justify-content: space-between; padding: 10px; background: #f1f5f9; border-radius: 10px; font-family: system-ui; }
</style>`,
          'App.vue': `<script setup>
import EnTete from './components/EnTete.vue'
import { useSessionStore } from '@/stores/session'
const session = useSessionStore()
</script>

<template>
  <EnTete />
  <main style="font-family: system-ui; padding: 10px">
    <div v-if="!session.estConnecte">
      <button data-test="connexion-salarie" @click="session.connecter('Léa', 'salarie')">Se connecter (salariée)</button>
      <button data-test="connexion-gestionnaire" @click="session.connecter('Lucas', 'gestionnaire')">Se connecter (gestionnaire)</button>
    </div>
    <p v-if="session.estGestionnaire" data-test="validation">Demandes à valider : 3</p>
  </main>
</template>`,
        },
        solution: {
          'stores/session.js': `export const useSessionStore = defineStore('session', () => {
  const utilisateur = ref(null)

  const estConnecte = computed(() => utilisateur.value !== null)
  const estGestionnaire = computed(() => utilisateur.value?.role === 'gestionnaire')

  function connecter(nom, role) {
    utilisateur.value = { nom, role }
  }
  function deconnecter() {
    utilisateur.value = null
  }

  return { utilisateur, estConnecte, estGestionnaire, connecter, deconnecter }
})`,
        },
        tests: [
          { name: 'Non connecté au départ', run: w => { expect(w.exists('[data-test=invite]'), '« Non connecté »').toBeTruthy(); expect(w.exists('[data-test=connexion-salarie]'), 'Boutons de connexion').toBeTruthy(); } },
          { name: 'Connexion : l’en-tête (autre composant) le voit', run: async w => { await w.click('[data-test=connexion-salarie]'); expect(w.text('[data-test=bonjour]'), 'En-tête').toBe('Bonjour Léa'); expect(w.exists('[data-test=validation]'), 'Bloc gestionnaire pour une salariée').toBeFalsy(); } },
          { name: 'Gestionnaire : voit les validations', run: async w => { await w.click('[data-test=connexion-gestionnaire]'); expect(w.exists('[data-test=validation]'), 'Bloc « Demandes à valider »').toBeTruthy(); } },
          { name: 'Déconnexion', run: async w => { await w.click('[data-test=connexion-salarie]'); await w.click('[data-test=deconnexion]'); expect(w.exists('[data-test=invite]')).toBeTruthy(); } },
        ],
        hints: [
          '`const estConnecte = computed(() => utilisateur.value !== null)`',
          "`const estGestionnaire = computed(() => utilisateur.value?.role === 'gestionnaire')`",
          'N’oublie pas de tout renvoyer : `return { utilisateur, estConnecte, estGestionnaire, connecter, deconnecter }`.',
        ],
      },
      cards: [
        { id: '6-1a', q: 'Dans un store « setup », à quoi correspond un `computed` ?', choices: ['Une action', 'Un getter', 'Le state', 'Un plugin'], answer: 1, explain: 'ref = state, computed = getter, function = action.' },
        { id: '6-1b', q: 'Deux composants appellent `useSessionStore()`. Ils obtiennent…', choices: ['Deux copies indépendantes', 'La même instance partagée', 'Une erreur', 'Une copie en lecture seule'], answer: 1, explain: 'Un store est un singleton par application : la donnée est partagée.' },
        { id: '6-1c', q: 'Un oubli fréquent dans un store setup ?', choices: ['Mettre des computed', 'Oublier de retourner une valeur/fonction dans le `return`', 'Utiliser ref', 'Donner un nom'], answer: 1, explain: 'Ce qui n’est pas retourné n’est pas accessible (et pas suivi par Pinia/devtools).' },
      ],
    },

    {
      id: '6-2',
      title: 'Piège : storeToRefs',
      minutes: 10,
      goal: 'Déstructurer un store sans perdre la réactivité.',
      blocks: [
        { t: 'p', text: "Même piège qu'avec `reactive` : **déstructurer un store** copie les valeurs du moment. Pour garder le lien sur le state et les getters, on utilise **`storeToRefs`**. Les **actions**, elles, se déstructurent directement." },
        { t: 'code', lang: 'js', code: `const session = useSessionStore()

const { utilisateur } = session                 // ❌ figé
const { utilisateur, estConnecte } = storeToRefs(session)  // ✅ refs liées
const { connecter } = session                   // ✅ les fonctions, directement` },
        { t: 'warn', text: "Avec `storeToRefs`, on récupère des **refs** : dans le script il faut à nouveau `.value` (`utilisateur.value.nom`), dans le template non." },
      ],
      exercise: {
        kind: 'bug',
        task: "**Trouve le bug.** Le compteur du panier de validation ne bouge pas quand on ajoute une demande, alors que le store est bien mis à jour (le total en bas, qui lit le store directement, change). Corrige `Compteur.vue`.",
        open: 'components/Compteur.vue',
        readonly: ['App.vue', 'stores/validation.js'],
        files: {
          'stores/validation.js': `export const useValidationStore = defineStore('validation', () => {
  const demandes = ref([])
  const nombre = computed(() => demandes.value.length)
  function ajouter(d) { demandes.value.push(d) }
  return { demandes, nombre, ajouter }
})`,
          'components/Compteur.vue': `<script setup>
import { useValidationStore } from '@/stores/validation'

const store = useValidationStore()
const { nombre, ajouter } = store
</script>

<template>
  <div class="compteur">
    <span data-test="badge">{{ nombre }}</span> demande(s) sélectionnée(s)
    <button data-test="ajouter" @click="ajouter({ id: Date.now() })">Ajouter</button>
  </div>
</template>`,
          'App.vue': `<script setup>
import Compteur from './components/Compteur.vue'
import { useValidationStore } from '@/stores/validation'
const store = useValidationStore()
</script>

<template>
  <Compteur />
  <p data-test="total">Total (lu directement dans le store) : {{ store.nombre }}</p>
</template>`,
        },
        solution: {
          'components/Compteur.vue': `<script setup>
import { useValidationStore } from '@/stores/validation'

const store = useValidationStore()
const { nombre } = storeToRefs(store)
const { ajouter } = store
</script>

<template>
  <div class="compteur">
    <span data-test="badge">{{ nombre }}</span> demande(s) sélectionnée(s)
    <button data-test="ajouter" @click="ajouter({ id: Date.now() })">Ajouter</button>
  </div>
</template>`,
        },
        tests: [
          { name: 'Le badge suit le store', run: async w => { await w.click('[data-test=ajouter]'); await w.click('[data-test=ajouter]'); expect(w.text('[data-test=total]'), 'Total lu dans le store').toContain('2'); expect(w.text('[data-test=badge]'), 'Badge du composant Compteur').toBe('2'); } },
        ],
        hints: [
          '`const { nombre } = store` copie la valeur 0 une fois pour toutes.',
          '`const { nombre } = storeToRefs(store)` et garde `const { ajouter } = store` pour l’action.',
        ],
      },
      cards: [
        { id: '6-2a', q: 'Comment déstructurer le state d’un store en gardant la réactivité ?', choices: ['`const { x } = store`', '`const { x } = storeToRefs(store)`', '`const { x } = toRaw(store)`', 'Impossible'], answer: 1, explain: '`storeToRefs` renvoie des refs liées au store (state et getters).' },
        { id: '6-2b', q: 'Et les actions du store ?', choices: ['Aussi via storeToRefs', 'Déstructurées directement depuis le store', 'Impossible à déstructurer', 'Via mapActions uniquement'], answer: 1, explain: '`storeToRefs` ignore les fonctions : on les prend directement (`const { ajouter } = store`).' },
        { id: '6-2c', q: 'Après `const { nombre } = storeToRefs(store)`, dans le script on lit…', choices: ['`nombre`', '`nombre.value`', '`store.nombre.value`', '`nombre()`'], answer: 1, explain: 'Ce sont des refs : `.value` dans le script, rien dans le template.' },
      ],
    },

    {
      id: '6-3',
      title: 'Paramètres partagés et persistants',
      minutes: 14,
      goal: 'Garder des paramètres entre les pages et après un rechargement.',
      blocks: [
        { t: 'p', text: "Un store survit aux changements de page (il vit tant que l'application est ouverte). Pour qu'un paramètre survive aussi au **rechargement**, on le sauvegarde dans `localStorage` avec un `watch`." },
        { t: 'code', lang: 'js', code: `export const useParametresStore = defineStore('parametres', () => {
  const lu = JSON.parse(localStorage.getItem('parametres') || '{}')
  const service = ref(lu.service ?? 'Tous')
  const parPage = ref(lu.parPage ?? 10)

  watch([service, parPage], () => {
    localStorage.setItem('parametres', JSON.stringify({ service: service.value, parPage: parPage.value }))
  })

  return { service, parPage }
})` },
        { t: 'tip', text: "`v-model=\"parametres.service\"` fonctionne directement sur un store (sans storeToRefs) : le store est réactif." },
      ],
      exercise: {
        kind: 'build',
        task: "1) Dans `stores/parametres.js`, initialise `service` depuis `localStorage` (clé **`parametres`**, défaut **« Tous »**) et sauvegarde-le à chaque changement. 2) Dans `pages/index.vue`, filtre la liste avec le service du store. Le choix fait sur `/parametres` doit être pris en compte sur `/`, même après rechargement.",
        open: 'stores/parametres.js',
        readonly: ['App.vue', 'pages/parametres.vue'],
        files: {
          'App.vue': `<template>
  <nav style="display:flex; gap:12px; font-family:system-ui">
    <router-link to="/" data-test="lien-liste">Liste</router-link>
    <router-link to="/parametres" data-test="lien-parametres">Paramètres</router-link>
  </nav>
  <router-view />
</template>`,
          'stores/parametres.js': `export const useParametresStore = defineStore('parametres', () => {
  const service = ref('Tous')
  // à compléter : lire localStorage au départ, sauvegarder à chaque changement
  return { service }
})`,
          'pages/parametres.vue': `<script setup>
import { useParametresStore } from '@/stores/parametres'
const parametres = useParametresStore()
</script>

<template>
  <h1>Paramètres</h1>
  <select data-test="service" v-model="parametres.service">
    <option>Tous</option><option>RH</option><option>Informatique</option><option>Comptabilité</option>
  </select>
</template>`,
          'pages/index.vue': `<script setup>
import { useParametresStore } from '@/stores/parametres'
const parametres = useParametresStore()

const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité' },
  { id: 2, nom: 'Bernard', service: 'Informatique' },
  { id: 3, nom: 'Petit', service: 'RH' },
  { id: 4, nom: 'Durand', service: 'Informatique' },
]
// à compléter : liste filtrée selon parametres.service
</script>

<template>
  <h1>Liste</h1>
  <ul><li v-for="s in salaries" :key="s.id" data-test="ligne">{{ s.nom }}</li></ul>
</template>`,
        },
        solution: {
          'stores/parametres.js': `export const useParametresStore = defineStore('parametres', () => {
  const lu = JSON.parse(localStorage.getItem('parametres') || '{}')
  const service = ref(lu.service ?? 'Tous')

  watch(service, () => {
    localStorage.setItem('parametres', JSON.stringify({ service: service.value }))
  })

  return { service }
})`,
          'pages/index.vue': `<script setup>
import { useParametresStore } from '@/stores/parametres'
const parametres = useParametresStore()

const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité' },
  { id: 2, nom: 'Bernard', service: 'Informatique' },
  { id: 3, nom: 'Petit', service: 'RH' },
  { id: 4, nom: 'Durand', service: 'Informatique' },
]
const visibles = computed(() => parametres.service === 'Tous' ? salaries : salaries.filter(s => s.service === parametres.service))
</script>

<template>
  <h1>Liste</h1>
  <ul><li v-for="s in visibles" :key="s.id" data-test="ligne">{{ s.nom }}</li></ul>
</template>`,
        },
        tests: [
          { name: 'Le choix sur /parametres filtre la liste', run: async w => { localStorage.removeItem('parametres'); await w.go('/parametres'); await w.select('[data-test=service]', 'Informatique'); await w.go('/'); expect(w.findAll('[data-test=ligne]').map(e => e.textContent), 'Liste après choix « Informatique »').toEqual(['Bernard', 'Durand']); } },
          { name: 'Sauvegardé dans localStorage', run: async w => { localStorage.removeItem('parametres'); await w.go('/parametres'); await w.select('[data-test=service]', 'RH'); await w.wait(10); expect(JSON.parse(localStorage.getItem('parametres') || '{}').service, 'localStorage « parametres ».service').toBe('RH'); } },
        ],
        hints: [
          "`const lu = JSON.parse(localStorage.getItem('parametres') || '{}')` puis `ref(lu.service ?? 'Tous')`.",
          "`watch(service, () => localStorage.setItem('parametres', JSON.stringify({ service: service.value })))`",
          "Dans la page : `const visibles = computed(() => parametres.service === 'Tous' ? salaries : salaries.filter(s => s.service === parametres.service))` et `v-for` sur `visibles`.",
        ],
      },
      cards: [
        { id: '6-3a', q: 'Un store Pinia survit-il à un rechargement de page (F5) ?', choices: ['Oui, toujours', 'Non : il faut le sauvegarder (localStorage, serveur…)', 'Oui avec storeToRefs', 'Seulement en production'], answer: 1, explain: 'Le store vit en mémoire : il est recréé au rechargement. On persiste ce qui doit survivre.' },
        { id: '6-3b', q: '`v-model="store.service"` fonctionne-t-il ?', choices: ['Non', 'Oui, le store est réactif', 'Seulement avec storeToRefs', 'Seulement pour les getters'], answer: 1, explain: 'On peut lier directement une propriété de state du store.' },
        { id: '6-3c', q: 'Le meilleur endroit pour sauvegarder un paramètre à chaque changement ?', choices: ['Un watch dans le store', 'Un onMounted', 'Le template', 'Un computed'], answer: 0, explain: 'Un `watch` sur le state, dans le store lui-même : la règle est centralisée.' },
      ],
    },
  ],
};
