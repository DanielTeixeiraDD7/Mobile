# AutoRadar

Chercher une **Peugeot e-2008** d'occasion au Portugal, en France, en Allemagne et en Belgique, suivre les annonces et calculer le **coût total au Portugal**, import compris.

**En ligne :** https://danielteixeiradd7.github.io/Mobile/auto/ (PWA : écran d'accueil, hors-ligne, « Partager » depuis une annonce sur Android).

## Ce que fait l'app

- **Rechercher** : tes critères (prix max, année min, km max, tri) appliqués d'un clic sur 11 sites :
  - 🇵🇹 Standvirtual, OLX, CustoJusto
  - 🇫🇷 Leboncoin, La Centrale, AutoScout24
  - 🇩🇪 mobile.de, AutoScout24
  - 🇧🇪 AutoScout24, 2ememain, Gocar

  Le bouton ouvre la page de résultats **du site officiel**. Aucune annonce n'est copiée (les conditions d'utilisation l'interdisent).
- **Annonces** : colle le lien d'une annonce, note prix / km / année / batterie ; l'app classe par coût total réel, avec statut et liste de vérifications par annonce.
- **Import** : comparaison « importer ou acheter au Portugal », frais officiels sourcés, démarches IMT / AT / IRN pas à pas, papiers pour ramener la voiture.
- **Guide e-2008** : versions (50 / 54 kWh), garantie batterie, rappels électriques, points à vérifier, repères de prix, arnaques courantes, historique officiel par pays.

## Fiabilité des données (relevé du 18/10/2026)

- Liens vérifiés sur le site (filtres appliqués constatés) : Standvirtual, OLX, CustoJusto, AutoScout24 DE/FR/BE, 2ememain. Construits d'après le format public (site inaccessible aux robots) : mobile.de, Leboncoin, La Centrale, Gocar ; l'app l'indique sur la carte du site.
- Montants officiels : ISV exclu (CISV art. 2.º n.º 2 a)), IUC exonéré (CIUC art. 5.º n.º 1 e)), inspection B 76,03 € + IVA, matrícula IMT 45 € (165 € sans CoC), registo IRN 55 € (−15 % en ligne). Transport et plaques = estimations modifiables.
- Les barèmes changent : vérifie avant d'acheter (liens vers les sources dans l'app).

## Développer

```bash
npm install
npm run dev
npm test        # liens par site, calcul d'import, formats
npm run build   # vue-tsc puis build dans ../auto
```

Stack : Vue 3 (`<script setup>`, auto-imports), routage par fichiers (`pages/annonces/_ID.vue`), Pinia, PrimeVue 4 (MIT), Vite. Données uniquement dans le navigateur (`localStorage`), export/import JSON dans Réglages. Coût : 0 €.
