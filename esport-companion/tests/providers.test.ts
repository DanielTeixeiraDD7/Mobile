import { describe, expect, it } from 'vitest';
import { eventToMatch, gamesOf, stagesOf, type RawEvent, type RawEventDetail } from '../src/providers/riot';
import { prettySlug } from '../src/games/riotAdapter';
import { buildStats, feedTime, loadGame, objectives, type RawFrame, type RawWindow } from '../src/providers/lolLivestats';
import { groupSeries, liveToMatch, type RawProMatch } from '../src/providers/opendota';
import { towersDestroyedBy, barracksDestroyedBy } from '../src/games/dotaView';
import { Http, type ProviderConfig } from '../src/core/http';

// Toutes les données ci-dessous sont FICTIVES (forme copiée des réponses réelles).
const ev = (state: string, teams: RawEvent['match'] extends infer M ? M extends { teams: infer T } ? T : never : never): RawEvent => ({
  startTime: '2026-10-17T18:00:00Z', state, type: 'match', blockName: 'Play-offs',
  league: { name: 'Ligue Test', slug: 'ligue_test', image: 'http://static.lolesports.com/x.png' },
  tournament: { split: { name: 'Été' } },
  match: { id: '42', teams, strategy: { type: 'bestOf', count: 5 } },
});

describe('Riot : normalisation', () => {
  it('match terminé : score, vainqueur, BO, https, phase', () => {
    const m = eventToMatch('lol', 'lolesports', ev('completed', [
      { name: 'Test Alpha', code: 'ALP', image: 'http://static.lolesports.com/a.png', result: { outcome: 'win', gameWins: 3 }, record: { wins: 2, losses: 0 } },
      { name: 'Test Beta', code: 'BET', result: { outcome: 'loss', gameWins: 1 } },
    ]), 1)!;
    expect(m).toMatchObject({ id: 'lol:42', status: 'finished', format: { count: 5 }, stage: 'Été · Play-offs', competition: { id: 'lol:ligue_test', image: 'https://static.lolesports.com/x.png' } });
    expect(m.sides[0]).toMatchObject({ score: 3, winner: true, record: { wins: 2, losses: 0 }, team: { id: 'lol:ALP', image: 'https://static.lolesports.com/a.png' } });
    expect(m.sides[1]).toMatchObject({ score: 1, winner: false });
  });
  it('match à venir : équipe TBD → null, pas de score', () => {
    const m = eventToMatch('lol', 'lolesports', ev('unstarted', [{ name: 'TBD', code: 'TBD' }, { name: 'Test Beta', code: 'BET', result: { gameWins: 0 } }]), 1)!;
    expect(m.status).toBe('upcoming');
    expect(m.sides[0].team).toBeNull();
    expect(m.sides[1].score).toBeNull();
  });
  it('émissions (type show) ignorées', () => {
    expect(eventToMatch('lol', 's', { ...ev('completed', []), type: 'show' }, 1)).toBeNull();
  });
  it('parties : côtés, VOD (fr puis en en premier), non jouées', () => {
    const d: RawEventDetail = { id: '42', type: 'match', tournament: { id: 't' }, league: { id: 'l', slug: 's', name: 'L' }, match: { teams: [], games: [
      { number: 1, id: 'g1', state: 'completed', teams: [{ id: 'A', side: 'red' }, { id: 'B', side: 'blue' }], vods: [
        { parameter: 'de', provider: 'youtube', locale: 'de-DE' }, { parameter: 'fr', provider: 'youtube', locale: 'fr-FR', mediaLocale: { englishName: 'French' } }, { parameter: '123', provider: 'twitch', locale: 'en-US' }] },
      { number: 2, id: 'g2', state: 'unneeded', teams: [] },
    ] } };
    const g = gamesOf(d, ['A', 'B']);
    expect(g[0]!.sideNames).toEqual(['red', 'blue']);
    expect(g[0]!.vods.map(v => v.url)).toEqual(['https://www.youtube.com/watch?v=fr', 'https://www.twitch.tv/videos/123', 'https://www.youtube.com/watch?v=de']);
    expect(g[1]!.status).toBe('unneeded');
  });
  it('classements et liens de bracket', () => {
    const st = stagesOf('lol', 's', { stages: [{ id: 's1', name: 'Play-offs', slug: 'p', sections: [{ name: 'Bracket', matches: [
      { id: '1', state: 'completed', teams: [{ name: 'Test Alpha', code: 'ALP', result: { outcome: 'win', gameWins: 3 } }, { name: 'Test Beta', code: 'BET', result: { outcome: 'loss', gameWins: 0 } }] },
      { id: '2', state: 'unstarted', teams: [{ name: 'TBD' }, { name: 'TBD' }], previousMatchIds: ['1'] },
    ], rankings: [{ ordinal: 1, teams: [{ name: 'Test Alpha', code: 'ALP', record: { wins: 5, losses: 1 } }] }] }] }] }, 1, new Map());
    const sec = st[0]!.sections[0]!;
    expect(sec.matches[1]!.previous).toEqual(['lol:1']);
    expect(sec.standings).toEqual([{ rank: 1, team: expect.objectContaining({ id: 'lol:ALP' }), wins: 5, losses: 1 }]);
  });
  it('noms d\'éditions lisibles', () => expect(prettySlug('worlds_2026')).toBe('Worlds 2026'));
});

