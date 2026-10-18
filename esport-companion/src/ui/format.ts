const DAY = 86_400_000;
const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

export const time = (ms: number) => new Date(ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** « Aujourd'hui 18:00 », « Demain 09:00 », « sam. 19 oct. 17:30 » — fuseau de l'appareil. */
export function when(ms: number | null, now = Date.now()): string {
  if (ms === null) return 'Horaire inconnu';
  const d = Math.round((startOfDay(ms) - startOfDay(now)) / DAY);
  if (d === 0) return `Aujourd'hui ${time(ms)}`;
  if (d === 1) return `Demain ${time(ms)}`;
  if (d === -1) return `Hier ${time(ms)}`;
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  if (new Date(ms).getFullYear() !== new Date(now).getFullYear()) opts.year = 'numeric';
  return `${new Date(ms).toLocaleDateString('fr-FR', opts)} ${time(ms)}`;
}

export function dayLabel(ms: number, now = Date.now()): string {
  const d = Math.round((startOfDay(ms) - startOfDay(now)) / DAY);
  const s = new Date(ms).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const cap = s.charAt(0).toUpperCase() + s.slice(1);
  return d === 0 ? `Aujourd'hui · ${s}` : d === 1 ? `Demain · ${s}` : d === -1 ? `Hier · ${s}` : cap;
}

export function relative(ms: number, now = Date.now()): string {
  const s = Math.round((now - ms) / 1000);
  if (s < 45) return "à l'instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return `il y a ${Math.round(s / 86400)} j`;
}

export function countdown(ms: number, now = Date.now()): string {
  const m = Math.round((ms - now) / 60000);
  if (m <= 0) return 'imminent';
  if (m < 60) return `dans ${m} min`;
  if (m < 48 * 60) return `dans ${Math.round(m / 60)} h`;
  return `dans ${Math.round(m / 1440)} j`;
}

export const clock = (sec: number | null) => {
  if (sec === null) return '—';
  const a = Math.abs(Math.round(sec));
  return `${sec < 0 ? '−' : ''}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`;
};
export const num = (n: number | null | undefined, digits = 0) => (n === null || n === undefined || !Number.isFinite(n) ? '—' : n.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits }));
export const kGold = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k`);
export const pct = (n: number | null | undefined, digits = 0) => (n === null || n === undefined ? '—' : `${(n * 100).toLocaleString('fr-FR', { maximumFractionDigits: digits })} %`);
export const startOfLocalDay = startOfDay;
