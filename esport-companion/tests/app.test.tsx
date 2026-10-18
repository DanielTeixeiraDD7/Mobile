import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { fakeMatch } from './fixtures/fake';

// Adaptateurs FICTIFS : LoL répond, Dota 2 est en panne (isolation des sources).
vi.mock('../src/games/registry', async () => {
  const { DEFS } = await import('../src/games/defs');
  const { ApiError } = await import('../src/core/errors');
  const now = Date.now();
  const lol = {
    def: DEFS.lol,
    matches: async () => ({ data: [
      fakeMatch({ id: 'lol:1', startTime: now - 3_600_000 }),
      fakeMatch({ id: 'lol:2', status: 'upcoming', startTime: now + 3_600_000, sides: [{ team: { id: 'lol:ALP', name: 'Test Alpha', code: 'ALP', image: null }, score: null, winner: null, record: null }, { team: null, score: null, winner: null, record: null }] }),
      fakeMatch({ id: 'lol:3', status: 'live', startTime: now - 600_000 }),
    ], fetchedAt: now, stale: false }),
    matchDetail: async (id: string) => ({ data: { match: fakeMatch({ id: `lol:${id}` }), games: [], quality: [] }, fetchedAt: now, stale: false }),
  };
  const dota2 = { def: DEFS.dota2, matches: async () => { throw new ApiError('unavailable', 'HTTP 503', 0, 'OpenDota'); }, matchDetail: async () => { throw new Error('x'); } };
  const ADAPTERS = { lol, dota2 };
  return { ADAPTERS, adapterOf: (g: string) => (ADAPTERS as Record<string, unknown>)[g] ?? null, gameOfId: (id: string) => id.split(':')[0], lol, valorant: null };
});

afterEach(() => { cleanup(); location.hash = ''; });

describe('interface', () => {
  it('présentation → accueil : direct, à venir, résultats ; une source en panne n\'empêche pas l\'affichage', async () => {
    const store = await import('../src/data/store');
    await store.init('ui-' + Math.random());
    const { App } = await import('../src/App');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Commencer' }));
    expect(await screen.findByText('En direct')).toBeTruthy();
    expect(await screen.findByText(/Dota 2 : Source temporairement indisponible \(OpenDota\)/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /À venir/ })).toBeTruthy();
    expect(screen.getAllByText('Test Alpha').length).toBeGreaterThan(0);
    expect(screen.getByText('À déterminer')).toBeTruthy(); // adversaire inconnu : pas inventé
    // Ouvre un match terminé
    fireEvent.click(screen.getAllByRole('button', { name: /Test Alpha contre Test Beta/ })[0]!);
    const head = await screen.findByLabelText(/Score 2 à 1/);
    expect(head).toBeTruthy();
    expect(screen.getByText('Données et qualité')).toBeTruthy();
    // Favori depuis… la liste des favoris vide
    fireEvent.click(screen.getByRole('button', { name: 'Favoris' }));
    expect(await screen.findByText('Aucun favori')).toBeTruthy();
    expect(within(screen.getByRole('navigation')).getAllByRole('button')).toHaveLength(5);
    store.reset();
  });
});
