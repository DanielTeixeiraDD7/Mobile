# Architecture

PWA 100 % client : React 19, TypeScript strict, Vite, IndexedDB (`idb`), service worker. Pas de serveur : le téléphone appelle directement les sources (CORS vérifié pour chacune).

```
src/
  core/                 commun à tous les jeux, sans React
    model.ts            modèle normalisé : Match, MatchGame, Competition, Tournament, Stage, Team, Player, Provenance…
    adapter.ts          interface GameAdapter (méthode absente = donnée indisponible) et GameDef
    http.ts             client HTTP : cache IndexedDB à durée de vie, données périmées en secours,
                        déduplication, limiteur par source, réessais 5xx/réseau, 429 + Retry-After, quota journalier
    limiter.ts          fenêtre glissante + blocage
    quality.ts          contrôles de cohérence, doublons par identifiant, validation des vainqueurs déduits
    filters.ts          filtres, tri, tableau de bord, regroupement par jour, colonnes de bracket
    analysis.ts         analyse déterministe (fait / calcul / interprétation), forme, confrontations
    csv.ts, backup.ts   import/export
    prefs.ts            préférences lues par les adaptateurs
  providers/            connecteurs bruts → modèle commun
    riot.ts             passerelle LoL/VALORANT Esports (normalisation commune)
    lolLivestats.ts     flux de stats en jeu : échantillonnage 1 image/min, reconstitution, objectifs déduits
    opendota.ts         OpenDota : séries reconstituées, direct
  games/                un adaptateur + une vue par jeu
    defs.ts             catalogue des jeux (couverture, explications)
    registry.ts         jeux actifs
    riotAdapter.ts      fabrique d'adaptateur pour les jeux Riot (LoL, VALORANT)
    dota2.ts            adaptateur Dota 2 (+ héros, objets, joueur)
    lolView.tsx, dotaView.tsx, valView.tsx   statistiques propres à chaque jeu
    views.ts            jeu → composant de partie
  data/                 stockage local (favoris, réglages, vues, imports, historique, cache) et flux multi-jeux
  hooks/useResource.ts  chargement : valeur connue d'abord, annulation, actualisation seulement app visible
  screens/              Accueil, Matchs, Compétitions, Favoris, Plus, fiches Match/Compétition/Équipe/Joueur/Jeu, Recherche, Sources, Données, Réglages
  ui/                   composants (cartes, logos, graphiques SVG, bandeaux d'état)
  sw/sw.js              service worker (généré au build avec la liste exacte des fichiers)
```

## Principes

- **Isolation des sources** : `loadFeed` charge chaque jeu avec `Promise.allSettled`. Une panne affiche un bandeau pour ce jeu ; les autres restent visibles.
- **Pas de valeur inventée** : champs inconnus à `null`, affichés « — » ou expliqués. Une valeur déduite (vainqueur LoL) porte l'étiquette « déduit ». Une valeur calculée (série Dota, bilans) porte « calculé ».
- **Provenance** : chaque `Match` a `prov` (source, type, date, confiance, note).
- **Identifiants** : `jeu:idSource`. Deux matchs ne sont jamais fusionnés sur des noms semblables ; un import proche d'un match de source est signalé, pas fusionné.
- **Fraîcheur** :

  | Donnée | Durée de cache |
  |---|---|
  | Direct | 30–60 s |
  | Calendrier | 3–5 min |
  | Matchs terminés, parties analysées | 30 jours / permanent |
  | Listes d'équipes, ligues, constantes | 1–7 jours |

- **Rafraîchissement** : uniquement quand l'app est visible, 1 min s'il y a du direct, 5 min sinon.
- **Hors-ligne** : réponse en cache servie avec `stale: true`, et l'âge est affiché.

## Ajouter un jeu

1. Une entrée dans `games/defs.ts` (couleur, genre, couverture, explication).
2. Un connecteur dans `providers/` qui produit des `Match` (et `MatchGame`) normalisés.
3. Un adaptateur qui implémente au minimum `matches` et `matchDetail` (le reste est facultatif), déclaré dans `games/registry.ts`.
4. Facultatif : une vue de partie dans `games/views.ts`.

Le reste (accueil, filtres, favoris, analyse de série, qualité, import, rappels) fonctionne sans autre changement. VALORANT est l'exemple d'un jeu à couverture partielle ; il réutilise l'adaptateur Riot.
