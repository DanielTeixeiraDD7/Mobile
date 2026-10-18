import type { Match } from './core/model';
import { DEFS } from './games/defs';
import { toast } from './ui/toast';

const timers = new Map<string, ReturnType<typeof setTimeout>>();
export const notificationsSupported = () => typeof Notification !== 'undefined' && 'serviceWorker' in navigator;

export async function askPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

const title = (m: Match) => `${m.sides[0].team?.name ?? 'À déterminer'} vs ${m.sides[1].team?.name ?? 'À déterminer'}`;

async function show(t: string, body: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg && Notification.permission === 'granted') return void (await reg.showNotification(t, { body, icon: 'icons/icon-192.png', tag: t }));
  } catch { /* repli : bandeau */ }
  toast(`${t} — ${body}`, { duration: 8000 });
}

/** Rappels locaux (app ouverte uniquement : pas de serveur de notifications). */
export function schedule(matches: Match[], minutes: number, now = Date.now()): number {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
  for (const m of matches) {
    if (m.status !== 'upcoming' || m.startTime === null) continue;
    const delay = m.startTime - minutes * 60_000 - now;
    if (delay <= 0 || delay > 24 * 3600_000) continue;
    timers.set(m.id, setTimeout(() => void show(title(m), `${DEFS[m.game]?.short ?? ''} · ${m.competition?.name ?? ''} · ${minutes ? `dans ${minutes} min` : 'maintenant'}`), delay));
  }
  return timers.size;
}

const icsDate = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function fold(line: string) {
  const enc = new TextEncoder(); const out: string[] = []; let cur = '', size = 0;
  for (const ch of line) { const n = enc.encode(ch).length; if (size + n > (out.length ? 74 : 75)) { out.push(cur); cur = ''; size = 0; } cur += ch; size += n; }
  out.push(cur); return out.join('\r\n ');
}

/** Calendrier .ics des matchs à venir (alertes gérées par l'app Calendrier, même app fermée). */
export function buildIcs(matches: Match[], alarmMinutes: number, stamp = Date.now()): string {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Esport Companion//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Esport Companion'];
  for (const m of matches) {
    if (m.status !== 'upcoming' || m.startTime === null) continue;
    const dur = (m.format?.count ?? 1) * 45;
    L.push('BEGIN:VEVENT', `UID:${m.id.replace(/[^\w.-]/g, '_')}@esport-companion`, `DTSTAMP:${icsDate(stamp)}`, `DTSTART:${icsDate(m.startTime)}`, `DTEND:${icsDate(m.startTime + dur * 60_000)}`,
      `SUMMARY:${icsText(`${DEFS[m.game]?.short ?? m.game} · ${title(m)}`)}`,
      `DESCRIPTION:${icsText(`${m.competition?.name ?? ''}${m.stage ? ' · ' + m.stage : ''}${m.format ? ' · BO' + m.format.count : ''}\nDurée estimée (${dur} min). Horaire de la source : peut changer.`)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(title(m))}`, `TRIGGER:-PT${alarmMinutes}M`, 'END:VALARM', 'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.map(fold).join('\r\n') + '\r\n';
}
