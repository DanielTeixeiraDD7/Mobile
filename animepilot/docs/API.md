# API AniList

- Point d'accès : `POST https://graphql.anilist.co` (GraphQL, sans clé, sans compte).
- Docs : https://docs.anilist.co/ (consultées le 17/10/2026).

## Requêtes utilisées (`src/api/queries.ts`)

| Requête | Usage | Cache local |
|---|---|---|
| `Search` | recherche par titre, `isAdult: false`, 20 résultats | 6 h |
| `Media` | fiche, synopsis, 12 recommandations communautaires | 24 h |
| `Batch` (`id_in`, 50 par page) | rafraîchit les titres suivis (prochain épisode, totaux) toutes les 6 h | — (copie dans la bibliothèque) |
| `Airing` (`airingSchedules`) | épisodes de la semaine des anime suivis | 1 h |
| `Trending` | candidats pour les recommandations | 12 h |

Toutes les requêtes ont été vérifiées contre l'API réelle (HTTP 200, sans erreur GraphQL).

## Limites de débit

- Doc AniList : 90 requêtes/min, **actuellement 30/min (mode dégradé)**. L'en-tête observé est `X-RateLimit-Limit: 30`.
- AnimePilot s'impose **25 requêtes/min** : fenêtre glissante dans `src/api/limiter.ts`.
- Si `X-RateLimit-Remaining` ≤ 1, l'app se bloque pendant 60 s.
- Sur un `429`, elle respecte `Retry-After` et ne relance pas automatiquement : l'utilisateur voit « Réessaie dans N s ».
- Recherche : anti-rebond de 400 ms, minimum 2 caractères, annulation (`AbortController`) de la requête précédente.
- Usage typique : 1 requête par recherche, 1 par fiche, au plus 6 pour calculer les recommandations, puis tout est en cache.

## Erreurs gérées (`ApiError.kind`)

| Cas | Comportement |
|---|---|
| `offline` (réseau coupé) | sert le cache même périmé, avec un bandeau « enregistré » ; sinon message clair |
| `rate_limited` (429) | blocage local, message avec délai |
| `unavailable` (403, 5xx) | « AniList indisponible », la bibliothèque reste utilisable |
| `not_found` (404) | « Titre introuvable » |
| `graphql` | message d'erreur AniList |
| `aborted` | ignoré silencieusement (saisie suivante) |

## Conditions d'utilisation : point d'attention ⚠️

Les conditions AniList (`/guide/terms-of-use`) disent notamment :

1. Usage gratuit pour le **non commercial** : c'est le cas, AnimePilot est personnel.
2. Interdit d'utiliser l'API comme **stockage ou sauvegarde**, ou de **collecter en masse** : l'app ne copie que les titres de *ta* bibliothèque. Son cache est borné à 300 réponses.
3. Interdit dans des **services concurrents de même nature, y compris les trackers de listes anime/manga**.

Le point 3 vise des *services* concurrents. AnimePilot est un outil personnel, non distribué, non commercial, sans comptes. Il cite AniList comme source et renvoie vers ses fiches. **Ce n'est pas une autorisation explicite.** Si l'app devait être publiée (App Store, autres utilisateurs), il faudrait :

- soit en faire un **client AniList** (connexion OAuth gratuite, la liste reste sur AniList ; voir ROADMAP) ;
- soit demander l'accord d'AniList (contact@anilist.co) ;
- soit changer de catalogue.

Autres conditions respectées :

- le nom ne contient pas « AniList » ;
- le contenu adulte est exclu (`isAdult: false`), ainsi que les tags adultes ou spoilers.
