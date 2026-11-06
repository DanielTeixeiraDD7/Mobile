/**
 * Mise à jour des données de RiftScan (à lancer une fois par jour, jamais depuis l'app) :
 *   node --experimental-strip-types scripts/donnees.ts <dossier>
 *
 * - Cartes et prix TCGplayer de Riftbound : copies quotidiennes publiées par TCGCSV (catégorie 89).
 *   Règles de TCGCSV respectées : une synchro par jour au plus, User-Agent dédié, pause entre requêtes,
 *   aucune requête depuis l'app.
 * - Taux USD → EUR : taux de référence quotidien de la Banque centrale européenne.
 * - Empreintes visuelles : calculées une seule fois par carte (les anciennes sont gardées).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import jpeg from 'jpeg-js';
import { DIM, empreinte, quantifier } from '../src/core/empreinte.ts';

const UA = { 'User-Agent': 'RiftScan/1.0 (fan app; github.com/DanielTeixeiraDD7/Mobile)' };
const CATEGORIE = 89;
const JOURS_HISTO = 30;
const dossier = process.argv[2] ?? 'donnees';
mkdirSync(dossier, { recursive: true });
const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
async function json<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json() as Promise<T>;
}
const lire = <T>(f: string, defaut: T): T => (existsSync(join(dossier, f)) ? JSON.parse(readFileSync(join(dossier, f), 'utf8')) : defaut);

interface Groupe { groupId: number; name: string; abbreviation: string; publishedOn: string }
interface Produit { productId: number; name: string; imageUrl: string; url: string; groupId: number; extendedData: { name: string; value: string }[] }
interface Prix { productId: number; lowPrice: number | null; midPrice: number | null; marketPrice: number | null; subTypeName: string }

// ----- 1. Rien de neuf chez TCGCSV ? on s'arrête. -----
const maj = (await (await fetch('https://tcgcsv.com/last-updated.txt', { headers: UA })).text()).trim();
const ancien = lire<{ maj?: string }>('prix.json', {});
if (ancien.maj === maj && !process.argv.includes('--force')) {
  console.log('Données déjà à jour :', maj);
  process.exit(0);
}

// ----- 2. Cartes et prix -----
const groupes = (await json<{ results: Groupe[] }>(`https://tcgcsv.com/tcgplayer/${CATEGORIE}/groups`)).results;
const cartes: Record<string, unknown>[] = [];
const prix: Record<string, Record<string, (number | null)[]>> = {};
for (const g of groupes) {
  await pause(150);
  const produits = (await json<{ results: Produit[] }>(`https://tcgcsv.com/tcgplayer/${CATEGORIE}/${g.groupId}/products`)).results;
  await pause(150);
  const lignes = (await json<{ results: Prix[] }>(`https://tcgcsv.com/tcgplayer/${CATEGORIE}/${g.groupId}/prices`)).results;
  const ext = (p: Produit, n: string) => p.extendedData.find(e => e.name === n)?.value ?? '';
  for (const p of produits) {
    const numero = ext(p, 'Number');
    if (!numero) continue; // produits scellés (boosters, decks…) : hors périmètre
    cartes.push({
      id: String(p.productId), n: p.name, s: g.abbreviation, sn: g.name, no: numero, r: ext(p, 'Rarity'),
      t: ext(p, 'Card Type'), d: ext(p, 'Domain').split(';').filter(Boolean), img: p.imageUrl, url: p.url,
    });
  }
  for (const l of lignes) {
    const f = l.subTypeName === 'Foil' ? 'F' : 'N';
    (prix[l.productId] ??= {})[f] = [l.marketPrice, l.lowPrice, l.midPrice].map(x => (x == null ? null : Math.round(x * 100) / 100));
  }
  console.log(`${g.abbreviation} ${g.name} : ${produits.length} produits, ${lignes.length} prix`);
}
const ids = new Set(cartes.map(c => c.id as string));
for (const id of Object.keys(prix)) if (!ids.has(id)) delete prix[id];

// ----- 3. Taux de change BCE -----
const xml = await (await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', { headers: UA })).text();
const usd = Number(/currency='USD' rate='([\d.]+)'/.exec(xml)?.[1]);
const dateTaux = /time='([\d-]+)'/.exec(xml)?.[1] ?? '';
if (!(usd > 0)) throw new Error('Taux BCE introuvable');

// ----- 4. Historique des prix du marché (30 jours) -----
const jour = maj.slice(0, 10);
const histo = lire<{ jours: string[]; p: Record<string, Record<string, (number | null)[]>> }>('historique.json', { jours: [], p: {} });
if (histo.jours[histo.jours.length - 1] !== jour) {
  histo.jours.push(jour);
  for (const id of ids) {
    for (const f of ['N', 'F']) {
      const serie = ((histo.p[id] ??= {})[f] ??= new Array(histo.jours.length - 1).fill(null));
      serie.push(prix[id]?.[f]?.[0] ?? null);
    }
  }
  const trop = histo.jours.length - JOURS_HISTO;
  if (trop > 0) {
    histo.jours.splice(0, trop);
    for (const s of Object.values(histo.p)) for (const f of Object.keys(s)) s[f]!.splice(0, trop);
  }
}

// ----- 5. Empreintes visuelles des nouvelles cartes -----
const idx = lire<{ ids: string[] }>('empreintes.json', { ids: [] });
const binOld = existsSync(join(dossier, 'empreintes.bin')) ? new Int8Array(readFileSync(join(dossier, 'empreintes.bin'))) : new Int8Array();
const lignesIds = [...idx.ids];
const lignes: Int8Array[] = idx.ids.map((_, k) => binOld.slice(k * DIM, (k + 1) * DIM));
const dejaFaites = new Set(idx.ids);
let nouvelles = 0, sansImage = 0;
for (const c of cartes) {
  const id = c.id as string;
  if (dejaFaites.has(id)) continue;
  await pause(100);
  const r = await fetch(c.img as string, { headers: UA });
  if (!r.ok) { sansImage++; continue; }
  const img = jpeg.decode(new Uint8Array(await r.arrayBuffer()), { useTArray: true, formatAsRGBA: true });
  // Carte paysage (champ de bataille) : vue tournée dans les deux sens, car le cadre de visée est en portrait.
  const rotations: (0 | 90 | 270)[] = img.width > img.height ? [90, 270] : [0];
  for (const rot of rotations) { lignesIds.push(id); lignes.push(quantifier(empreinte(img, undefined, rot))); }
  nouvelles++;
}
const bin = new Int8Array(lignes.length * DIM);
lignes.forEach((l, k) => bin.set(l, k * DIM));

// ----- 6. Écriture -----
const ecrire = (f: string, d: unknown) => writeFileSync(join(dossier, f), JSON.stringify(d));
ecrire('cartes.json', cartes);
ecrire('prix.json', { maj, usdParEur: usd, dateTaux, p: prix });
ecrire('historique.json', histo);
ecrire('empreintes.json', { ids: lignesIds, dim: DIM });
writeFileSync(join(dossier, 'empreintes.bin'), bin);
console.log(`${cartes.length} cartes, ${Object.keys(prix).length} avec prix, 1 EUR = ${usd} USD (BCE ${dateTaux}), ${nouvelles} nouvelles empreintes (${sansImage} sans image), ${lignesIds.length} lignes d'empreintes.`);
