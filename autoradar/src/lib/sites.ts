import type { Criteres, Pays } from './types';

export type Filtre = 'modele' | 'electrique' | 'prix' | 'annee' | 'km' | 'tri';

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
  /** Filtres réellement appliqués par le lien (les autres sont à régler sur le site). */
  filtres: Filtre[];
  /** Lien vérifié (page de résultats filtrée obtenue) ou seulement construit d'après la doc / des exemples. */
  verifie: boolean;
  lien(c: Criteres): string;
}

const q = (base: string, params: Record<string, string | number | null | undefined | false>) => {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== false && v !== '') u.append(k, String(v));
  const s = u.toString();
  return s ? `${base}${base.includes('?') ? '&' : '?'}${s}` : base;
};
const prix = (c: Criteres) => c.tri === 'prix';

/** CustoJusto : le km max est un index dans une liste fixe (relevé dans le code du site). */
const CUSTOJUSTO_KM = [4999, 9999, 19999, 29999, 39999, 49999, 59999, 69999, 79999, 89999, 99999, 109999, 119999, 129999, 139999, 149999, 159999, 169999, 179999, 189999, 199999, 249999, 299999, 349999, 399999, 449999, 499999];
export function indexKmCustojusto(kmMax: number): number {
  // Plus grand palier ≤ kmMax (on n'élargit jamais la recherche au-delà de la limite voulue).
  let idx: number | null = null;
  CUSTOJUSTO_KM.forEach((v, i) => { if (v <= kmMax) idx = i + 1; });
  return idx ?? 1;
}

/*
 * Formats relevés le 18/10/2026 pour le Peugeot e-2008 (seul modèle du catalogue pour l'instant).
 * Sur Standvirtual, OLX, CustoJusto et AutoScout24 FR/BE, « e-2008 » est un modèle à part :
 * chercher « 2008 + électrique » en raterait la plupart.
 */
