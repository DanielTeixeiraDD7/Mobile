import { http, type Http, type ProviderConfig } from '../core/http';
import { ApiError } from '../core/errors';

/** Flux de statistiques en jeu de lolesports.com (non documenté, CORS ouvert). Images ~ toutes les 10 s. */
export const LOL_FEED: ProviderConfig = { id: 'lolfeed', name: 'LoL Esports livestats', baseUrl: 'https://feed.lolesports.com/livestats/v1/', rpm: 60 };

export interface RawParticipantMeta { participantId: number; esportsPlayerId: string; summonerName: string; championId: string; role: string }
export interface RawTeamFrame { totalGold: number; inhibitors: number; towers: number; barons: number; totalKills: number; dragons: string[]; participants: { participantId: number; totalGold: number; level: number; kills: number; deaths: number; assists: number; creepScore: number; currentHealth: number; maxHealth: number }[] }
export interface RawFrame { rfc460Timestamp: string; gameState: 'in_game' | 'paused' | 'finished' | string; blueTeam: RawTeamFrame; redTeam: RawTeamFrame }
export interface RawWindow {
  esportsGameId: string;
  gameMetadata: { patchVersion: string; blueTeamMetadata: { esportsTeamId: string; participantMetadata: RawParticipantMeta[] }; redTeamMetadata: { esportsTeamId: string; participantMetadata: RawParticipantMeta[] } };
  frames: RawFrame[];
}
export interface RawDetailParticipant { participantId: number; level: number; kills: number; deaths: number; assists: number; totalGoldEarned: number; creepScore: number; killParticipation: number; championDamageShare: number; wardsPlaced: number; wardsDestroyed: number; items: number[] }
export interface RawDetails { frames: { rfc460Timestamp: string; participants: RawDetailParticipant[] }[] }

export type LolSide = 'blue' | 'red';

export interface LolPlayerLine {
  participantId: number;
  playerId: string;
  name: string;
  champion: string;
  role: string;
  side: LolSide;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  items: number[] | null;
  damageShare: number | null;
  killParticipation: number | null;
  wardsPlaced: number | null;
  wardsDestroyed: number | null;
}

export interface LolTeamLine {
  side: LolSide;
  esportsTeamId: string;
  gold: number;
  kills: number;
  towers: number;
  inhibitors: number;
  barons: number;
  dragons: string[];
}

export interface LolPoint {
  /** Secondes depuis la première image (pauses incluses). */
  t: number;
  blueGold: number;
  redGold: number;
  blueKills: number;
  redKills: number;
  blueTowers: number;
  redTowers: number;
  blueDragons: number;
  redDragons: number;
  blueBarons: number;
  redBarons: number;
}

export interface LolObjective {
  /** Intervalle où l'objectif a été pris (résolution = pas d'échantillonnage). */
  from: number;
  to: number;
  side: LolSide;
  type: 'dragon' | 'baron' | 'tower' | 'inhibitor' | 'kill';
  detail: string | null;
  count: number;
}

export interface LolGameStats {
  gameId: string;
  patch: string;
  state: string;
  startedAt: number;
  /** Secondes ; null tant que la partie n'est pas terminée. Pauses incluses. */
  duration: number | null;
  teams: [LolTeamLine, LolTeamLine];
  players: LolPlayerLine[];
  timeline: LolPoint[];
  stepSeconds: number;
  /** true quand la courbe couvre toute la partie. */
  complete: boolean;
  /** Vainqueur DÉDUIT de l'état final (non publié par la source), validé ensuite contre le score de la série. */
  winner: LolSide | null;
}

export const STEP_SECONDS = 60;
const MAX_SAMPLES = 90;

/** Heure ISO arrondie à la dizaine de secondes supérieure (exigé par le flux). */
export function feedTime(ms: number): string {
  const r = Math.ceil(ms / 10_000) * 10_000;
  return new Date(r).toISOString().replace(/\.\d{3}Z$/, '.000Z');
}

