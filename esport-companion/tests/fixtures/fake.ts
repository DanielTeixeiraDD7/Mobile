/**
 * DONNÉES FICTIVES pour les tests uniquement — jamais affichées dans l'app.
 * Équipes « Test Alpha / Test Beta », compétition « Ligue Test ».
 */
import type { Match } from '../../src/core/model';

export function fakeMatch(over: Partial<Match> & { id?: string } = {}): Match {
  const id = over.id ?? 'lol:1';
  return {
    id, game: id.split(':')[0]!, source: 'test', sourceId: id.split(':')[1]!, status: 'finished', startTime: Date.UTC(2026, 9, 17, 18),
    competition: { id: 'lol:ligue-test', name: 'Ligue Test (fictive)', image: null }, tournamentId: null, stage: null,
    format: { type: 'bestOf', count: 3 },
    sides: [
      { team: { id: 'lol:ALP', name: 'Test Alpha', code: 'ALP', image: null }, score: 2, winner: true, record: null },
      { team: { id: 'lol:BET', name: 'Test Beta', code: 'BET', image: null }, score: 1, winner: false, record: null },
    ],
    duration: null,
    prov: { source: 'test', kind: 'official', fetchedAt: 0, confidence: 'high' },
    ...over,
  };
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
