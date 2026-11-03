# FitMaison v3 (Vue 3) — Objectif Foot

Source de l'app FitMaison ; le build est écrit à la racine du dépôt (voir le README principal).

```
src/core/figurine.ts    moteur de la figurine articulée (poses, interpolation, ancrage au sol)
src/core/exercices.ts   50 exercices (dont Bureau et Football) : guide complet + animation
src/core/plan.ts        plan « Objectif Foot » (4 phases, bilans, règle de la douleur, reprise) — sources : PLAN.md
src/core/programmes.ts  séances, niveaux, planning, conseils
src/core/seance.ts      construction d'une séance (démos, remplacements)
src/core/calculs.ts     nutrition, tendance, série, badges
src/core/etat.ts        données (clé localStorage fitmaison_v1, compatible v1)
src/stores/fit.ts       store Pinia
src/components/         Figurine (coach illustré), CoachVideo (lecteur vidéo), GuideExercice, Lecteur, CartePlanDuJour, …
src/pages/              accueil, plan, séances, exercices, progrès, nutrition, profil
src/sw/sw.js            service worker (version = hash du build)
tests/                  poses (aucun membre sous le sol / hors cadre) + logique
```
