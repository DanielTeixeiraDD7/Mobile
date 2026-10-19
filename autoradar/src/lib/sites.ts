import type { Criteres, Energie, Pays } from './types';
import { marqueDuModele, marqueParNom, modeleAs24, modeleDuCatalogue, modeleSv, slug, type CodesModele, type Marque } from './catalogue';

export type Filtre = 'marque' | 'modele' | 'energie' | 'prix' | 'annee' | 'km' | 'tri';

/** Lien construit pour un site : adresse, filtres réellement appliqués, format vérifié ou non. */
export interface Lien { url: string; ok: Filtre[]; verifie: boolean }

export interface Site {
  id: string;
  nom: string;
  pays: Pays;
  couleur: string;
  domaines: string[];
  /** Qui vend : surtout des pros (garantie) ou aussi des particuliers. */
  vendeurs: 'pros' | 'mixte';
  /** Pourquoi ce site, et à quoi faire attention. */
  note: string;
  recherche(c: Criteres): Lien;
}

const q = (base: string, params: Record<string, string | number | null | undefined | false>) => {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== false && v !== '') u.append(k, String(v));
  const s = u.toString();
  return s ? `${base}${base.includes('?') ? '&' : '?'}${s}` : base;
};
const prix = (c: Criteres) => c.tri === 'prix';
const BASE: Filtre[] = ['prix', 'annee', 'km', 'tri'];
const TOUT: Filtre[] = ['marque', 'modele', 'energie', ...BASE];
const majuscules = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

/** Critères interprétés : marque / modèle du catalogue (adresses relevées) ou saisis librement (mot-clé). */
interface Contexte {
  marque: Marque | null;
  nomMarque: string;
  modele: { nom: string; codes: CodesModele } | null;
  nomModele: string;
  energie: Energie;
  e2008: boolean;
}
function contexte(critere: Criteres): Contexte {
  const c = { ...critere, marque: critere.marque.trim() || marqueDuModele(critere.modele) || '' };
  const marque = marqueParNom(c.marque);
  const modele = modeleDuCatalogue(c.marque, c.modele);
  // Modèle 100 % électrique : le filtre est ajouté d'office (sinon « e-208 » ramènerait aussi les 208 essence sur certains sites).
  const energie = c.energie === 'tous' && modele?.codes.elec ? 'electrique' : c.energie;
  return {
    marque, nomMarque: marque?.nom ?? c.marque.trim(), modele, nomModele: modele?.nom ?? c.modele.trim(), energie,
    e2008: marque?.nom === 'Peugeot' && modele?.nom === 'e-2008',
  };
}
/**
 * Mot-clé pour les sites qui cherchent dans le texte : modèle seul si la marque est déjà filtrée, sinon marque + modèle.
 * Note dans `ok` ce que le mot-clé couvre.
 */
function motCle(x: Contexte, marqueFiltree: boolean, ok: Filtre[]): string {
  const mot = (marqueFiltree ? x.nomModele : [x.nomMarque, x.nomModele].filter(Boolean).join(' ')).trim();
  if (mot && !marqueFiltree && x.nomMarque) ok.push('marque');
  if (mot && x.nomModele) ok.push('modele');
  return mot;
}

/** CustoJusto : le km max est un index dans une liste fixe (relevé dans le code du site). */
const CUSTOJUSTO_KM = [4999, 9999, 19999, 29999, 39999, 49999, 59999, 69999, 79999, 89999, 99999, 109999, 119999, 129999, 139999, 149999, 159999, 169999, 179999, 189999, 199999, 249999, 299999, 349999, 399999, 449999, 499999];
export function indexKmCustojusto(kmMax: number): number {
  // Plus grand palier ≤ kmMax (on n'élargit jamais la recherche au-delà de la limite voulue).
  let idx: number | null = null;
  CUSTOJUSTO_KM.forEach((v, i) => { if (v <= kmMax) idx = i + 1; });
  return idx ?? 1;
}

