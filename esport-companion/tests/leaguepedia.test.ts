import { describe, expect, it } from 'vitest';
import { buildQuery, parseGames } from '../src/providers/leaguepedia';
import { Http } from '../src/core/http';

// Lignes FICTIVES (forme des réponses Cargo).
const row = (n: number, winner: string) => ({
  T1: 'Test Alpha', T2: 'Test Beta', Date: '2026-10-17 18:00:00', N: String(n), Blue: 'Test Alpha', Red: 'Test Beta', Winner: winner,
  T1B1: 'Ahri', T2B1: 'Zed', T1B2: 'Lux', T2B2: 'Jinx', T1B3: 'Vi', T2B3: 'None', T1P1: 'Azir', T2P1: 'Orianna', T2P2: 'Sejuani', T1P2: 'Vi2', T1P3: 'Kai\'Sa', T2P3: 'Rell',
  T2B4: 'Karma', T1B4: 'Rakan', T2B5: 'Nami', T1B5: 'Lulu', T2P4: 'Gnar', T1P4: 'Renekton', T1P5: 'Nautilus', T2P5: 'Varus',
});

describe('Leaguepedia', () => {
  it('draft dans l\'ordre réel du tournoi (B1 R1 B2 R2 B3 R3 / B R R B B R / R B R B / R B B R)', () => {
    const g = parseGames([row(1, '1')])[0]!;
    expect(g.winner).toBe('blue');
    expect(g.draft.slice(0, 6).map(d => `${d.side[0]}${d.kind[0]}:${d.champion}`)).toEqual(['bb:Ahri', 'rb:Zed', 'bb:Lux', 'rb:Jinx', 'bb:Vi', 'rb:null']);
    expect(g.draft.slice(6, 12).map(d => d.champion)).toEqual(['Azir', 'Orianna', 'Sejuani', 'Vi2', "Kai'Sa", 'Rell']);
    expect(g.draft.slice(16).map(d => `${d.side[0]}:${d.champion}`)).toEqual(['r:Gnar', 'b:Renekton', 'b:Nautilus', 'r:Varus']);
    expect(parseGames([{ ...row(2, '2') }])[0]!.winner).toBe('red');
    expect(parseGames([{ ...row(3, '') }])[0]!.winner).toBeNull();
  });
  it('requête : noms exacts (échappés) des deux équipes dans les deux ordres, fenêtre ±18 h', () => {
    const q = new URLSearchParams(buildQuery("O'Team", 'Test Beta', Date.UTC(2026, 9, 17, 18)));
    expect(q.get('where')).toBe("((MS.Team1='O\\'Team' AND MS.Team2='Test Beta') OR (MS.Team1='Test Beta' AND MS.Team2='O\\'Team')) AND MS.DateTime_UTC >= '2026-10-17 00:00:00' AND MS.DateTime_UTC <= '2026-10-18 12:00:00'");
    expect(q.get('origin')).toBe('*');
  });
  it('erreur « ratelimited » renvoyée en HTTP 200 : rien en cache, source mise en pause', async () => {
    const { lpMatchGames, LEAGUEPEDIA } = await import('../src/providers/leaguepedia');
    const map = new Map();
    const h = new Http({ fetch: (async () => new Response(JSON.stringify({ error: { code: 'ratelimited' } }))) as unknown as typeof fetch,
      cache: { get: async k => map.get(k), put: async (k, d, at) => void map.set(k, { data: d, at }) }, now: () => 1, sleep: async () => {}, online: () => true });
    const httpMod = await import('../src/core/http');
    const orig = httpMod.http.get.bind(httpMod.http);
    (httpMod.http as { get: typeof orig }).get = h.get.bind(h) as typeof orig;
    await expect(lpMatchGames(['A', 'B'], 0, { finished: true })).rejects.toMatchObject({ kind: 'rate_limited' });
    expect(map.size).toBe(0);
    expect(h.limiter(LEAGUEPEDIA).blockedFor).toBeGreaterThan(0);
    (httpMod.http as { get: typeof orig }).get = orig;
  });
});

describe('draft vérifiée contre le flux officiel', () => {
  it('gardée, inversée ou écartée', async () => {
    const { alignDraft } = await import('../src/providers/leaguepedia');
    const d = parseGames([row(1, '1')])[0]!.draft;
    const blue = ['Azir', 'Vi2', "Kai'Sa", 'Renekton', 'Nautilus'], red = ['Orianna', 'Sejuani', 'Rell', 'Gnar', 'Varus'];
    expect(alignDraft(d, { blue, red })).toEqual({ draft: d, swapped: false });
    const sw = alignDraft(d, { blue: red, red: blue })!;
    expect(sw.swapped).toBe(true);
    expect(sw.draft[0]!.side).toBe('red');
    expect(alignDraft(d, { blue: ['Teemo'], red })).toBeNull();
    expect(alignDraft(d, { blue: ['MonkeyKing', 'Vi2', 'KaiSa', 'Renekton', 'Nautilus'], red }, n => (n === 'Azir' ? 'MonkeyKing' : n))?.swapped).toBe(false);
  });
});
