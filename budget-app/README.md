# Budget v2

Suivi de dépenses et budget à deux (FR / PT), hors-ligne, en Vue 3. Remplace la v1 **à la même adresse** :
https://danielteixeiradd7.github.io/Mobile/budget/

## Les données ne bougent pas

La v2 réutilise **tel quel** le cœur de données de la v1 (`src/core/` : IndexedDB `budget` v3, file d'envoi `outbox`, synchronisation Supabase, calcul 50/50, CSV, sauvegarde JSON). Seule l'interface est nouvelle.

- Même base IndexedDB et même session : l'app installée sur l'écran d'accueil se met à jour toute seule (le service worker v2 remplace celui de la v1) et retrouve opérations, catégories, plafonds, connexion et foyer partagé.
- Les modifications pas encore envoyées (hors ligne) dans la v1 partent depuis la v2 au retour du réseau.
- La v1 reste disponible en secours : https://danielteixeiradd7.github.io/Mobile/budget-v1/ (mêmes données).
- Seul ajout stocké : le réglage local `theme` (clair / sombre / auto), dans la même table `settings`, non partagé.

Vérifié avant publication (Playwright + faux Supabase local : Postgres + PostgREST + passerelle d'auth) :
- données saisies dans la v1 → lues par la v2, et inversement ;
- foyer partagé Daniel / Diana créé en v1, dépense hors ligne en file d'attente, passage des deux téléphones en v2 : la file est envoyée, le 50/50 est identique sur les deux, règlement et suppression synchronisés ;
- mise à jour sur place : v1 installée (service worker en cache) → v2 au rechargement, données intactes, ancien cache supprimé.

## Nouveautés

- **Accueil** : dépensé du mois, anneau du budget, courbe cumulée (ce mois / mois précédent / rythme du budget), reste par jour, projection de fin de mois (sans compter les grosses dépenses ponctuelles comme le loyer), cartes « À savoir », où va l'argent, dernières opérations, résumé du partage.
- **Saisie rapide** (bouton +) : pavé numérique, catégories avec icônes, « refaire en un geste » les saisies récentes, notes auto-complétées, payé par / commun-perso, alerte de budget, annuler.
- **Historique** : recherche (note, catégorie, montant) sur tous les mois, filtres type / catégorie / personne / perso, glisser pour supprimer, toucher pour modifier.
- **Budget** : partage 50/50, plafond global et par catégorie avec repère du temps écoulé, suggestion de plafond (moyenne des 3 derniers mois), dépenses régulières repérées automatiquement.
- **Stats** : indicateurs vs mois précédent, donut interactif, évolution 6 / 12 mois, dépenses cumulées, calendrier des dépenses, jours de la semaine, détail par catégorie.
- Thème clair / sombre / automatique, mise en page bureau (menu latéral), français et portugais.

## Développer

```bash
npm install
npm run dev
npm test        # pont IndexedDB ↔ Vue, analyses
npm run build   # vue-tsc puis build dans ../budget
```

Stack : Vue 3 (`<script setup>`, auto-imports), routage par fichiers, Pinia, Vite. Graphiques SVG maison, aucune dépendance d'interface.

## Budget partagé (Supabase)

Inchangé par rapport à la v1 : `supabase/schema.sql` puis `supabase/002_partage_50_50.sql` (SQL Editor), URL + clé `anon` dans `src/core/config.js` (jamais la clé `service_role`), sécurité par Row Level Security (tests dans `supabase/test/`).
