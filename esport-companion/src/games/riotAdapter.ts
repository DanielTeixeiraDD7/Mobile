import type { GameAdapter, GameDef, MatchDetail, Opts } from '../core/adapter';
import { ApiError } from '../core/errors';
import { http, type ProviderConfig } from '../core/http';
import type { Competition, CompetitionDetail, Fetched, Match, Team, Tournament } from '../core/model';
import { getPrefs } from '../core/prefs';
import { checkMatch, dedupeMatches } from '../core/quality';
import { eventToMatch, gamesOf, https, stagesOf, statusOf, teamRef, type RawEvent, type RawEventDetail, type RawStandings } from '../providers/riot';

interface RawLeague { id: string; slug: string; name: string; region: string; image: string; priority: number; displayPriority?: { position: number; status: string } }
interface RawTeamFull { id: string; slug: string; name: string; code: string; image: string; status: string; homeLeague?: { name: string; region: string } | null; players?: { id: string; summonerName: string; firstName: string; lastName: string; image: string; role: string }[] }

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

export interface RiotAdapterConfig {
  def: GameDef;
  gw: ProviderConfig;
  /** Paramètres ajoutés à chaque requête (ex. `&sport=val`). */
  extra: string;
  /** La passerelle expose getTeams (rosters). */
  teams: boolean;
  live: boolean;
}

