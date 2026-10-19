import { describe, expect, it } from 'vitest';
import { SITES, siteDepuisUrl, indexKmCustojusto, energieEffective } from '../src/lib/sites';
import { MARQUES, modeleDuCatalogue, nomsModeles } from '../src/lib/catalogue';
import type { Criteres } from '../src/lib/types';

const vide: Criteres = { marque: '', modele: '', energie: 'tous', prixMax: null, anneeMin: null, kmMax: null, tri: 'recent' };
const e2008: Criteres = { ...vide, marque: 'Peugeot', modele: 'e-2008', prixMax: 25000, anneeMin: 2021, kmMax: 80000 };
const site = (id: string) => SITES.find(s => s.id === id)!;
const lien = (id: string, c: Criteres = e2008) => site(id).recherche(c).url;
const params = (u: string) => Object.fromEntries(new URL(u).searchParams);

describe('liens de recherche : Peugeot e-2008 (liens d’origine, vérifiés)', () => {
  it('11 sites, 4 pays, liens https valides', () => {
    expect(SITES.length).toBe(11);
    expect(new Set(SITES.map(s => s.pays))).toEqual(new Set(['PT', 'FR', 'DE', 'BE']));
    for (const s of SITES) expect(new URL(s.recherche(e2008).url).protocol).toBe('https:');
  });
  it('Standvirtual : e-2008 ET 2008 électrique', () => {
    const p = params(lien('standvirtual'));
    expect(p['search[filter_enum_model][0]']).toBe('e-2008');
    expect(p['search[filter_enum_fuel_type]']).toBe('electric');
    expect(p['search[filter_float_price:to]']).toBe('25000');
    expect(p['search[filter_float_first_registration_year:from]']).toBe('2021');
    expect(p['search[filter_float_mileage:to]']).toBe('80000');
    expect(p['search[order]']).toBe('created_at_first:desc');
  });
  it('CustoJusto : km en index (80 000 → 9 = ≤ 79 999 km)', () => {
    expect(indexKmCustojusto(80000)).toBe(9);
    expect(indexKmCustojusto(100000)).toBe(11);
    expect(indexKmCustojusto(1000)).toBe(1);
    expect(lien('custojusto')).toBe('https://www.custojusto.pt/portugal/veiculos/carros-usados/peugeot/e-2008?pe=25000&rs=2021&me=9&sp=1');
  });
  it('AutoScout24 : FR/BE les deux modèles, DE « 2008 » électrique', () => {
    expect(params(lien('as24fr')).mmmv).toBe('55|20237||,55|76031||');
    expect(params(lien('as24be')).cy).toBe('B');
    const de = lien('as24de');
    expect(de.startsWith('https://www.autoscout24.de/lst/peugeot/2008?')).toBe(true);
    expect(params(de)).toMatchObject({ cy: 'D', fuel: 'E', priceto: '25000' });
  });
  it('mobile.de : formats « :max » et « min: »', () => {
    const p = params(lien('mobilede'));
    expect(p).toMatchObject({ ms: '19300;46;;', p: ':25000', fr: '2021:', ml: ':80000', ft: 'ELECTRICITY' });
  });
  it('2ememain : prix en centimes dans le fragment', () => {
    expect(lien('2ememain')).toBe('https://www.2ememain.be/l/autos/peugeot/f/2008+electrique/10776+11756/#PriceCentsTo:2500000|constructionYearFrom:2021|mileageTo:80000|sortBy:SORT_INDEX|sortOrder:DECREASING|Language:all-languages');
  });
  it('tous les filtres sont appliqués partout sauf sur les sites non vérifiables', () => {
    for (const id of ['standvirtual', 'olx', 'custojusto', 'as24fr', 'as24be', '2ememain']) expect(site(id).recherche(e2008).ok).toEqual(expect.arrayContaining(['marque', 'modele', 'energie']));
  });
});

