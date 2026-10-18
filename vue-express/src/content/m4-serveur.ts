import { expect } from '@/lib/expect';
import type { Module } from './types';

const API_DOC = `// Module fourni (serveur FICTIF, latence simulée) :
// import { fetchSalaries, fetchSalarie, saveAbsence, ApiError } from '@/lib/api'
//   fetchSalaries(filtre?)  → Promise<Salarie[]>
//   fetchSalarie(id)        → Promise<Salarie>   (ApiError 404 si inconnu)
//   saveAbsence(absence)    → Promise<Absence>   (ApiError 400 si dates invalides)
//   err.status, err.message`;

export const m4: Module = {
  id: 4,
  title: 'Appels serveur',
  icon: 'pi pi-cloud-download',
  color: '#f59e0b',
  summary: 'Charger et envoyer des données : chargement, erreurs, cas réels.',
  lessons: [
    {
      id: '4-1',
      title: 'async/await, chargement et erreurs',
      minutes: 15,
      goal: 'Charger une liste avec un état de chargement et une gestion d’erreur.',
      blocks: [
        { t: 'p', text: "Un appel serveur renvoie une **Promise** : la réponse arrive plus tard. On l'attend avec **`await`** dans une fonction **`async`**, et on gère trois états : **chargement**, **erreur**, **données**." },
        { t: 'code', lang: 'vue', code: `<script setup>
import { fetchSalaries } from '@/lib/api'

const salaries = ref([])
const chargement = ref(false)
const erreur = ref(null)

async function charger() {
  chargement.value = true
  erreur.value = null
  try {
    salaries.value = await fetchSalaries()
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false     // toujours exécuté, succès ou échec
  }
}

onMounted(charger)
</script>

<template>
  <ProgressSpinner v-if="chargement" />
  <p v-else-if="erreur">{{ erreur }} <button @click="charger">Réessayer</button></p>
  <ul v-else>…</ul>
</template>` },
        { t: 'code', lang: 'js', title: 'Même chose avec .then (style que tu croiseras aussi)', code: `fetchSalaries()
  .then(data => { salaries.value = data })
  .catch(e => { erreur.value = e.message })
  .finally(() => { chargement.value = false })` },
        { t: 'warn', text: "Oublier `await` : `salaries.value = fetchSalaries()` met une **Promise** dans la ref, pas la liste. Résultat : rien ne s'affiche (ou `v-for` sur un objet bizarre)." },
        { t: 'sql', text: "`try/catch/finally` ≈ `BEGIN … EXCEPTION WHEN OTHERS THEN … END` ; `finally` n'a pas d'équivalent direct : c'est le code exécuté dans **tous** les cas.", code: `BEGIN
  charger_salaries;
EXCEPTION
  WHEN OTHERS THEN v_erreur := SQLERRM;
END;` },
        { t: 'code', lang: 'js', title: 'Le serveur fictif des exercices', code: API_DOC },
      ],
      exercise: {
        kind: 'build',
        task: "La liste ne s'affiche jamais (il manque `await`…), et il n'y a ni chargement ni erreur. Écris `charger()` proprement : **chargement** pendant l'appel (`data-test=\"chargement\"`), message d'**erreur** en cas d'échec (`data-test=\"erreur\"`) avec un bouton **Réessayer**, puis la liste.",
        open: 'App.vue',
        files: {
          'App.vue': `<script setup>
import { fetchSalaries } from '@/lib/api'

const salaries = ref([])
const chargement = ref(false)
const erreur = ref(null)

function charger() {
  salaries.value = fetchSalaries()
}

onMounted(charger)
</script>

<template>
  <div class="page">
    <button data-test="actualiser" @click="charger">Actualiser</button>
    <p v-if="chargement" data-test="chargement">Chargement…</p>
    <p v-else-if="erreur" data-test="erreur" class="erreur">
      {{ erreur }} <button data-test="reessayer" @click="charger">Réessayer</button>
    </p>
    <ul v-else>
      <li v-for="s in salaries" :key="s.id" data-test="ligne">{{ s.prenom }} {{ s.nom }}</li>
    </ul>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 12px; }
.erreur { color: #b91c1c; }
</style>`,
        },
        solution: {
          'App.vue': `<script setup>
import { fetchSalaries } from '@/lib/api'

const salaries = ref([])
const chargement = ref(false)
const erreur = ref(null)

async function charger() {
  chargement.value = true
  erreur.value = null
  try {
    salaries.value = await fetchSalaries()
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}

onMounted(charger)
</script>

<template>
  <div class="page">
    <button data-test="actualiser" @click="charger">Actualiser</button>
    <p v-if="chargement" data-test="chargement">Chargement…</p>
    <p v-else-if="erreur" data-test="erreur" class="erreur">
      {{ erreur }} <button data-test="reessayer" @click="charger">Réessayer</button>
    </p>
    <ul v-else>
      <li v-for="s in salaries" :key="s.id" data-test="ligne">{{ s.prenom }} {{ s.nom }}</li>
    </ul>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 12px; }
.erreur { color: #b91c1c; }
</style>`,
        },
        tests: [
          { name: 'La liste se charge (6 salariés)', run: async w => { await w.until(() => w.findAll('[data-test=ligne]').length > 0, 'la liste devrait apparaître'); expect(w.findAll('[data-test=ligne]').length, 'Lignes').toBe(6); } },
          { name: 'Chargement visible pendant l’appel', run: async w => { await w.until(() => w.findAll('[data-test=ligne]').length > 0, 'chargement initial'); w.api.delay = 150; w.get('[data-test=actualiser]').click(); await w.flush(); expect(w.exists('[data-test=chargement]'), 'Indicateur « Chargement… » pendant l’appel').toBeTruthy(); await w.until(() => !w.exists('[data-test=chargement]'), 'fin du chargement'); expect(w.findAll('[data-test=ligne]').length).toBe(6); } },
          { name: 'Erreur affichée, puis Réessayer fonctionne', run: async w => { await w.until(() => w.findAll('[data-test=ligne]').length > 0, 'chargement initial'); w.api.failNext = 500; await w.click('[data-test=actualiser]'); await w.until(() => w.exists('[data-test=erreur]'), 'le message d’erreur devrait apparaître'); expect(w.text('[data-test=erreur]')).toContain('Erreur serveur'); await w.click('[data-test=reessayer]'); await w.until(() => w.findAll('[data-test=ligne]').length === 6, 'la liste après Réessayer'); } },
        ],
        hints: [
          'Ajoute `async` devant `function charger()` et `await` devant `fetchSalaries()`.',
          'Entoure l’appel de `try { … } catch (e) { erreur.value = e.message } finally { chargement.value = false }`.',
          'Au début : `chargement.value = true` et `erreur.value = null`.',
        ],
      },
      cards: [
        { id: '4-1a', q: 'Que contient `salaries.value` après `salaries.value = fetchSalaries()` (sans await) ?', choices: ['La liste', 'Une Promise', 'undefined', 'Une erreur'], answer: 1, explain: 'Sans `await`, on stocke la promesse elle-même, pas son résultat.' },
        { id: '4-1b', q: 'Le bloc `finally` s’exécute…', choices: ['Seulement en cas de succès', 'Seulement en cas d’erreur', 'Dans tous les cas', 'Jamais avec await'], answer: 2, explain: 'Idéal pour remettre `chargement` à false quoi qu’il arrive.' },
        { id: '4-1c', q: 'Pourquoi remettre `erreur.value = null` au début de `charger()` ?', choices: ['Par habitude', 'Pour effacer l’ancienne erreur quand on réessaie', 'Pour éviter un warning', 'C’est obligatoire avec async'], answer: 1, explain: 'Sinon l’ancien message resterait affiché pendant le nouvel essai, même s’il réussit.' },
      ],
    },

    {
      id: '4-2',
      title: 'Piège : recharger quand l’ID change',
      minutes: 14,
      goal: 'Recharger les données quand on passe de /salaries/1 à /salaries/2.',
      blocks: [
        { t: 'p', text: "Quand on navigue de `/salaries/1` à `/salaries/2`, c'est **la même page** (`_ID.vue`) : Vue **réutilise** le composant. `onMounted` ne se relance pas… et la fiche reste sur l'ancien salarié." },
        { t: 'code', lang: 'js', code: `const route = useRoute()

async function charger() {
  salarie.value = await fetchSalarie(route.params.ID)
}

// ❌ onMounted(charger)  → seulement au premier affichage
// ✅ au montage ET à chaque changement d'ID :
watch(() => route.params.ID, charger, { immediate: true })` },
        { t: 'tip', text: "Si l'utilisateur va très vite (1 → 2 → 3), les réponses peuvent arriver dans le désordre. Astuce : mémorise l'ID demandé et ignore une réponse qui ne correspond plus à `route.params.ID`." },
      ],
      exercise: {
        kind: 'bug',
        task: "**Trouve le bug.** La fiche affiche le bon salarié au premier chargement, mais le bouton **Suivant** change l'URL sans changer la fiche. Corrige pour que la fiche suive toujours l'ID de l'URL.",
        open: 'pages/salaries/_ID.vue',
        readonly: ['App.vue'],
        files: {
          'App.vue': `<template><router-view /></template>`,
          'pages/index.vue': `<template><router-link to="/salaries/1">Commencer</router-link></template>`,
          'pages/salaries/_ID.vue': `<script setup>
import { fetchSalarie } from '@/lib/api'

const route = useRoute()
const salarie = ref(null)
const erreur = ref(null)

async function charger() {
  erreur.value = null
  try {
    salarie.value = await fetchSalarie(route.params.ID)
  } catch (e) {
    salarie.value = null
    erreur.value = e.message
  }
}

onMounted(charger)
</script>

<template>
  <div class="fiche">
    <h1 v-if="salarie" data-test="nom">{{ salarie.prenom }} {{ salarie.nom }}</h1>
    <p v-if="erreur" data-test="erreur">{{ erreur }}</p>
    <router-link data-test="suivant" :to="'/salaries/' + (Number(route.params.ID) + 1)">Suivant</router-link>
  </div>
</template>`,
        },
        solution: {
          'pages/salaries/_ID.vue': `<script setup>
import { fetchSalarie } from '@/lib/api'

const route = useRoute()
const salarie = ref(null)
const erreur = ref(null)

async function charger() {
  erreur.value = null
  try {
    salarie.value = await fetchSalarie(route.params.ID)
  } catch (e) {
    salarie.value = null
    erreur.value = e.message
  }
}

watch(() => route.params.ID, charger, { immediate: true })
</script>

<template>
  <div class="fiche">
    <h1 v-if="salarie" data-test="nom">{{ salarie.prenom }} {{ salarie.nom }}</h1>
    <p v-if="erreur" data-test="erreur">{{ erreur }}</p>
    <router-link data-test="suivant" :to="'/salaries/' + (Number(route.params.ID) + 1)">Suivant</router-link>
  </div>
</template>`,
        },
        tests: [
          { name: 'Premier affichage', run: async w => { await w.go('/salaries/1'); await w.until(() => w.exists('[data-test=nom]'), 'fiche 1'); expect(w.text('[data-test=nom]')).toBe('Léa Martin'); } },
          { name: 'Suivant charge la fiche suivante', run: async w => { await w.go('/salaries/1'); await w.until(() => w.exists('[data-test=nom]'), 'fiche 1'); await w.click('[data-test=suivant]'); await w.until(() => w.text('[data-test=nom]') === 'Hugo Bernard', 'la fiche 2 (Hugo Bernard) devrait s’afficher après Suivant', 800); } },
          { name: 'ID inconnu : message d’erreur, plus d’ancienne fiche', run: async w => { await w.go('/salaries/6'); await w.until(() => w.exists('[data-test=nom]'), 'fiche 6'); await w.click('[data-test=suivant]'); await w.until(() => w.exists('[data-test=erreur]'), 'le message pour l’ID 7', 800); expect(w.exists('[data-test=nom]'), 'Ancienne fiche encore affichée').toBeFalsy(); } },
        ],
        hints: [
          '`onMounted` ne se relance pas : le composant est réutilisé quand seul l’ID change.',
          'Remplace `onMounted(charger)` par `watch(() => route.params.ID, charger, { immediate: true })`.',
        ],
      },
      cards: [
        { id: '4-2a', q: 'De /salaries/1 à /salaries/2, le composant `_ID.vue`…', choices: ['Est détruit puis recréé', 'Est réutilisé (onMounted ne se relance pas)', 'Recharge toute l’app', 'Lève une erreur'], answer: 1, explain: 'Même route, autre paramètre : Vue garde l’instance. Il faut surveiller le paramètre.' },
        { id: '4-2b', q: 'Quelle ligne charge au montage ET à chaque changement d’ID ?', choices: ['`onMounted(charger)`', '`watch(route.params.ID, charger)`', '`watch(() => route.params.ID, charger, { immediate: true })`', '`computed(charger)`'], answer: 2, explain: 'Source sous forme de fonction + `immediate: true` pour le premier chargement.' },
        { id: '4-2c', q: 'Réponses dans le désordre (1 → 2 très vite) : comment éviter d’afficher la mauvaise fiche ?', choices: ['Ajouter un délai', 'Ignorer une réponse dont l’ID ne correspond plus à la route', 'Utiliser v-show', 'Recharger la page'], answer: 1, explain: 'On compare l’ID demandé à l’ID courant avant d’écrire la réponse (ou on annule la requête précédente).' },
      ],
    },

    {
      id: '4-3',
      title: 'Envoyer un formulaire',
      minutes: 15,
      goal: 'Soumettre, bloquer le double envoi, afficher l’erreur du serveur.',
      blocks: [
        { t: 'p', text: "Pour un envoi, trois choses comptent : **désactiver le bouton** pendant l'envoi (pas de double clic → double enregistrement), afficher **l'erreur métier** renvoyée par le serveur, et **confirmer** le succès." },
        { t: 'code', lang: 'vue', code: `<script setup>
import { saveAbsence } from '@/lib/api'

const form = reactive({ type: 'CP', debut: '', fin: '' })
const envoi = ref(false)
const erreur = ref(null)

async function envoyer() {
  if (envoi.value) return
  envoi.value = true
  erreur.value = null
  try {
    await saveAbsence({ ...form })
  } catch (e) {
    erreur.value = e.status === 400 ? e.message : 'Erreur serveur, réessaie.'
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <form @submit.prevent="envoyer">
    …
    <button :disabled="envoi">{{ envoi ? 'Envoi…' : 'Envoyer' }}</button>
  </form>
</template>` },
        { t: 'list', items: [
          '`@submit.prevent` empêche le rechargement de page du formulaire HTML.',
          '`{ ...form }` envoie une **copie** simple de l’objet réactif.',
          'Le statut HTTP (`e.status`) permet de distinguer une erreur de saisie (400) d’une panne (500).',
        ] },
        { t: 'sql', text: "Le serveur te renvoie une erreur métier comme un `RAISE_APPLICATION_ERROR(-20001, 'Dates invalides')` : le front l'affiche tel quel à l'utilisateur." },
      ],
      exercise: {
        kind: 'build',
        task: "Termine `envoyer()` : bloque le **double envoi** (bouton désactivé pendant l'envoi), affiche l'**erreur du serveur** (`data-test=\"erreur\"`, ex. « Dates invalides »), et en cas de succès affiche « Demande envoyée » (`data-test=\"succes\"`) puis vide les dates.",
        open: 'App.vue',
        files: {
          'App.vue': `<script setup>
import { saveAbsence } from '@/lib/api'

const form = reactive({ salarieId: 1, type: 'Congés payés', debut: '', fin: '' })
const envoi = ref(false)
const erreur = ref(null)
const succes = ref(false)

async function envoyer() {
  // à compléter
  await saveAbsence({ ...form })
}
</script>

<template>
  <form class="form" @submit.prevent="envoyer">
    <select v-model="form.type"><option>Congés payés</option><option>RTT</option></select>
    <label>Du <input data-test="debut" type="date" v-model="form.debut"></label>
    <label>Au <input data-test="fin" type="date" v-model="form.fin"></label>
    <button data-test="envoyer" :disabled="envoi">{{ envoi ? 'Envoi…' : 'Envoyer' }}</button>
    <p v-if="erreur" data-test="erreur" class="erreur">{{ erreur }}</p>
    <p v-if="succes" data-test="succes" class="succes">Demande envoyée</p>
  </form>
</template>

<style>
.form { display: grid; gap: 8px; max-width: 300px; font-family: system-ui; }
.erreur { color: #b91c1c; } .succes { color: #15803d; font-weight: 700; }
</style>`,
        },
        solution: {
          'App.vue': `<script setup>
import { saveAbsence } from '@/lib/api'

const form = reactive({ salarieId: 1, type: 'Congés payés', debut: '', fin: '' })
const envoi = ref(false)
const erreur = ref(null)
const succes = ref(false)

async function envoyer() {
  if (envoi.value) return
  envoi.value = true
  erreur.value = null
  succes.value = false
  try {
    await saveAbsence({ ...form })
    succes.value = true
    form.debut = ''
    form.fin = ''
  } catch (e) {
    erreur.value = e.message
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <form class="form" @submit.prevent="envoyer">
    <select v-model="form.type"><option>Congés payés</option><option>RTT</option></select>
    <label>Du <input data-test="debut" type="date" v-model="form.debut"></label>
    <label>Au <input data-test="fin" type="date" v-model="form.fin"></label>
    <button data-test="envoyer" :disabled="envoi">{{ envoi ? 'Envoi…' : 'Envoyer' }}</button>
    <p v-if="erreur" data-test="erreur" class="erreur">{{ erreur }}</p>
    <p v-if="succes" data-test="succes" class="succes">Demande envoyée</p>
  </form>
</template>

<style>
.form { display: grid; gap: 8px; max-width: 300px; font-family: system-ui; }
.erreur { color: #b91c1c; } .succes { color: #15803d; font-weight: 700; }
</style>`,
        },
        tests: [
          { name: 'Dates invalides : message du serveur', run: async w => { await w.input('[data-test=debut]', '2026-11-10'); await w.input('[data-test=fin]', '2026-11-02'); await w.click('[data-test=envoyer]'); await w.until(() => w.exists('[data-test=erreur]'), 'le message d’erreur'); expect(w.text('[data-test=erreur]')).toBe('Dates invalides'); } },
          { name: 'Succès : message et dates vidées', run: async w => { await w.input('[data-test=debut]', '2026-11-02'); await w.input('[data-test=fin]', '2026-11-06'); await w.click('[data-test=envoyer]'); await w.until(() => w.exists('[data-test=succes]'), 'le message de succès'); expect((w.get('[data-test=debut]') as HTMLInputElement).value, 'Date de début après envoi').toBe(''); expect(w.api.absences.length, 'Absences enregistrées').toBe(1); } },
          { name: 'Pas de double envoi', run: async w => { w.api.delay = 100; await w.input('[data-test=debut]', '2026-11-02'); await w.input('[data-test=fin]', '2026-11-03'); const b = w.get('[data-test=envoyer]'); b.click(); await w.flush(); b.click(); b.click(); await w.wait(200); expect(w.api.calls.saveAbsence ?? 0, 'Appels au serveur pour 3 clics rapides').toBe(1); } },
          { name: 'Une nouvelle tentative efface l’ancienne erreur', run: async w => { await w.input('[data-test=debut]', '2026-11-10'); await w.input('[data-test=fin]', '2026-11-02'); await w.click('[data-test=envoyer]'); await w.until(() => w.exists('[data-test=erreur]'), 'erreur'); await w.input('[data-test=fin]', '2026-11-12'); await w.click('[data-test=envoyer]'); await w.until(() => w.exists('[data-test=succes]'), 'succès'); expect(w.exists('[data-test=erreur]'), 'Ancienne erreur encore affichée').toBeFalsy(); } },
        ],
        hints: [
          "Commence par `if (envoi.value) return` puis `envoi.value = true`.",
          'Mets l’appel dans `try`, l’erreur dans `catch (e) { erreur.value = e.message }`, et `envoi.value = false` dans `finally`.',
          'Après succès : `succes.value = true`, `form.debut = \'\'`, `form.fin = \'\'`. Pense à remettre `erreur.value = null` au début.',
        ],
      },
      cards: [
        { id: '4-3a', q: 'À quoi sert `@submit.prevent` ?', choices: ['À valider le formulaire', 'À empêcher le rechargement de la page par le navigateur', 'À envoyer en JSON', 'À désactiver le bouton'], answer: 1, explain: 'Un `<form>` HTML recharge la page à l’envoi ; `.prevent` appelle `event.preventDefault()`.' },
        { id: '4-3b', q: 'Meilleure protection contre le double clic ?', choices: ['Un setTimeout', 'Un booléen `envoi` qui désactive le bouton et sort de la fonction', 'Rien', 'Recharger après l’envoi'], answer: 1, explain: 'Bouton `:disabled="envoi"` + `if (envoi.value) return` au début.' },
        { id: '4-3c', q: 'Pourquoi envoyer `{ ...form }` plutôt que `form` ?', choices: ['C’est plus rapide', 'Pour envoyer une copie simple, détachée de l’objet réactif', 'C’est obligatoire en Vue', 'Pour trier les champs'], answer: 1, explain: 'On évite de transmettre (et de voir modifié) le proxy réactif lui-même.' },
      ],
    },
  ],
};
