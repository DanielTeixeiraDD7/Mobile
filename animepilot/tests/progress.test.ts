import { describe, expect, it } from 'vitest';
import { canIncrement, diff, nextUnit, normalizeProgress, normalizeScore, planProgress, planStatus } from '../src/domain/progress';
import { entry, media } from './fixtures';

const anime = (o = {}) => entry({ media: media({ id: 1, episodes: 12 }), ...o });
const manga = (o = {}) => entry({ media: media({ id: 2, type: 'MANGA', episodes: null, chapters: null }), type: 'MANGA', ...o });

describe('progression', () => {
  it('anime : épisodes entiers, bornés au total', () => {
    expect(normalizeProgress(anime(), 3.7)).toBe(3);
    expect(normalizeProgress(anime(), 40)).toBe(12);
    expect(normalizeProgress(anime(), -2)).toBe(0);
    expect(normalizeProgress(anime(), NaN)).toBe(0);
  });
  it('manga : chapitres décimaux, sans borne si total inconnu', () => {
    expect(normalizeProgress(manga(), 10.5)).toBe(10.5);
    expect(normalizeProgress(manga(), 10.04)).toBe(10);
    expect(normalizeProgress(manga(), 1200)).toBe(1200);
  });
  it('+1 passe au chapitre entier suivant', () => {
    expect(nextUnit(manga({ progress: 10.5 }))).toBe(11);
    expect(nextUnit(manga({ progress: 10 }))).toBe(11);
    expect(nextUnit(anime({ progress: 0 }))).toBe(1);
  });
  it('+1 bloqué au total connu', () => {
    expect(canIncrement(anime({ progress: 12 }))).toBe(false);
    expect(canIncrement(anime({ progress: 11 }))).toBe(true);
    expect(canIncrement(manga({ progress: 999 }))).toBe(true);
  });
  it('commencer un titre « à regarder » le passe en cours avec date de début', () => {
    expect(planProgress(anime(), 1, '2026-10-17')).toEqual({ progress: 1, status: 'CURRENT', startedAt: '2026-10-17' });
  });
  it('atteindre le total termine le titre', () => {
    const p = planProgress(anime({ status: 'CURRENT', progress: 11, startedAt: '2026-01-01' }), 12, '2026-10-17');
    expect(p).toEqual({ progress: 12, status: 'COMPLETED', completedAt: '2026-10-17' });
  });
  it('finir un revisionnage incrémente le compteur', () => {
    const p = planProgress(anime({ status: 'REWATCH', progress: 11, startedAt: 'x' }), 12, 'd');
    expect(p.repeatCount).toBe(1);
    expect(p.status).toBe('COMPLETED');
  });
  it('reculer sous le total rouvre un titre terminé', () => {
    const p = planProgress(anime({ status: 'COMPLETED', progress: 12, completedAt: 'd', startedAt: 'x' }), 10, 'd');
    expect(p).toEqual({ progress: 10, status: 'CURRENT', completedAt: null });
  });
  it('statut terminé remplit la progression', () => {
    expect(planStatus(anime({ status: 'CURRENT', progress: 3, startedAt: 'x' }), 'COMPLETED', 'd')).toEqual({ status: 'COMPLETED', progress: 12, completedAt: 'd' });
  });
  it('statut terminé sans total connu ne touche pas la progression', () => {
    expect(planStatus(manga({ status: 'CURRENT', progress: 50, startedAt: 'x' }), 'COMPLETED', 'd').progress).toBeUndefined();
  });
  it('« à revoir » remet la progression à zéro', () => {
    expect(planStatus(anime({ status: 'COMPLETED', progress: 12, completedAt: 'd' }), 'REWATCH').progress).toBe(0);
  });
  it('note : pas de 0,5 entre 0 et 10', () => {
    expect(normalizeScore(7.3)).toBe(7.5);
    expect(normalizeScore(12)).toBe(10);
    expect(normalizeScore(null)).toBeNull();
  });
  it('diff ignore les champs inchangés', () => {
    expect(diff(anime({ progress: 2 }), { progress: 2, status: 'CURRENT' })).toEqual({ before: { status: 'PLANNING' }, after: { status: 'CURRENT' } });
  });
});