export function pointOf(f: RawFrame, t0: number): LolPoint {
  return {
    t: Math.max(0, Math.round((Date.parse(f.rfc460Timestamp) - t0) / 1000)),
    blueGold: f.blueTeam.totalGold, redGold: f.redTeam.totalGold,
    blueKills: f.blueTeam.totalKills, redKills: f.redTeam.totalKills,
    blueTowers: f.blueTeam.towers, redTowers: f.redTeam.towers,
    blueDragons: f.blueTeam.dragons.length, redDragons: f.redTeam.dragons.length,
    blueBarons: f.blueTeam.barons, redBarons: f.redTeam.barons,
  };
}

/** Objectifs déduits des écarts entre deux échantillons (données calculées, horaire approximatif). */
export function objectives(timeline: LolPoint[], last: RawFrame | null): LolObjective[] {
  const out: LolObjective[] = [];
  const dragonsBlue = last?.blueTeam.dragons ?? [];
  const dragonsRed = last?.redTeam.dragons ?? [];
  for (let i = 1; i < timeline.length; i++) {
    const a = timeline[i - 1]!, b = timeline[i]!;
    for (const side of ['blue', 'red'] as const) {
      const d = (k: 'Dragons' | 'Barons' | 'Towers') => (b[`${side}${k}`] as number) - (a[`${side}${k}`] as number);
      const dd = d('Dragons');
      if (dd > 0) {
        const names = side === 'blue' ? dragonsBlue : dragonsRed;
        const from = a[`${side}Dragons`];
        out.push({ from: a.t, to: b.t, side, type: 'dragon', detail: names.slice(from, from + dd).join(', ') || null, count: dd });
      }
      if (d('Barons') > 0) out.push({ from: a.t, to: b.t, side, type: 'baron', detail: null, count: d('Barons') });
      if (d('Towers') > 0) out.push({ from: a.t, to: b.t, side, type: 'tower', detail: null, count: d('Towers') });
    }
  }
  return out;
}

export function teamLine(side: LolSide, id: string, f: RawTeamFrame): LolTeamLine {
  return { side, esportsTeamId: id, gold: f.totalGold, kills: f.totalKills, towers: f.towers, inhibitors: f.inhibitors, barons: f.barons, dragons: f.dragons };
}

export function buildStats(first: RawWindow, samples: RawFrame[], details: RawDetails | null, done: boolean): LolGameStats {
  const meta = first.gameMetadata;
  const t0 = Date.parse(first.frames[0]!.rfc460Timestamp);
  const frames = [...first.frames.slice(0, 1), ...samples].sort((a, b) => Date.parse(a.rfc460Timestamp) - Date.parse(b.rfc460Timestamp));
  const last = frames[frames.length - 1]!;
  const finished = last.gameState === 'finished';
  const detailLast = details?.frames[details.frames.length - 1];
  const dp = new Map((detailLast?.participants ?? []).map(p => [p.participantId, p]));

  const players: LolPlayerLine[] = [];
  for (const [side, tm, tf] of [['blue', meta.blueTeamMetadata, last.blueTeam], ['red', meta.redTeamMetadata, last.redTeam]] as const) {
    for (const pm of tm.participantMetadata) {
      const p = tf.participants.find(x => x.participantId === pm.participantId);
      const d = dp.get(pm.participantId);
      players.push({
        participantId: pm.participantId, playerId: pm.esportsPlayerId, name: pm.summonerName, champion: pm.championId, role: pm.role, side,
        level: p?.level ?? 0, kills: p?.kills ?? 0, deaths: p?.deaths ?? 0, assists: p?.assists ?? 0, cs: p?.creepScore ?? 0, gold: p?.totalGold ?? 0,
        items: d ? d.items : null,
        damageShare: d ? d.championDamageShare : null,
        killParticipation: d ? d.killParticipation : null,
        wardsPlaced: d ? d.wardsPlaced : null,
        wardsDestroyed: d ? d.wardsDestroyed : null,
      });
    }
  }
  // Une seule valeur par instant (on garde la dernière image de chaque seconde).
  const byT = new Map<number, LolPoint>();
  for (const f of frames) byT.set(pointOf(f, t0).t, pointOf(f, t0));
  const timeline = [...byT.values()].sort((a, b) => a.t - b.t);
  // Le flux ne publie pas le vainqueur. Déduction prudente : seulement si la même équipe
  // a plus de tours détruites ET plus de gold à la fin ; sinon inconnu.
  const b = last.blueTeam, r = last.redTeam;
  const winner: LolSide | null = !finished ? null
    : b.towers > r.towers && b.totalGold > r.totalGold ? 'blue'
    : r.towers > b.towers && r.totalGold > b.totalGold ? 'red'
    : null;
  return {
    gameId: first.esportsGameId,
    patch: meta.patchVersion,
    state: last.gameState,
    startedAt: t0,
    duration: finished ? timeline[timeline.length - 1]!.t : null,
    teams: [teamLine('blue', meta.blueTeamMetadata.esportsTeamId, last.blueTeam), teamLine('red', meta.redTeamMetadata.esportsTeamId, last.redTeam)],
    players,
    timeline,
    stepSeconds: STEP_SECONDS,
    complete: done,
    winner,
  };
}

