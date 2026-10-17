import type { LibraryEntry } from './types';

const DAY = 86_400_000;
const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const time = (ms: number) => new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** « aujourd'hui 17:30 », « demain 09:00 », « sam. 19 oct. 17:30 ». `airingAt` en secondes Unix. */
export function formatAiring(airingAt: number, now = Date.now()): string {
  const ms = airingAt * 1000;
  const days = Math.round((startOfDay(ms) - startOfDay(now)) / DAY);
  if (days === 0) return `aujourd'hui ${time(ms)}`;
  if (days === 1) return `demain ${time(ms)}`;
  if (days === -1) return `hier ${time(ms)}`;
  return `${new Date(ms).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} ${time(ms)}`;
}

export function dayLabel(dayStart: number, now = Date.now()): string {
  const days = Math.round((dayStart - startOfDay(now)) / DAY);
  const date = new Date(dayStart).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  if (days === 0) return `Aujourd'hui · ${date}`;
  if (days === 1) return `Demain · ${date}`;
  if (days === -1) return `Hier · ${date}`;
  return date.charAt(0).toUpperCase() + date.slice(1);
}

export function groupByDay<T extends { airingAt: number }>(items: T[]): { day: number; items: T[] }[] {
  const map = new Map<number, T[]>();
  for (const it of [...items].sort((a, b) => a.airingAt - b.airingAt)) {
    const d = startOfDay(it.airingAt * 1000);
    map.set(d, [...(map.get(d) ?? []), it]);
  }
  return [...map].map(([day, list]) => ({ day, items: list }));
}

/** Dernier épisode sorti (exact si AniList donne le prochain épisode ou si la série est terminée). */
export function airedEpisodes(e: Pick<LibraryEntry, 'media'>, nowSec = Date.now() / 1000): number | null {
  const m = e.media;
  if (m.nextAiring) return m.nextAiring.airingAt <= nowSec ? m.nextAiring.episode : m.nextAiring.episode - 1;
  if (m.status === 'FINISHED') return m.episodes;
  return null;
}

/** Épisodes sortis pas encore vus (anime en cours uniquement). */
export function behind(e: LibraryEntry, nowSec = Date.now() / 1000): number {
  if (e.type !== 'ANIME' || (e.status !== 'CURRENT' && e.status !== 'REWATCH')) return 0;
  const aired = airedEpisodes(e, nowSec);
  return aired === null ? 0 : Math.max(0, aired - e.progress);
}

/** Anime de la bibliothèque dont on veut le calendrier. */
export const followedForCalendar = (entries: LibraryEntry[]) =>
  entries.filter(e => e.type === 'ANIME' && ['CURRENT', 'PLANNING', 'PAUSED', 'REWATCH'].includes(e.status)
    && (e.media.status === 'RELEASING' || e.media.status === 'NOT_YET_RELEASED' || e.media.nextAiring !== null));

export interface IcsEvent {
  uid: string;
  title: string;
  start: number; // secondes Unix
  durationMin: number;
  alarmMinutes: number | null;
  description?: string;
  url?: string;
}

const icsDate = (sec: number) => new Date(sec * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Plie les lignes à 75 octets (RFC 5545), sans couper un caractère multi-octet. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; size = 0; }
    cur += ch;
    size += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

/** Fichier calendrier .ics (Calendrier iOS gère les alertes sans serveur). */
export function buildIcs(events: IcsEvent[], stamp = Date.now() / 1000): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AnimePilot//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:AnimePilot'];
  for (const ev of events) {
    lines.push('BEGIN:VEVENT', `UID:${ev.uid}`, `DTSTAMP:${icsDate(stamp)}`, `DTSTART:${icsDate(ev.start)}`,
      `DTEND:${icsDate(ev.start + ev.durationMin * 60)}`, `SUMMARY:${icsText(ev.title)}`);
    if (ev.description) lines.push(`DESCRIPTION:${icsText(ev.description)}`);
    if (ev.url) lines.push(`URL:${ev.url}`);
    if (ev.alarmMinutes !== null) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(ev.title)}`, `TRIGGER:-PT${ev.alarmMinutes}M`, 'END:VALARM');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