const frame = (t: string, state: string, b: Partial<RawFrame['blueTeam']>, r: Partial<RawFrame['redTeam']>): RawFrame => {
  const base = { totalGold: 0, inhibitors: 0, towers: 0, barons: 0, totalKills: 0, dragons: [] as string[], participants: [] };
  return { rfc460Timestamp: t, gameState: state, blueTeam: { ...base, ...b }, redTeam: { ...base, ...r } };
};
const meta: RawWindow['gameMetadata'] = {
  patchVersion: '16.20', blueTeamMetadata: { esportsTeamId: 'A', participantMetadata: [{ participantId: 1, esportsPlayerId: 'p1', summonerName: 'ALP Joueur', championId: 'Ahri', role: 'mid' }] },
  redTeamMetadata: { esportsTeamId: 'B', participantMetadata: [{ participantId: 6, esportsPlayerId: 'p6', summonerName: 'BET Joueur', championId: 'Zed', role: 'mid' }] },
};

describe('LoL livestats', () => {
  it('heure du flux arrondie à 10 s', () => {
    expect(feedTime(Date.UTC(2026, 9, 17, 18, 14, 22, 713))).toBe('2026-10-17T18:14:30.000Z');
    expect(feedTime(Date.UTC(2026, 9, 17, 18, 14, 30))).toBe('2026-10-17T18:14:30.000Z');
  });
  it('statistiques finales, vainqueur déduit seulement si tours ET gold concordent', () => {
    const first: RawWindow = { esportsGameId: 'g', gameMetadata: meta, frames: [frame('2026-10-17T18:00:00.000Z', 'in_game', {}, {})] };
    const end = frame('2026-10-17T18:30:00.000Z', 'finished', { totalGold: 60000, towers: 9, totalKills: 20, dragons: ['ocean'] }, { totalGold: 50000, towers: 2 });
    const s = buildStats(first, [end], { frames: [{ rfc460Timestamp: 'x', participants: [{ participantId: 1, level: 18, kills: 5, deaths: 1, assists: 3, totalGoldEarned: 1, creepScore: 300, killParticipation: .4, championDamageShare: .3, wardsPlaced: 10, wardsDestroyed: 2, items: [3089] }] }] }, true);
    expect(s).toMatchObject({ duration: 1800, winner: 'blue', complete: true, patch: '16.20' });
    expect(s.players.find(p => p.participantId === 1)).toMatchObject({ items: [3089], damageShare: .3, champion: 'Ahri', side: 'blue' });
    expect(s.players.find(p => p.participantId === 6)!.items).toBeNull(); // pas de détails : null, pas 0
    const mixed = buildStats(first, [frame('2026-10-17T18:30:00.000Z', 'finished', { totalGold: 60000, towers: 2 }, { totalGold: 50000, towers: 9 })], null, true);
    expect(mixed.winner).toBeNull();
  });
  it('objectifs déduits par intervalle', () => {
    const o = objectives([
      { t: 0, blueGold: 0, redGold: 0, blueKills: 0, redKills: 0, blueTowers: 0, redTowers: 0, blueDragons: 0, redDragons: 0, blueBarons: 0, redBarons: 0 },
      { t: 60, blueGold: 0, redGold: 0, blueKills: 0, redKills: 0, blueTowers: 1, redTowers: 0, blueDragons: 0, redDragons: 1, blueBarons: 0, redBarons: 0 },
    ], frame('', 'in_game', {}, { dragons: ['infernal'] }));
    expect(o).toEqual(expect.arrayContaining([
      { from: 0, to: 60, side: 'blue', type: 'tower', detail: null, count: 1 },
      { from: 0, to: 60, side: 'red', type: 'dragon', detail: 'infernal', count: 1 },
    ]));
  });
  it('rejoue une partie terminée jusqu\'à l\'image de fin (client simulé)', async () => {
    const t0 = Date.UTC(2026, 9, 17, 18);
    const fake = (async (u: string) => {
      const url = new URL(u);
      const st = url.searchParams.get('startingTime');
      const t = st ? Date.parse(st) : t0;
      const min = (t - t0) / 60000;
      if (url.pathname.includes('details')) return new Response(JSON.stringify({ frames: [] }));
      const f = min >= 5 ? frame(new Date(t0 + 5 * 60000).toISOString(), 'finished', { totalGold: 9000, towers: 3 }, { totalGold: 7000 })
        : frame(new Date(t).toISOString(), 'in_game', { totalGold: min * 1500 }, { totalGold: min * 1400 });
      return new Response(JSON.stringify({ esportsGameId: 'g', gameMetadata: meta, frames: [f] }));
    }) as unknown as typeof fetch;
    let t = 0;
    const client = new Http({ fetch: fake, now: () => (t += 1), sleep: async () => {}, online: () => true });
    let progress = 0;
    const s = await loadGame('g', { finished: true, client, onProgress: () => progress++ });
    expect(s.state).toBe('finished');
    expect(s.duration).toBe(300);
    expect(s.timeline.map(p => p.t)).toEqual([0, 60, 120, 180, 240, 300]);
    expect(progress).toBeGreaterThan(0);
  });
});

