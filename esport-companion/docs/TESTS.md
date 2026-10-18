# Tests — exécutés le 18/10/2026

```bash
npm test            # 59 tests unitaires et d'intégration (jsdom + fake-indexeddb), données FICTIVES
npm run test:live   # 3 tests contre les API réelles
npm run typecheck   # TypeScript strict, 0 erreur
```

Résultats : **59/59 réussis** (3 exécutions consécutives sans échec), **3/3 tests réels réussis**, typecheck et build OK.

## Tests unitaires (`tests/`)

Données de test : `tests/fixtures/fake.ts`, équipes « Test Alpha / Test Beta », ligue « Ligue Test (fictive) ». Jamais affichées dans l'app.

| Fichier | Couvre |
|---|---|
| `http.test.ts` | cache frais, **déduplication** des requêtes simultanées, **réessais 5xx** avec attente croissante, **données périmées** si le réseau tombe, **429 + Retry-After**, limite par minute, **quota journalier**, 404 sans données périmées, hors-ligne, JSON invalide, annulation, données définitives jamais rechargées |
| `providers.test.ts` | normalisation Riot (scores, vainqueurs, TBD → null, https, phases, émissions ignorées), parties et VOD, classements et liens de bracket ; livestats : arrondi de l'heure, stats finales, objets null si non publiés, **vainqueur déduit uniquement si tours ET gold concordent**, objectifs par intervalle, **rejeu complet d'une partie** avec un client simulé ; OpenDota : **séries reconstituées** (changement de côté), série incomplète = statut inconnu, direct, BO2 nul, bâtiments détruits |
| `core.test.ts` | contrôles qualité (score/format, vainqueur, même équipe, nombre de parties, durée impossible), doublons par identifiant uniquement, validation des vainqueurs déduits ; filtres, tri, tableau de bord, favoris, bracket ; analyse (avances, changements de leader, remontée = interprétation, vainqueur déduit jamais présenté comme fait, aucune prédiction) ; forme, confrontations ; CSV (export BOM, échappement, import avec erreurs par ligne, alias de colonnes, identifiant stable, doublon probable) ; sauvegarde (aller-retour, rejets, fusion) ; `.ics` ; formats (temps négatif) |
| `leaguepedia.test.ts` | ordre réel de la draft de tournoi, requête par noms exacts échappés, erreur « ratelimited » en HTTP 200 (rien en cache, pause), **draft gardée/inversée/écartée selon les champions du flux officiel** |
| `store.test.ts` | favoris, réglages (transmis aux adaptateurs), historique borné, imports, cache IndexedDB |
| `app.test.tsx` | rendu complet avec adaptateurs fictifs : présentation → accueil (direct, à venir), **une source en panne n'empêche pas l'affichage des autres**, adversaire inconnu affiché « À déterminer », fiche de match, favoris vides |

## Tests réels (`tests/live/`)

- **LoL** : 80 matchs. Détail MVK–FURIA 3-1 (Worlds 2026), 5 parties dont 1 non jouée.
  - Livestats : patch 16.20, durée 31:08, 32 points, vainqueur déduit cohérent ; gold 64,3k / 54,4k, 21-8 kills, 8-1 tours, 4 dragons, 1 baron ; objets et stats des 10 joueurs.
  - Compétition Worlds : 3 phases.
  - Roster de MVK.
- **Dota 2** : 88 séries reconstituées.
  - Détail BO3 avec vainqueur et durée par partie ; partie analysée avec 44 points de gold, 24 picks/bans, héros.
  - Ligue EPL Masters 2026 : 185 séries, bilan calculé.
  - Équipe CyberHero : roster et 28 parties.
- **VALORANT** : 80 matchs. Détail 100T–VIT 1-3 (5 cartes, VOD). Champions Shanghai : 2 phases.

## Tests de bout en bout (Playwright, Chromium, émulation iPhone 13, API réelles, build de production)

1. Présentation → accueil : sections, cartes, aucune erreur console.
2. Match LoL terminé → Partie 1 : partie reconstituée (35 requêtes au flux, mises en cache), comparaison, courbe de gold, kills, objectifs, tableaux joueurs avec champions et objets, analyse.
3. Match Dota 2 → Partie 1 : draft ordonnée, courbes gold/XP, 30+ événements datés, tableaux joueurs, analyse.
4. Fiche joueur Dota (depuis la partie) : 12 parties de tournoi récentes, moyennes, pool de héros ; ajout en favori.
5. Compétition Worlds (3 phases) ; équipe Karmine Corp (roster de 5) ; ajout en favori.
6. Import CSV : 1 ligne valide, 1 ligne en erreur avec 3 messages précis ; import appliqué.
7. Thème clair ; écran Sources (état réel des appels).
8. **Hors-ligne** après rechargement : 125 matchs affichés depuis le cache, avec la mention « Hors-ligne ».

## À valider sur un vrai iPhone (non testable ici)

- Installation sur l'écran d'accueil et service worker iOS.
- Notifications (iOS 16.4+, app installée).
- Feuille de partage pour l'export `.ics`, JSON et CSV.
