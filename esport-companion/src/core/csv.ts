import type { Match, MatchStatus } from './model';
import { DEFS } from '../games/defs';

const COLS = ['jeu', 'date_utc', 'competition', 'phase', 'equipe1', 'equipe2', 'score1', 'score2', 'format_bo', 'statut', 'source', 'type_donnee'] as const;

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV `;`, UTF-8 avec BOM (s'ouvre tel quel dans Excel). */
export function matchesToCsv(list: Match[]): string {
  const rows = list.map(m => [
    m.game, m.startTime ? new Date(m.startTime).toISOString() : '', m.competition?.name ?? '', m.stage ?? '',
    m.sides[0].team?.name ?? '', m.sides[1].team?.name ?? '', m.sides[0].score ?? '', m.sides[1].score ?? '',
    m.format?.count ?? '', m.status, m.source, m.prov.kind,
  ].map(esc).join(';'));
  return '﻿' + [COLS.join(';'), ...rows].join('\r\n') + '\r\n';
}

/** Parse CSV (séparateur ; ou , détecté, guillemets gérés). */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, '');
  const firstLine = t.split(/\r?\n/, 1)[0] ?? '';
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i]!;
    if (q) {
      if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ''));
}

export interface ImportRow { line: number; match: Match | null; errors: string[] }

const ALIASES: Record<string, string> = {
  game: 'jeu', jeu: 'jeu', date: 'date_utc', date_utc: 'date_utc', datetime: 'date_utc', competition: 'competition', tournament: 'competition', tournoi: 'competition',
  stage: 'phase', phase: 'phase', team1: 'equipe1', equipe1: 'equipe1', team_1: 'equipe1', team2: 'equipe2', equipe2: 'equipe2', team_2: 'equipe2',
  score1: 'score1', score2: 'score2', bo: 'format_bo', format: 'format_bo', format_bo: 'format_bo', status: 'statut', statut: 'statut',
};

const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
export const normName = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Lignes CSV → matchs importés (marqués `imported`), avec erreurs par ligne. */
export function csvToMatches(text: string, origin: string, now = Date.now()): ImportRow[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [{ line: 1, match: null, errors: ['Fichier vide ou sans ligne de données.'] }];
  const header = rows[0]!.map(h => { const k = h.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[\s-]+/g, '_'); return ALIASES[k] ?? k; });
  const col = (r: string[], k: string) => { const i = header.indexOf(k); return i >= 0 ? (r[i] ?? '').trim() : ''; };
  const missing = ['jeu', 'date_utc', 'equipe1', 'equipe2'].filter(k => !header.includes(k));
  if (missing.length) return [{ line: 1, match: null, errors: [`Colonnes manquantes : ${missing.join(', ')}.`] }];

  return rows.slice(1).map((r, i) => {
    const errors: string[] = [];
    const game = col(r, 'jeu').toLowerCase();
    if (!DEFS[game]) errors.push(`Jeu inconnu « ${col(r, 'jeu')} » (attendu : ${Object.keys(DEFS).join(', ')}).`);
    const dateRaw = col(r, 'date_utc');
    const t = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw + 'T12:00:00Z' : dateRaw);
    if (!Number.isFinite(t)) errors.push(`Date invalide « ${dateRaw} » (format ISO : 2026-10-17T18:00:00Z).`);
    const t1 = col(r, 'equipe1'), t2 = col(r, 'equipe2');
    if (!t1 || !t2) errors.push('Les deux équipes sont obligatoires.');
    if (t1 && t2 && normName(t1) === normName(t2)) errors.push('Les deux équipes sont identiques.');
    const sc = (v: string) => (v === '' ? null : /^\d{1,3}$/.test(v) ? Number(v) : NaN);
    const s1 = sc(col(r, 'score1')), s2 = sc(col(r, 'score2'));
    if (Number.isNaN(s1) || Number.isNaN(s2)) errors.push('Score invalide (entier attendu).');
    const bo = col(r, 'format_bo') ? Number(col(r, 'format_bo').replace(/^bo/i, '')) : null;
    if (bo !== null && (!Number.isInteger(bo) || bo < 1 || bo > 9)) errors.push('Format invalide (1 à 9).');
    const st = col(r, 'statut').toLowerCase();
    const status: MatchStatus = st === 'upcoming' || st === 'à venir' ? 'upcoming' : st === 'canceled' || st === 'annulé' ? 'canceled' : (s1 !== null && s2 !== null ? 'finished' : 'unknown');
    if (errors.length) return { line: i + 2, match: null, errors };
    const sid = `import-${hash(`${game}|${new Date(t).toISOString().slice(0, 16)}|${normName(t1)}|${normName(t2)}`)}`;
    const team = (n: string) => ({ id: `${game}:manual:${normName(n)}`, name: n, code: null, image: null });
    const fin = status === 'finished' && s1 !== null && s2 !== null && s1 !== s2;
    const match: Match = {
      id: `${game}:${sid}`, game, source: 'import', sourceId: sid, status, startTime: t,
      competition: col(r, 'competition') ? { id: `${game}:manual:${normName(col(r, 'competition'))}`, name: col(r, 'competition'), image: null } : null,
      tournamentId: null, stage: col(r, 'phase') || null,
      format: bo ? { type: 'bestOf', count: bo } : null,
      sides: [
        { team: team(t1), score: s1 as number | null, winner: fin ? s1! > s2! : null, record: null },
        { team: team(t2), score: s2 as number | null, winner: fin ? s2! > s1! : null, record: null },
      ],
      duration: null,
      prov: { source: 'import', kind: 'imported', fetchedAt: now, confidence: 'low', note: `Importé depuis ${origin}` },
    };
    return { line: i + 2, match, errors: [] };
  });
}

/** Doublon probable avec une donnée de source (même jeu, mêmes équipes, ±12 h) : signalé, jamais fusionné. */
export function probableDuplicate(m: Match, existing: Match[]): Match | null {
  const names = new Set(m.sides.map(s => normName(s.team?.name ?? '')));
  return existing.find(x => x.id !== m.id && x.game === m.game && x.startTime !== null && m.startTime !== null && Math.abs(x.startTime - m.startTime) < 12 * 3600_000
    && x.sides.every(s => names.has(normName(s.team?.name ?? '')) || names.has(normName(s.team?.code ?? '')))) ?? null;
}
