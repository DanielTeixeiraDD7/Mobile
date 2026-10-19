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
| +1 épisode | durée de l'épisode (TMDB / AniList ; défaut 24 min anime, 40 min série) |
| +1 chapitre de manga | compté en **chapitres lus**, hors temps d'écran (option : chapitres × temps réglé) |
| Film « Vu aujourd'hui » | durée du film (défaut 1 h 50) |
| Passage à « Terminé » d'un titre en cours | épisodes restants |
| Ajout direct en « Terminé » / « Déjà vu » | rien (rattrapage) |
| Action annulée | rien |

Ce n'est pas le « Temps d'écran » du téléphone (inaccessible à une app web).

## Catalogue « À découvrir »

Les tendances mondiales TMDB sont surtout américaines. Les rangées partent donc du **pays** (réglable : France, Portugal, Belgique, Suisse, Canada ; par défaut selon la langue du téléphone) — `src/lib/catalogue.ts` :
au cinéma dans le pays, nouveautés en streaming dans le pays, cinéma / séries en langue locale, cinéma du monde (hors anglais), les mieux notés, puis tendances mondiales.
L'animation japonaise est rangée dans Anime (AniList), pas dans Films / Séries.

Les titres **pas encore sortis** (date de sortie future) n'apparaissent que dans « Prochainement », avec leur date ; « Vu aujourd'hui » est bloqué tant qu'ils ne sont pas sortis.

« Pour toi » apparaît dès le premier titre de la catégorie (même « à voir ») : recommandations TMDB / AniList de tes titres + listes du pays, classées selon tes genres.

## Où regarder / où lire

Sur chaque fiche, par pays (le tien par défaut, les autres en un geste pour comparer avec un ami) — `src/lib/streaming.ts` :
- films et séries : plateformes JustWatch via l'API TMDB (`watch/providers`) : abonnement, gratuit, location, achat ;
- anime : l'anime AniList est retrouvé dans TMDB (titre japonais, titre, année, popularité ; les saisons tombent sur la série), puis même chose ; sinon sites officiels AniList ;
- manga : sites de lecture officiels AniList, dans la langue du pays d'abord.

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

## Comptes et amis (facultatif)

Supabase (projet `iyefzfmvqrlbgvqshjqc`, clé *publishable* dans `src/config.ts`, jamais de clé secrète).
Sans compte, rien n'est chargé ni envoyé (la bibliothèque Supabase n'est téléchargée qu'à l'ouverture de la page Amis).

- Inscription email + mot de passe, pseudo, code ami `ABCD-1234` et lien d'invitation (`#/amis?code=…`).
- Demande → acceptation ; classement de la semaine (total, par catégorie ; manga en chapitres).
- Fiche ami : semaine jour par jour, comparaison, en ce moment, titres en commun, compatibilité, titres adorés.
- Partage réglable : temps d'écran (par défaut) et bibliothèque (sur option, sans notes perso). Suppression du compte en un geste.

Serveur : `supabase/schema.sql` (tables, RLS, fonctions) à exécuter une fois dans le SQL Editor.
Tests de sécurité : `supabase/tests-rls.sql` (sur une base de test locale, voir l'en-tête).
Réglage Supabase requis : *Authentication → Sign In / Providers → Email → Confirm email* **désactivé**
(l'envoi d'emails gratuit de Supabase est réservé aux membres du projet).
