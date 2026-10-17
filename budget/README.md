# Budget

PWA de suivi de dépenses et de budget, 100 % locale : aucun serveur, aucun compte, aucune API externe. Les données sont stockées dans IndexedDB sur le téléphone et l'app fonctionne hors-ligne. Interface en français et en portugais.

## Lancer en local

Les modules ES et le service worker exigent un serveur HTTP (pas `file://`) :

```bash
cd budget
python3 -m http.server 8000
# ou : npx serve .
```

Puis ouvrir http://localhost:8000.

## Installer sur le téléphone

L'app doit être servie en HTTPS. Elle est publiée avec GitHub Pages : https://danielteixeiradd7.github.io/Mobile/budget/

- **iPhone** : ouvrir le lien dans Safari → Partager → « Sur l'écran d'accueil ».
- **Android** : ouvrir le lien dans Chrome → ⋮ → « Installer l'application ».

Sur iPhone, l'app installée et Safari ne partagent pas leurs données : utilise toujours l'icône de l'écran d'accueil.

## Budget partagé (optionnel)

Sans connexion, l'app reste 100 % locale. Dans Réglages → « Budget partagé », deux personnes peuvent partager le même budget via Supabase (PostgreSQL) :

1. Exécuter `supabase/schema.sql` puis `supabase/002_partage_50_50.sql` une fois dans Supabase → SQL Editor (si `schema.sql` est déjà installé, seulement le second).
2. Mettre l'URL du projet et la clé `anon` dans `js/config.js` (la clé `service_role` ne doit jamais être dans le code).
3. Connexion par e-mail + mot de passe. Le plus simple : Supabase → Authentication → Sign In / Providers → Email → désactiver « Confirm email » (sinon, chacun confirme son e-mail via le lien reçu, puis se connecte ; régler alors Site URL sur l'adresse de l'app).
4. La première personne crée le foyer et génère un code d'invitation (24 h, usage unique) ; la seconde le saisit.
5. Une fois les deux comptes créés, désactiver les inscriptions : Authentication → Sign In / Providers → « Allow new users to sign up ».

Partage 50/50 (onglet Budget, à deux) : chaque dépense a un « payé par » et peut être marquée « perso » (exclue du partage). L'app calcule ce que chacun a payé pour les dépenses communes, qui doit combien à l'autre, et enregistre les remboursements (« Marquer comme réglé »).

Fonctionnement : les données restent dans IndexedDB ; chaque modification est mise dans une file d'attente (`js/outbox.js`) puis envoyée à l'API REST de Supabase (`js/sync.js`), qui renvoie aussi les modifications de l'autre personne. Hors-ligne, la file attend le retour du réseau. La sécurité repose sur la Row Level Security : voir `supabase/schema.sql` et les tests `supabase/test/`.

## Publier une mise à jour

Modifier `VERSION` dans `sw.js` (ex. `budget-v2`) à chaque publication. Le service worker re-télécharge alors tous les fichiers et l'app se recharge à l'ouverture suivante.

## Structure

```
index.html            page unique
manifest.webmanifest  installation PWA
sw.js                 cache hors-ligne
css/style.css         styles, thème clair/sombre automatique
js/main.js            démarrage, barre d'onglets, service worker
js/router.js          navigation entre les écrans
js/db.js              accès IndexedDB
js/store.js           données en mémoire + écriture (opérations, catégories, réglages)
js/calc.js            totaux, répartition, état des budgets
js/format.js          montants, dates, échappement HTML
js/i18n.js            traductions FR / PT
js/ui.js              toast, feuilles modales, gestes (glisser, appui long), fichiers
js/chart.js           graphiques SVG (anneau, barres)
js/csv.js             export / import CSV
js/backup.js          sauvegarde / restauration JSON
js/config.js          URL et clé publique Supabase
js/auth.js            connexion par code e-mail, session
js/api.js             appels REST Supabase
js/outbox.js          file d’attente des modifications locales
js/sync.js            synchronisation (envoi, réception, foyer, invitations)
supabase/             schéma SQL et tests de sécurité
js/views/             un fichier par écran (add, list, budget, stats, settings) + formulaire et sélecteur de mois
```

## Format des données

- Les montants sont stockés en centimes (entiers) pour éviter les erreurs d'arrondi.
- CSV : séparateur `;`, UTF-8 avec BOM (s'ouvre directement dans Excel), colonnes `Date;Type;Montant;Catégorie;Note`. L'import accepte aussi les exports bancaires (`Date;Libellé;Montant`, montants négatifs = dépenses, dates `JJ/MM/AAAA`) et ignore les doublons.
- JSON : sauvegarde complète (opérations, catégories, réglages), restaurable depuis Réglages.
