/**
 * Révision espacée (système de Leitner) : une bonne réponse fait monter la carte d'une boîte
 * et l'espace davantage ; une erreur la renvoie en boîte 1, à revoir dès demain.
 */
export const INTERVALS_DAYS = [0, 1, 3, 7, 16, 35];
export const MAX_BOX = INTERVALS_DAYS.length - 1;

export interface CardState {
  box: number;
  due: number; // ms
  seen: number;
  correct: number;
}

const DAY = 86_400_000;
const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

export function newCard(now = Date.now()): CardState {
  return { box: 0, due: now, seen: 0, correct: 0 };
}

export function review(s: CardState, ok: boolean, now = Date.now()): CardState {
  const box = ok ? Math.min(MAX_BOX, s.box + 1) : 1;
  const due = startOfDay(now) + INTERVALS_DAYS[box]! * DAY;
  return { box, due, seen: s.seen + 1, correct: s.correct + (ok ? 1 : 0) };
}

export const isDue = (s: CardState, now = Date.now()) => s.due <= now;
/** Une carte est « maîtrisée » à partir de la boîte 4 (révisée avec succès à 1, 3 et 7 jours). */
export const isMastered = (s: CardState) => s.box >= 4;
