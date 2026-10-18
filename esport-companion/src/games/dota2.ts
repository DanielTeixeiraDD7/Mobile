import type { GameAdapter, MatchDetail, Opts } from '../core/adapter';
import { ApiError } from '../core/errors';
import { http } from '../core/http';
import type { Competition, CompetitionDetail, Fetched, Match, MatchGame, Team } from '../core/model';
import { checkMatch } from '../core/quality';
import { groupSeries, liveToMatch, OPENDOTA, SERIES_COUNT, type RawLive, type RawMatch, type RawProMatch } from '../providers/opendota';
import { DEFS } from './defs';

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
export const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com';

export interface HeroInfo { id: number; name: string; img: string | null }
export interface ItemInfo { id: number; name: string; img: string | null }

let heroCache: Map<number, HeroInfo> | null = null;
let itemCache: Map<number, ItemInfo> | null = null;

export async function heroes(o: Opts = {}): Promise<Map<number, HeroInfo>> {
  if (heroCache) return heroCache;
  const r = await http.get<Record<string, { id: number; localized_name: string; img?: string }>>(OPENDOTA, 'constants/heroes', { ttl: 7 * DAY, signal: o.signal, maxWait: 30_000 });
  heroCache = new Map(Object.values(r.data).map(h => [h.id, { id: h.id, name: h.localized_name, img: h.img ? STEAM_CDN + h.img : null }]));
  return heroCache;
}

export async function items(o: Opts = {}): Promise<Map<number, ItemInfo>> {
  if (itemCache) return itemCache;
  const [ids, all] = await Promise.all([
    http.get<Record<string, string>>(OPENDOTA, 'constants/item_ids', { ttl: 7 * DAY, signal: o.signal, maxWait: 30_000 }),
    http.get<Record<string, { id: number; dname?: string; img?: string }>>(OPENDOTA, 'constants/items', { ttl: 7 * DAY, signal: o.signal, maxWait: 30_000 }),
  ]);
  itemCache = new Map(Object.entries(ids.data).map(([id, key]) => {
    const it = all.data[key];
    return [Number(id), { id: Number(id), name: it?.dname ?? key, img: it?.img ? STEAM_CDN + it.img : null }];
  }));
  return itemCache;
}

async function proMatches(o: Opts) {
  // Deux pages = ~200 parties récentes, de quoi reconstituer les séries des derniers jours.
  const p1 = await http.get<RawProMatch[]>(OPENDOTA, 'proMatches', { ttl: 5 * MIN, signal: o.signal, force: o.force });
  const last = p1.data[p1.data.length - 1];
  let all = p1.data;
  if (last) {
    try {
      const p2 = await http.get<RawProMatch[]>(OPENDOTA, `proMatches?less_than_match_id=${last.match_id}`, { ttl: 6 * 3600_000, signal: o.signal });
      all = [...p1.data, ...p2.data];
    } catch { /* la première page suffit */ }
  }
  return { data: all, fetchedAt: p1.fetchedAt, stale: p1.stale };
}

async function liveGames(o: Opts) {
  const r = await http.get<RawLive[]>(OPENDOTA, 'live', { ttl: 60_000, signal: o.signal, force: o.force, noStore: false });
  return { data: r.data.filter(l => l.league_id > 0 && (l.team_name_radiant || l.team_name_dire)), fetchedAt: r.fetchedAt, stale: r.stale };
}

function teamList(o: Opts) {
  return http.get<{ team_id: number; name: string; tag: string; logo_url: string | null; rating: number }[]>(OPENDOTA, 'teams', { ttl: DAY, signal: o.signal, maxWait: 30_000 });
}

async function leagueList(o: Opts) {
  return http.get<{ leagueid: number; name: string; tier: string }[]>(OPENDOTA, 'leagues', { ttl: 7 * DAY, signal: o.signal, maxWait: 30_000 });
}

/** Partie Dota détaillée (définitive une fois analysée : cache permanent). */
export async function dotaGame(matchId: number, o: Opts = {}): Promise<Fetched<RawMatch>> {
  const r = await http.get<RawMatch>(OPENDOTA, `matches/${matchId}`, { ttl: 30 * DAY, signal: o.signal, force: o.force, maxWait: 30_000 });
  return { data: r.data, fetchedAt: r.fetchedAt, stale: r.stale };
}

