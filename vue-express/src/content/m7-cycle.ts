import { expect } from '@/lib/expect';
import type { Module } from './types';

const keydown = (key: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key }));

export const m7: Module = {
  id: 7,
  title: 'Cycle de vie et UI',
  icon: 'pi pi-sync',
  color: '#14b8a6',
  summary: 'Monter, nettoyer, interroger le serveur à intervalles, notifier.',
  lessons: [
    {
      id: '7-1',
      title: 'onMounted / onBeforeUnmount',
      minutes: 12,
      goal: 'Ajouter un écouteur global au montage et le retirer en quittant la page.',
      blocks: [
        { t: 'p', text: "Un composant naît (**montage**), vit, puis disparaît (**démontage**, par exemple quand on change de page). Tout ce qu'on branche **en dehors** du composant (écouteur sur `window`, minuteur, abonnement) doit être **débranché** au démontage, sinon ça continue à tourner : c'est une **fuite**." },
        { t: 'code', lang: 'js', code: `function surTouche(e) {
  if (e.key === 'Escape') fermer()
}

onMounted(() => window.addEventListener('keydown', surTouche))
onBeforeUnmount(() => window.removeEventListener('keydown', surTouche))` },
        { t: 'list', items: [
          '`onMounted` : le DOM existe, on peut charger, mesurer, s’abonner.',
          '`onBeforeUnmount` : dernier moment pour nettoyer (le DOM existe encore).',
          'Il faut passer **la même fonction** à `addEventListener` et `removeEventListener` (pas une fonction fléchée recréée).',
        ] },
        { t: 'sql', text: "C'est le principe `OPEN … CLOSE` d'un curseur : ce que tu ouvres, tu le fermes, même si tu sors plus tôt." },
      ],
      exercise: {
        kind: 'bug',
        task: "**Trouve le bug.** Sur `/editeur`, la touche **s** déclenche une sauvegarde. Mais après être revenu à l'accueil, la touche **s** sauvegarde encore (et ça s'accumule à chaque visite). Corrige la page pour retirer l'écouteur en la quittant.",
        open: 'pages/editeur.vue',
        readonly: ['App.vue', 'pages/index.vue'],
        files: {
          'App.vue': `<template>
  <nav style="display:flex; gap:12px; font-family:system-ui">
    <router-link to="/">Accueil</router-link>
    <router-link to="/editeur">Éditeur</router-link>
  </nav>
  <router-view />
</template>`,
          'pages/index.vue': `<template><h1>Accueil</h1></template>`,
          'pages/editeur.vue': `<script setup>
window.sauvegardes = window.sauvegardes ?? 0
const derniere = ref(null)

function sauvegarder() {
  window.sauvegardes++
  derniere.value = new Date().toLocaleTimeString('fr-FR')
}

onMounted(() => {
  window.addEventListener('keydown', e => {
    if (e.key === 's') sauvegarder()
  })
})
</script>

<template>
  <h1>Éditeur</h1>
  <p>Appuie sur « s » pour sauvegarder.</p>
  <p v-if="derniere" data-test="derniere">Sauvegardé à {{ derniere }}</p>
</template>`,
        },
        solution: {
          'pages/editeur.vue': `<script setup>
window.sauvegardes = window.sauvegardes ?? 0
const derniere = ref(null)

function sauvegarder() {
  window.sauvegardes++
  derniere.value = new Date().toLocaleTimeString('fr-FR')
}

function surTouche(e) {
  if (e.key === 's') sauvegarder()
}

onMounted(() => window.addEventListener('keydown', surTouche))
onBeforeUnmount(() => window.removeEventListener('keydown', surTouche))
</script>

<template>
  <h1>Éditeur</h1>
  <p>Appuie sur « s » pour sauvegarder.</p>
  <p v-if="derniere" data-test="derniere">Sauvegardé à {{ derniere }}</p>
</template>`,
        },
        tests: [
          { name: 'La touche s sauvegarde sur l’éditeur', run: async w => { (window as unknown as { sauvegardes: number }).sauvegardes = 0; await w.go('/editeur'); keydown('s'); await w.flush(); expect((window as unknown as { sauvegardes: number }).sauvegardes, 'Sauvegardes').toBe(1); expect(w.exists('[data-test=derniere]')).toBeTruthy(); } },
          { name: 'Plus de sauvegarde après avoir quitté la page', run: async w => { const g = window as unknown as { sauvegardes: number }; g.sauvegardes = 0; await w.go('/editeur'); await w.go('/'); await w.go('/editeur'); await w.go('/'); keydown('s'); await w.flush(); expect(g.sauvegardes, 'Sauvegardes déclenchées depuis l’accueil').toBe(0); } },
        ],
        hints: [
          'Une fonction fléchée créée dans `addEventListener` ne peut pas être retirée : donne-lui un nom (`function surTouche(e) {…}`).',
          '`onMounted(() => window.addEventListener(\'keydown\', surTouche))` et `onBeforeUnmount(() => window.removeEventListener(\'keydown\', surTouche))`.',
        ],
      },
      cards: [
        { id: '7-1a', q: 'Que se passe-t-il si on n’enlève pas un écouteur `window` en quittant la page ?', choices: ['Rien', 'Il continue de s’exécuter (fuite), et s’accumule à chaque visite', 'Vue l’enlève tout seul', 'La page plante'], answer: 1, explain: 'Vue ne connaît pas ce que tu branches sur `window` : à toi de nettoyer dans `onBeforeUnmount`.' },
        { id: '7-1b', q: 'Pourquoi `removeEventListener("keydown", e => …)` ne retire rien ?', choices: ['Mauvais nom d’événement', 'C’est une nouvelle fonction, différente de celle ajoutée', 'Il faut useCapture', 'Ça marche'], answer: 1, explain: 'Il faut la même référence de fonction : déclare-la avec un nom et réutilise-la.' },
        { id: '7-1c', q: 'Quand le DOM du composant est-il disponible ?', choices: ['Dans le setup directement', 'À partir de onMounted', 'Dans onBeforeMount', 'Jamais'], answer: 1, explain: '`onMounted` s’exécute après l’insertion du composant dans la page.' },
      ],
    },

    {
      id: '7-2',
      title: 'Polling avec nettoyage',
      minutes: 15,
      goal: 'Interroger le serveur jusqu’à la fin d’un traitement, et arrêter en quittant.',
      blocks: [
        { t: 'p', text: "Pour un traitement long (export, calcul de paie…), on **interroge le serveur** régulièrement jusqu'à ce qu'il réponde « terminé ». Avec `setTimeout` en chaîne, on ne relance la question **qu'après** la réponse précédente." },
        { t: 'code', lang: 'js', code: `let minuteur = null
let actif = true

async function verifier() {
  const r = await fetchStatutExport()
  if (!actif) return                        // page quittée pendant la requête
  statut.value = r.statut
  if (r.statut === 'en_cours') {
    minuteur = setTimeout(verifier, 2000)   // on réessaie plus tard
  } else {
    fichier.value = r.fichier
  }
}

onMounted(verifier)
onBeforeUnmount(() => {
  actif = false
  clearTimeout(minuteur)                    // on arrête en quittant la page
})` },
        { t: 'warn', text: "Le piège : si on quitte la page **pendant** une requête, `clearTimeout` ne suffit pas, car la réponse arrive après et relance un nouveau minuteur. D'où le drapeau `actif`, vérifié après chaque `await`." },
        { t: 'tip', text: "`setTimeout` en chaîne plutôt que `setInterval` : si le serveur est lent, les appels ne s'empilent pas." },
        { t: 'sql', text: "C'est une boucle `LOOP … EXIT WHEN statut = 'TERMINE'; DBMS_SESSION.SLEEP(2); END LOOP;`, mais **non bloquante** : l'écran reste utilisable pendant l'attente." },
      ],
      exercise: {
        kind: 'build',
        task: "Écris le polling de `pages/export.vue` : appelle `fetchStatutExport()`, et tant que le statut est `en_cours`, réessaie après **`INTERVALLE`** ms. Quand c'est `termine`, affiche le nom du fichier et **arrête**. Si on quitte la page, le polling doit **s'arrêter**, même si une requête était en cours.",
        open: 'pages/export.vue',
        readonly: ['App.vue', 'pages/index.vue'],
        files: {
          'App.vue': `<template><router-view /></template>`,
          'pages/index.vue': `<template><router-link to="/export">Lancer l'export</router-link></template>`,
          'pages/export.vue': `<script setup>
import { fetchStatutExport } from '@/lib/api'

const INTERVALLE = 60
const statut = ref('en_cours')
const fichier = ref(null)

// à compléter : verifier(), lancement au montage, arrêt en quittant
</script>

<template>
  <div style="font-family: system-ui">
    <p v-if="statut === 'en_cours'" data-test="en-cours"><ProgressSpinner style="width:20px;height:20px" /> Export en cours…</p>
    <p v-else data-test="termine">Export prêt : <strong>{{ fichier }}</strong></p>
  </div>
</template>`,
        },
        solution: {
          'pages/export.vue': `<script setup>
import { fetchStatutExport } from '@/lib/api'

const INTERVALLE = 60
const statut = ref('en_cours')
const fichier = ref(null)
let minuteur = null
let actif = true

async function verifier() {
  const r = await fetchStatutExport()
  if (!actif) return
  statut.value = r.statut
  if (r.statut === 'en_cours') {
    minuteur = setTimeout(verifier, INTERVALLE)
  } else {
    fichier.value = r.fichier
  }
}

onMounted(verifier)
onBeforeUnmount(() => {
  actif = false
  clearTimeout(minuteur)
})
</script>

<template>
  <div style="font-family: system-ui">
    <p v-if="statut === 'en_cours'" data-test="en-cours"><ProgressSpinner style="width:20px;height:20px" /> Export en cours…</p>
    <p v-else data-test="termine">Export prêt : <strong>{{ fichier }}</strong></p>
  </div>
</template>`,
        },
        tests: [
          { name: 'Finit par afficher le fichier', run: async w => { await w.go('/export'); await w.until(() => w.exists('[data-test=termine]'), 'le message « Export prêt »', 2000); expect(w.text('[data-test=termine]')).toContain('export-fictif.csv'); } },
          { name: 'S’arrête une fois terminé', run: async w => { await w.go('/export'); await w.until(() => w.exists('[data-test=termine]'), 'fin de l’export', 2000); const n = w.api.calls.fetchStatutExport ?? 0; expect(n, 'Appels (3 « en cours » + 1 « terminé »)').toBe(4); await w.wait(250); expect(w.api.calls.fetchStatutExport, 'Appels après la fin').toBe(n); } },
          { name: 'S’arrête quand on quitte la page', run: async w => { await w.go('/export'); await w.until(() => (w.api.calls.fetchStatutExport ?? 0) >= 1, 'premier appel'); await w.go('/'); const n = w.api.calls.fetchStatutExport ?? 0; await w.wait(300); expect(w.api.calls.fetchStatutExport ?? 0, 'Appels après avoir quitté la page').toBe(n); } },
        ],
        hints: [
          'Déclare `let minuteur = null` et une fonction `async function verifier()` qui appelle `fetchStatutExport()`.',
          "Si `r.statut === 'en_cours'` : `minuteur = setTimeout(verifier, INTERVALLE)`, sinon `fichier.value = r.fichier`.",
          '`onMounted(verifier)` et `onBeforeUnmount(() => clearTimeout(minuteur))`.',
          "Si tu quittes la page pendant une requête, la réponse relance un minuteur : ajoute `let actif = true`, mets-le à `false` dans `onBeforeUnmount`, et fais `if (!actif) return` juste après l'`await`.",
        ],
      },
      cards: [
        { id: '7-2a', q: 'Pourquoi un setTimeout en chaîne plutôt que setInterval pour le polling ?', choices: ['C’est plus court', 'On ne relance qu’après la réponse : pas d’appels empilés si le serveur est lent', 'setInterval n’existe pas', 'Pour le SEO'], answer: 1, explain: 'setInterval tire même si la réponse précédente n’est pas arrivée.' },
        { id: '7-2b', q: 'Que faire dans `onBeforeUnmount` pour un polling ?', choices: ['Rien', '`clearTimeout(minuteur)`', 'Recharger la page', 'Appeler encore une fois le serveur'], answer: 1, explain: 'Sinon les appels continuent en arrière-plan après avoir quitté la page.' },
        { id: '7-2c', q: 'Où démarrer le polling ?', choices: ['Dans le template', '`onMounted(verifier)`', 'Dans un computed', 'Dans le store uniquement'], answer: 1, explain: 'Au montage de la page ; et on l’arrête au démontage.' },
      ],
    },

    {
      id: '7-3',
      title: 'Toasts et confirmations (PrimeVue)',
      minutes: 12,
      goal: 'Confirmer une action dangereuse et notifier le résultat.',
      blocks: [
        { t: 'p', text: "PrimeVue fournit des services prêts à l'emploi : **`useToast()`** pour les notifications, **`useConfirm()`** pour les confirmations. Il faut placer une fois `<Toast />` et `<ConfirmDialog />` dans la page (souvent dans `App.vue`)." },
        { t: 'code', lang: 'js', code: `import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

function supprimer(demande) {
  confirm.require({
    message: 'Supprimer cette demande ?',
    header: 'Confirmation',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    accept: () => {
      demandes.value = demandes.value.filter(d => d.id !== demande.id)
      toast.add({ severity: 'success', summary: 'Demande supprimée', life: 3000 })
    },
  })
}` },
        { t: 'list', items: [
          '`severity` : `success`, `info`, `warn`, `error`.',
          '`life` : durée d’affichage en ms (sans `life`, le toast reste).',
          'Autres composants très utilisés : `<Drawer>` (panneau latéral, appelé `<Sidebar>` en PrimeVue 3), `<ProgressSpinner>`, `<Button>`.',
        ] },
      ],
      exercise: {
        kind: 'build',
        task: "Le bouton **Supprimer** supprime tout de suite. Ajoute une **confirmation** (`useConfirm`, bouton d'acceptation « Supprimer ») : la demande n'est retirée qu'après acceptation, puis un **toast** de succès « Demande supprimée » s'affiche.",
        open: 'App.vue',
        files: {
          'App.vue': `<script setup>
const demandes = ref([
  { id: 1, libelle: 'Congés · 3 jours' },
  { id: 2, libelle: 'RTT · 1 jour' },
])

function supprimer(d) {
  demandes.value = demandes.value.filter(x => x.id !== d.id)
}
</script>

<template>
  <Toast />
  <ConfirmDialog />
  <ul style="font-family: system-ui">
    <li v-for="d in demandes" :key="d.id" data-test="demande">
      {{ d.libelle }}
      <Button :data-test="'suppr-' + d.id" label="Supprimer" severity="danger" text @click="supprimer(d)" />
    </li>
  </ul>
</template>`,
        },
        solution: {
          'App.vue': `<script setup>
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

const demandes = ref([
  { id: 1, libelle: 'Congés · 3 jours' },
  { id: 2, libelle: 'RTT · 1 jour' },
])

function supprimer(d) {
  confirm.require({
    message: 'Supprimer cette demande ?',
    header: 'Confirmation',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    accept: () => {
      demandes.value = demandes.value.filter(x => x.id !== d.id)
      toast.add({ severity: 'success', summary: 'Demande supprimée', life: 3000 })
    },
  })
}
</script>

<template>
  <Toast />
  <ConfirmDialog />
  <ul style="font-family: system-ui">
    <li v-for="d in demandes" :key="d.id" data-test="demande">
      {{ d.libelle }}
      <Button :data-test="'suppr-' + d.id" label="Supprimer" severity="danger" text @click="supprimer(d)" />
    </li>
  </ul>
</template>`,
        },
        tests: [
          { name: 'Une confirmation apparaît, rien n’est supprimé tout de suite', run: async w => { await w.click('[data-test=suppr-1]'); await w.flush(); expect(w.bodyText(), 'Page').toContain('Supprimer cette demande ?'); expect(w.findAll('[data-test=demande]').length, 'Demandes avant confirmation').toBe(2); } },
          { name: 'Accepter supprime et affiche un toast', run: async w => { await w.click('[data-test=suppr-2]'); await w.flush(); const ok = [...document.body.querySelectorAll<HTMLElement>('.p-confirmdialog button')].find(b => b.textContent?.includes('Supprimer')); expect(!!ok, 'Bouton « Supprimer » de la confirmation').toBeTruthy(); ok!.click(); await w.wait(30); expect(w.findAll('[data-test=demande]').length, 'Demandes après confirmation').toBe(1); expect(w.bodyText(), 'Page').toContain('Demande supprimée'); } },
          { name: 'Annuler ne supprime rien', run: async w => { await w.click('[data-test=suppr-1]'); await w.flush(); const non = [...document.body.querySelectorAll<HTMLElement>('.p-confirmdialog button')].find(b => b.textContent?.includes('Annuler')); expect(!!non, 'Bouton « Annuler »').toBeTruthy(); non!.click(); await w.wait(30); expect(w.findAll('[data-test=demande]').length).toBe(2); } },
        ],
        hints: [
          "Importe `useToast` depuis 'primevue/usetoast' et `useConfirm` depuis 'primevue/useconfirm'.",
          "Dans `supprimer` : `confirm.require({ message: 'Supprimer cette demande ?', acceptLabel: 'Supprimer', rejectLabel: 'Annuler', accept: () => { … } })`.",
          "Dans `accept` : filtre la liste puis `toast.add({ severity: 'success', summary: 'Demande supprimée', life: 3000 })`.",
        ],
      },
      cards: [
        { id: '7-3a', q: 'Que faut-il pour que `toast.add(...)` affiche quelque chose ?', choices: ['Rien', 'Un composant `<Toast />` présent dans la page', 'Un store', 'Un watch'], answer: 1, explain: 'Le service envoie le message ; le composant `<Toast />` l’affiche.' },
        { id: '7-3b', q: 'Dans `confirm.require`, où mettre la suppression ?', choices: ['Avant l’appel', 'Dans `accept`', 'Dans `reject`', 'Après l’appel'], answer: 1, explain: 'La confirmation est asynchrone : l’action ne doit se faire que dans `accept`.' },
        { id: '7-3c', q: 'En PrimeVue 4, le panneau latéral `<Sidebar>` s’appelle…', choices: ['`<Panel>`', '`<Drawer>`', '`<Aside>`', '`<Slide>`'], answer: 1, explain: '`Sidebar` a été renommé `Drawer` en PrimeVue 4 (même principe : `v-model:visible`).' },
      ],
    },
  ],
};