export const SITES: Site[] = [
  {
    id: 'standvirtual', nom: 'Standvirtual', pays: 'PT', couleur: '#e5531a', domaines: ['standvirtual.com'], vendeurs: 'mixte', verifie: true,
    note: 'Le plus gros site auto du Portugal, beaucoup de stands (vendeurs pros). Privilégie-les pour la garantie.',
    filtres: ['modele', 'electrique', 'prix', 'annee', 'km', 'tri'],
    lien: c => q('https://www.standvirtual.com/carros/peugeot', {
      'search[filter_enum_model][0]': 'e-2008', 'search[filter_enum_model][1]': '2008', 'search[filter_enum_fuel_type]': 'electric',
      'search[filter_float_price:to]': c.prixMax, 'search[filter_float_first_registration_year:from]': c.anneeMin, 'search[filter_float_mileage:to]': c.kmMax,
      'search[order]': prix(c) ? 'filter_float_price:asc' : 'created_at_first:desc',
    }),
  },
  {
    id: 'olx', nom: 'OLX', pays: 'PT', couleur: '#0f8a8f', domaines: ['olx.pt'], vendeurs: 'mixte', verifie: true,
    note: 'Beaucoup de particuliers, donc de bonnes affaires… et des arnaques. Jamais d’acompte avant d’avoir vu la voiture.',
    filtres: ['modele', 'electrique', 'prix', 'annee', 'km', 'tri'],
    lien: c => q('https://www.olx.pt/carros-motos-e-barcos/carros/peugeot/', {
      'search[filter_enum_modelo][0]': 'e-2008', 'search[filter_enum_modelo][1]': '2008', 'search[filter_enum_combustivel][0]': 'electrico',
      'search[filter_float_price:to]': c.prixMax, 'search[filter_float_year:from]': c.anneeMin, 'search[filter_float_quilometros:to]': c.kmMax,
      'search[order]': prix(c) ? 'filter_float_price:asc' : 'created_at:desc',
    }),
  },
  {
    id: 'custojusto', nom: 'CustoJusto', pays: 'PT', couleur: '#d1342f', domaines: ['custojusto.pt'], vendeurs: 'mixte', verifie: true,
    note: 'Petites annonces généralistes : moins d’offres, parfois des particuliers qu’on ne voit pas ailleurs.',
    // La page « e-2008 » ne contient que des électriques.
    filtres: ['modele', 'electrique', 'prix', 'annee', 'km', 'tri'],
    lien: c => q('https://www.custojusto.pt/portugal/veiculos/carros-usados/peugeot/e-2008', {
      pe: c.prixMax, rs: c.anneeMin, me: c.kmMax ? indexKmCustojusto(c.kmMax) : null, sp: prix(c) ? 4 : 1,
    }),
  },
  {
    id: 'mobilede', nom: 'mobile.de', pays: 'DE', couleur: '#f07a1f', domaines: ['mobile.de'], vendeurs: 'mixte', verifie: false,
    note: 'Le n°1 en Allemagne, énormément de concessionnaires. Annonces en allemand ; le site existe aussi en français.',
    filtres: ['modele', 'electrique', 'prix', 'annee', 'km', 'tri'],
    lien: c => q('https://suchen.mobile.de/fahrzeuge/search.html', {
      dam: 'false', isSearchRequest: 'true', s: 'Car', vc: 'Car', ms: '19300;46;;', ft: 'ELECTRICITY',
      p: c.prixMax ? `:${c.prixMax}` : null, fr: c.anneeMin ? `${c.anneeMin}:` : null, ml: c.kmMax ? `:${c.kmMax}` : null,
      sb: prix(c) ? 'p' : 'doc', od: prix(c) ? 'up' : 'down',
    }),
  },
  {
    id: 'as24de', nom: 'AutoScout24 DE', pays: 'DE', couleur: '#1e6fd9', domaines: ['autoscout24.de'], vendeurs: 'mixte', verifie: true,
    note: 'Très grand choix en Allemagne, surtout chez des pros. Le filtre pays garde uniquement les voitures en Allemagne.',
    filtres: ['modele', 'electrique', 'prix', 'annee', 'km', 'tri'],
    lien: c => q('https://www.autoscout24.de/lst/peugeot/2008', {
      atype: 'C', cy: 'D', fuel: 'E', priceto: c.prixMax, fregfrom: c.anneeMin, kmto: c.kmMax,
      sort: prix(c) ? 'price' : 'age', desc: prix(c) ? 0 : 1,
    }),
  },
  {
    id: 'leboncoin', nom: 'Leboncoin', pays: 'FR', couleur: '#ec5a13', domaines: ['leboncoin.fr'], vendeurs: 'mixte', verifie: false,
    note: 'Le plus d’annonces de particuliers en France. Méfie-toi des prix trop bas et des vendeurs « à l’étranger ».',
    filtres: ['modele', 'electrique', 'prix', 'annee', 'km', 'tri'],
    lien: c => q('https://www.leboncoin.fr/recherche', {
      category: 2, u_car_brand: 'PEUGEOT', u_car_model: 'PEUGEOT_2008', fuel: 4,
      price: c.prixMax ? `min-${c.prixMax}` : null, regdate: c.anneeMin ? `${c.anneeMin}-max` : null, mileage: c.kmMax ? `min-${c.kmMax}` : null,
      sort: prix(c) ? 'price' : 'time', order: prix(c) ? 'asc' : 'desc',
    }),
  },
  {
    id: 'lacentrale', nom: 'La Centrale', pays: 'FR', couleur: '#0b3d91', domaines: ['lacentrale.fr'], vendeurs: 'mixte', verifie: false,
    note: 'Site auto spécialisé français, beaucoup de professionnels.',
    filtres: ['modele', 'electrique', 'prix', 'annee', 'km', 'tri'],
    lien: c => q('https://www.lacentrale.fr/listing', {
      makesModelsCommercialNames: 'PEUGEOT:2008', energies: 'elec', priceMax: c.prixMax, yearMin: c.anneeMin, mileageMax: c.kmMax,
      sortBy: prix(c) ? 'priceAsc' : 'firstOnlineDateDesc',
    }),
  },
  {
    id: 'as24fr', nom: 'AutoScout24 FR', pays: 'FR', couleur: '#1e6fd9', domaines: ['autoscout24.fr'], vendeurs: 'mixte', verifie: true,
    note: 'Moins d’offres en France qu’en Allemagne, mais surtout des professionnels.',
    filtres: ['modele', 'electrique', 'prix', 'annee', 'km', 'tri'],
    lien: c => q('https://www.autoscout24.fr/lst', {
      mmmv: '55|20237||,55|76031||', atype: 'C', cy: 'F', fuel: 'E', priceto: c.prixMax, fregfrom: c.anneeMin, kmto: c.kmMax,
      sort: prix(c) ? 'price' : 'age', desc: prix(c) ? 0 : 1,
    }),
  },
  {
    id: 'as24be', nom: 'AutoScout24 BE', pays: 'BE', couleur: '#1e6fd9', domaines: ['autoscout24.be'], vendeurs: 'mixte', verifie: true,
    note: 'Le plus grand choix en Belgique, annonces en français et en néerlandais.',
    filtres: ['modele', 'electrique', 'prix', 'annee', 'km', 'tri'],
    lien: c => q('https://www.autoscout24.be/fr/lst', {
      mmmv: '55|20237||,55|76031||', atype: 'C', cy: 'B', fuel: 'E', priceto: c.prixMax, fregfrom: c.anneeMin, kmto: c.kmMax,
      sort: prix(c) ? 'price' : 'age', desc: prix(c) ? 0 : 1,
    }),
  },
  {
    id: '2ememain', nom: '2ememain', pays: 'BE', couleur: '#e8590c', domaines: ['2ememain.be', '2dehands.be'], vendeurs: 'mixte', verifie: true,
    note: 'Petites annonces belges, beaucoup de particuliers. Le vendeur doit te remettre le Car-Pass.',
    filtres: ['modele', 'electrique', 'prix', 'annee', 'km', 'tri'],
    lien: c => {
      // Filtres d'intervalle dans le fragment (#), séparés par « | » ; prix en centimes.
      const h = [
        c.prixMax ? `PriceCentsTo:${c.prixMax * 100}` : '',
        c.anneeMin ? `constructionYearFrom:${c.anneeMin}` : '',
        c.kmMax ? `mileageTo:${c.kmMax}` : '',
        prix(c) ? 'sortBy:PRICE|sortOrder:INCREASING' : 'sortBy:SORT_INDEX|sortOrder:DECREASING',
        'Language:all-languages',
      ].filter(Boolean).join('|');
      return `https://www.2ememain.be/l/autos/peugeot/f/2008+electrique/10776+11756/#${h}`;
    },
  },
  {
    id: 'gocar', nom: 'Gocar', pays: 'BE', couleur: '#13a36b', domaines: ['gocar.be'], vendeurs: 'mixte', verifie: false,
    note: 'Site auto belge. Si un filtre n’est pas repris, règle-le sur la page : le filtre électrique, lui, est dans l’adresse.',
    filtres: ['modele', 'electrique', 'prix', 'annee', 'km', 'tri'],
    lien: c => q('https://gocar.be/fr/search/u_electrique', {
      gbrands: 'Peugeot', gmodels: '2008', fuel: 'Electrique',
      price: c.prixMax ? `:${c.prixMax}` : null, first_registration_year: c.anneeMin ? `${c.anneeMin}:` : null, kilometers: c.kmMax ? `:${c.kmMax}` : null,
      sort: prix(c) ? 'price-asc' : 'published_date-desc',
    }),
  },
];

export function siteDepuisUrl(url: string): Site | null {
  try {
    const h = new URL(url.trim()).hostname.replace(/^www\./, '');
    return SITES.find(s => s.domaines.some(d => h === d || h.endsWith('.' + d))) ?? null;
  } catch {
    return null;
  }
}

export const sitesDuPays = (p: Pays) => SITES.filter(s => s.pays === p);
