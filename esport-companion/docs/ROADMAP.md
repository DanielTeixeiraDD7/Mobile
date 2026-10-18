# Feuille de route

## Terminé (v1.0)

- [x] Phase 0 : audit de l'environnement (Linux, Node 22, pas de Xcode → PWA)
- [x] Phase 1 : audit des sources (12 sources testées, CORS et conditions vérifiés), rapport de couverture
- [x] Phase 2 : architecture multi-jeux (modèle commun, adaptateurs, HTTP/cache/limiteur, qualité)
- [x] Phase 3 : interface (5 onglets, états chargement/vide/erreur/périmé/hors-ligne, thèmes)
- [x] Phase 4 : League of Legends (calendrier, direct, résultats, parties reconstituées, classements, bracket, rosters)
- [x] Phase 5 : Dota 2 (séries, direct, parties détaillées, ligues, équipes, joueurs)
- [x] Phase 6 : VALORANT (résultats, calendrier, classements) ; autres jeux via import
- [x] Phase 7 : graphiques, comparaisons, analyses déterministes, forme, confrontations, favoris, filtres, vues
- [x] Phase 8 : rappels (.ics + notifications), import/export, documentation, tests

## Prochaines étapes possibles (toutes gratuites)

- **LoL** : bans et ordre de draft, et vainqueur officiel par partie, via Leaguepedia (CC BY-SA, CORS ouvert). Bloqué ici par une limite d'IP à revérifier depuis le téléphone.
- **Connecteur PandaScore optionnel** (jeton gratuit à saisir) : calendrier CS2, Rocket League, R6, Overwatch.
- **start.gg** (jeton gratuit) : brackets de jeux de combat.
- **Statistiques agrégées LoL** par joueur et par champion, calculées sur les parties déjà consultées.
- **Script local** (ordinateur) pour Liquipedia avec un User-Agent conforme, qui produit un JSON à importer.
- **Comparateur** de deux équipes côte à côte.
