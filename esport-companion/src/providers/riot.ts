import type { ProviderConfig } from '../core/http';
import type { Match, MatchGame, MatchSide, MatchStatus, Provenance, Standing, Stage, TeamRef } from '../core/model';

/**
 * Passerelle « persisted » des sites officiels lolesports.com / valorantesports.com.
 * API non documentée ; la clé est publique (intégrée au site par Riot). Voir docs/DATA_SOURCES.md.
 */
export const RIOT_PUBLIC_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';

export const LOL_GW: ProviderConfig = {
  id: 'lolesports',
  name: 'LoL Esports',
  baseUrl: 'https://esports-api.lolesports.com/persisted/gw/',
  headers: { 'x-api-key': RIOT_PUBLIC_KEY },
  rpm: 30,
};

export const VAL_GW: ProviderConfig = {
  id: 'valesports',
  name: 'VALORANT Esports',
  baseUrl: 'https://esports-api.service.valorantesports.com/persisted/val/',
  headers: { 'x-api-key': RIOT_PUBLIC_KEY },
  rpm: 30,
};

// ---- Formes brutes (seulement les champs utilisés) ----

export interface RawTeam {
  id?: string;
  slug?: string;
  name: string;
  code?: string;
  image?: string;
  result?: { outcome?: 'win' | 'loss' | 'tie' | null; gameWins?: number } | null;
  record?: { wins: number; losses: number } | null;
}

export interface RawEvent {
  startTime: string;
  state: 'unstarted' | 'inProgress' | 'completed' | string;
  type: 'match' | 'show' | string;
  blockName?: string | null;
  league: { name: string; slug: string; image?: string; id?: string };
  tournament?: { split?: { name?: string } };
  match?: { id: string; flags?: string[]; teams: RawTeam[]; strategy?: { type?: string; count?: number } };
  id?: string;
}

export interface RawGame {
  number: number;
  id: string;
  state: 'completed' | 'inProgress' | 'unstarted' | 'unneeded' | string;
  teams: { id: string; side: 'blue' | 'red' | string }[];
  vods?: { parameter: string; provider: string; locale: string; mediaLocale?: { englishName?: string } }[];
}

export interface RawEventDetail {
  id: string;
  type: string;
  tournament: { id: string };
  league: { id: string; slug: string; image?: string; name: string };
  match: { strategy?: { count?: number }; teams: RawTeam[]; games: RawGame[] };
  streams?: { parameter: string; provider: string; locale: string }[];
}

