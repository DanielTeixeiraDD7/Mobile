> Ce dépôt contient six apps : **FitMaison** (racine, ci-dessous), **[Budget v2](budget-app/README.md)** (source `budget-app/`, build `budget/`, https://danielteixeiradd7.github.io/Mobile/budget/ ; ancienne version : `budget-v1/`), **[AnimePilot](animepilot/README.md)** (https://danielteixeiradd7.github.io/Mobile/anime/), **[Esport Companion](esport-companion/README.md)** (source `esport-companion/`, build `esport/`, https://danielteixeiradd7.github.io/Mobile/esport/), **[Vue Express](vue-express/README.md)** (source `vue-express/`, build `vue/`, https://danielteixeiradd7.github.io/Mobile/vue/) et **[AutoRadar](autoradar/README.md)** (source `autoradar/`, build `auto/`, https://danielteixeiradd7.github.io/Mobile/auto/).

# FitMaison 🔥 – Perte de poids au poids du corps

Application mobile (PWA) pour perdre du poids avec des séances **sans matériel et sans saut**, à la maison ou au jardin. Fonctionne hors-ligne, s’installe sur l’écran d’accueil (iPhone et Android). Les données restent sur le téléphone.

## Fonctionnalités
- **Séances guidées** avec minuteur, bips, annonce vocale, vibrations et écran maintenu allumé
  - Full body, Cardio doux, Renfo & gainage, Marche active (fractionnée), Mobilité
  - 3 niveaux (30/30 → 40/20 → 45/15) avec ajustement automatique selon ton ressenti
  - Exercices faible impact adaptés aux gabarits lourds (genoux et dos préservés), avec version plus facile
- **Planning hebdo** (lun Full · mar Marche · mer Cardio · jeu Mobilité · ven Renfo · sam Marche · dim Repos)
- **Suivi du poids** : courbe, moyenne 7 jours, tendance kg/semaine, date estimée d’objectif, IMC, paliers (120, 115, 110…)
- **Nutrition** : objectif calorique (Mifflin-St Jeor, déficit ~650 kcal), protéines, eau, journal des repas
- **Quotidien** : verres d’eau, pas, habitudes, série de jours, badges
- Export / import des données (JSON)

## Installer sur le téléphone
1. Héberger le dossier (ex. GitHub Pages : *Settings → Pages → Deploy from a branch* → choisir la branche, dossier `/ (root)`).
2. Ouvrir l’URL sur le téléphone :
   - **iPhone (Safari)** : Partager ⬆️ → *Sur l’écran d’accueil*
   - **Android (Chrome)** : menu ⋮ → *Installer l’application*

## Tester en local
```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Structure
```
index.html             page unique
css/style.css          styles (mobile first, thème sombre)
js/data.js             exercices, programmes, conseils
js/app.js              logique : vues, calculs, minuteur, stockage (localStorage)
sw.js                  service worker (hors-ligne)
manifest.webmanifest   installation PWA
icons/                 icônes
```

> ⚠️ Ne remplace pas un avis médical. Consulte ton médecin avant de reprendre le sport si tu as des problèmes de santé.
