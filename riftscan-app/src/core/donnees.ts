import { DIM, type Index } from './empreinte';
import type { Carte, Historique, Prix } from './types';

/**
 * Données publiées chaque jour sur la branche « rift-data » du dépôt (script scripts/donnees.ts lancé
 * par GitHub Actions). L'app ne contacte jamais TCGCSV ni TCGplayer : elle lit cette copie.
 */
export const BASE = import.meta.env.VITE_DONNEES ?? 'https://raw.githubusercontent.com/DanielTeixeiraDD7/Mobile/rift-data/';
const CACHE = 'riftscan-donnees';

export interface Donnees { cartes: Carte[]; prix: Prix; histo: Historique; index: Index; horsLigne: boolean }

/** Réseau d'abord (prix du jour), copie locale si hors-ligne. */
async function lire(fichier: string): Promise<{ rep: Response; horsLigne: boolean }> {
  const url = BASE + fichier;
  const cache = typeof caches !== 'undefined' ? await caches.open(CACHE).catch(() => null) : null;
  try {
    const rep = await fetch(url, { cache: 'no-cache' });
    if (!rep.ok) throw new Error(String(rep.status));
    await cache?.put(url, rep.clone()).catch(() => {});
    return { rep, horsLigne: false };
  } catch (e) {
    const local = await cache?.match(url);
    if (local) return { rep: local, horsLigne: true };
    throw e;
  }
}

export async function chargerDonnees(): Promise<Donnees> {
  const [c, p, h, ie, ib] = await Promise.all(['cartes.json', 'prix.json', 'historique.json', 'empreintes.json', 'empreintes.bin'].map(lire));
  const idx = (await ie!.rep.json()) as { ids: string[]; dim: number };
  if (idx.dim !== DIM) throw new Error('Empreintes incompatibles avec cette version de l’app');
  return {
    cartes: await c!.rep.json(),
    prix: await p!.rep.json(),
    histo: await h!.rep.json(),
    index: { ids: idx.ids, lignes: new Int8Array(await ib!.rep.arrayBuffer()) },
    horsLigne: [c, p, h, ie, ib].some(x => x!.horsLigne),
  };
}
