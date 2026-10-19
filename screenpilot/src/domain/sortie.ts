import { todayIso } from './progress';
import type { MediaSnapshot } from './types';

/**
 * Pas encore sorti : date de sortie future, ou statut « à venir » sans date.
 * Une série / un anime en cours de diffusion est sorti (le 1er épisode est passé).
 */
export function pasSorti(m: Pick<MediaSnapshot, 'releaseDate' | 'status'>, aujourdhui = todayIso()): boolean {
  if (m.releaseDate) return m.releaseDate > aujourdhui;
  return m.status === 'NOT_YET_RELEASED';
}

/** « 16 déc. 2026 », « 2027 » si seule l'année est connue, null si inconnu. */
export function dateSortie(m: Pick<MediaSnapshot, 'releaseDate' | 'startYear'>, court = false): string | null {
  if (m.releaseDate) return new Date(m.releaseDate + 'T12:00:00').toLocaleDateString('fr-FR', court ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'long', year: 'numeric' });
  return m.startYear ? String(m.startYear) : null;
}