export interface LoadOptions {
  signal?: AbortSignal;
  /** La passerelle indique la partie terminée : les données sont définitives (cache permanent). */
  finished: boolean;
  onProgress?: (s: LolGameStats) => void;
  client?: Http;
  now?: () => number;
}

/**
 * Reconstitue une partie : première image, puis une image par minute jusqu'à la fin
 * (ou jusqu'à maintenant si en direct), puis les détails joueurs de la dernière image.
 */
export async function loadGame(gameId: string, o: LoadOptions): Promise<LolGameStats> {
  const c = o.client ?? http;
  const now = o.now ?? (() => Date.now());
  const ttl = o.finished ? Infinity : 15_000;
  const first = (await c.get<RawWindow | null>(LOL_FEED, `window/${gameId}`, { signal: o.signal, ttl: o.finished ? Infinity : 3_600_000 })).data;
  if (!first || !first.frames?.length) throw new ApiError('not_found', 'pas de statistiques pour cette partie', 0, LOL_FEED.name);
  const t0 = Date.parse(first.frames[0]!.rfc460Timestamp);
  const samples: RawFrame[] = [];
  let ended = first.frames.some(f => f.gameState === 'finished');
  let k = 1;
  while (!ended && k <= MAX_SAMPLES) {
    const target = t0 + k * STEP_SECONDS * 1000;
    // En direct, le flux a ~1 min de retard : on s'arrête avant.
    if (!o.finished && target > now() - 60_000) break;
    const batch = [target, target + STEP_SECONDS * 1000, target + 2 * STEP_SECONDS * 1000].filter(t => o.finished || t <= now() - 60_000);
    const res = await Promise.all(batch.map(t =>
      c.get<RawWindow | null>(LOL_FEED, `window/${gameId}?startingTime=${feedTime(t)}`, { signal: o.signal, ttl, maxWait: 60_000 })
        // Après la fin, toutes les fenêtres renvoient les mêmes dernières images : on prend l'image de fin.
        .then(r => r.data?.frames?.find(f => f.gameState === 'finished') ?? r.data?.frames?.[0] ?? null)
        .catch(e => { if (e instanceof ApiError && e.kind === 'not_found') return null; throw e; })));
    for (const f of res) {
      if (!f) continue;
      samples.push(f);
      if (f.gameState === 'finished') { ended = true; break; }
    }
    if (res.every(f => !f)) break;
    k += batch.length;
    o.onProgress?.(buildStats(first, samples, null, false));
  }
  // Dernière image exacte : fenêtre courante en direct, image de fin sinon.
  const lastT = samples.length ? Date.parse(samples[samples.length - 1]!.rfc460Timestamp) : t0;
  let details: RawDetails | null = null;
  try {
    details = (await c.get<RawDetails | null>(LOL_FEED, `details/${gameId}?startingTime=${feedTime(lastT)}`, { signal: o.signal, ttl, maxWait: 60_000 })).data;
  } catch (e) {
    if (!(e instanceof ApiError) || e.kind === 'aborted') throw e;
  }
  return buildStats(first, samples, details, ended || !o.finished);
}
