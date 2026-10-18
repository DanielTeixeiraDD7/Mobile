import { describe, expect, it } from 'vitest';
import { LESSONS, MODULES, ALL_CARDS } from '../src/content';
import { runTests } from '../src/lib/testing';

/**
 * Garantie de qualité du contenu : pour CHAQUE exercice,
 * le code de départ compile mais échoue aux tests, et la solution réussit tous les tests.
 */
describe('contenu', () => {
  it('identifiants uniques, cartes valides', () => {
    expect(new Set(LESSONS.map(l => l.id)).size).toBe(LESSONS.length);
    expect(new Set(ALL_CARDS.map(c => c.id)).size).toBe(ALL_CARDS.length);
    for (const c of ALL_CARDS) expect(c.answer, c.id).toBeLessThan(c.choices.length);
    for (const m of MODULES) for (const l of m.lessons) expect(l.id.startsWith(m.id + '-'), l.id).toBe(true);
  });
  for (const l of LESSONS) {
    describe(`leçon ${l.id} — ${l.title}`, () => {
      it('départ : compile, mais au moins un test échoue', async () => {
        const r = await runTests(l.exercise.files, l.exercise.tests, { messages: l.exercise.messages });
        expect(r.compileError, JSON.stringify(r.compileError)).toBeNull();
        expect(r.passed, 'le code de départ ne doit pas déjà réussir').toBe(false);
      });
      it('solution : tous les tests passent', async () => {
        const r = await runTests({ ...l.exercise.files, ...l.exercise.solution }, l.exercise.tests, { messages: l.exercise.messages });
        expect(r.compileError, JSON.stringify(r.compileError)).toBeNull();
        expect(r.results.filter(x => !x.ok), JSON.stringify(r.results)).toEqual([]);
      });
      it('fichiers en lecture seule non modifiés par la solution', () => {
        for (const f of l.exercise.readonly ?? []) expect(f in l.exercise.solution, f).toBe(false);
        expect(l.exercise.open in l.exercise.files).toBe(true);
      });
    });
  }
});
