# ScreenPilot

Suivi de **films, séries, anime et manga** + **temps d'écran estimé** (jour / semaine / mois, par catégorie).
Vue 3 + Pinia + Vite, PWA hors-ligne, sans compte. Remplace AnimePilot à la même adresse :
https://danielteixeiradd7.github.io/Mobile/anime/

## Données conservées (migration AnimePilot)

- Même URL → même base IndexedDB `animepilot` et même icône d'écran d'accueil sur iPhone.
- Identifiants des titres inchangés (`anilist:ANIME:id`) ; nouveaux : `tmdb:MOVIE:id`, `tmdb:TV:id`.
- Le nouveau service worker supprime les caches `animepilot-*` et recharge la page une fois.
- Sauvegardes AnimePilot importables (format `animepilot-backup` v1 conservé).

## Temps d'écran (estimation)

Calculé depuis l'historique (`src/domain/screentime.ts`), donc aussi pour le passé :

| Action | Compté |
|---|---|
| +1 épisode / chapitre | durée de l'épisode (TMDB / AniList ; défaut 24 min anime, 40 min série) ; chapitre = réglage (5 min) |
| Film « Vu aujourd'hui » | durée du film (défaut 1 h 50) |
| Passage à « Terminé » d'un titre en cours | épisodes restants |
| Ajout direct en « Terminé » / « Déjà vu » | rien (rattrapage) |
| Action annulée | rien |

Ce n'est pas le « Temps d'écran » du téléphone (inaccessible à une app web).

## Catalogue « À découvrir »

Les tendances mondiales TMDB sont surtout américaines. Les rangées partent donc du **pays** (réglable : France, Portugal, Belgique, Suisse, Canada ; par défaut selon la langue du téléphone) — `src/lib/catalogue.ts` :
au cinéma dans le pays, nouveautés en streaming dans le pays, cinéma / séries en langue locale, cinéma du monde (hors anglais), les mieux notés, puis tendances mondiales.
L'animation japonaise est rangée dans Anime (AniList), pas dans Films / Séries.

« Pour toi » apparaît dès le premier titre de la catégorie (même « à voir ») : recommandations TMDB / AniList de tes titres + listes du pays, classées selon tes genres.

## Sources

- Films / séries : API TMDB v3 (clé publique de lecture, usage **non commercial**, attribution dans Réglages).
- Anime / manga : API GraphQL AniList.

## Commandes

```bash
npm install
npm run dev        # développement
npm test           # Vitest (domaine, API mockées, stockage)
npm run build      # vue-tsc + build vers ../anime (servi par GitHub Pages)
```

## Arborescence

- `src/domain/` : règles pures (progression, temps d'écran, stats, goûts, assistant local, sauvegarde).
- `src/data/` : IndexedDB, historique avec annulation, rafraîchissement des fiches.
- `src/api/` : clients AniList et TMDB (limitation de débit, cache, repli hors-ligne).
- `src/pages/` : routes (Accueil, Bibliothèque, Recherche, Fiche, Temps, Calendrier, Profil, Données, Réglages).

## Phase 2 (prévue)

Compte facultatif (Supabase), amis par code, classement hebdomadaire, titres en commun. Privé par défaut.
