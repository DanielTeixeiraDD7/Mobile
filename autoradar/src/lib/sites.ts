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
  /** Alertes e-mail : où les activer. */
  alertes: string;
  lien(c: Criteres): string;
}

export const SITES: Site[] = [];

export function siteDepuisUrl(url: string): Site | null {
  try {
    const h = new URL(url.trim()).hostname.replace(/^www\./, '');
    return SITES.find(s => s.domaines.some(d => h === d || h.endsWith('.' + d))) ?? null;
  } catch {
    return null;
  }
}

export const sitesDuPays = (p: Pays) => SITES.filter(s => s.pays === p);
