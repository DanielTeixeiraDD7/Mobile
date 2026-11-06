> Ce dépôt contient huit apps : **[Nocturne](nocturne-tcg/README.md)** (jeu de cartes gothique gacha/TCG ; source `nocturne-tcg/`, démo `nocturne/`, https://danielteixeiradd7.github.io/Mobile/nocturne/), **FitMaison** (source `fitmaison-app/`, build à la racine, ci-dessous ; ancienne version : `fitmaison-v1/`), **[Budget v2](budget-app/README.md)** (source `budget-app/`, build `budget/`, https://danielteixeiradd7.github.io/Mobile/budget/ ; ancienne version : `budget-v1/`), **[ScreenPilot](screenpilot/README.md)** (films, séries, anime, manga + temps d'écran ; source `screenpilot/`, build `anime/`, https://danielteixeiradd7.github.io/Mobile/anime/ ; remplace AnimePilot, dont la source reste dans `animepilot/`), **[Esport Companion](esport-companion/README.md)** (source `esport-companion/`, build `esport/`, https://danielteixeiradd7.github.io/Mobile/esport/), **[Vue Express](vue-express/README.md)** (source `vue-express/`, build `vue/`, https://danielteixeiradd7.github.io/Mobile/vue/) **[AutoRadar](autoradar/README.md)** (source `autoradar/`, build `auto/`, https://danielteixeiradd7.github.io/Mobile/auto/) et **[RiftScan](riftscan-app/README.md)** (scanner de cartes Riftbound et leur valeur ; source `riftscan-app/`, build `rift/`, https://danielteixeiradd7.github.io/Mobile/rift/).

# FitMaison ⚽ – Objectif Foot : perte de poids au poids du corps (v3, Vue 3)

PWA pour perdre du poids et retrouver du souffle avec des séances **sans matériel et sans saut**, à la maison ou au jardin, jusqu'au retour sur un terrain de foot. Hors-ligne, installable (iPhone / Android), données sur le téléphone. https://danielteixeiradd7.github.io/Mobile/

## Fonctionnalités
- **Plan « Objectif Foot »** (24 semaines minimum, 4 phases : Réveil → Fondations → Moteur → Retour terrain), jour par jour, avec bilans simples (marche de 6 min, assis-debout, escaliers…) pour passer à la phase suivante, règle de la douleur (genoux / dos), reprise douce après une pause, questionnaire santé inspiré du PAR-Q+, objectifs de pas progressifs. Sources dans `fitmaison-app/PLAN.md`.
- **Coach animé façon vidéo** : personnage illustré (silhouette mince ou costaud), décors salon / jardin / bureau, ralenti 0,25× et 0,5×, timeline, sous-titres des étapes, voix, miroir, plein écran.
- **50 exercices** expliqués (position de départ, étapes, respiration, points clés, erreurs, sensations, versions plus facile / plus dure), dont **pauses bureau** (anti-sédentarité) et **football** (conduite de balle, passes contre un mur, semelle, slalom, frappe, équilibre).
- **Mode bureau** : pause active de 4 min et rappel pendant les heures de travail (notification seulement si activée).
- Séances Full body, Cardio doux, Renfo, Marche, Mobilité, Souffle, Intervalles, Technique balle, Prévention, Marche / trottinement ; lecteur avec démo, « Trop dur ? », voix, bips, vibrations, écran allumé.
- **Progrès** (courbe, tendance, jalons vers le terrain), **nutrition** (Mifflin-St Jeor, repères de repas), habitudes, pas, eau, série, badges ; thème clair / sombre ; export / import JSON.

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
