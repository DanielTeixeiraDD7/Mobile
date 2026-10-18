// @vitest-environment node
import { appendFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const LOG = '/tmp/claude-0/-home-user-Mobile/42967c78-04de-5e53-afea-301318e5976c/scratchpad/live.log';
writeFileSync(LOG, '');
const log = (...a: unknown[]) => appendFileSync(LOG, a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ') + '\n');
import { lol, valorant } from '../../src/games/registry';
import { dota2, heroes } from '../../src/games/dota2';
import { loadGame } from '../../src/providers/lolLivestats';

/** Tests contre les API réelles (LIVE=1 npm run test:live). Affichent ce qui est récupéré. */
describe('API réelles', () => {
  it('LoL : calendrier, détail, livestats, classement, équipe', async () => {
    const m = await lol.matches({});
    const done = m.data.filter(x => x.status === 'finished');
    log('LoL matchs', m.data.length, 'terminés', done.length, 'à venir', m.data.filter(x => x.status === 'upcoming').length);
    expect(m.data.length).toBeGreaterThan(5);
    const last = done.sort((a, b) => (b.startTime ?? 0) - (a.startTime ?? 0))[0]!;
    const d = await lol.matchDetail(last.sourceId, {});
    log('détail', last.sides.map(s => `${s.team?.code} ${s.score}`).join(' - '), d.data.games.map(g => `${g.number}:${g.status}:${g.sideNames}`), d.data.quality);
    const g = d.data.games.find(x => x.status === 'finished')!;
    let steps = 0;
    const st = await loadGame(g.id, { finished: true, onProgress: () => steps++ });
    log('livestats', st.patch, 'durée', st.duration, 's points', st.timeline.length, 'complet', st.complete, 'vainqueur déduit', st.winner,
      st.teams.map(t => `${t.side} ${t.gold}g ${t.kills}k ${t.towers}t ${t.dragons.length}d ${t.barons}b`), st.players.slice(0, 2).map(p => `${p.name} ${p.champion} ${p.kills}/${p.deaths}/${p.assists} cs${p.cs} items${p.items?.length}`));
    expect(st.timeline.length).toBeGreaterThan(10);
    const comp = await lol.competition!(last.competition!.id, null, {});
    log('compétition', comp.data.competition.name, comp.data.tournament?.name, comp.data.stages.map(s => `${s.name}:${s.sections.map(x => x.matches.length + 'm/' + x.standings.length + 'r').join(',')}`));
    const team = await lol.team!(last.sides[0].team!.id, {});
    log('équipe', team.data.team.name, team.data.team.region, team.data.team.roster.map(p => `${p.handle}(${p.role})`).join(' '));
    expect(team.data.team.roster.length).toBeGreaterThan(0);
  });

  it('Dota 2 : séries, détail, partie, héros, ligue, équipe', async () => {
    const m = await dota2.matches({});
    log('Dota séries', m.data.length, m.data.slice(0, 3).map(x => `${x.sides[0].team?.name} ${x.sides[0].score}-${x.sides[1].score} ${x.sides[1].team?.name} BO${x.format?.count} ${x.status}`));
    const s = m.data.find(x => x.status === 'finished' && (x.format?.count ?? 1) > 1)!;
    const d = await dota2.matchDetail(s.sourceId, {});
    log('détail', d.data.games.map(g => `${g.number}:${g.winner}:${g.duration}s`), d.data.quality);
    const game = await (await import('../../src/games/dota2')).dotaGame(Number(d.data.games[0]!.id), {});
    const h = await heroes({});
    log('partie', game.data.match_id, 'gold adv pts', game.data.radiant_gold_adv?.length, 'picks', game.data.picks_bans?.length, 'héros', h.get(game.data.players[0]!.hero_id)?.name);
    const comp = await dota2.competition!(s.competition!.id, null, {});
    log('ligue', comp.data.competition.name, comp.data.stages[0]!.sections[0]!.matches.length, 'séries', comp.data.stages[0]!.sections[0]!.standings.slice(0, 3).map(r => `${r.team.name} ${r.wins}-${r.losses}`));
    const t = await dota2.team!(s.sides[0].team!.id, {});
    log('équipe', t.data.team.name, t.data.team.roster.map(p => p.handle).join(', '), t.data.matches.length, 'parties');
  });

  it('VALORANT : calendrier, détail, compétition', async () => {
    const m = await valorant.matches({});
    log('VAL', m.data.length, m.data.filter(x => x.status === 'upcoming').slice(0, 2).map(x => `${x.sides[0].team?.name ?? 'TBD'} vs ${x.sides[1].team?.name ?? 'TBD'} ${new Date(x.startTime!).toISOString()}`));
    const done = m.data.filter(x => x.status === 'finished').pop()!;
    const d = await valorant.matchDetail(done.sourceId, {});
    log('détail', d.data.match.sides.map(s => `${s.team?.code} ${s.score} ${s.winner}`), d.data.games.length, 'cartes', d.data.games[0]?.vods[0]?.url);
    const comp = await valorant.competition!(done.competition!.id, null, {});
    log('compétition', comp.data.tournament?.name, comp.data.stages.map(s => s.name));
  });
});
