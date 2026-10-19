> Ce dépôt contient six apps : **FitMaison** (source `fitmaison-app/`, build à la racine, ci-dessous ; ancienne version : `fitmaison-v1/`), **[Budget v2](budget-app/README.md)** (source `budget-app/`, build `budget/`, https://danielteixeiradd7.github.io/Mobile/budget/ ; ancienne version : `budget-v1/`), **[ScreenPilot](screenpilot/README.md)** (films, séries, anime, manga + temps d'écran ; source `screenpilot/`, build `anime/`, https://danielteixeiradd7.github.io/Mobile/anime/ ; remplace AnimePilot, dont la source reste dans `animepilot/`), **[Esport Companion](esport-companion/README.md)** (source `esport-companion/`, build `esport/`, https://danielteixeiradd7.github.io/Mobile/esport/), **[Vue Express](vue-express/README.md)** (source `vue-express/`, build `vue/`, https://danielteixeiradd7.github.io/Mobile/vue/) et **[AutoRadar](autoradar/README.md)** (source `autoradar/`, build `auto/`, https://danielteixeiradd7.github.io/Mobile/auto/).

# FitMaison 🔥 – Perte de poids au poids du corps (v2, Vue 3)

PWA pour perdre du poids avec des séances **sans matériel et sans saut**, à la maison ou au jardin. Hors-ligne, installable (iPhone / Android), données sur le téléphone. https://danielteixeiradd7.github.io/Mobile/

## Fonctionnalités
- **Chaque exercice expliqué** : figurine animée (pause, ralenti, zone travaillée en orange), position de départ, étapes numérotées, respiration, tempo, points clés ✓, erreurs fréquentes ✗, ce que tu dois sentir, version plus facile / plus dure, sécurité, matériel (chaise, mur, marche…)
- **Lecteur de séance** : démo de 15 s avant un exercice jamais fait, consignes qui défilent, aperçu de l'exercice suivant pendant le repos, « Comment faire ? », « Trop dur ? » (remplacé et mémorisé), annonce « change de côté », bips, voix, vibrations, écran allumé
- Séances Full body, Cardio doux, Renfo & gainage, Marche active, Mobilité ; 3 niveaux ajustés selon le ressenti ; planning hebdo
- **Bibliothèque** : 32 exercices, recherche, catégories, favoris
- **Poids** (courbe, moyenne 7 j, tendance, objectif, IMC, paliers), **nutrition** (Mifflin-St Jeor, protéines, eau, repas), habitudes, pas, série, badges
- Thème clair / sombre, export / import JSON

## Développement
```bash
cd fitmaison-app
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest (poses de la figurine + calculs + compatibilité v1)
npm run build    # écrit index.html, assets/, sw.js à la racine du dépôt
```

Même clé `localStorage` (`fitmaison_v1`) et même URL que la v1 : l'app installée garde ses données. Le service worker (portée `/Mobile/`) ne touche qu'à ses propres fichiers et caches `fitmaison-*` (les autres apps ne sont pas affectées). La v1 reste consultable sur `/Mobile/fitmaison-v1/`.

> ⚠️ Ne remplace pas un avis médical. Consulte ton médecin avant de reprendre le sport si tu as des problèmes de santé.
