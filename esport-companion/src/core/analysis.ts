import type { Match } from './model';

/**
 * Moteur d'analyse déterministe et local. Chaque phrase est étiquetée :
 * fact = mesuré par la source ; calc = calculé par l'app ; interp = interprétation (règle explicite).
 * Aucune prédiction, aucun pourcentage de victoire.
 */
export type Kind = 'fact' | 'calc' | 'interp';
export interface Line { kind: Kind; text: string }

export interface SeriesPoint { t: number; diff: number }

/** Plus grande avance de chaque côté sur une série de différences (positif = côté A). */
export function leads(points: SeriesPoint[]) {
  let maxA = { v: 0, t: 0 }, maxB = { v: 0, t: 0 };
  for (const p of points) {
    if (p.diff > maxA.v) maxA = { v: p.diff, t: p.t };
    if (-p.diff > maxB.v) maxB = { v: -p.diff, t: p.t };
  }
  return { maxA, maxB };
}

/** Changements de leader (avance qui change de signe, en ignorant les écarts < seuil). */
export function leadChanges(points: SeriesPoint[], threshold: number): number {
  let sign = 0, n = 0;
  for (const p of points) {
    const s = p.diff >= threshold ? 1 : p.diff <= -threshold ? -1 : 0;
    if (s !== 0 && sign !== 0 && s !== sign) n++;
    if (s !== 0) sign = s;
  }
  return n;
}

const mmss = (s: number) => { const a = Math.abs(Math.round(s)); return `${s < 0 ? '−' : ''}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`; };
const k = (n: number) => `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k`;

export interface GameSummaryInput {
  names: [string, string];
  /** null = vainqueur inconnu ; inferred = déduit (pas publié). */
  winner: { side: 0 | 1; inferred: boolean } | null;
  duration: number | null;
  gold: SeriesPoint[]; // diff côté 0 - côté 1
  goldUnit: string;
  comebackThreshold: number;
  finals: { label: string; a: number; b: number }[];
  highlights: { label: string; text: string }[];
}

export function summarizeGame(g: GameSummaryInput): Line[] {
  const out: Line[] = [];
  const [A, B] = g.names;
  if (g.winner) out.push({ kind: g.winner.inferred ? 'interp' : 'fact', text: `${g.names[g.winner.side]} remporte la partie${g.winner.inferred ? ' (déduit de l\'état final : plus de tours détruites et de gold ; la source ne publie pas le vainqueur)' : ''}.` });
  if (g.duration !== null) out.push({ kind: 'fact', text: `Durée : ${mmss(g.duration)}.` });
  for (const f of g.finals) {
    if (f.a === f.b) out.push({ kind: 'fact', text: `${f.label} : égalité (${f.a}).` });
    else out.push({ kind: 'fact', text: `${f.label} : ${A} ${f.a} – ${f.b} ${B}.` });
  }
  if (g.gold.length >= 3) {
    const { maxA, maxB } = leads(g.gold);
    if (maxA.v > 0) out.push({ kind: 'calc', text: `Plus grande avance de ${A} : ${k(maxA.v)} ${g.goldUnit} (à ${mmss(maxA.t)}).` });
    if (maxB.v > 0) out.push({ kind: 'calc', text: `Plus grande avance de ${B} : ${k(maxB.v)} ${g.goldUnit} (à ${mmss(maxB.t)}).` });
    const ch = leadChanges(g.gold, 1000);
    out.push({ kind: 'calc', text: ch === 0 ? `Pas de changement de leader au ${g.goldUnit} (écarts ≥ 1k).` : `${ch} changement(s) de leader au ${g.goldUnit} (écarts ≥ 1k).` });
    if (g.winner) {
      const loserMax = g.winner.side === 0 ? maxB.v : maxA.v;
      if (loserMax >= g.comebackThreshold) out.push({ kind: 'interp', text: `Remontée : ${g.names[g.winner.side]} a été mené de ${k(loserMax)} ${g.goldUnit} avant de gagner (règle : retard ≥ ${k(g.comebackThreshold)}).` });
      else {
        const winnerMax = g.winner.side === 0 ? maxA.v : maxB.v;
        if (loserMax < 1000 && winnerMax >= g.comebackThreshold) out.push({ kind: 'interp', text: `Partie à sens unique : ${g.names[g.winner.side]} n'a jamais été mené de plus de 1k (règle : retard max < 1k et avance ≥ ${k(g.comebackThreshold)}).` });
      }
    }
  }
  for (const h of g.highlights) out.push({ kind: 'calc', text: `${h.label} : ${h.text}.` });
  return out;
}

