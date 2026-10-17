import { describe, expect, it } from 'vitest';
import { parseRoute, routeHash, tabOf } from '../src/router';

describe('router', () => {
  it('lit les onglets et retombe sur accueil', () => {
    expect(parseRoute('#/manga')).toEqual({ name: 'tab', tab: 'manga' });
    expect(parseRoute('')).toEqual({ name: 'tab', tab: 'home' });
    expect(parseRoute('#/nimporte')).toEqual({ name: 'tab', tab: 'home' });
  });
  it('lit une fiche et refuse un id invalide', () => {
    expect(parseRoute('#/media/ANIME/21')).toEqual({ name: 'media', type: 'ANIME', id: 21 });
    expect(parseRoute('#/media/ANIME/abc')).toEqual({ name: 'tab', tab: 'home' });
  });
  it('aller-retour hash', () => {
    for (const h of ['#/calendar', '#/media/MANGA/30013', '#/search/ANIME', '#/data']) expect(routeHash(parseRoute(h))).toBe(h);
  });
  it('rattache les écrans secondaires au bon onglet', () => {
    expect(tabOf({ name: 'media', type: 'MANGA', id: 1 })).toBe('manga');
    expect(tabOf({ name: 'settings' })).toBe('profile');
  });
});