function gameOf(g: RawProMatch, number: number, sideIds: [string | undefined, string | undefined]): MatchGame {
  const radiantId = `dota2:${g.radiant_team_id ?? g.radiant_name}`;
  const radiantIdx = sideIds[0] === radiantId ? 0 : 1;
  return {
    id: String(g.match_id),
    number,
    status: g.radiant_win === null ? 'unknown' : 'finished',
    winner: g.radiant_win === null ? null : (g.radiant_win ? radiantIdx : (1 - radiantIdx)) as 0 | 1,
    sideNames: radiantIdx === 0 ? ['Radiant', 'Dire'] : ['Dire', 'Radiant'],
    map: null,
    duration: g.duration,
    vods: [],
  };
}

/** Ajoute les logos depuis la liste des équipes (facultatif : sans elle, initiales). */
async function withLogos(list: Match[], o: Opts): Promise<Match[]> {
  let logos: Map<string, string>;
  try { logos = new Map((await teamList(o)).data.filter(t => t.logo_url).map(t => [`dota2:${t.team_id}`, t.logo_url!])); } catch { return list; }
  return list.map(m => ({ ...m, sides: m.sides.map(s => (s.team && !s.team.image && logos.has(s.team.id) ? { ...s, team: { ...s.team, image: logos.get(s.team.id)! } } : s)) as Match['sides'] }));
}

