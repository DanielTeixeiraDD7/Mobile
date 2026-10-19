# FitMaison v2 (Vue 3)

Source de l'app FitMaison ; le build est écrit à la racine du dépôt (voir le README principal).

```
src/core/figurine.ts    moteur de la figurine articulée (poses, interpolation, ancrage au sol)
src/core/exercices.ts   32 exercices : guide complet + animation
src/core/programmes.ts  séances, niveaux, planning, conseils
src/core/seance.ts      construction d'une séance (démos, remplacements)
src/core/calculs.ts     nutrition, tendance, série, badges
src/core/etat.ts        données (clé localStorage fitmaison_v1, compatible v1)
src/stores/fit.ts       store Pinia
src/components/         Figurine, GuideExercice, Lecteur, …
src/pages/              accueil, séances, exercices, poids, nutrition, profil
src/sw/sw.js            service worker (version = hash du build)
tests/                  poses (aucun membre sous le sol / hors cadre) + logique
```