const pm = (id: number, series: number, rad: [number, string], dire: [number, string], radiantWin: boolean, start: number, type = 1): RawProMatch => ({
  match_id: id, duration: 1800, start_time: start, radiant_team_id: rad[0], radiant_name: rad[1], dire_team_id: dire[0], dire_name: dire[1],
  leagueid: 7, league_name: 'Ligue Test ', series_id: series, series_type: type, radiant_score: 20, dire_score: 10, radiant_win: radiantWin,
});

describe('OpenDota : séries reconstituées', () => {
  it('BO3 2-1 avec changement de côté entre parties', () => {
    const s = groupSeries([
      pm(1, 9, [1, 'Alpha'], [2, 'Beta'], true, 100),
      pm(2, 9, [2, 'Beta'], [1, 'Alpha'], true, 200), // Beta gagne côté Radiant
      pm(3, 9, [1, 'Alpha'], [2, 'Beta'], true, 300),
    ], [], 0)[0]!;
    expect(s).toMatchObject({ id: 'dota2:s9', status: 'finished', format: { count: 3 }, startTime: 100_000, competition: { name: 'Ligue Test' } });
    expect(s.sides.map(x => [x.team?.name, x.score, x.winner])).toEqual([['Alpha', 2, true], ['Beta', 1, false]]);
    expect(s.prov.kind).toBe('computed');
  });
  it('série incomplète : statut inconnu (pas « terminé »), ou en direct si une partie est en cours', () => {
    const one = [pm(1, 9, [1, 'Alpha'], [2, 'Beta'], true, 100, 2)];
    expect(groupSeries(one, [], 0)[0]!.status).toBe('unknown');
    const live = liveToMatch({ match_id: '5', league_id: 7, game_time: 600, activate_time: 1, radiant_score: 3, dire_score: 1, radiant_lead: 2500, team_name_radiant: 'Alpha', team_name_dire: 'Beta', team_id_radiant: 1, team_id_dire: 2, deactivate_time: 0 }, 'Ligue Test', 0);
    expect(groupSeries(one, [{ ...live, team_id_radiant: 1, team_id_dire: 2 } as never], 0)[0]!.status).toBe('live');
    expect(live.stage).toContain('gold Radiant +2');
  });
  it('BO2 1-1 : terminé sans vainqueur', () => {
    const s = groupSeries([pm(1, 4, [1, 'A'], [2, 'B'], true, 1, 3), pm(2, 4, [1, 'A'], [2, 'B'], false, 2, 3)], [], 0)[0]!;
    expect(s.status).toBe('finished');
    expect(s.sides.map(x => x.winner)).toEqual([false, false]);
  });
  it('bâtiments détruits depuis les bits des bâtiments restants', () => {
    expect(towersDestroyedBy(0b11111111111)).toBe(0);
    expect(towersDestroyedBy(0)).toBe(11);
    expect(barracksDestroyedBy(0b111100)).toBe(2);
  });
});

export type { ProviderConfig };