/** AutoScout24 (même plateforme dans les 3 pays) : codes carburant relevés le 19/10/2026. */
const AS24_CARBURANT: Partial<Record<Energie, string>> = { essence: 'B', diesel: 'D', electrique: 'E', hybride: '2' };
function autoscout(pays: 'DE' | 'FR' | 'BE', base: string, e2008Mmmv: boolean) {
  return (c: Criteres): Lien => {
    const x = contexte(c);
    const commun = { atype: 'C', cy: pays === 'DE' ? 'D' : pays === 'FR' ? 'F' : 'B', priceto: c.prixMax, fregfrom: c.anneeMin, kmto: c.kmMax, sort: prix(c) ? 'price' : 'age', desc: prix(c) ? 0 : 1 };
    // e-2008 : en France / Belgique, « 2008 » et « e-2008 » sont deux modèles ; on prend les deux.
    if (x.e2008 && e2008Mmmv) return { url: q(`${base}/lst`, { mmmv: '55|20237||,55|76031||', ...commun, fuel: 'E' }), ok: TOUT, verifie: true };
    const ok = [...BASE];
    let chemin = `${base}/lst`;
    if (x.marque) {
      chemin += '/' + (x.marque.codes?.as24 ?? slug(x.marque.nom));
      ok.push('marque');
      const md = x.modele && modeleAs24(x.modele.codes, x.modele.nom, pays);
      if (md) { chemin += '/' + md; ok.push('modele'); }
    }
    const fuel = AS24_CARBURANT[x.energie];
    if (fuel) ok.push('energie');
    const { atype, cy, ...reste } = commun;
    return { url: q(chemin, { atype, cy, fuel, ...reste }), ok, verifie: true };
  };
}

/*
 * Formats relevés le 18-19/10/2026. Sur Standvirtual, OLX, CustoJusto et AutoScout24 FR/BE, « e-2008 » est un modèle à part :
 * pour lui on garde les liens d'origine qui prennent « e-2008 » ET « 2008 électrique ».
 */
