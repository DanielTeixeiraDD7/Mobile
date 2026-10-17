# Tests

```bash
npm test            # Vitest (jsdom + fake-indexeddb)
npm run typecheck   # TypeScript strict
```

**77 tests unitaires et d'intégration, tous verts** (3 exécutions consécutives sans échec).

| Fichier | Couvre |
|---|---|
| `router.test.ts` | routes, retour à l'onglet, ids invalides |
| `progress.test.ts` | épisodes entiers / chapitres décimaux, bornes, +1, statuts automatiques, revisionnage, notes |
| `store.test.ts` | IndexedDB réelle (fake-indexeddb) : ajout sans doublon, persistance, **anti double incrément** (appuis simultanés, valeur vue périmée, rebond < 300 ms), conflit entre onglets, annulations valides et périmées, suppression annulable, historique borné, ajout direct en « Terminé » |
| `anilist.test.ts` | client avec `fetch` simulé : normalisation, cache, 429 + `Retry-After`, 403, hors-ligne → cache périmé, annulation, erreurs GraphQL, pagination ; limiteur |
| `calendar.test.ts` | épisodes sortis / en retard, filtrage, regroupement par jour, `.ics` (CRLF, échappement, alarme, pliage UTF-8) |
| `insights.test.ts` | statistiques exactes / estimées, activité, profil de goûts, cosinus, recommandations (exclusions, raisons), assistant (intentions, durées « 1h30 », réponses honnêtes) |
| `backup.test.ts` | export/import aller-retour, fichiers invalides ou trop récents, nettoyage, doublons, aperçu, stratégies de fusion, écriture en base |
| `app.test.tsx` | rendu React : présentation → accueil, +1 depuis la bibliothèque (double clic = 1) |

## Tests de bout en bout (manuels, scriptés avec Playwright)

Chromium en émulation iPhone 13, contre l'**API AniList réelle**, sur le build de production :

- présentation, choix de la langue des titres ;
- recherche (une seule requête après la saisie complète), ajout « En cours » / « Terminé » ;
- saisie exacte, chapitre 83,5 puis +1 → 84 ;
- double tap = 1 épisode, annulation ;
- accueil : conseil « 2 épisodes sortis à rattraper » ;
- calendrier : épisode de la semaine, export `.ics` téléchargé et valide ;
- assistant : « J'ai 1h » → « 2 épisodes de … (24 min chacun) » ;
- statistiques avec badges exact / estimé ;
- recommandations : 12 titres avec leurs raisons ;
- export JSON → import : aperçu « 3 identiques » ;
- hors-ligne après rechargement : bibliothèque affichée, recherche servie depuis le cache avec bandeau.

Résultat : aucune erreur console, 8 requêtes AniList pour tout le scénario.

## Non testé ici

- Sur un vrai iPhone : installation, notifications, feuille de partage `.ics`. Voir LIMITATIONS.md.
