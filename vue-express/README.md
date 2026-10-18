# Vue Express

Apprendre **Vue 3** par la pratique, avec les outils d'un vrai projet d'entreprise : `<script setup>` auto-importé, routage par fichiers (`_ID.vue`), Pinia, PrimeVue, vue-i18n.

**En ligne :** https://danielteixeiradd7.github.io/Mobile/vue/ (PWA, fonctionne hors-ligne, s'installe sur l'écran d'accueil).

## Ce que contient l'app

- **8 modules, 25 leçons** : réactivité → composants → routage par fichiers → appels serveur → UI déclarative → Pinia → cycle de vie / polling → responsive + i18n.
- Chaque leçon : explication courte, exemples colorés, **pont PL/SQL** (« c'est comme un curseur / un package… »), mini-quiz.
- **Exercice vérifié automatiquement** : éditeur CodeMirror, aperçu en direct dans un faux navigateur, tests qui montent l'app et simulent un utilisateur. Exercices « chasse au bug » inclus.
- Indices progressifs, solution (moins d'XP), brouillons sauvegardés, confettis.
- **Révision espacée** (Leitner : 1, 3, 7, 16, 35 jours) des 75 cartes.
- XP, niveaux, série de jours, thème clair/sombre, export/import de la progression.

Données d'exercice **fictives** (salariés, absences). Aucun serveur, aucun compte, aucun suivi : tout reste dans le navigateur (`localStorage`).

## Comment ça marche

| Fichier | Rôle |
|---|---|
| `src/lib/compile.ts` | Compile les `.vue` / `.js` de l'exercice dans le navigateur (`@vue/compiler-sfc`), ajoute les auto-imports, lit le bloc `<route>`. |
| `src/lib/runtime.ts` | Monte le projet : mini routeur par fichiers (`pages/`), Pinia, i18n, PrimeVue, faux serveur. Bac à sable : écouteurs, minuteurs et largeur d'écran isolés, CSS préfixé (`scopeCss.ts`). |
| `src/lib/testing.ts` | Tests façon Testing Library (`click`, `input`, `until`, `go`, `resize`…), messages d'échec en français. |
| `src/lib/fakeApi.ts` | Faux serveur avec délai, erreurs 400/404 et export asynchrone (polling). |
| `src/content/m*.ts` | Les leçons, exercices, tests et cartes. |
| `src/pages/` | L'app elle-même, en routage par fichiers (comme dans les exercices). |

## Développer

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 90 tests : moteur + chaque leçon (le départ échoue, la solution passe)
npm run build      # vue-tsc puis build dans ../vue
```

Vérifié avant publication : `vue-tsc` sans erreur, 90 tests Vitest, et un test Playwright (Chromium) qui, pour **les 25 exercices**, lance les tests sur le code de départ (échec attendu) puis sur la solution (succès), plus un parcours complet en émulation iPhone 13 (aucun débordement horizontal, aucune erreur console).

## Licences

Vue, Vue Router, Pinia, vue-i18n, Vite, CodeMirror 6, PrimeVue **4** (MIT), PrimeIcons, PrimeFlex : toutes MIT. Coût : 0 €.
