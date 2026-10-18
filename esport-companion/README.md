# Esport Companion

Centre de données esport personnel, multi-jeux, gratuit. Matchs en direct, calendrier, résultats, compétitions, équipes et **statistiques détaillées par partie**, depuis des sources réelles et vérifiables. Rien n'est inventé : une donnée non publiée est affichée comme indisponible.

**Ouvrir / installer** : https://danielteixeiradd7.github.io/Mobile/esport/
iPhone : Safari → Partager → « Sur l'écran d'accueil ».

## Ce que fait la v1

| | League of Legends | Dota 2 | VALORANT |
|---|---|---|---|
| Direct, calendrier, résultats | ✅ | ✅ (direct + résultats, pas de calendrier futur) | ✅ |
| Compétitions, classements, bracket | ✅ | 🟡 bilan calculé par ligue | ✅ |
| Rosters | ✅ | ✅ | — |
| Stats par partie | ✅ courbe de gold, kills, tours, inhibiteurs, barons, dragons, objectifs ; par joueur : KDA, CS, gold, objets, part des dégâts, wards | ✅ draft ordonnée, avantage gold/XP par minute, Roshan, bâtiments, événements datés ; par joueur : KDA, LH/DN, GPM/XPM, net worth, dégâts, soins, objets | ❌ non publié |
| Fiche joueur | via les parties | ✅ parties de tournoi récentes, pool de héros | — |

Et pour tous les jeux :

- **Accueil** personnalisable : jeux, ordre des sections.
- **Matchs** : filtres (jeu, statut, compétition, texte, période, favoris), vues enregistrées, export CSV.
- **Favoris** : équipes, joueurs, compétitions et jeux, plus l'historique des matchs consultés.
- **Analyse locale déterministe** : chaque phrase est étiquetée *fait*, *calcul* ou *interprétation*. Aucune prédiction.
- **Qualité des données** : provenance (officielle, communautaire, importée, calculée), date, contrôles de cohérence.
- **Imports** :
  - CSV/JSON avec aperçu, erreurs ligne par ligne et doublons signalés ;
  - saisie manuelle pour les jeux sans source (CS2, Rocket League…) ;
  - sauvegarde et restauration.
- **Rappels** des matchs favoris : export `.ics` vers Calendrier, plus des notifications quand l'app est ouverte.
- **Hors-ligne** : dernières données affichées avec leur âge. Thème sombre, ou clair en option. Mode anti-spoiler.

## Développement

```bash
cd esport-companion
npm install
npm run dev          # http://localhost:5173
npm test             # tests unitaires (données fictives)
npm run test:live    # tests contre les vraies API (réseau)
npm run typecheck
npm run build        # écrit ../esport (publié par GitHub Pages)
```

## Documentation

- [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) — audit des sources, conditions, tests réels
- [docs/GAME_COVERAGE.md](docs/GAME_COVERAGE.md) — couverture par jeu
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — architecture et ajout d'un jeu
- [docs/API_SETUP.md](docs/API_SETUP.md) — clés (aucune requise) et sources optionnelles
- [docs/COSTS.md](docs/COSTS.md) · [docs/PRIVACY.md](docs/PRIVACY.md) · [docs/TESTS.md](docs/TESTS.md) · [docs/ROADMAP.md](docs/ROADMAP.md)

Non affilié à Riot Games, Valve ou OpenDota. Données LoL/VALORANT : sites officiels lolesports.com et valorantesports.com (API non documentée). Dota 2 : OpenDota.