export const dota2: GameAdapter = {
  def: DEFS.dota2!,

  async matches(o: Opts) {
    const [pm, live] = await Promise.all([proMatches(o), liveGames(o).catch(() => ({ data: [] as RawLive[], fetchedAt: 0, stale: true }))]);
    const series = groupSeries(pm.data, live.data, pm.fetchedAt);
    const liveMatches = live.data.map(l => liveToMatch(l, null, live.fetchedAt));
    return { data: await withLogos([...liveMatches, ...series], o), fetchedAt: pm.fetchedAt, stale: pm.stale };
  },

  async live(o: Opts) {
    const live = await liveGames(o);
    let names = new Map<number, string>();
    try { names = new Map((await leagueList(o)).data.map(l => [l.leagueid, l.name])); } catch { /* noms facultatifs */ }
    return { data: live.data.map(l => liveToMatch(l, names.get(l.league_id) ?? null, live.fetchedAt)), fetchedAt: live.fetchedAt, stale: live.stale };
  },

  async matchDetail(sourceId: string, o: Opts): Promise<Fetched<MatchDetail>> {
    if (sourceId.startsWith('live')) {
      const live = await dota2.live!(o);
      const m = live.data.find(x => x.sourceId === sourceId);
      if (!m) throw new ApiError('not_found', 'partie terminée ou introuvable', 0, OPENDOTA.name);
      return { data: { match: m, games: [], quality: [] }, fetchedAt: live.fetchedAt, stale: live.stale };
    }
    const pm = await proMatches(o);
    let list: RawProMatch[];
    if (sourceId.startsWith('s')) list = pm.data.filter(g => `s${g.series_id}` === sourceId);
    else list = pm.data.filter(g => `m${g.match_id}` === sourceId);
    if (list.length === 0 && sourceId.startsWith('m')) {
      // Partie hors de la liste récente : chargée directement.
      const g = (await dotaGame(Number(sourceId.slice(1)), o)).data;
      list = [{ match_id: g.match_id, duration: g.duration, start_time: g.start_time, radiant_team_id: g.radiant_team?.team_id ?? null, radiant_name: g.radiant_team?.name ?? g.radiant_name ?? null,
        dire_team_id: g.dire_team?.team_id ?? null, dire_name: g.dire_team?.name ?? g.dire_name ?? null, leagueid: g.leagueid, league_name: g.league?.name ?? null,
        series_id: 0, series_type: 0, radiant_score: g.radiant_score, dire_score: g.dire_score, radiant_win: g.radiant_win }];
    }
    if (list.length === 0) throw new ApiError('not_found', 'série hors de la période récente', 0, OPENDOTA.name);
    const match = (await withLogos(groupSeries(list, [], pm.fetchedAt), o))[0]!;
    const ids: [string | undefined, string | undefined] = [match.sides[0].team?.id, match.sides[1].team?.id];
    const games = [...list].sort((a, b) => a.start_time - b.start_time).map((g, i) => gameOf(g, i + 1, ids));
    return { data: { match, games, quality: checkMatch(match, games) }, fetchedAt: pm.fetchedAt, stale: pm.stale };
  },

  async competitions(o: Opts) {
    const r = await leagueList(o);
    const data: Competition[] = r.data
      .filter(l => l.tier === 'premium' || l.tier === 'professional')
      .sort((a, b) => b.leagueid - a.leagueid)
      .slice(0, 150)
      .map(l => ({ id: `dota2:${l.leagueid}`, game: 'dota2', name: l.name.trim(), region: null, image: null, priority: l.tier === 'premium' ? 0 : 1,
        prov: { source: 'opendota', kind: 'community', fetchedAt: r.fetchedAt, confidence: 'high' } }));
    return { data, fetchedAt: r.fetchedAt, stale: r.stale };
  },

  async competition(competitionId: string, _t: string | null, o: Opts): Promise<Fetched<CompetitionDetail>> {
    const id = Number(competitionId.split(':')[1]);
    const comps = await dota2.competitions!(o);
    const competition = comps.data.find(c => c.id === competitionId)
      ?? { id: competitionId, game: 'dota2', name: `Ligue ${id}`, region: null, image: null, priority: 2, prov: { source: 'opendota', kind: 'community' as const, fetchedAt: comps.fetchedAt, confidence: 'medium' as const } };
    const r = await http.get<RawProMatch[]>(OPENDOTA, `leagues/${id}/matches`, { ttl: 15 * MIN, signal: o.signal, force: o.force, maxWait: 30_000 });
    // Cette liste ne contient que les identifiants d'équipes : noms repris de la liste des équipes OpenDota.
    let names = new Map<number, { name: string; logo: string | null }>();
    try { names = new Map((await teamList(o)).data.map(t => [t.team_id, { name: t.name, logo: t.logo_url }])); } catch { /* identifiants affichés */ }
    const named = r.data.map(m => ({ ...m, league_name: competition.name,
      radiant_name: m.radiant_name ?? names.get(m.radiant_team_id ?? -1)?.name ?? null,
      dire_name: m.dire_name ?? names.get(m.dire_team_id ?? -1)?.name ?? null }));
    const series = groupSeries(named, [], r.fetchedAt).map(m => ({ ...m, sides: m.sides.map(sd => {
      const tid = Number(sd.team?.id.split(':')[1]);
      return sd.team && !sd.team.image && names.get(tid)?.logo ? { ...sd, team: { ...sd.team, image: names.get(tid)!.logo } } : sd;
    }) as Match['sides'] }));
    // Bilan par équipe CALCULÉ à partir des séries terminées (pas un classement officiel).
    const table = new Map<string, { team: NonNullable<Match['sides'][0]['team']>; wins: number; losses: number }>();
    for (const m of series) {
      if (m.status !== 'finished') continue;
      for (const [i, s] of m.sides.entries()) {
        if (!s.team) continue;
        const row = table.get(s.team.id) ?? { team: s.team, wins: 0, losses: 0 };
        if (s.winner) row.wins++; else if (m.sides[1 - i]!.winner) row.losses++;
        table.set(s.team.id, row);
      }
    }
    const standings = [...table.values()].sort((a, b) => b.wins - a.wins || a.losses - b.losses).map((r, i) => ({ rank: i + 1, ...r }));
    return {
      data: {
        competition, tournaments: [], tournament: null,
        stages: [{ id: 'all', name: 'Séries', sections: [{ name: 'Bilan calculé (séries terminées présentes dans OpenDota)', matches: series, standings }] }],
      },
      fetchedAt: r.fetchedAt, stale: r.stale,
    };
  },

  async team(teamId: string, o: Opts) {
    const id = teamId.split(':')[1];
    if (!/^\d+$/.test(id ?? '')) throw new ApiError('not_found', 'équipe sans identifiant OpenDota', 0, OPENDOTA.name);
    const [t, players, ms] = await Promise.all([
      http.get<{ team_id: number; name: string; tag: string; logo_url: string | null; rating: number; wins: number; losses: number }>(OPENDOTA, `teams/${id}`, { ttl: DAY, signal: o.signal, force: o.force }),
      http.get<{ account_id: number; name: string | null; is_current_team_member: boolean | null; games_played: number }[]>(OPENDOTA, `teams/${id}/players`, { ttl: DAY, signal: o.signal, force: o.force }),
      http.get<{ match_id: number; radiant_win: boolean; radiant: boolean; duration: number; start_time: number; leagueid: number; league_name: string; opposing_team_id: number; opposing_team_name: string; opposing_team_logo: string | null }[]>(
        OPENDOTA, `teams/${id}/matches`, { ttl: 30 * MIN, signal: o.signal, force: o.force }),
    ]);
    const team: Team = {
      id: teamId, game: 'dota2', name: t.data.name, code: t.data.tag || null, image: t.data.logo_url, region: null,
      roster: players.data.filter(p => p.is_current_team_member).map(p => ({ id: `dota2:p:${p.account_id}`, handle: p.name ?? `#${p.account_id}`, realName: null, role: null, image: null })),
      prov: { source: 'opendota', kind: 'community', fetchedAt: t.fetchedAt, confidence: 'medium', note: `Joueurs marqués « membre actuel » par OpenDota. Bilan global : ${t.data.wins} V – ${t.data.losses} D (parties).` },
    };
    const matches: Match[] = ms.data.slice(0, 40).map(m => {
      const won = m.radiant === m.radiant_win;
      const me = { team: { id: teamId, name: team.name, code: team.code, image: team.image }, score: won ? 1 : 0, winner: won, record: null };
      const opp = { team: { id: `dota2:${m.opposing_team_id}`, name: m.opposing_team_name ?? 'Inconnu', code: null, image: m.opposing_team_logo }, score: won ? 0 : 1, winner: !won, record: null };
      return {
        id: `dota2:m${m.match_id}`, game: 'dota2', source: 'opendota', sourceId: `m${m.match_id}`, status: 'finished', startTime: m.start_time * 1000,
        competition: { id: `dota2:${m.leagueid}`, name: (m.league_name ?? '').trim(), image: null }, tournamentId: null, stage: 'Partie', format: { type: 'bestOf', count: 1 },
        sides: [me, opp], duration: m.duration,
        prov: { source: 'opendota', kind: 'community', fetchedAt: ms.fetchedAt, confidence: 'high', note: 'Partie (pas la série complète)' },
      } satisfies Match;
    });
    return { data: { team, matches }, fetchedAt: t.fetchedAt, stale: t.stale };
  },

  async searchTeams(text: string, o: Opts) {
    const n = text.trim().toLowerCase();
    if (n.length < 2) return [];
    const r = await teamList(o);
    return r.data.filter(t => t.name?.toLowerCase().includes(n) || t.tag?.toLowerCase() === n).slice(0, 20).map(t => ({
      id: `dota2:${t.team_id}`, game: 'dota2', name: t.name, code: t.tag || null, image: t.logo_url, region: null, roster: [],
      prov: { source: 'opendota', kind: 'community', fetchedAt: r.fetchedAt, confidence: 'medium' },
    }));
  },
};