export function createRiotAdapter(cfg: RiotAdapterConfig): GameAdapter & {
  leagues(o: Opts): Promise<Fetched<RawLeague[]>>;
  followedLeagueIds(o: Opts): Promise<string[]>;
} {
  const game = cfg.def.id;
  const q = (path: string, params = '') => `${path}?hl=fr-FR${cfg.extra}${params}`;
  const src = cfg.gw.id;

  async function leagues(o: Opts) {
    const r = await http.get<{ data: { leagues: RawLeague[] } }>(cfg.gw, q('getLeagues'), { ttl: 7 * DAY, signal: o.signal, force: o.force });
    return { data: r.data.data.leagues, fetchedAt: r.fetchedAt, stale: r.stale };
  }

  /** Ligues suivies : choix de l'utilisateur, sinon celles mises en avant par la source. */
  async function followedLeagueIds(o: Opts) {
    const all = (await leagues(o)).data;
    const chosen = getPrefs().followed[game];
    if (chosen?.length) return all.filter(l => chosen.includes(l.slug)).map(l => l.id);
    return all.filter(l => l.displayPriority?.status === 'force_selected' || l.displayPriority?.status === 'selected').map(l => l.id);
  }

  async function schedule(leagueIds: string[], o: Opts, pageToken?: string) {
    const params = (leagueIds.length ? `&leagueId=${leagueIds.join(',')}` : '') + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
    const r = await http.get<{ data: { schedule: { events: RawEvent[]; pages: { older: string | null; newer: string | null } } } }>(
      cfg.gw, q('getSchedule', params), { ttl: 3 * MIN, signal: o.signal, force: o.force });
    const now = r.fetchedAt;
    const matches = r.data.data.schedule.events.map(e => eventToMatch(game, src, e, now)).filter((m): m is Match => !!m);
    return { matches, pages: r.data.data.schedule.pages, fetchedAt: r.fetchedAt, stale: r.stale };
  }

  async function teamIndex(o: Opts): Promise<RawTeamFull[]> {
    if (!cfg.teams) return [];
    const r = await http.get<{ data: { teams: RawTeamFull[] } }>(cfg.gw, q('getTeams'), { ttl: 7 * DAY, signal: o.signal, maxWait: 30_000 });
    return r.data.data.teams.filter(t => t.slug !== 'tbd');
  }

  const toTeam = (t: RawTeamFull, fetchedAt: number): Team => ({
    id: `${game}:${t.code || t.name}`,
    game,
    name: t.name,
    code: t.code || null,
    image: https(t.image),
    region: t.homeLeague ? `${t.homeLeague.name} (${t.homeLeague.region})` : null,
    roster: (t.players ?? []).map(p => ({
      id: `${game}:p:${p.id}`,
      handle: p.summonerName,
      realName: [p.firstName, p.lastName].filter(Boolean).join(' ') || null,
      role: p.role || null,
      image: https(p.image),
    })),
    prov: { source: src, kind: 'official', fetchedAt, confidence: 'high', note: t.status === 'active' ? 'Roster actuel publié par la source' : 'Équipe archivée' },
  });

  const adapter = {
    def: cfg.def,
    leagues,
    followedLeagueIds,

    async matches(o: Opts) {
      const ids = await followedLeagueIds(o);
      const s = await schedule(ids, o);
      return { data: s.matches, fetchedAt: s.fetchedAt, stale: s.stale };
    },

    ...(cfg.live ? {
      async live(o: Opts) {
        const r = await http.get<{ data: { schedule: { events: RawEvent[] | null } } }>(cfg.gw, q('getLive'), { ttl: 30_000, signal: o.signal, force: o.force });
        const data = (r.data.data.schedule.events ?? []).map(e => eventToMatch(game, src, { ...e, state: 'inProgress' }, r.fetchedAt)).filter((m): m is Match => !!m);
        return { data, fetchedAt: r.fetchedAt, stale: r.stale };
      },
    } : {}),

    async matchDetail(id: string, o: Opts): Promise<Fetched<MatchDetail>> {
      const r = await http.get<{ data: { event: RawEventDetail | null } }>(cfg.gw, q('getEventDetails', `&id=${id}`), { ttl: 60_000, signal: o.signal, force: o.force });
      const d = r.data.data.event;
      if (!d) throw new ApiError('not_found', 'match introuvable', 0, cfg.gw.name);
      const states = d.match.games.map(g => g.state);
      const status = states.length && states.every(s => s === 'completed' || s === 'unneeded') ? 'finished'
        : states.some(s => s === 'inProgress') ? 'live'
        : states.some(s => s === 'completed') ? 'live' : 'upcoming';
      // Horaire et phase ne sont pas dans cette réponse : l'écran les reprend du calendrier.
      const t = d.match.teams;
      const need = d.match.strategy?.count ? Math.floor(d.match.strategy.count / 2) + 1 : null;
      const sides = t.slice(0, 2).map((x, i) => {
        const other = t[1 - i];
        const score = x.result?.gameWins ?? null;
        const winner = status === 'finished' && score !== null && other?.result?.gameWins !== undefined
          ? (need ? score >= need : score > (other.result?.gameWins ?? 0)) : null;
        return { team: teamRef(game, x), score: status === 'upcoming' ? null : score, winner, record: null };
      }) as Match['sides'];
      const match: Match = {
        id: `${game}:${d.id}`, game, source: src, sourceId: d.id, status: status as Match['status'],
        startTime: null,
        competition: { id: `${game}:${d.league.slug}`, name: d.league.name, image: https(d.league.image) },
        tournamentId: d.tournament.id, stage: null,
        format: d.match.strategy?.count ? { type: 'bestOf', count: d.match.strategy.count } : null,
        sides, duration: null,
        prov: { source: src, kind: 'official', fetchedAt: r.fetchedAt, confidence: 'high' },
      };
      const games = gamesOf(d, [t[0]?.id, t[1]?.id]);
      const streams = (d.streams ?? []).filter(x => x.provider === 'twitch' || x.provider === 'youtube')
        .sort((a, b) => Number(b.locale.startsWith('fr')) - Number(a.locale.startsWith('fr')))
        .slice(0, 4)
        .map(x => ({ url: x.provider === 'twitch' ? `https://www.twitch.tv/${x.parameter}` : `https://www.youtube.com/watch?v=${x.parameter}`, label: `${x.provider === 'twitch' ? 'Twitch' : 'YouTube'} · ${x.locale}` }));
      return { data: { match, games, quality: checkMatch(match, games), streams }, fetchedAt: r.fetchedAt, stale: r.stale };
    },

    async competitions(o: Opts) {
      const r = await leagues(o);
      const data: Competition[] = r.data.map(l => ({
        id: `${game}:${l.slug}`, game, name: l.name, region: l.region || null, image: https(l.image),
        priority: l.displayPriority?.status === 'force_selected' ? 0 : l.displayPriority?.status === 'selected' ? 1 : 2,
        prov: { source: src, kind: 'official', fetchedAt: r.fetchedAt, confidence: 'high' },
      }));
      return { data, fetchedAt: r.fetchedAt, stale: r.stale };
    },

    async competition(competitionId: string, tournamentId: string | null, o: Opts): Promise<Fetched<CompetitionDetail>> {
      const slug = competitionId.slice(game.length + 1);
      const ls = await leagues(o);
      const l = ls.data.find(x => x.slug === slug);
      if (!l) throw new ApiError('not_found', 'compétition introuvable', 0, cfg.gw.name);
      let tournaments: Tournament[] = [];
      let trMeta = { fetchedAt: ls.fetchedAt, stale: ls.stale };
      try {
        const tr = await http.get<{ data: { leagues: { tournaments: { id: string; slug: string; startDate: string; endDate: string }[] }[] } }>(
          cfg.gw, q('getTournamentsForLeague', `&leagueId=${l.id}`), { ttl: DAY, signal: o.signal, force: o.force });
        tournaments = (tr.data.data.leagues[0]?.tournaments ?? [])
          .map(t => ({ id: t.id, competitionId, name: prettySlug(t.slug), startDate: t.startDate, endDate: t.endDate }))
          .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
        trMeta = tr;
      } catch (e) {
        if (!(e instanceof ApiError) || e.kind !== 'http') throw e;
        // VALORANT : pas de liste des tournois. On retrouve le tournoi en cours via un match récent de la ligue.
        const recent = (await schedule([l.id], o)).matches.sort((a, b) => (b.startTime ?? 0) - (a.startTime ?? 0));
        const ref = recent.find(m => (m.startTime ?? 0) <= Date.now()) ?? recent[0];
        if (ref) {
          const ev = await http.get<{ data: { event: RawEventDetail | null } }>(cfg.gw, q('getEventDetails', `&id=${ref.sourceId}`), { ttl: DAY, signal: o.signal });
          const tid = ev.data.data.event?.tournament.id;
          if (tid) tournaments = [{ id: tid, competitionId, name: ref.stage?.split(' · ')[0] ?? l.name, startDate: null, endDate: null }];
        }
      }
      const today = new Date().toISOString().slice(0, 10);
      const tournament = tournaments.find(t => t.id === tournamentId)
        ?? tournaments.find(t => (t.startDate ?? '') <= today && today <= (t.endDate ?? ''))
        ?? tournaments.find(t => (t.startDate ?? '') <= today)
        ?? tournaments[0] ?? null;
      const competition = (await adapter.competitions(o)).data.find(c => c.id === competitionId)!;
      if (!tournament) return { data: { competition, tournaments, tournament: null, stages: [] }, fetchedAt: trMeta.fetchedAt, stale: trMeta.stale };

      const done = !!tournament.endDate && tournament.endDate < today;
      const st = await http.get<{ data: { standings: (RawStandings & { name?: string; startTime?: string; endTime?: string })[] } }>(cfg.gw, q('getStandings', `&tournamentId=${tournament.id}`),
        { ttl: done ? 30 * DAY : 5 * MIN, signal: o.signal, force: o.force });
      const meta = st.data.data.standings[0];
      if (meta?.name && !tournament.startDate) {
        tournament.name = meta.name;
        tournament.startDate = meta.startTime?.slice(0, 10) ?? null;
        tournament.endDate = meta.endTime?.slice(0, 10) ?? null;
      }
      // Horaires des matchs : calendrier de la ligue (événements terminés + à venir).
      const sched = new Map<string, Match>();
      try {
        const ce = await http.get<{ data: { schedule: { events: RawEvent[] } } }>(cfg.gw, q('getCompletedEvents', `&tournamentId=${tournament.id}`),
          { ttl: done ? 30 * DAY : 10 * MIN, signal: o.signal, force: o.force });
        for (const e of ce.data.data.schedule.events) {
          const m = eventToMatch(game, src, { ...e, type: 'match', state: 'completed', league: { name: l.name, slug: l.slug, image: l.image } } as RawEvent, ce.fetchedAt);
          if (m) sched.set(m.id, m);
        }
      } catch { /* source sans cet appel (VALORANT) : horaires repris du calendrier */ }
      try {
        if (!done) for (const m of (await schedule([l.id], o)).matches) if (!sched.has(m.id)) sched.set(m.id, m);
      } catch { /* les classements restent affichables sans horaires */ }
      const stages = (st.data.data.standings[0] ? stagesOf(game, src, st.data.data.standings[0], st.fetchedAt, sched) : []).map(s => ({
        ...s,
        sections: s.sections.map(sec => ({ ...sec, matches: dedupeMatches(sec.matches.map(m => ({ ...m, tournamentId: tournament.id, competition: m.competition ?? { id: competitionId, name: l.name, image: https(l.image) } }))).matches })),
      }));
      return { data: { competition, tournaments, tournament, stages }, fetchedAt: st.fetchedAt, stale: st.stale };
    },

    ...(cfg.teams ? {
      async team(teamId: string, o: Opts) {
        const code = teamId.slice(game.length + 1);
        const idx = await teamIndex(o);
        const raw = idx.filter(t => (t.code || t.name) === code).sort((a, b) => Number(b.status === 'active') - Number(a.status === 'active'))[0];
        if (!raw) throw new ApiError('not_found', 'équipe introuvable', 0, cfg.gw.name);
        const all = await adapter.matches(o);
        const matches = all.data.filter(m => m.sides.some(s => s.team?.id === teamId));
        return { data: { team: toTeam(raw, all.fetchedAt), matches }, fetchedAt: all.fetchedAt, stale: all.stale };
      },
      async searchTeams(text: string, o: Opts) {
        const n = norm(text);
        if (n.length < 2) return [];
        const idx = await teamIndex(o);
        return idx
          .filter(t => t.status === 'active' && (norm(t.name).includes(n) || norm(t.code).includes(n) || (t.players ?? []).some(p => norm(p.summonerName) === n)))
          .slice(0, 20)
          .map(t => toTeam(t, Date.now()));
      },
    } : {}),
  };
  return adapter;
}

const norm = (s: string | null | undefined) => (s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function prettySlug(slug: string): string {
  return slug.split('_').map(w => (/^\d{4}$/.test(w) ? w : w.length <= 3 ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1))).join(' ');
}

export { statusOf };
