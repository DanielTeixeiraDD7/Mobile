import { describe, expect, it } from 'vitest';
import { SITES, siteDepuisUrl, indexKmCustojusto } from '../src/lib/sites';
import type { Criteres } from '../src/lib/types';

const c: Criteres = { modele: 'peugeot-e2008', prixMax: 25000, anneeMin: 2021, kmMax: 80000, tri: 'recent' };
const lien = (id: string, cr = c) => SITES.find(s => s.id === id)!.lien(cr);
const params = (u: string) => Object.fromEntries(new URL(u).searchParams);

describe('liens de recherche', () => {
  it('11 sites, 4 pays, liens https valides', () => {
    expect(SITES.length).toBe(11);
    expect(new Set(SITES.map(s => s.pays))).toEqual(new Set(['PT', 'FR', 'DE', 'BE']));
    for (const s of SITES) expect(new URL(s.lien(c)).protocol).toBe('https:');
  });
  it('Standvirtual : e-2008 ET 2008 électrique, filtres relevés sur le site', () => {
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
    expect(params(lien('custojusto'))).toEqual({ pe: '25000', rs: '2021', me: '9', sp: '1' });
  });
  it('AutoScout24 FR/BE : les deux modèles (2008 et e-2008)', () => {
    expect(params(lien('as24fr')).mmmv).toBe('55|20237||,55|76031||');
    expect(params(lien('as24be')).cy).toBe('B');
  });
  it('mobile.de : formats « :max » et « min: »', () => {
    const p = params(lien('mobilede'));
    expect(p.ms).toBe('19300;46;;');
    expect(p.p).toBe(':25000');
    expect(p.fr).toBe('2021:');
    expect(p.ml).toBe(':80000');
  });
  it('2ememain : prix en centimes dans le fragment', () => {
    expect(lien('2ememain')).toBe('https://www.2ememain.be/l/autos/peugeot/f/2008+electrique/10776+11756/#PriceCentsTo:2500000|constructionYearFrom:2021|mileageTo:80000|sortBy:SORT_INDEX|sortOrder:DECREASING|Language:all-languages');
  });
  it('critères vides : aucun paramètre vide dans les liens', () => {
    const vide: Criteres = { modele: 'peugeot-e2008', prixMax: null, anneeMin: null, kmMax: null, tri: 'prix' };
    for (const s of SITES) expect(s.lien(vide)).not.toMatch(/=(&|$)|null|undefined|NaN/);
    expect(params(lien('leboncoin', vide))).toMatchObject({ sort: 'price', order: 'asc' });
  });
  it('détecte le site depuis un lien d’annonce', () => {
    expect(siteDepuisUrl('https://www.standvirtual.com/carros/anuncio/peugeot-e-2008-ID8Pabc.html')?.id).toBe('standvirtual');
    expect(siteDepuisUrl('https://m.leboncoin.fr/ad/voitures/123')?.id).toBe('leboncoin');
    expect(siteDepuisUrl('https://www.2dehands.be/v/auto/x')?.id).toBe('2ememain');
    expect(siteDepuisUrl('pas un lien')).toBeNull();
  });
});