export { SERIES_COUNT };

export interface DotaPlayerData {
  accountId: number;
  name: string;
  persona: string | null;
  avatar: string | null;
  country: string | null;
  recent: { match_id: number; hero_id: number; start_time: number; duration: number; kills: number; deaths: number; assists: number; gold_per_min: number; xp_per_min: number; hero_damage: number; last_hits: number; radiant_win: boolean; player_slot: number; lobby_type: number }[];
  heroes: { hero_id: number; games: number; win: number; last_played: number }[];
}

/** Joueur Dota : profil, 20 dernières parties (filtrées sur les lobbies de tournoi), pool de héros en lobby de tournoi. */
export async function dotaPlayer(accountId: number, o: Opts = {}): Promise<Fetched<DotaPlayerData>> {
  const [p, rec, her] = await Promise.all([
    http.get<{ profile?: { personaname: string | null; name: string | null; avatarfull: string | null; loccountrycode: string | null } }>(OPENDOTA, `players/${accountId}`, { ttl: DAY, signal: o.signal, force: o.force }),
    http.get<DotaPlayerData['recent']>(OPENDOTA, `players/${accountId}/recentMatches`, { ttl: 30 * MIN, signal: o.signal, force: o.force }),
    http.get<DotaPlayerData['heroes']>(OPENDOTA, `players/${accountId}/heroes?lobby_type=1`, { ttl: DAY, signal: o.signal, force: o.force }),
  ]);
  if (!p.data.profile) throw new ApiError('not_found', 'profil privé ou inconnu', 0, OPENDOTA.name);
  return {
    data: {
      accountId,
      name: p.data.profile.name || p.data.profile.personaname || `#${accountId}`,
      persona: p.data.profile.personaname,
      avatar: p.data.profile.avatarfull,
      country: p.data.profile.loccountrycode,
      recent: rec.data.filter(m => m.lobby_type === 1),
      heroes: her.data.filter(h => h.games > 0).slice(0, 15),
    },
    fetchedAt: p.fetchedAt, stale: p.stale || rec.stale,
  };
}