export const SITES: Site[] = [
  {
    id: 'standvirtual', nom: 'Standvirtual', pays: 'PT', couleur: '#e5531a', domaines: ['standvirtual.com'], vendeurs: 'mixte',
    note: 'Le plus gros site auto du Portugal, beaucoup de stands (vendeurs pros). Privilégie-les pour la garantie.',
    recherche: c => {
      const x = contexte(c);
      const reste = {
        'search[filter_float_price:to]': c.prixMax, 'search[filter_float_first_registration_year:from]': c.anneeMin, 'search[filter_float_mileage:to]': c.kmMax,
        'search[order]': prix(c) ? 'filter_float_price:asc' : 'created_at_first:desc',
      };
      if (x.e2008) {
        return { url: q('https://www.standvirtual.com/carros/peugeot', { 'search[filter_enum_model][0]': 'e-2008', 'search[filter_enum_model][1]': '2008', 'search[filter_enum_fuel_type]': 'electric', ...reste }), ok: TOUT, verifie: true };
      }
      const ok = [...BASE];
      let chemin = 'https://www.standvirtual.com/carros';
      if (x.marque) {
        chemin += '/' + (x.marque.codes?.sv ?? slug(x.marque.nom));
        ok.push('marque');
        const md = x.modele && modeleSv(x.modele.codes, x.modele.nom);
        if (md) { chemin += '/' + md; ok.push('modele'); }
      }
      const fuel = ({ essence: ['gaz'], diesel: ['diesel'], electrique: ['electric'], hybride: ['hibride-gaz', 'hibride-diesel', 'plugin-hybrid'] } as Partial<Record<Energie, string[]>>)[x.energie] ?? [];
      if (fuel.length) ok.push('energie');
      const carburant = Object.fromEntries(fuel.map((f, i) => [`search[filter_enum_fuel_type][${i}]`, f]));
      return { url: q(chemin, { ...carburant, ...reste }), ok, verifie: true };
    },
  },
  {
    id: 'olx', nom: 'OLX', pays: 'PT', couleur: '#0f8a8f', domaines: ['olx.pt'], vendeurs: 'mixte',
    note: 'Beaucoup de particuliers, donc de bonnes affaires… et des arnaques. Jamais d’acompte avant d’avoir vu la voiture.',
    recherche: c => {
      const x = contexte(c);
      const reste = {
        'search[filter_float_price:to]': c.prixMax, 'search[filter_float_year:from]': c.anneeMin, 'search[filter_float_quilometros:to]': c.kmMax,
        'search[order]': prix(c) ? 'filter_float_price:asc' : 'created_at:desc',
      };
      if (x.e2008) {
        return { url: q('https://www.olx.pt/carros-motos-e-barcos/carros/peugeot/', { 'search[filter_enum_modelo][0]': 'e-2008', 'search[filter_enum_modelo][1]': '2008', 'search[filter_enum_combustivel][0]': 'electrico', ...reste }), ok: TOUT, verifie: true };
      }
      // Site inaccessible aux robots : format déduit des liens publics (marque dans le chemin, mot-clé « q-… »).
      const ok = [...BASE];
      let chemin = 'https://www.olx.pt/carros-motos-e-barcos/carros/';
      if (x.marque) { chemin += (x.marque.codes?.sv ?? slug(x.marque.nom)) + '/'; ok.push('marque'); }
      const mot = motCle(x, !!x.marque, ok);
      if (mot) chemin += `q-${slug(mot)}/`;
      const fuel = ({ essence: 'gasolina', diesel: 'diesel', electrique: 'electrico' } as Partial<Record<Energie, string>>)[x.energie];
      if (fuel) ok.push('energie');
      return { url: q(chemin, { 'search[filter_enum_combustivel][0]': fuel, ...reste }), ok, verifie: false };
    },
  },
  {
    id: 'custojusto', nom: 'CustoJusto', pays: 'PT', couleur: '#d1342f', domaines: ['custojusto.pt'], vendeurs: 'mixte',
    note: 'Petites annonces généralistes : moins d’offres, parfois des particuliers qu’on ne voit pas ailleurs.',
    recherche: c => {
      const x = contexte(c);
      const reste = { pe: c.prixMax, rs: c.anneeMin, me: c.kmMax ? indexKmCustojusto(c.kmMax) : null, sp: prix(c) ? 4 : 1 };
      // La page « e-2008 » ne contient que des électriques.
      if (x.e2008) return { url: q('https://www.custojusto.pt/portugal/veiculos/carros-usados/peugeot/e-2008', reste), ok: TOUT, verifie: true };
      const ok = [...BASE];
      let chemin = 'https://www.custojusto.pt/portugal/veiculos/carros-usados';
      if (x.marque) { chemin += '/' + (x.marque.codes?.cj ?? slug(x.marque.nom)); ok.push('marque'); }
      const mot = motCle(x, !!x.marque, ok);
      if (mot) chemin += '/q/' + slug(mot);
      const fu = ({ essence: 1, diesel: 2, hybride: 4, electrique: 5 } as Partial<Record<Energie, number>>)[x.energie];
      if (fu) ok.push('energie');
      return { url: q(chemin, { fu, ...reste }), ok, verifie: true };
    },
  },
  {
    id: 'mobilede', nom: 'mobile.de', pays: 'DE', couleur: '#f07a1f', domaines: ['mobile.de'], vendeurs: 'mixte',
    note: 'Le n°1 en Allemagne, énormément de concessionnaires. Annonces en allemand ; le site existe aussi en français.',
    recherche: c => {
      const x = contexte(c);
      const ok = [...BASE];
      let ms: string | null = null;
      if (x.e2008) { ms = '19300;46;;'; ok.push('marque', 'modele'); }
      else if (x.marque?.codes?.mobilede) { ms = `${x.marque.codes.mobilede};;;`; ok.push('marque'); }
      const ft = ({ essence: 'PETROL', diesel: 'DIESEL', electrique: 'ELECTRICITY', hybride: 'HYBRID' } as Partial<Record<Energie, string>>)[x.energie];
      if (ft) ok.push('energie');
      const url = q('https://suchen.mobile.de/fahrzeuge/search.html', {
        dam: 'false', isSearchRequest: 'true', s: 'Car', vc: 'Car', ms, ft,
        p: c.prixMax ? `:${c.prixMax}` : null, fr: c.anneeMin ? `${c.anneeMin}:` : null, ml: c.kmMax ? `:${c.kmMax}` : null,
        sb: prix(c) ? 'p' : 'doc', od: prix(c) ? 'up' : 'down',
      });
      return { url, ok, verifie: false };
    },
  },
  {
    id: 'as24de', nom: 'AutoScout24 DE', pays: 'DE', couleur: '#1e6fd9', domaines: ['autoscout24.de'], vendeurs: 'mixte',
    note: 'Très grand choix en Allemagne, surtout chez des pros. Le filtre pays garde uniquement les voitures en Allemagne.',
    // En Allemagne, l'e-2008 est rangée sous « 2008 » : le catalogue renvoie vers 2008 + électrique.
    recherche: autoscout('DE', 'https://www.autoscout24.de', false),
  },
  {
    id: 'leboncoin', nom: 'Leboncoin', pays: 'FR', couleur: '#ec5a13', domaines: ['leboncoin.fr'], vendeurs: 'mixte',
    note: 'Le plus d’annonces de particuliers en France. Méfie-toi des prix trop bas et des vendeurs « à l’étranger ».',
    recherche: c => {
      const x = contexte(c);
      const ok = [...BASE];
      const brand = x.marque ? majuscules(x.marque.nom) : null;
      if (brand) ok.push('marque');
      const e = x.e2008;
      if (e) ok.push('modele');
      const text = e ? null : motCle(x, !!brand, ok) || null;
      const fuel = ({ essence: 1, diesel: 2, electrique: 4 } as Partial<Record<Energie, number>>)[x.energie];
      if (fuel) ok.push('energie');
      const url = q('https://www.leboncoin.fr/recherche', {
        category: 2, u_car_brand: brand, u_car_model: e ? 'PEUGEOT_2008' : null, text, fuel,
        price: c.prixMax ? `min-${c.prixMax}` : null, regdate: c.anneeMin ? `${c.anneeMin}-max` : null, mileage: c.kmMax ? `min-${c.kmMax}` : null,
        sort: prix(c) ? 'price' : 'time', order: prix(c) ? 'asc' : 'desc',
      });
      return { url, ok, verifie: false };
    },
  },
  {
    id: 'lacentrale', nom: 'La Centrale', pays: 'FR', couleur: '#0b3d91', domaines: ['lacentrale.fr'], vendeurs: 'mixte',
    note: 'Site auto spécialisé français, beaucoup de professionnels.',
    recherche: c => {
      const x = contexte(c);
      const ok = [...BASE];
      let mm: string | null = null;
      if (x.e2008) { mm = 'PEUGEOT:2008'; ok.push('marque', 'modele'); }
      else if (x.marque) {
        mm = majuscules(x.marque.nom);
        ok.push('marque');
        if (x.nomModele) { mm += ':' + majuscules(x.nomModele); ok.push('modele'); }
      }
      const energies = ({ essence: 'ess', diesel: 'dies', electrique: 'elec' } as Partial<Record<Energie, string>>)[x.energie];
      if (energies) ok.push('energie');
      const url = q('https://www.lacentrale.fr/listing', {
        makesModelsCommercialNames: mm, energies, priceMax: c.prixMax, yearMin: c.anneeMin, mileageMax: c.kmMax,
        sortBy: prix(c) ? 'priceAsc' : 'firstOnlineDateDesc',
      });
      return { url, ok, verifie: false };
    },
  },
  {
    id: 'as24fr', nom: 'AutoScout24 FR', pays: 'FR', couleur: '#1e6fd9', domaines: ['autoscout24.fr'], vendeurs: 'mixte',
    note: 'Moins d’offres en France qu’en Allemagne, mais surtout des professionnels.',
    recherche: autoscout('FR', 'https://www.autoscout24.fr', true),
  },
  {
    id: 'as24be', nom: 'AutoScout24 BE', pays: 'BE', couleur: '#1e6fd9', domaines: ['autoscout24.be'], vendeurs: 'mixte',
    note: 'Le plus grand choix en Belgique, annonces en français et en néerlandais.',
    recherche: autoscout('BE', 'https://www.autoscout24.be/fr', true),
  },
  {
    id: '2ememain', nom: '2ememain', pays: 'BE', couleur: '#e8590c', domaines: ['2ememain.be', '2dehands.be'], vendeurs: 'mixte',
    note: 'Petites annonces belges, beaucoup de particuliers. Le vendeur doit te remettre le Car-Pass.',
    recherche: c => {
      const x = contexte(c);
      // Filtres d'intervalle dans le fragment (#), séparés par « | » ; prix en centimes.
      const h = [
        c.prixMax ? `PriceCentsTo:${c.prixMax * 100}` : '',
        c.anneeMin ? `constructionYearFrom:${c.anneeMin}` : '',
        c.kmMax ? `mileageTo:${c.kmMax}` : '',
        prix(c) ? 'sortBy:PRICE|sortOrder:INCREASING' : 'sortBy:SORT_INDEX|sortOrder:DECREASING',
        'Language:all-languages',
      ].filter(Boolean).join('|');
      if (x.e2008) return { url: `https://www.2ememain.be/l/autos/peugeot/f/2008+electrique/10776+11756/#${h}`, ok: TOUT, verifie: true };
      const ok = [...BASE];
      let chemin = 'https://www.2ememain.be/l/autos/';
      if (x.marque) { chemin += slug(x.marque.nom) + '/'; ok.push('marque'); }
      const mot = motCle(x, !!x.marque, ok);
      // Mot-clé : espaces en « + » (un tiret ne trouve rien).
      if (mot) chemin += 'q/' + mot.toLowerCase().split(/\s+/).map(encodeURIComponent).join('+') + '/';
      return { url: `${chemin}#${h}`, ok, verifie: true };
    },
  },
  {
    id: 'gocar', nom: 'Gocar', pays: 'BE', couleur: '#13a36b', domaines: ['gocar.be'], vendeurs: 'mixte',
    note: 'Site auto belge. Si un filtre n’est pas repris, règle-le sur la page.',
    recherche: c => {
      const x = contexte(c);
      const ok = [...BASE];
      const elec = x.energie === 'electrique';
      if (elec) ok.push('energie');
      if (x.nomMarque) ok.push('marque');
      if (x.nomMarque && x.nomModele) ok.push('modele');
      const url = q(`https://gocar.be/fr/search${elec ? '/u_electrique' : ''}`, {
        gbrands: x.nomMarque || null, gmodels: x.nomMarque ? (x.e2008 ? '2008' : x.nomModele) || null : null, fuel: elec ? 'Electrique' : null,
        price: c.prixMax ? `:${c.prixMax}` : null, first_registration_year: c.anneeMin ? `${c.anneeMin}:` : null, kilometers: c.kmMax ? `:${c.kmMax}` : null,
        sort: prix(c) ? 'price-asc' : 'published_date-desc',
      });
      return { url, ok, verifie: false };
    },
  },
];

/** Énergie réellement cherchée (un modèle 100 % électrique impose « électrique »). */
export const energieEffective = (c: Criteres) => contexte(c).energie;
export const lienSite = (id: string, c: Criteres) => SITES.find(s => s.id === id)!.recherche(c).url;

export function siteDepuisUrl(url: string): Site | null {
  try {
    const h = new URL(url.trim()).hostname.replace(/^www\./, '');
    return SITES.find(s => s.domaines.some(d => h === d || h.endsWith('.' + d))) ?? null;
  } catch {
    return null;
  }
}

export const sitesDuPays = (p: Pays) => SITES.filter(s => s.pays === p);