export const https = (u: string | undefined | null) => (u ? u.replace(/^http:\/\//, 'https://') : null);

export const statusOf = (state: string): MatchStatus =>
  state === 'completed' ? 'finished' : state === 'inProgress' ? 'live' : state === 'unstarted' ? 'upcoming' : 'unknown';

export function teamRef(game: string, t: RawTeam): TeamRef | null {
  if (!t || !t.name || t.name === 'TBD' || t.code === 'TBD') return null;
  return { id: `${game}:${t.code || t.name}`, name: t.name, code: t.code || null, image: https(t.image) };
}

function side(game: string, t: RawTeam | undefined, status: MatchStatus): MatchSide {
  if (!t) return { team: null, score: null, winner: null, record: null };
  const outcome = t.result?.outcome;
  return {
    team: teamRef(game, t),
    score: status === 'upcoming' ? null : t.result?.gameWins ?? null,
    winner: outcome === 'win' ? true : outcome === 'loss' ? false : null,
    record: t.record ?? null,
  };
}

export function eventToMatch(game: string, source: string, e: RawEvent, now: number): Match | null {
  if (e.type !== 'match' || !e.match) return null;
  const status = statusOf(e.state);
  const t = e.match.teams;
  return {
    id: `${game}:${e.match.id}`,
    game,
    source,
    sourceId: e.match.id,
    status,
    startTime: Date.parse(e.startTime) || null,
    competition: { id: `${game}:${e.league.slug}`, name: e.league.name, image: https(e.league.image) },
    tournamentId: null,
    stage: [e.tournament?.split?.name, e.blockName].filter(Boolean).join(' · ') || null,
    format: e.match.strategy?.count ? { type: 'bestOf', count: e.match.strategy.count } : null,
    sides: [side(game, t[0], status), side(game, t[1], status)],
    duration: null,
    prov: { source, kind: 'official', fetchedAt: now, confidence: 'high' } satisfies Provenance,
  };
}

const VOD_URL: Record<string, (p: string) => string> = {
  youtube: p => `https://www.youtube.com/watch?v=${p}`,
  twitch: p => (/^\d+$/.test(p) ? `https://www.twitch.tv/videos/${p}` : `https://www.twitch.tv/${p}`),
};

export function gamesOf(d: RawEventDetail, matchTeamIds: [string | undefined, string | undefined]): MatchGame[] {
  return d.match.games.map(g => {
    const sideOf = (teamId?: string) => g.teams.find(x => x.id === teamId)?.side ?? null;
    const vods = (g.vods ?? [])
      .filter(v => VOD_URL[v.provider])
      .sort((a, b) => Number(b.locale.startsWith('fr')) - Number(a.locale.startsWith('fr')) || Number(b.locale.startsWith('en')) - Number(a.locale.startsWith('en')))
      .slice(0, 3)
      .map(v => ({ url: VOD_URL[v.provider]!(v.parameter), label: `${v.provider === 'youtube' ? 'YouTube' : 'Twitch'} · ${v.mediaLocale?.englishName ?? v.locale}` }));
    return {
      id: g.id,
      number: g.number,
      status: g.state === 'completed' ? 'finished' : g.state === 'inProgress' ? 'live' : g.state === 'unneeded' ? 'unneeded' : g.state === 'unstarted' ? 'upcoming' : 'unknown',
      winner: null, // la passerelle ne donne pas le vainqueur par partie : complété par les livestats (LoL)
      sideNames: [sideOf(matchTeamIds[0]), sideOf(matchTeamIds[1])],
      map: null,
      duration: null,
      vods,
    } satisfies MatchGame;
  });
}

export interface RawStandings {
  stages: { id: string; name: string; slug: string; sections: { name: string; matches?: RawStandingMatch[]; rankings?: { ordinal: number; teams: (RawTeam & { record?: { wins: number; losses: number } })[] }[] }[] }[];
}
export interface RawStandingMatch { id: string; state: string; teams: RawTeam[]; previousMatchIds?: string[] }

export function stagesOf(game: string, source: string, raw: RawStandings, now: number, scheduleById: Map<string, Match>): Stage[] {
  return raw.stages.map(s => ({
    id: s.id,
    name: s.name,
    sections: s.sections.map(sec => ({
      name: sec.name,
      matches: (sec.matches ?? []).map(m => {
        const known = scheduleById.get(`${game}:${m.id}`);
        const previous = (m.previousMatchIds ?? []).map(x => `${game}:${x}`);
        if (known) return previous.length ? { ...known, previous } : known;
        const status = statusOf(m.state);
        return {
          id: `${game}:${m.id}`, game, source, sourceId: m.id, status, startTime: null, competition: null, tournamentId: null, stage: s.name,
          format: null,
          sides: [side(game, m.teams[0]!, status), side(game, m.teams[1]!, status)],
          duration: null,
          prov: { source, kind: 'official', fetchedAt: now, confidence: 'high' },
          ...(previous.length ? { previous } : {}),
        } satisfies Match;
      }),
      standings: (sec.rankings ?? []).flatMap(r => r.teams.flatMap((t): Standing[] => {
        const team = teamRef(game, t);
        return team ? [{ rank: r.ordinal ?? null, team, wins: t.record?.wins ?? null, losses: t.record?.losses ?? null }] : [];
      })),
    })),
  }));
}
