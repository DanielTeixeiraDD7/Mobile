import { describe, expect, it } from 'vitest';
import { cadresAutour, chercher, DIM, empreinte, quantifier, type Pixels } from '@/core/empreinte';
import { enEuros, valeurUsd, variation } from '@/core/prix';
import { rechercher } from '@/core/recherche';
import type { Carte, Historique, Prix } from '@/core/types';

/** Image de test : motif coloré déterministe (w × h). */
function image(w: number, h: number, graine: number): Pixels {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = (y * w + x) * 4;
    data[k] = (Math.sin((x + graine * 7) / 9) * 0.5 + 0.5) * 255;
    data[k + 1] = (Math.cos((y * (graine % 5 + 1)) / 13) * 0.5 + 0.5) * 255;
    data[k + 2] = ((x * y + graine * 31) % 97) * 2.6;
    data[k + 3] = 255;
  }
  return { data, width: w, height: h };
}
const assombrir = (p: Pixels, f: number): Pixels => ({ ...p, data: p.data.map((v, i) => (i % 4 === 3 ? v : v * f)) });

describe('empreinte', () => {
  it('a la bonne taille et une norme de 1', () => {
    const v = empreinte(image(200, 279, 1));
    expect(v).toHaveLength(DIM);
    expect(Math.hypot(...v)).toBeCloseTo(1, 4);
  });
  it('ne dépend presque pas de l’éclairage', () => {
    const a = empreinte(image(200, 279, 2)), b = empreinte(assombrir(image(200, 279, 2), 0.5));
    expect(a.reduce((s, x, i) => s + x * b[i]!, 0)).toBeGreaterThan(0.99);
  });
  it('retrouve la bonne image parmi d’autres, même assombrie et décalée', () => {
    const refs = Array.from({ length: 30 }, (_, g) => image(200, 279, g + 10));
    const lignes = new Int8Array(30 * DIM);
    refs.forEach((r, k) => lignes.set(quantifier(empreinte(r)), k * DIM));
    const index = { ids: refs.map((_, k) => `c${k}`), lignes };
    // Photo : la carte n° 17 dans une image plus grande, décalée de 4 px.
    const src = assombrir(refs[17]!, 0.7);
    const grande: Pixels = { data: new Uint8ClampedArray(240 * 330 * 4), width: 240, height: 330 };
    for (let y = 0; y < 279; y++) for (let x = 0; x < 200; x++) for (let c = 0; c < 4; c++) grande.data[((y + 29) * 240 + x + 24) * 4 + c] = src.data[(y * 200 + x) * 4 + c]!;
    const res = chercher(index, cadresAutour({ x: 20, y: 25, l: 200, h: 279 }).map(c => empreinte(grande, c)));
    expect(res[0]!.id).toBe('c17');
    // Motif synthétique à hautes fréquences : plus sensible au décalage qu'une vraie carte (≥ 0,75 mesuré sur 250 photos simulées).
    expect(res[0]!.score).toBeGreaterThan(0.5);
  });
  it('une carte paysage lue à 90° correspond à sa version tournée', () => {
    const p = image(279, 200, 3);
    const tournee: Pixels = { data: new Uint8ClampedArray(200 * 279 * 4), width: 200, height: 279 };
    // Rotation de 90° dans le sens horaire : (x, y) paysage → (H-1-y, x) portrait.
    for (let y = 0; y < 200; y++) for (let x = 0; x < 279; x++) for (let c = 0; c < 4; c++) tournee.data[(x * 200 + (199 - y)) * 4 + c] = p.data[(y * 279 + x) * 4 + c]!;
    const a = empreinte(p, undefined, 90), b = empreinte(tournee), c = empreinte(p, undefined, 270);
    const sim = (u: Float32Array, v: Float32Array) => u.reduce((s, x, i) => s + x * v[i]!, 0);
    expect(Math.max(sim(a, b), sim(c, b))).toBeGreaterThan(0.97);
  });
});

describe('prix', () => {
  const prix: Prix = { maj: '', usdParEur: 1.25, dateTaux: '', p: { a: { N: [10, 8, 12], F: [null, 30, 40] } } };
  it('convertit en euros au taux BCE (1 € = 1,25 $ → 10 $ = 8 €)', () => expect(enEuros(10, prix)).toBe(8));
  it('prend le prix du marché, sinon le plus bas', () => {
    expect(valeurUsd(prix, 'a', 'N')).toBe(10);
    expect(valeurUsd(prix, 'a', 'F')).toBe(30);
    expect(valeurUsd(prix, 'b', 'N')).toBeNull();
  });
  it('variation sur l’historique en ignorant les trous', () => {
    const h: Historique = { jours: ['1', '2', '3', '4'], p: { a: { N: [null, 10, 12, null] } } };
    expect(variation(h, 'a', 'N')).toEqual({ pct: 20, jours: 1 });
    expect(variation(h, 'a', 'F')).toBeNull();
  });
});

describe('recherche', () => {
  const c = (id: string, n: string, no: string): Carte => ({ id, n, s: 'OGN', sn: 'Origins', no, r: 'Rare', t: 'Unit', d: [], img: '', url: '' });
  const cartes = [c('1', 'Jinx - Loose Cannon', '202/298'), c('2', 'Légion Rearguard', '010/298'), c('3', 'Jinx - Rebel (Alternate Art)', '301/298')];
  it('par nom, sans accents ni casse', () => expect(rechercher(cartes, 'legion').map(x => x.id)).toEqual(['2']));
  it('par numéro, avec ou sans zéros', () => {
    expect(rechercher(cartes, '10').map(x => x.id)).toEqual(['2']);
    expect(rechercher(cartes, '010').map(x => x.id)).toEqual(['2']);
  });
  it('plusieurs mots', () => expect(rechercher(cartes, 'jinx alternate').map(x => x.id)).toEqual(['3']));
});
