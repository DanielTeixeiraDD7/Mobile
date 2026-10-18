import type { Match, MatchGame } from './model';

export interface QualityIssue {
  level: 'info' | 'warn' | 'error';
  code: string;
  message: string;
}

const MAX_GAME_SECONDS = 4 * 3600;

/** Contrôles de cohérence d'un match et de ses parties (affichés dans la fiche). */
export function checkMatch(m: Match, games: MatchGame[]): QualityIssue[] {
  const out: QualityIssue[] = [];
  const [a, b] = m.sides;
  if (m.status === 'finished') {
    if (a.score === null || b.score === null) out.push({ level: 'warn', code: 'no-score', message: 'Match terminé sans score publié.' });
    if (a.winner === null && b.winner === null) out.push({ level: 'info', code: 'no-winner', message: 'Vainqueur non publié par la source.' });
    if (a.winner && b.winner) out.push({ level: 'error', code: 'two-winners', message: 'La source désigne deux vainqueurs.' });
    if (m.format && a.score !== null && b.score !== null) {
      const need = Math.floor(m.format.count / 2) + 1;
      const max = Math.max(a.score, b.score);
      if (m.format.count > 1 && max !== need && m.format.count % 2 === 1) out.push({ level: 'warn', code: 'score-format', message: `Score ${a.score}-${b.score} incohérent avec un BO${m.format.count}.` });
      if (a.winner && a.score < b.score) out.push({ level: 'error', code: 'winner-score', message: 'Le vainqueur a le score le plus bas.' });
      if (b.winner && b.score < a.score) out.push({ level: 'error', code: 'winner-score', message: 'Le vainqueur a le score le plus bas.' });
    }
  }
  if (a.team && b.team && a.team.id === b.team.id) out.push({ level: 'error', code: 'same-team', message: 'Les deux côtés désignent la même équipe.' });

  const played = games.filter(g => g.status === 'finished');
  if (m.status === 'finished' && a.score !== null && b.score !== null && games.length > 0 && played.length !== a.score + b.score) {
    out.push({ level: 'warn', code: 'games-count', message: `${played.length} partie(s) terminée(s) pour un score de ${a.score}-${b.score}.` });
  }
  const known = played.filter(g => g.winner !== null);
  if (known.length === played.length && known.length > 0 && a.score !== null && b.score !== null) {
    const wa = known.filter(g => g.winner === 0).length;
    if (wa !== a.score || known.length - wa !== b.score) out.push({ level: 'warn', code: 'games-winners', message: 'Les vainqueurs par partie ne correspondent pas au score de la série.' });
  }
  for (const g of games) {
    if (g.duration !== null && (g.duration <= 0 || g.duration > MAX_GAME_SECONDS)) out.push({ level: 'warn', code: 'duration', message: `Durée impossible pour la partie ${g.number}.` });
  }
  if (m.startTime === null && m.status === 'upcoming') out.push({ level: 'info', code: 'no-time', message: 'Horaire non communiqué.' });
  return out;
}

/** Doublons : même jeu et même identifiant de source. Jamais sur la seule ressemblance de noms. */
export function dedupeMatches(list: Match[]): { matches: Match[]; duplicates: number } {
  const byId = new Map<string, Match>();
  let duplicates = 0;
  for (const m of list) {
    const prev = byId.get(m.id);
    if (prev) {
      duplicates++;
      if (m.prov.fetchedAt < prev.prov.fetchedAt) continue;
    }
    byId.set(m.id, m);
  }
  return { matches: [...byId.values()], duplicates };
}

/**
 * Vainqueurs déduits par partie : gardés seulement s'ils reproduisent exactement le score de la série.
 * Sinon on les retire tous (pas de valeur douteuse affichée).
 */
export function validateInferredWinners(scores: [number | null, number | null], winners: (0 | 1 | null)[]): (0 | 1 | null)[] {
  const [a, b] = scores;
  if (a === null || b === null || winners.length !== a + b || winners.some(w => w === null)) return winners.map(() => null);
  const wa = winners.filter(w => w === 0).length;
  return wa === a && winners.length - wa === b ? winners : winners.map(() => null);
}
