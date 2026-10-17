# Feuille de route

| Phase | Contenu | État |
|---|---|---|
| 0 | Audit de l'environnement, choix technique, docs de base | ✅ |
| 1 | Squelette PWA : Vite/React/TS, 5 onglets, thème sombre, manifest, service worker, tests | ✅ |
| 2 | Données : IndexedDB versionnée, bibliothèque, statuts, historique | ⏳ |
| 3 | Catalogue AniList : recherche, fiche, cache, limiteur, hors-ligne | ⏳ |
| 4 | Progression : +1, saisie exacte, chapitres décimaux, annulation, anti double incrément | ⏳ |
| 5 | Calendrier des diffusions, rappels locaux, export `.ics` | ⏳ |
| 6 | Statistiques (exact vs estimé) | ⏳ |
| 7 | Profil de goûts, recommandations, assistant à règles | ⏳ |
| 8 | Export / import JSON versionné, aperçu, doublons ; onboarding | ⏳ |
| 9 | Finitions, accessibilité, tests E2E, déploiement | ⏳ |

## Après la v1 (non planifié, gratuit)

- Synchronisation optionnelle avec un compte AniList (OAuth, gratuit) pour faire d'AnimePilot un client complémentaire d'AniList.
- Migration native SwiftUI + SwiftData si un Mac devient disponible : `domain/` se transpose 1:1 (modèles → `@Model`, règles → fonctions pures Swift) ; l'export JSON v1 sert de format de migration.
