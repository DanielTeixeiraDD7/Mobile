import { describe, expect, it } from 'vitest';
import { ALIMENTS, GOUTS_DEFAUT, REPAS, calculer, conseilsPour, habitudesPour, journeeType, repasOk, repasPour, type Gouts } from '@/core/aliments';

/** Goûts de l'utilisateur réel : ni œufs ni légumes, seulement pomme, banane, clémentine. */
const DANIEL: Gouts = { exclus: ['oeufs', 'legumes'], fruits: ['pomme', 'banane', 'clementine'] };
const CIBLE = 2060;

describe('repas selon les goûts', () => {
  it('aucun repas proposé ne contient un aliment exclu ou un fruit non aimé', () => {
    for (const m of ['petitdej', 'dejeuner', 'collation', 'diner'] as const) {
      const options = repasPour(m, DANIEL, CIBLE);
      expect(options.length).toBeGreaterThan(1);
      for (const o of options) {
        for (const l of o.lignes) {
          const a = ALIMENTS[l.a] as { tag?: string; fruit?: string };
          expect(a.tag === 'oeufs' || a.tag === 'legumes').toBe(false);
          if (a.fruit) expect(DANIEL.fruits).toContain(a.fruit);
        }
      }
    }
  });
  it('les repas avec œufs ou légumes existent mais sont filtrés', () => {
    expect(REPAS.some(r => !repasOk(r, DANIEL))).toBe(true);
    expect(REPAS.every(r => repasOk(r, GOUTS_DEFAUT))).toBe(true);
  });
  it('poulet / dinde, riz / pâtes et frites font partie des idées', () => {
    const noms = REPAS.filter(r => repasOk(r, DANIEL)).map(r => r.nom).join(' ');
    expect(noms).toMatch(/[Pp]oulet/); expect(noms).toMatch(/[Dd]inde/); expect(noms).toMatch(/riz/i); expect(noms).toMatch(/[Pp]âtes/); expect(noms).toMatch(/[Ff]rites/);
  });
});

describe('portions', () => {
  it('le féculent s’ajuste pour approcher la cible (calcul à la main)', () => {
    // Poulet grillé et riz, cible 721 kcal : poulet 160 g = 224 kcal, huile 10 g = 90 kcal → riz = (721 − 314) / 1,30 ≈ 313 g → 310 g.
    const r = calculer(REPAS.find(x => x.id === 'dj_poulet_riz')!, 721);
    expect(r.lignes.find(l => l.a === 'riz')!.g).toBe(310);
    expect(r.kcal).toBe(224 + 403 + 90);
  });
  it('la portion reste dans ses bornes', () => {
    const r = calculer(REPAS.find(x => x.id === 'dj_poulet_riz')!, 3000);
    expect(r.lignes.find(l => l.a === 'riz')!.g).toBe(400);
  });
  it('une journée type reste proche de l’objectif et apporte beaucoup de protéines', () => {
    for (let j = 0; j < 7; j++) {
      const d = journeeType(DANIEL, CIBLE, j);
      expect(Math.abs(d.kcal - CIBLE)).toBeLessThanOrEqual(CIBLE * 0.1);
      expect(d.prot).toBeGreaterThanOrEqual(100);
    }
  });
});

describe('habitudes et conseils', () => {
  it('sans légumes, l’habitude « légumes » devient « 1 fruit » avec ses fruits', () => {
    const h = habitudesPour(DANIEL);
    expect(h.some(x => x.id === 'legumes')).toBe(false);
    expect(h.find(x => x.id === 'fruit')!.label).toContain('pomme');
    expect(h).toHaveLength(habitudesPour(GOUTS_DEFAUT).length);
  });
  it('aucun conseil ne parle d’œufs ni de légumes', () => {
    for (const c of conseilsPour(DANIEL)) expect(c).not.toMatch(/œuf|légume/i);
  });
});
