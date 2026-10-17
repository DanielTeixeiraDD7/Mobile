# AnimePilot

Suivi personnel d'anime et de manga pour iPhone : une PWA gratuite, hors-ligne, sans compte.

**Ouvrir / installer** : https://danielteixeiradd7.github.io/Mobile/anime/ → Safari → Partager → « Sur l'écran d'accueil ».

## Fonctionnalités

- **Bibliothèque** anime et manga avec 6 statuts :
  - anime : À regarder, En cours, En pause, Terminé, Abandonné, À revoir ;
  - manga : les mêmes, avec À lire et À relire.
- **Progression** :
  - « +1 » en un appui, ou saisie exacte (chapitres décimaux : 10,5) ;
  - statut automatique : commencer passe le titre en cours, arriver au total le termine ;
  - historique, annulation de chaque action ;
  - un double appui accidentel ne compte qu'un épisode.
- **Catalogue AniList** :
  - recherche avec anti-rebond et annulation des requêtes ;
  - fiche avec synopsis et recommandations de la communauté ;
  - cache local qui garde ces données disponibles hors-ligne.
- **Calendrier** :
  - épisodes de la semaine pour tes anime suivis, épisodes en retard ;
  - rappels par export `.ics` vers le Calendrier iPhone, plus des notifications quand l'app est ouverte.
- **Statistiques** : chaque chiffre est étiqueté **exact** ou **estimé**, et l'hypothèse de chaque estimation est expliquée.
- **Profil de goûts**, **recommandations** calculées localement et **assistant à règles** (« J'ai 45 min, quoi regarder ? »), sans IA en ligne.
- **Sauvegardes** :
  - export / import JSON versionné ;
  - aperçu avant import, détection des doublons, choix en cas de conflit.
- **Présentation** au premier lancement ; thème sombre violet / indigo.

## Développement

```bash
cd animepilot
npm install
npm run dev         # http://localhost:5173
npm test            # 77 tests Vitest
npm run typecheck
npm run build       # écrit ../anime (publié par GitHub Pages)
```

## Documentation

| Fichier | Contenu |
|---|---|
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | audit de l'environnement, choix technique |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | organisation du code, flux de données |
| [docs/ROADMAP.md](docs/ROADMAP.md) | phases et suite |
| [docs/API.md](docs/API.md) | utilisation d'AniList, limites, conditions |
| [docs/TESTS.md](docs/TESTS.md) | stratégie et liste des tests |
| [docs/COSTS.md](docs/COSTS.md) | coûts (0 €) |
| [docs/PRIVACY.md](docs/PRIVACY.md) | données et vie privée |
| [docs/LIMITATIONS.md](docs/LIMITATIONS.md) | limites connues, honnêtement |

Données de catalogue : [AniList](https://anilist.co). AnimePilot n'est pas affilié à AniList.
