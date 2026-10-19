import { describe, expect, it } from 'vitest';
import { EXERCICES } from '../src/core/exercices';
import { SOL, dureeCycle, image, type Squelette } from '../src/core/figurine';

/** Contrôle des animations : pas de membre sous le sol, et des appuis réellement posés. */
const points = (s: Squelette) => Object.entries(s).filter(([k]) => k !== 'tete') as [string, [number, number]][];
const ex = Object.values(EXERCICES);

describe('animations des exercices', () => {
  it.each(ex.map(e => [e.id, e] as const))('%s : rien sous le sol, rien hors cadre', (_, e) => {
    const c = dureeCycle(e.anim);
    for (let i = 0; i <= 40; i++) {
      const s = image(e.anim, (c * i) / 40);
      for (const [k, [x, y]] of points(s)) {
        expect(y, `${k} à t=${((c * i) / 40).toFixed(2)}`).toBeLessThanOrEqual(SOL + 3.5);
        expect(x).toBeGreaterThan(-5); expect(x).toBeLessThan(205);
      }
      expect(s.tete[1]).toBeGreaterThan(2);
    }
  });

  it.each(ex.map(e => [e.id, e] as const))('%s : un appui touche le sol à chaque pose clé', (_, e) => {
    const c = dureeCycle(e.anim);
    for (let i = 0; i < 40; i++) {
      const s = image(e.anim, (c * i) / 40);
      const bas = Math.max(...points(s).map(([, [, y]]) => y), s.tete[1] + 10);
      // Sur un support (marche) ou au sol, à 3 px près.
      const surMarche = e.anim.decor?.some(d => d.type === 'marche');
      expect(SOL - bas, `t=${((c * i) / 40).toFixed(2)}`).toBeLessThanOrEqual(surMarche ? 30 : 4);
    }
  });
});
