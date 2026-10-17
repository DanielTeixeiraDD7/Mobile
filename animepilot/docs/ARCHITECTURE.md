# Architecture

Application 100 % côté client. Aucune donnée personnelle ne quitte le téléphone ; seules des **recherches de catalogue** partent vers AniList.

```
src/
  domain/     logique pure, sans React ni IndexedDB (testée unitairement)
    types.ts        modèles : LibraryEntry, HistoryEvent, MediaSnapshot, Settings
    labels.ts       libellés FR (statuts anime/manga, formats, saisons)
    progress.ts     progression, statuts automatiques, annulation, anti double incrément
    stats.ts        statistiques (valeurs exactes vs estimations)
    taste.ts        profil de goûts
    recommend.ts    moteur de recommandations local
    assistant.ts    assistant à règles
    calendar.ts     regroupement des diffusions, export .ics
    backup.ts       export / import JSON versionné, aperçu, doublons
  data/       persistance IndexedDB (idb)
    db.ts           schéma versionné et migrations
    repo.ts         lecture / écriture bibliothèque + historique (transactions atomiques)
    store.ts        état en mémoire + abonnement React (useSyncExternalStore)
    refresh.ts      mise à jour des infos AniList des titres suivis (toutes les 6 h, par lots de 50)
  api/        catalogue AniList
    anilist.ts      client GraphQL : limiteur, annulation, erreurs typées
    queries.ts      requêtes GraphQL
    cache.ts        cache IndexedDB avec durée de vie, repli hors-ligne
    mapper.ts       réponse AniList → MediaSnapshot
    limiter.ts      limiteur de débit (fenêtre glissante + blocage 429)
  hooks/      useOnline, useSearch, useDetails, useAiring, useRecommendations
  reminders.ts  notifications locales (app ouverte) + export .ics
  ui/         composants réutilisables (affiche, toast, feuille modale, icônes)
  screens/    un écran par onglet + fiche, recherche, données, réglages
  sw/sw.js    service worker (modèle, complété au build)
```

## Principes

- **Local d'abord** : la bibliothèque est la source de vérité, stockée dans IndexedDB. L'app fonctionne entièrement hors-ligne sauf la recherche de nouveaux titres.
- **Domaine pur** : toute la logique métier est dans `domain/`, sans dépendance au navigateur. Elle est portable telle quelle vers une future app native (Swift : mêmes modèles, mêmes règles ; voir ROADMAP).
- **Écritures atomiques** : une modification de progression écrit l'entrée **et** l'événement d'historique dans la même transaction IndexedDB.
- **Comparer-et-écrire** : chaque incrément envoie la valeur attendue (`from`). Si la valeur stockée a déjà changé (double appui, deux onglets), l'écriture est refusée : pas de double incrément.
- **Pas de fausses données** : une affiche absente reste un bloc neutre avec l'initiale ; un total inconnu s'affiche « ? » ; les estimations sont étiquetées.

## Flux d'une recherche

saisie → anti-rebond 400 ms → annulation de la requête précédente (`AbortController`) → cache IndexedDB (frais ?) → limiteur (25 req/min, respecte `Retry-After`) → AniList → cache → affichage. Hors-ligne : résultat en cache marqué « hors-ligne », sinon message clair.

## Service worker

Généré au build avec la liste exacte des fichiers et une version dérivée de leur contenu. Page : réseau d'abord. Fichiers du build : cache. Affiches AniList : cache (400 max). Les réponses GraphQL ne passent **pas** par le cache du SW (gérées par `api/cache.ts`).
