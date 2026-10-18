# Sources de données — audit du 18/10/2026

Tests réels depuis l'environnement de développement :

- requêtes HTTP avec l'en-tête `Origin` de l'app (GitHub Pages) pour vérifier le **CORS**. C'est indispensable : l'app n'a pas de serveur, le téléphone appelle directement les API ;
- lecture des conditions d'utilisation publiées.

## Retenues

### 1. LoL Esports — API « persisted gateway » (League of Legends) ✅

- URL : `https://esports-api.lolesports.com/persisted/gw/*` et `https://feed.lolesports.com/livestats/v1/*`.
- Accès : clé publique `x-api-key` **intégrée par Riot dans le site lolesports.com** (pas de compte, pas de paiement). CORS `*` vérifié.
- Statut : **non documentée officiellement**. C'est l'API qu'utilise le site officiel, largement réutilisée par la communauté. Riot peut la modifier ou la couper sans préavis, et le Riot Developer Portal ne propose pas de données esport.
- Endpoints vérifiés :

| Endpoint | Contenu vérifié |
|---|---|
| `getLeagues` | ligues (LEC, LCK, Worlds…) |
| `getTournamentsForLeague` | éditions (Worlds 2015 → 2026) |
| `getSchedule` | calendrier et résultats paginés : équipes, score de série, BO1/3/5, phase |
| `getLive` | matchs en cours |
| `getEventDetails` | parties d'un match, côtés, VOD |
| `getStandings` | phases, sections, matchs, classements |
| `getTeams` | roster actuel avec rôles |
| `livestats/window/{gameId}` | images toutes les ~10 s : gold, kills, tours, inhibiteurs, barons, dragons par équipe ; niveau, KDA, CS, PV par joueur ; champions et rôles |
| `livestats/details/{gameId}` | par joueur : objets, dégâts (part), wards, kill participation, runes |

- Paramètre `startingTime` : rejouer une partie terminée. Vérifié sur une partie de Worlds 2026 du 17/10 (gold 64 407 / 54 407, kills 21 / 8, 4 dragons, 8 tours).
- Limites : non publiées. L'app espace ses appels (≤ 20 req/min), met tout en cache, et ne télécharge les images d'une partie qu'à l'ouverture de sa fiche.
- Usage retenu : **personnel, non commercial**.

### 1 bis. Leaguepedia (lol.fandom.com, Cargo) — complément LoL ✅

- URL : `https://lol.fandom.com/api.php?action=cargoquery&origin=*` — CORS `*` vérifié. Contenu **CC BY-SA 3.0** (attribution affichée).
- Rôle : **vainqueur officiel de chaque partie** et **draft complète dans l'ordre** (tables `MatchSchedule`, `MatchScheduleGame`, `PicksAndBansS7`). Vérifié sur MVK–FURIA (Worlds 2026) : 4 parties, vainqueurs 1-1-2-1.
- Requête réelle validée le 18/10/2026 : 4 parties MVK–FURIA, vainqueurs 1-1-2-1 (= 3-1 publié par Riot), 10 bans et 10 picks par partie.
- **Incohérence constatée** : pour la partie 1, les picks « Team1 » de `PicksAndBansS7` sont les champions joués côté **rouge** d'après le flux officiel. L'app compare donc toujours les picks aux champions du flux. S'ils sont inversés, elle les rattache à la bonne équipe et masque l'ordre de sélection, qui n'est plus garanti. S'ils ne correspondent pas, la draft n'est pas affichée.
- Rapprochement avec lolesports : **noms d'équipes exacts** + date ±18 h, puis contrôle contre le score de la série. Aucun rapprochement approximatif.
- Limite : stricte pour les requêtes anonymes. L'IP partagée du serveur de test a été limitée après 3 requêtes. L'app fait 1 requête par match ouvert, garde le résultat 30 jours, détecte l'erreur `ratelimited` (renvoyée en HTTP 200) et se met en pause. En cas d'échec, la fiche garde le vainqueur déduit.

### 2. Riot VALORANT Esports — même passerelle ✅ (partiel)

