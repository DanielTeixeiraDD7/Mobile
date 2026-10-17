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
js/views/             un fichier par écran (add, list, budget, stats, settings) + formulaire et sélecteur de mois
```

## Format des données

- Les montants sont stockés en centimes (entiers) pour éviter les erreurs d'arrondi.
- CSV : séparateur `;`, UTF-8 avec BOM (s'ouvre directement dans Excel), colonnes `Date;Type;Montant;Catégorie;Note`. L'import accepte aussi les exports bancaires (`Date;Libellé;Montant`, montants négatifs = dépenses, dates `JJ/MM/AAAA`) et ignore les doublons.
- JSON : sauvegarde complète (opérations, catégories, réglages), restaurable depuis Réglages.
