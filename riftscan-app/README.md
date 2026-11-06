# RiftScan (Vue 3)

Scanner de cartes **Riftbound** : la caméra reconnaît la carte et affiche sa valeur (prix du marché TCGplayer, convertis en euros au taux BCE). Recherche, fiche détaillée, collection sur l'appareil. Build : `../rift/` → https://danielteixeiradd7.github.io/Mobile/rift/

```
src/core/empreinte.ts   empreinte visuelle (vignette 12 × 17 normalisée) + recherche par similarité
src/core/scan.ts        reconnaissance (cadre de visée, photo importée), seuils
src/core/donnees.ts     lecture des données de la branche rift-data (cache hors-ligne)
scripts/donnees.ts      mise à jour quotidienne (TCGCSV, BCE, empreintes des nouvelles cartes)
```

Données : `.github/workflows/riftscan-donnees.yml` lance `scripts/donnees.ts` chaque jour (après la mise à jour de TCGCSV) et publie le résultat sur la branche `rift-data`. L'app ne contacte jamais TCGCSV ni TCGplayer directement (règles d'usage de TCGCSV).

Mesure de la reconnaissance (250 photos simulées : rotation ±6°, décalage, échelle ±8 %, éclairage ×0,55–1,4, dominante de couleur, flou, bruit, JPEG) : bonne carte dans le top 3 à 100 %, bonne carte (même nom) en 1er à 100 %, version exacte en 1er à 94 % ; ~70 ms par image sur ordinateur.

```bash
npm install
npm run donnees -- /tmp/donnees   # données locales
VITE_DONNEES=http://localhost:5191/ npm run dev
npm test && npm run build
```