export function summarizeSeries(m: Match): Line[] {
  const out: Line[] = [];
  const [a, b] = m.sides;
  const A = a.team?.name ?? 'À déterminer', B = b.team?.name ?? 'À déterminer';
  if (m.status === 'finished' && a.score !== null && b.score !== null) {
    const w = a.winner ? 0 : b.winner ? 1 : null;
    if (w !== null) {
      const [ws, ls] = w === 0 ? [a.score, b.score] : [b.score, a.score];
      out.push({ kind: m.prov.kind === 'computed' ? 'calc' : 'fact', text: `${w === 0 ? A : B} bat ${w === 0 ? B : A} ${ws}-${ls}${m.format ? ` (BO${m.format.count})` : ''}.` });
      if (m.format && m.format.count >= 3) {
        const need = Math.floor(m.format.count / 2) + 1;
        if (ls === 0) out.push({ kind: 'interp', text: 'Série nette : le perdant n\'a gagné aucune partie.' });
        else if (ls === need - 1) out.push({ kind: 'interp', text: 'Série allée au bout : décidée à la dernière partie possible.' });
      }
    } else out.push({ kind: 'fact', text: `Score : ${A} ${a.score} – ${b.score} ${B}.` });
  } else if (m.status === 'live') out.push({ kind: 'fact', text: `En cours${a.score !== null ? ` : ${a.score}-${b.score}` : ''}.` });
  else if (m.status === 'upcoming') out.push({ kind: 'fact', text: `Match à venir${m.format ? ` en BO${m.format.count}` : ''}.` });
  if (a.record && b.record) out.push({ kind: 'fact', text: `Bilan dans la compétition (source) : ${A} ${a.record.wins}V-${a.record.losses}D, ${B} ${b.record.wins}V-${b.record.losses}D.` });
  return out;
}

export interface Form { played: number; wins: number; losses: number; streak: { kind: 'W' | 'L'; n: number } | null; last: ('W' | 'L')[]; from: number | null; to: number | null }

/** Forme d'une équipe sur les matchs terminés fournis (période indiquée). */
export function teamForm(teamId: string, matches: Match[]): Form {
  const done = matches
    .filter(m => m.status === 'finished' && m.startTime !== null && m.sides.some(s => s.team?.id === teamId) && m.sides.some(s => s.winner !== null))
    .sort((a, b) => b.startTime! - a.startTime!);
  const res = done.map(m => (m.sides.find(s => s.team?.id === teamId)!.winner ? 'W' : 'L') as 'W' | 'L');
  let streak: Form['streak'] = null;
  if (res.length) { let n = 0; while (n < res.length && res[n] === res[0]) n++; streak = { kind: res[0]!, n }; }
  return {
    played: res.length, wins: res.filter(r => r === 'W').length, losses: res.filter(r => r === 'L').length, streak,
    last: res.slice(0, 10), from: done.length ? done[done.length - 1]!.startTime : null, to: done.length ? done[0]!.startTime : null,
  };
}

export function headToHead(a: string, b: string, matches: Match[]): Match[] {
  return matches
    .filter(m => m.status === 'finished' && m.sides.some(s => s.team?.id === a) && m.sides.some(s => s.team?.id === b))
    .sort((x, y) => (y.startTime ?? 0) - (x.startTime ?? 0));
}
