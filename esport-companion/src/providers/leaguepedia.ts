import { ApiError } from '../core/errors';
import { http, type ProviderConfig } from '../core/http';
import type { Fetched } from '../core/model';

/**
 * Leaguepedia (lol.fandom.com), base Cargo publique, contenu CC BY-SA 3.0.
 * Sert uniquement à compléter LoL : vainqueur officiel de chaque partie et draft ordonnée.
 * Limite anonyme stricte → très peu de requêtes, cache long, panne sans conséquence.
 */
export const LEAGUEPEDIA: ProviderConfig = { id: 'leaguepedia', name: 'Leaguepedia', baseUrl: 'https://lol.fandom.com/api.php?', rpm: 4 };

export type Side = 'blue' | 'red';
export interface DraftStep { side: Side; kind: 'ban' | 'pick'; champion: string | null; order: number }
export interface LpGame {
  number: number;
  blue: string;
  red: string;
  winner: Side | null;
  draft: DraftStep[];
}

/** Ordre standard de la draft de tournoi (bans 3+2, picks 1-2-2-1 puis 1-2-1). T1 = côté bleu. */
const ORDER: [Side, 'ban' | 'pick', number][] = [
  ['blue', 'ban', 1], ['red', 'ban', 1], ['blue', 'ban', 2], ['red', 'ban', 2], ['blue', 'ban', 3], ['red', 'ban', 3],
  ['blue', 'pick', 1], ['red', 'pick', 1], ['red', 'pick', 2], ['blue', 'pick', 2], ['blue', 'pick', 3], ['red', 'pick', 3],
  ['red', 'ban', 4], ['blue', 'ban', 4], ['red', 'ban', 5], ['blue', 'ban', 5],
  ['red', 'pick', 4], ['blue', 'pick', 4], ['blue', 'pick', 5], ['red', 'pick', 5],
];

const FIELDS = ['MS.Team1=T1', 'MS.Team2=T2', 'MS.DateTime_UTC=Date', 'MSG.N_GameInMatch=N', 'MSG.Blue=Blue', 'MSG.Red=Red', 'MSG.Winner=Winner',
  ...[1, 2].flatMap(t => [1, 2, 3, 4, 5].flatMap(i => [`PB.Team${t}Ban${i}=T${t}B${i}`, `PB.Team${t}Pick${i}=T${t}P${i}`]))];

const sql = (s: string) => s.replace(/'/g, "\\'");
const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');

export function buildQuery(a: string, b: string, startMs: number): string {
  const where = `((MS.Team1='${sql(a)}' AND MS.Team2='${sql(b)}') OR (MS.Team1='${sql(b)}' AND MS.Team2='${sql(a)}'))`
    + ` AND MS.DateTime_UTC >= '${fmt(startMs - 18 * 3600_000)}' AND MS.DateTime_UTC <= '${fmt(startMs + 18 * 3600_000)}'`;
  const q = new URLSearchParams({
    action: 'cargoquery', format: 'json', origin: '*',
    tables: 'MatchSchedule=MS,MatchScheduleGame=MSG,PicksAndBansS7=PB',
    join_on: 'MS.MatchId=MSG.MatchId,MSG.GameId=PB.GameId',
    fields: FIELDS.join(','), where, order_by: 'MSG.N_GameInMatch', limit: '9',
  });
  return q.toString();
}

type Row = Record<string, string | null>;

export function parseGames(rows: Row[]): LpGame[] {
  return rows.map((r): LpGame => {
    const champ = (v: string | null | undefined) => (v && v !== 'None' ? v : null);
    const draft = ORDER.map(([side, kind, i], order) => ({ side, kind, order, champion: champ(r[`T${side === 'blue' ? 1 : 2}${kind === 'ban' ? 'B' : 'P'}${i}`]) }));
    return {
      number: Number(r.N) || 0,
      blue: r.Blue ?? '',
      red: r.Red ?? '',
      winner: r.Winner === '1' ? 'blue' : r.Winner === '2' ? 'red' : null,
      draft: draft.some(d => d.champion) ? draft : [],
    };
  }).filter(g => g.number > 0);
}

function validate(data: unknown, p: ProviderConfig) {
  const e = (data as { error?: { code?: string; info?: string } })?.error;
  if (e?.code === 'ratelimited') throw new ApiError('rate_limited', 'limite Leaguepedia', 120_000, p.name);
  if (e) throw new ApiError('bad_data', e.info ?? e.code ?? 'erreur', 0, p.name);
  if (!Array.isArray((data as { cargoquery?: unknown }).cargoquery)) throw new ApiError('bad_data', 'réponse inattendue', 0, p.name);
}

/**
 * Parties d'un match retrouvé sur Leaguepedia par NOMS EXACTS des deux équipes et date (±18 h).
 * Aucun rapprochement approximatif : si les noms diffèrent, rien n'est associé.
 */
export async function lpMatchGames(teams: [string, string], startMs: number, o: { signal?: AbortSignal; finished: boolean }): Promise<Fetched<LpGame[]>> {
  const r = await http.get<{ cargoquery: { title: Row }[] }>(LEAGUEPEDIA, buildQuery(teams[0], teams[1], startMs),
    { ttl: o.finished ? 30 * 86_400_000 : 10 * 60_000, signal: o.signal, maxWait: 30_000, validate });
  return { data: parseGames(r.data.cargoquery.map(x => x.title)), fetchedAt: r.fetchedAt, stale: r.stale };
}

const norm = (c: string) => c.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Vérifie la draft contre les champions publiés par le flux officiel (par côté).
 * - mêmes champions du bon côté → draft gardée ;
 * - champions inversés → côtés corrigés ;
 * - sinon → draft écartée (jamais affichée si elle ne colle pas aux données officielles).
 * `alias` : nom → identifiant (« Wukong » → MonkeyKing) pour comparer avec le flux.
 */
export function alignDraft(draft: DraftStep[], official: { blue: string[]; red: string[] }, alias: (name: string) => string = n => n): DraftStep[] | null {
  const picks = (side: Side) => draft.filter(d => d.kind === 'pick' && d.side === side).map(d => norm(alias(d.champion ?? ''))).sort().join(',');
  const off = (l: string[]) => l.map(norm).sort().join(',');
  if (!draft.length || !official.blue.length) return null;
  if (picks('blue') === off(official.blue) && picks('red') === off(official.red)) return draft;
  if (picks('blue') === off(official.red) && picks('red') === off(official.blue)) return draft.map(d => ({ ...d, side: d.side === 'blue' ? 'red' : 'blue' }));
  return null;
}
