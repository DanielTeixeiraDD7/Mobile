import type { AiringRow } from './airing';
import { mediaTitle } from '../domain/labels';
import { buildIcs, type IcsEvent } from '../domain/calendar';
import type { Settings } from '../domain/types';
import { toast } from '../composables/useToast';

/**
 * Rappels SANS serveur :
 * 1. notifications programmées tant que l'app reste ouverte (setTimeout) ;
 * 2. export .ics : le Calendrier du téléphone affiche l'alerte même app fermée.
 */
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const MAX_DELAY = 24 * 3600_000;

export const notificationsSupported = () => typeof Notification !== 'undefined' && 'serviceWorker' in navigator;

export async function askPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

async function show(title: string, body: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg && Notification.permission === 'granted') return void (await reg.showNotification(title, { body, icon: 'icons/icon-192.png', tag: title + body }));
  } catch { /* repli : toast */ }
  toast(`${title} — ${body}`, { duree: 8000 });
}

export function scheduleInApp(rows: AiringRow[], settings: Settings, now = Date.now()) {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
  if (!settings.notify) return 0;
  for (const r of rows) {
    const at = r.airingAt * 1000 - settings.reminderMinutes * 60_000;
    const delay = at - now;
    if (delay <= 0 || delay > MAX_DELAY) continue;
    const title = mediaTitle(r.entry.media, settings.titleLanguage);
    const when = settings.reminderMinutes ? `dans ${settings.reminderMinutes} min` : 'maintenant';
    timers.set(`${r.entry.type}:${r.mediaId}:${r.episode}`, setTimeout(() => void show(title, `Épisode ${r.episode} ${when}`), delay));
  }
  return timers.size;
}

export function icsEvents(rows: AiringRow[], settings: Settings, nowSec = Date.now() / 1000): IcsEvent[] {
  return rows.filter(r => r.airingAt > nowSec).map(r => ({
    uid: `${r.entry.type === 'TV' ? 'tv' : 'animepilot'}-${r.mediaId}-${r.episode}@animepilot`,
    title: `${mediaTitle(r.entry.media, settings.titleLanguage)} — ép. ${r.episode}`,
    start: r.airingAt,
    durationMin: r.entry.media.duration ?? (r.entry.type === 'TV' ? 40 : 24),
    alarmMinutes: settings.reminderMinutes,
    description: r.entry.type === 'TV'
      ? 'Date de première diffusion (TMDB). La sortie sur ta plateforme peut être décalée.'
      : 'Horaire de diffusion japonaise (AniList). La sortie sur ta plateforme peut être décalée.',
    url: r.entry.media.siteUrl ?? undefined,
  }));
}

/** Partage (iOS : feuille de partage) ou téléchargement du fichier .ics. */
export async function exportIcs(rows: AiringRow[], settings: Settings) {
  const events = icsEvents(rows, settings);
  if (events.length === 0) return toast('Aucune diffusion à venir à exporter.');
  const file = new File([buildIcs(events)], 'screenpilot-diffusions.ics', { type: 'text/calendar' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Diffusions ScreenPilot' }); return; }
    catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  toast(`${events.length} diffusion(s) exportée(s).`);
}