describe('liens de recherche : autres voitures', () => {
  const p208: Criteres = { ...vide, marque: 'Peugeot', modele: '208', energie: 'essence', anneeMin: 2019 };
  it('Peugeot 208 essence sur les sites vérifiés', () => {
    expect(lien('standvirtual', p208)).toBe('https://www.standvirtual.com/carros/peugeot/208?search%5Bfilter_enum_fuel_type%5D%5B0%5D=gaz&search%5Bfilter_float_first_registration_year%3Afrom%5D=2019&search%5Border%5D=created_at_first%3Adesc');
    expect(lien('custojusto', p208)).toBe('https://www.custojusto.pt/portugal/veiculos/carros-usados/peugeot/q/208?fu=1&rs=2019&sp=1');
    expect(lien('as24de', p208)).toBe('https://www.autoscout24.de/lst/peugeot/208?atype=C&cy=D&fuel=B&fregfrom=2019&sort=age&desc=1');
    expect(lien('2ememain', p208).startsWith('https://www.2ememain.be/l/autos/peugeot/q/208/#constructionYearFrom:2019|')).toBe(true);
    for (const s of SITES) expect(s.recherche(p208).ok).toContain('marque');
  });
  it('adresses propres à chaque site (VW = vw sur Standvirtual, Série 1 = 1er en Allemagne)', () => {
    const golf: Criteres = { ...vide, marque: 'Volkswagen', modele: 'golf' };
    expect(lien('standvirtual', golf)).toContain('/carros/vw/golf?');
    expect(lien('custojusto', golf)).toContain('/carros-usados/vw/q/golf?');
    const s1: Criteres = { ...vide, marque: 'BMW', modele: 'Série 1' };
    expect(lien('as24de', s1)).toContain('/lst/bmw/1er?');
    expect(lien('as24fr', s1)).toContain('/lst/bmw/serie-1-tous?');
    // Absent de Standvirtual sous ce nom : marque seule, modèle à régler sur le site.
    expect(lien('standvirtual', s1)).toContain('/carros/bmw?');
    expect(site('standvirtual').recherche(s1).ok).not.toContain('modele');
  });
  it('modèle 100 % électrique : filtre électrique imposé', () => {
    const e208: Criteres = { ...vide, marque: 'Peugeot', modele: 'e-208' };
    expect(energieEffective(e208)).toBe('electrique');
    expect(lien('as24de', e208)).toContain('/lst/peugeot/208?atype=C&cy=D&fuel=E');
    expect(lien('as24fr', e208)).toContain('/lst/peugeot/e-208?');
  });
  it('modèle hors liste : mot-clé là où c’est possible, sinon marque seule', () => {
    const c: Criteres = { ...vide, marque: 'Peugeot', modele: 'Partner Tepee' };
    expect(lien('custojusto', c)).toContain('/peugeot/q/partner-tepee');
    expect(lien('2ememain', c)).toContain('/peugeot/q/partner+tepee/');
    expect(params(lien('leboncoin', c))).toMatchObject({ u_car_brand: 'PEUGEOT', text: 'Partner Tepee' });
    expect(lien('as24de', c)).toContain('/lst/peugeot?');
    expect(site('as24de').recherche(c).ok).not.toContain('modele');
  });
  it('modèle seul : marque retrouvée (« Clio » → Renault)', () => {
    const c: Criteres = { ...vide, modele: 'Clio' };
    expect(lien('standvirtual', c)).toContain('/carros/renault/clio?');
    expect(lien('as24fr', c)).toContain('/lst/renault/clio?');
  });
  it('marque hors liste : mot-clé marque + modèle', () => {
    const c: Criteres = { ...vide, marque: 'Porsche', modele: 'Taycan' };
    expect(lien('custojusto', c)).toContain('/carros-usados/q/porsche-taycan');
    expect(site('custojusto').recherche(c).ok).toEqual(expect.arrayContaining(['marque', 'modele']));
    expect(site('standvirtual').recherche(c).ok).not.toContain('marque');
  });
  it('hybride : toutes les variantes sur Standvirtual, code 2 sur AutoScout24', () => {
    const c: Criteres = { ...vide, marque: 'Toyota', modele: 'C-HR', energie: 'hybride' };
    const p = params(lien('standvirtual', c));
    expect([p['search[filter_enum_fuel_type][0]'], p['search[filter_enum_fuel_type][1]'], p['search[filter_enum_fuel_type][2]']]).toEqual(['hibride-gaz', 'hibride-diesel', 'plugin-hybrid']);
    expect(params(lien('as24be', c)).fuel).toBe('2');
  });
  it('critères vides : aucun paramètre vide dans les liens', () => {
    for (const c of [vide, { ...vide, tri: 'prix' as const }, { ...vide, modele: 'Clio' }]) {
      for (const s of SITES) {
        const u = s.recherche(c).url;
        expect(u).not.toMatch(/=(&|$|#)|null|undefined|NaN/);
        expect(u.slice(8)).not.toContain('//');
      }
    }
    expect(params(lien('leboncoin', { ...vide, tri: 'prix' }))).toMatchObject({ sort: 'price', order: 'asc' });
  });
  it('détecte le site depuis un lien d’annonce', () => {
    expect(siteDepuisUrl('https://www.standvirtual.com/carros/anuncio/peugeot-e-2008-ID8Pabc.html')?.id).toBe('standvirtual');
    expect(siteDepuisUrl('https://m.leboncoin.fr/ad/voitures/123')?.id).toBe('leboncoin');
    expect(siteDepuisUrl('https://www.2dehands.be/v/auto/x')?.id).toBe('2ememain');
    expect(siteDepuisUrl('pas un lien')).toBeNull();
  });
});

describe('catalogue', () => {
  it('28 marques, noms uniques, recherche souple', () => {
    expect(MARQUES.length).toBe(28);
    expect(new Set(MARQUES.map(m => m.nom)).size).toBe(28);
    expect(modeleDuCatalogue('volkswagen', 'id 3')?.nom).toBe('ID.3');
    expect(modeleDuCatalogue('citroen', 'e-c4')?.nom).toBe('ë-C4');
    expect(nomsModeles('Tesla')).toEqual(['Model 3', 'Model Y', 'Model S']);
    expect(modeleDuCatalogue('Peugeot', 'Partner')).toBeNull();
  });
});