- URL : `https://esports-api.service.valorantesports.com/persisted/val/*` (même clé publique, `sport=val`). CORS `*` vérifié.
- Contenu vérifié :
  - `getLeagues` (Champions, Masters, VCT Americas/EMEA/Pacific/China, Game Changers) ;
  - `getSchedule` (score de série, BO) ;
  - `getEventDetails` (nombre de cartes, VOD) ;
  - `getStandings`, `getTournamentsForLeague`.
- **Pas de statistiques par carte ou par joueur** (ni ACS, ADR, rounds, agents) dans cette API.
- `getLive` renvoie une erreur de paramètres : direct non disponible.
- Même statut non documenté que LoL Esports.

### 3. OpenDota (Dota 2) ✅

- URL : `https://api.opendota.com/api/*`. Docs : https://docs.opendota.com/ — offre : https://www.opendota.com/api-keys
- Gratuit **sans clé**. En-têtes observés : 60 req/min et 3 000 req/jour (`x-rate-limit-remaining-*`). La clé « premium » exige une carte bancaire : **jamais utilisée**.
- CORS : origine renvoyée.
- Contenu vérifié :
  - `proMatches` (matchs pros récents) ;
  - `live` (parties en cours, dont pros) ;
  - `matches/{id}` : picks/bans avec ordre, durée, avantage de gold et d'XP **minute par minute**, objectifs (premier sang, Roshan, tours, Aegis), tours et casernes, et pour chaque joueur : KDA, last hits/denies, GPM/XPM, net worth, dégâts, soins, objets, rôle de lane ;
  - `teams`, `teams/{id}/matches|players`, `leagues`, `proPlayers`, `constants/heroes|items`.
- Les courbes n'existent que pour les matchs **analysés** (la plupart des pros).
- Licence : données de l'API Steam, projet open source (MIT). Attribution affichée.

## Évaluées, non intégrées (ou optionnelles)

| Source | Jeux | Pourquoi |
|---|---|---|
| **PandaScore** | CS2, R6, Rocket League, Overwatch, CoD, PUBG, LoL, Dota, Valorant… | Offre **gratuite sans carte**, mais : compte et jeton obligatoires (je ne peux pas créer de compte pour toi) ; seulement calendrier, avant-match et équipes/joueurs à 1 000 req/h ; **résultats détaillés et stats payants (dès 400 €/mois/jeu)**. CORS non vérifiable sans jeton. → connecteur optionnel prévu, voir API_SETUP.md |
| **Liquipedia MediaWiki API** | tous | Gratuit, CC BY-SA, mais exige un **User-Agent personnalisé**, impossible à fixer depuis un navigateur, et 1 req / 2 s. Inutilisable légalement depuis une PWA ; possible via un script local (ROADMAP) |
| **LiquipediaDB API** | tous | Clé sur **approbation** (60 req/h). Non demandée |
| **octane.gg** | Rocket League | API `zsr.octane.gg` **injoignable** (site hors service) |
| **vlr.gg** et API tierces (vlr.orlandomm.net…) | VALORANT | Pas d'API officielle : ce sont des scrapers du site vlr.gg sans autorisation publiée → **exclus** (règle anti-scraping). `vlrggapi.vercel.app` : déploiement désactivé (HTTP 402) |
| **HLTV** | CS2 | Pas d'API, scraping interdit → exclu |
| **FACEIT Data API** | CS2 (FACEIT) | Clé gratuite requise ; bloquée par Cloudflare depuis le serveur de test |
| **start.gg GraphQL** | jeux de combat, Smash | Jeton gratuit requis (compte). CORS `*` vérifié |
| **Aligulac** | StarCraft II | Clé gratuite requise |
| **GRID Open Access** | CS2, Dota 2 | Programme sur candidature |
| **Riot Developer Portal** | LoL, VALORANT, TFT | Parties **classées** de joueurs, pas l'esport pro ; clé personnelle valable 24 h. Hors périmètre (domaine différent) |

## Règle de priorité entre sources

1. Source officielle de l'éditeur (Riot), puis communautaire (OpenDota), puis import manuel.
2. Deux matchs ne sont jamais fusionnés sur une ressemblance de noms : uniquement par identifiant de source.
3. En cas de désaccord, la valeur affichée est celle de la source prioritaire, et l'écart est signalé dans le contrôle qualité de la fiche.
