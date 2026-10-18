import type { ProviderConfig } from '../core/http';
import type { Match, MatchSide, Provenance } from '../core/model';

/** OpenDota : gratuit sans clé (60 req/min, 3 000/jour). La clé premium exige une carte : jamais utilisée. */
export const OPENDOTA: ProviderConfig = { id: 'opendota', name: 'OpenDota', baseUrl: 'https://api.opendota.com/api/', rpm: 50 };

export interface RawProMatch {
  match_id: number;
  duration: number;
  start_time: number;
  radiant_team_id: number | null;
  radiant_name: string | null;
  dire_team_id: number | null;
  dire_name: string | null;
  leagueid: number;
  league_name: string | null;
  series_id: number;
  series_type: number;
  radiant_score: number;
  dire_score: number;
  radiant_win: boolean | null;
}

export interface RawLive {
  match_id: string;
  league_id: number;
  game_time: number;
  activate_time: number;
  radiant_score: number;
  dire_score: number;
  radiant_lead: number;
  team_name_radiant: string;
  team_name_dire: string;
  team_id_radiant: number;
  team_id_dire: number;
  team_logo_radiant?: string;
  team_logo_dire?: string;
  deactivate_time: number;
  spectators?: number;
}

export interface RawPlayer {
  account_id: number | null;
  name: string | null;
  personaname: string | null;
  hero_id: number;
  isRadiant: boolean;
  player_slot: number;
  kills: number;
  deaths: number;
  assists: number;
  last_hits: number;
  denies: number;
  gold_per_min: number;
  xp_per_min: number;
  net_worth: number | null;
  hero_damage: number | null;
  tower_damage: number | null;
  hero_healing: number | null;
  level: number;
  item_0: number; item_1: number; item_2: number; item_3: number; item_4: number; item_5: number; item_neutral?: number | null;
  lane_role?: number | null;
  obs_placed?: number | null;
  sen_placed?: number | null;
  stuns?: number | null;
  teamfight_participation?: number | null;
  roshans_killed?: number | null;
  firstblood_claimed?: number | null;
}

export interface RawObjective { time: number; type: string; team?: number; key?: string | number; slot?: number; player_slot?: number; value?: number; unit?: string }

export interface RawMatch {
  match_id: number;
  duration: number;
  start_time: number;
  radiant_win: boolean;
  radiant_score: number;
  dire_score: number;
  first_blood_time: number | null;
  leagueid: number;
  league?: { name: string; tier: string } | null;
  series_id: number;
  series_type: number;
  radiant_team?: { team_id: number; name: string; tag: string; logo_url: string | null } | null;
  dire_team?: { team_id: number; name: string; tag: string; logo_url: string | null } | null;
  radiant_name?: string | null;
  dire_name?: string | null;
  picks_bans: { is_pick: boolean; hero_id: number; team: 0 | 1; order: number }[] | null;
  radiant_gold_adv: number[] | null;
  radiant_xp_adv: number[] | null;
  objectives: RawObjective[] | null;
  tower_status_radiant: number;
  tower_status_dire: number;
  barracks_status_radiant: number;
  barracks_status_dire: number;
  players: RawPlayer[];
  patch?: number | null;
  version?: number | null;
}

export const SERIES_COUNT: Record<number, number> = { 0: 1, 1: 3, 2: 5, 3: 2 };
export const winsNeeded = (count: number) => (count === 2 ? 2 : Math.floor(count / 2) + 1);

const tref = (id: number | null, name: string | null, logo?: string | null) =>
  id || name ? { id: `dota2:${id ?? name}`, name: name || `Équipe ${id}`, code: null, image: logo || null } : null;

/**
 * Regroupe les parties pro en séries (`series_id`). Données CALCULÉES :
 * score = parties gagnées par chaque équipe dans la liste disponible.
 */
