import { expect } from '@/lib/expect';
import type { Module } from './types';


const COMPOSABLE_SOLUTION = `export function useEcran() {
  const largeur = ref(window.innerWidth)
  const estMobile = computed(() => largeur.value < 992)

  function maj() {
    largeur.value = window.innerWidth
  }

  onMounted(() => window.addEventListener('resize', maj))
  onBeforeUnmount(() => window.removeEventListener('resize', maj))

  return { largeur, estMobile }
}`;

export const m8: Module = {
  id: 8,
  title: 'Responsive et i18n',
  icon: 'pi pi-mobile',
  color: '#6366f1',
  summary: 'Composables, version mobile, traductions : finitions pro.',
  lessons: [
    {
      id: '8-1',
      title: 'Un composable useEcran()',
      minutes: 14,
      goal: 'Écrire un composable réutilisable qui suit la largeur d’écran (seuil 992 px).',
      blocks: [
        { t: 'p', text: "Un **composable** est une fonction `use…()` qui regroupe de l'état réactif et de la logique **réutilisable** (avec son propre cycle de vie). On le range dans `composables/`." },
        { t: 'code', lang: 'js', title: 'composables/useEcran.js', code: COMPOSABLE_SOLUTION },
        { t: 'code', lang: 'vue', title: 'Utilisation', code: `<script setup>
import { useEcran } from '@/composables/useEcran'
const { estMobile } = useEcran()
</script>
<template>
  <BarreDuBas v-if="estMobile" />
  <MenuLateral v-else />
</template>` },
        { t: 'list', items: [
          'Un composable peut utiliser `ref`, `computed`, `watch`, `onMounted`… comme un composant.',
          'Chaque appel crée **son propre état** (contrairement à un store Pinia, partagé).',
          'Il renvoie un objet de refs : on peut le déstructurer sans perdre la réactivité.',
        ] },
        { t: 'tip', text: "Pour du pur affichage, le CSS (`@media (max-width: 991px)`) ou les classes utilitaires suffisent. Le composable sert quand la **logique** change selon l'écran (colonnes, composants différents)." },
      ],
      exercise: {
        kind: 'build',
        task: "Écris `composables/useEcran.js` : une ref **`largeur`** (= `window.innerWidth`) mise à jour à chaque `resize` (écouteur ajouté au montage, retiré au démontage), et un computed **`estMobile`** vrai sous **992 px**. `App.vue` l'utilise déjà.",
        open: 'composables/useEcran.js',
        readonly: ['App.vue'],
        files: {
          'composables/useEcran.js': `export function useEcran() {
  const largeur = ref(window.innerWidth)
  // à compléter : estMobile (< 992), mise à jour sur resize, nettoyage

  return { largeur }
}`,
          'App.vue': `<script setup>
import { useEcran } from '@/composables/useEcran'
const { largeur, estMobile } = useEcran()
</script>

<template>
  <p data-test="mode">{{ estMobile ? 'Mobile' : 'Bureau' }}</p>
  <p data-test="largeur">{{ largeur }} px</p>
</template>`,
        },
        solution: { 'composables/useEcran.js': COMPOSABLE_SOLUTION },
        tests: [
          { name: 'Bureau à 1200 px', run: async w => { await w.resize(1200); expect(w.text('[data-test=mode]')).toBe('Bureau'); } },
          { name: 'Mobile sous 992 px, et suit le redimensionnement', run: async w => { await w.resize(1200); await w.resize(500); expect(w.text('[data-test=mode]'), 'Mode à 500 px').toBe('Mobile'); expect(w.text('[data-test=largeur]')).toBe('500 px'); await w.resize(992); expect(w.text('[data-test=mode]'), 'Mode à 992 px').toBe('Bureau'); } },
        ],
        hints: [
          '`const estMobile = computed(() => largeur.value < 992)`',
          '`function maj() { largeur.value = window.innerWidth }` puis `onMounted(() => window.addEventListener(\'resize\', maj))`.',
          'Nettoyage : `onBeforeUnmount(() => window.removeEventListener(\'resize\', maj))`, et `return { largeur, estMobile }`.',
        ],
      },
      cards: [
        { id: '8-1a', q: 'Différence entre un composable et un store Pinia ?', choices: ['Aucune', 'Chaque appel d’un composable crée son propre état ; un store est partagé', 'Un composable est plus lent', 'Un store ne peut pas avoir de computed'], answer: 1, explain: 'Composable = logique réutilisable (état local à chaque usage). Store = état unique partagé.' },
        { id: '8-1b', q: 'Convention de nommage d’un composable ?', choices: ['`getEcran()`', '`useEcran()`', '`EcranStore`', '`$ecran`'], answer: 1, explain: 'Préfixe `use` : `useEcran`, `useToast`, `useRoute`…' },
        { id: '8-1c', q: 'Un composable peut-il utiliser onMounted ?', choices: ['Non', 'Oui, s’il est appelé dans le setup d’un composant', 'Seulement dans un store', 'Seulement avec async'], answer: 1, explain: 'Les hooks s’attachent au composant qui appelle le composable pendant son setup.' },
      ],
    },

    {
      id: '8-2',
      title: 'Traductions avec $t()',
      minutes: 12,
      goal: 'Remplacer les textes en dur par des clés de traduction, avec paramètres.',
      blocks: [
        { t: 'p', text: "Avec **vue-i18n**, aucun texte n'est écrit en dur : on utilise une **clé** et `$t()` va chercher la traduction dans la langue courante." },
        { t: 'code', lang: 'js', title: 'Messages (fr)', code: `{
  "absences.titre": "Mes absences",
  "absences.solde": "Solde : {n} jour(s)",
  "commun.enregistrer": "Enregistrer"
}` },
        { t: 'code', lang: 'vue', code: `<template>
  <h1>{{ $t('absences.titre') }}</h1>
  <p>{{ $t('absences.solde', { n: solde }) }}</p>      <!-- paramètre -->
  <Button :label="$t('commun.enregistrer')" />          <!-- dans un attribut : ":" -->
</template>

<script setup>
const { t } = useI18n()                                // dans le script
toast.add({ summary: t('commun.enregistre') })
</script>` },
        { t: 'warn', text: "Dans un attribut, il faut le `:` : `label=\"$t('x')\"` afficherait littéralement « $t('x') »." },
      ],
      exercise: {
        kind: 'build',
        task: "Traduis l'écran avec les clés fournies : titre **`absences.titre`**, solde **`absences.solde`** avec le paramètre `n`, libellé du bouton **`commun.demander`** (attribut `label` du `<Button>`), et le message affiché après le clic avec **`absences.envoyee`** via `useI18n()` dans le script.",
        open: 'App.vue',
        messages: {
          'absences.titre': 'Mes absences',
          'absences.solde': 'Solde : {n} jour(s)',
          'commun.demander': 'Faire une demande',
          'absences.envoyee': 'Votre demande a bien été envoyée',
        },
        files: {
          'App.vue': `<script setup>
const solde = ref(12)
const message = ref('')

function demander() {
  message.value = 'Demande envoyée'
}
</script>

<template>
  <div style="font-family: system-ui">
    <h1 data-test="titre">Absences</h1>
    <p data-test="solde">Solde : {{ solde }}</p>
    <Button data-test="demander" label="Demander" @click="demander" />
    <p data-test="message">{{ message }}</p>
  </div>
</template>`,
        },
        solution: {
          'App.vue': `<script setup>
const { t } = useI18n()
const solde = ref(12)
const message = ref('')

function demander() {
  message.value = t('absences.envoyee')
}
</script>

<template>
  <div style="font-family: system-ui">
    <h1 data-test="titre">{{ $t('absences.titre') }}</h1>
    <p data-test="solde">{{ $t('absences.solde', { n: solde }) }}</p>
    <Button data-test="demander" :label="$t('commun.demander')" @click="demander" />
    <p data-test="message">{{ message }}</p>
  </div>
</template>`,
        },
        tests: [
          { name: 'Titre et solde traduits (avec paramètre)', run: w => { expect(w.text('[data-test=titre]')).toBe('Mes absences'); expect(w.text('[data-test=solde]')).toBe('Solde : 12 jour(s)'); } },
          { name: 'Libellé du bouton traduit', run: w => expect(w.text('[data-test=demander]'), 'Bouton').toBe('Faire une demande') },
          { name: 'Message du script traduit', run: async w => { await w.click('[data-test=demander]'); expect(w.text('[data-test=message]')).toBe('Votre demande a bien été envoyée'); } },
        ],
        hints: [
          "Template : `{{ $t('absences.titre') }}` et `{{ $t('absences.solde', { n: solde }) }}`.",
          "Bouton : `:label=\"$t('commun.demander')\"` (avec les deux-points).",
          "Script : `const { t } = useI18n()` puis `message.value = t('absences.envoyee')`.",
        ],
      },
      cards: [
        { id: '8-2a', q: 'Comment passer un paramètre à une traduction « Solde : {n} jour(s) » ?', choices: ["`$t('absences.solde') + n`", "`$t('absences.solde', { n: solde })`", "`$t('absences.solde', solde)`", "`$t('absences.solde.n')`"], answer: 1, explain: 'Les paramètres nommés se passent en objet, `{n}` est remplacé.' },
        { id: '8-2b', q: '`<Button label="$t(\'x\')">` affiche…', choices: ['La traduction', "Le texte « $t('x') »", 'Rien', 'Une erreur'], answer: 1, explain: 'Sans `:`, la valeur est une chaîne littérale. Il faut `:label="$t(\'x\')"`.' },
        { id: '8-2c', q: 'Pour traduire dans le `<script setup>` :', choices: ['`this.$t()`', '`const { t } = useI18n()` puis `t(\'cle\')`', '`$t()` directement', '`i18n.translate()`'], answer: 1, explain: 'Dans le script on utilise le composable `useI18n()` ; `$t` est pour le template.' },
      ],
    },

    {
      id: '8-3',
      title: 'Projet final : barre du bas mobile',
      minutes: 20,
      goal: 'Assembler composable, config déclarative et routeur dans un layout responsive.',
      blocks: [
        { t: 'p', text: "Dernière étape : un **layout** comme au travail. Sur bureau, un **menu latéral** ; sous 992 px, une **barre du bas**. Les entrées du menu viennent d'**une seule config** (déclaratif), affichée de deux façons." },
        { t: 'code', lang: 'vue', code: `<script setup>
import { useEcran } from '@/composables/useEcran'
const { estMobile } = useEcran()

const menu = [
  { to: '/', label: 'Accueil', icon: 'pi pi-home' },
  { to: '/absences', label: 'Absences', icon: 'pi pi-calendar' },
  { to: '/profil', label: 'Profil', icon: 'pi pi-user' },
]
</script>

<template>
  <div class="flex">
    <aside v-if="!estMobile">
      <router-link v-for="m in menu" :key="m.to" :to="m.to">{{ m.label }}</router-link>
    </aside>
    <main class="flex-1"><router-view /></main>
  </div>
  <nav v-if="estMobile" class="barre-bas">…même menu…</nav>
</template>` },
        { t: 'tip', text: "Tu as maintenant vu tout ce qui sert le plus au travail : réactivité, composants, routage par fichiers, appels serveur, config déclarative, Pinia, cycle de vie, PrimeVue, responsive et i18n. Bravo 🎉" },
      ],
      exercise: {
        kind: 'build',
        task: "Termine `App.vue` : à partir de la config **`menu`**, affiche un menu latéral (`data-test=\"lateral\"`) sur **bureau** et une barre du bas (`data-test=\"barre-bas\"`) sur **mobile** (< 992 px, via `useEcran`). Chaque entrée est un `router-link` avec la classe active, et `<router-view />` affiche la page.",
        open: 'App.vue',
        readonly: ['composables/useEcran.js', 'pages/index.vue', 'pages/absences/index.vue', 'pages/profil.vue'],
        files: {
          'composables/useEcran.js': COMPOSABLE_SOLUTION,
          'pages/index.vue': `<template><h1>Accueil</h1></template>`,
          'pages/absences/index.vue': `<template><h1>Absences</h1></template>`,
          'pages/profil.vue': `<template><h1>Profil</h1></template>`,
          'App.vue': `<script setup>
const menu = [
  { to: '/', label: 'Accueil', icon: 'pi pi-home' },
  { to: '/absences', label: 'Absences', icon: 'pi pi-calendar' },
  { to: '/profil', label: 'Profil', icon: 'pi pi-user' },
]
// à compléter : useEcran
</script>

<template>
  <div class="layout">
    <!-- à compléter : menu latéral (bureau) -->
    <main class="contenu"><!-- à compléter --></main>
  </div>
  <!-- à compléter : barre du bas (mobile) -->
</template>

<style>
.layout { display: flex; gap: 12px; font-family: system-ui; min-height: 200px; }
.lateral { display: flex; flex-direction: column; gap: 6px; width: 160px; padding: 10px; background: #f8fafc; border-radius: 12px; }
.contenu { flex: 1; padding-bottom: 70px; }
.barre-bas { position: fixed; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: repeat(3, 1fr); background: #fff; border-top: 1px solid #e2e8f0; }
.barre-bas a { display: grid; justify-items: center; padding: 8px 0; font-size: 12px; color: #64748b; text-decoration: none; }
a.router-link-exact-active { color: #42b883; font-weight: 700; }
</style>`,
        },
        solution: {
          'App.vue': `<script setup>
import { useEcran } from '@/composables/useEcran'

const { estMobile } = useEcran()

const menu = [
  { to: '/', label: 'Accueil', icon: 'pi pi-home' },
  { to: '/absences', label: 'Absences', icon: 'pi pi-calendar' },
  { to: '/profil', label: 'Profil', icon: 'pi pi-user' },
]
</script>

<template>
  <div class="layout">
    <aside v-if="!estMobile" class="lateral" data-test="lateral">
      <router-link v-for="m in menu" :key="m.to" :to="m.to" data-test="entree">
        <i :class="m.icon" /> {{ m.label }}
      </router-link>
    </aside>
    <main class="contenu"><router-view /></main>
  </div>
  <nav v-if="estMobile" class="barre-bas" data-test="barre-bas">
    <router-link v-for="m in menu" :key="m.to" :to="m.to" data-test="entree">
      <i :class="m.icon" /><span>{{ m.label }}</span>
    </router-link>
  </nav>
</template>

<style>
.layout { display: flex; gap: 12px; font-family: system-ui; min-height: 200px; }
.lateral { display: flex; flex-direction: column; gap: 6px; width: 160px; padding: 10px; background: #f8fafc; border-radius: 12px; }
.contenu { flex: 1; padding-bottom: 70px; }
.barre-bas { position: fixed; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: repeat(3, 1fr); background: #fff; border-top: 1px solid #e2e8f0; }
.barre-bas a { display: grid; justify-items: center; padding: 8px 0; font-size: 12px; color: #64748b; text-decoration: none; }
a.router-link-exact-active { color: #42b883; font-weight: 700; }
</style>`,
        },
        tests: [
          { name: 'Bureau : menu latéral, pas de barre du bas', run: async w => { await w.resize(1280); expect(w.exists('[data-test=lateral]'), 'Menu latéral').toBeTruthy(); expect(w.exists('[data-test=barre-bas]'), 'Barre du bas').toBeFalsy(); expect(w.findAll('[data-test=lateral] [data-test=entree]').length, 'Entrées du menu').toBe(3); } },
          { name: 'Mobile : barre du bas qui navigue', run: async w => { await w.resize(400); expect(w.exists('[data-test=barre-bas]'), 'Barre du bas à 400 px').toBeTruthy(); expect(w.exists('[data-test=lateral]'), 'Menu latéral à 400 px').toBeFalsy(); w.findAll('[data-test=barre-bas] [data-test=entree]')[1]!.click(); await w.flush(); await w.flush(); expect(w.text('h1'), 'Page après clic sur Absences').toBe('Absences'); expect(w.findAll('[data-test=barre-bas] [data-test=entree]')[1]!.classList.contains('router-link-exact-active'), 'Entrée active').toBeTruthy(); } },
          { name: 'Passage bureau → mobile en direct', run: async w => { await w.resize(1280); await w.resize(700); expect(w.exists('[data-test=barre-bas]')).toBeTruthy(); } },
        ],
        hints: [
          "`import { useEcran } from '@/composables/useEcran'` puis `const { estMobile } = useEcran()`.",
          '`<aside v-if="!estMobile" class="lateral" data-test="lateral">` avec `<router-link v-for="m in menu" :key="m.to" :to="m.to" data-test="entree">`.',
          'Mets `<router-view />` dans `<main>` et la barre `<nav v-if="estMobile" class="barre-bas" data-test="barre-bas">` après le layout.',
        ],
      },
      cards: [
        { id: '8-3a', q: 'Pourquoi une seule config `menu` pour le menu latéral ET la barre du bas ?', choices: ['Pour aller plus vite à l’exécution', 'Une seule source de vérité : ajouter une entrée la met partout', 'C’est obligatoire avec router-link', 'Pour le SEO'], answer: 1, explain: 'Interface déclarative : la liste décrit le menu, deux rendus l’affichent.' },
        { id: '8-3b', q: 'Classe ajoutée sur le lien exactement égal à l’URL courante ?', choices: ['`active`', '`router-link-exact-active`', '`current`', '`is-active`'], answer: 1, explain: '`router-link-active` = préfixe correspondant ; `router-link-exact-active` = correspondance exacte.' },
        { id: '8-3c', q: '`v-if` vs `v-show` pour basculer bureau/mobile ?', choices: ['Identiques', '`v-if` crée/détruit, `v-show` cache en CSS (display:none)', '`v-show` est plus récent', '`v-if` ne marche pas avec des composants'], answer: 1, explain: 'v-show garde l’élément dans le DOM ; v-if ne le rend que si la condition est vraie.' },
      ],
    },
  ],
};