export function groupSeries(games: RawProMatch[], live: RawLive[], now: number): Match[] {
  const groups = new Map<string, RawProMatch[]>();
  for (const g of games) {
    const key = g.series_id ? `s${g.series_id}` : `m${g.match_id}`;
    groups.set(key, [...(groups.get(key) ?? []), g]);
  }
  const out: Match[] = [];
  for (const [key, list] of groups) {
    list.sort((a, b) => a.start_time - b.start_time);
    const first = list[0]!;
    const ids: [number | null, number | null] = [first.radiant_team_id, first.dire_team_id];
    const names: [string | null, string | null] = [first.radiant_name, first.dire_name];
    const wins = [0, 0];
    for (const g of list) {
      if (g.radiant_win === null) continue;
      const winnerId = g.radiant_win ? g.radiant_team_id : g.dire_team_id;
      const idx = winnerId === ids[0] ? 0 : winnerId === ids[1] ? 1 : -1;
      if (idx >= 0) wins[idx]!++;
    }
    const count = SERIES_COUNT[first.series_type] ?? 1;
    const need = winsNeeded(count);
    const decided = count === 2 ? list.length >= 2 : Math.max(wins[0]!, wins[1]!) >= need;
    const liveGame = live.find(l => [l.team_id_radiant, l.team_id_dire].includes(ids[0] ?? -1) && [l.team_id_radiant, l.team_id_dire].includes(ids[1] ?? -1));
    const status = decided ? 'finished' : liveGame ? 'live' : 'unknown';
    const prov: Provenance = { source: 'opendota', kind: 'computed', fetchedAt: now, confidence: 'medium', note: 'Série reconstituée à partir des parties publiées par OpenDota' };
    const sides = [0, 1].map(i => ({
      team: tref(ids[i]!, names[i]!),
      score: wins[i]!,
      winner: decided ? (count === 2 && wins[0] === wins[1] ? false : wins[i]! > wins[1 - i]!) : null,
      record: null,
    })) as [MatchSide, MatchSide];
    out.push({
      id: `dota2:${key}`, game: 'dota2', source: 'opendota', sourceId: key,
      status, startTime: first.start_time * 1000,
      competition: first.leagueid ? { id: `dota2:${first.leagueid}`, name: (first.league_name ?? `Ligue ${first.leagueid}`).trim(), image: null } : null,
      tournamentId: null, stage: list.length > 1 || count > 1 ? `${list.length} partie${list.length > 1 ? 's' : ''} jouée${list.length > 1 ? 's' : ''}` : null,
      format: { type: 'bestOf', count },
      sides,
      duration: list.length === 1 && count === 1 ? first.duration : null,
      prov,
    });
  }
  return out.sort((a, b) => (b.startTime ?? 0) - (a.startTime ?? 0));
}

export function liveToMatch(l: RawLive, leagueName: string | null, now: number): Match {
  const lead = l.radiant_lead;
  return {
    id: `dota2:live${l.match_id}`, game: 'dota2', source: 'opendota', sourceId: `live${l.match_id}`,
    status: 'live', startTime: l.activate_time * 1000,
    competition: l.league_id ? { id: `dota2:${l.league_id}`, name: leagueName ?? `Ligue ${l.league_id}`, image: null } : null,
    tournamentId: null,
    stage: `Partie en cours · ${Math.floor(l.game_time / 60)} min · kills ${l.radiant_score}-${l.dire_score} · gold ${lead >= 0 ? 'Radiant' : 'Dire'} +${Math.abs(lead).toLocaleString('fr-FR')}`,
    format: null,
    sides: [
      { team: tref(l.team_id_radiant || null, l.team_name_radiant || null, l.team_logo_radiant), score: null, winner: null, record: null },
      { team: tref(l.team_id_dire || null, l.team_name_dire || null, l.team_logo_dire), score: null, winner: null, record: null },
    ],
    duration: null,
    prov: { source: 'opendota', kind: 'community', fetchedAt: now, confidence: 'medium', note: 'Données en direct (retard de diffusion ~2 min)' },
  };
}
