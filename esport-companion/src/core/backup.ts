import type { Favorite, ManualMatch, SavedView, Settings } from '../data/db';
import { SECTIONS } from '../data/db';
import { DEFS } from '../games/defs';

export const BACKUP_FORMAT = 'esport-companion-backup';
export const BACKUP_VERSION = 1;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  settings: Partial<Settings>;
  favorites: Favorite[];
  manual: ManualMatch[];
  views: SavedView[];
}

export function createBackup(p: { settings: Settings; favorites: Favorite[]; manual: ManualMatch[]; views: SavedView[] }, now = new Date()): Backup {
  const { onboarded: _o, ...settings } = p.settings;
  return { format: BACKUP_FORMAT, schemaVersion: BACKUP_VERSION, exportedAt: now.toISOString(), settings, favorites: p.favorites, manual: p.manual, views: p.views };
}

export class BackupError extends Error {}
const obj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export interface ParsedBackup {
  exportedAt: string | null;
  settings: Partial<Settings>;
  favorites: Favorite[];
  manual: ManualMatch[];
  views: SavedView[];
  invalid: number;
}

/** Valide une sauvegarde ; les éléments invalides sont ignorés et comptés. */
export function parseBackup(text: string): ParsedBackup {
  let d: unknown;
  try { d = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new BackupError("Ce fichier n'est pas un JSON valide."); }
  if (!obj(d) || d.format !== BACKUP_FORMAT) throw new BackupError("Ce fichier n'est pas une sauvegarde Esport Companion.");
  if (typeof d.schemaVersion !== 'number' || !Number.isInteger(d.schemaVersion)) throw new BackupError('Version de sauvegarde inconnue.');
  if (d.schemaVersion > BACKUP_VERSION) throw new BackupError(`Sauvegarde créée par une version plus récente (v${d.schemaVersion}).`);
  let invalid = 0;
  const keep = <T,>(arr: unknown, ok: (x: Record<string, unknown>) => boolean): T[] => (Array.isArray(arr) ? arr : []).filter(x => (obj(x) && ok(x)) || (invalid++, false)) as T[];
  const favorites = keep<Favorite>(d.favorites, f => typeof f.id === 'string' && ['team', 'player', 'competition', 'game'].includes(f.kind as string) && typeof f.name === 'string' && typeof f.game === 'string');
  const manual = keep<ManualMatch>(d.manual, m => typeof m.id === 'string' && obj(m.match) && (m.match as Record<string, unknown>).id === m.id && obj((m.match as Record<string, unknown>).prov)
    && ((m.match as { prov: { kind: string } }).prov.kind === 'imported') && Array.isArray((m.match as Record<string, unknown>).sides));
  const views = keep<SavedView>(d.views, v => typeof v.id === 'string' && typeof v.name === 'string' && obj(v.filters));
  const s = obj(d.settings) ? d.settings : {};
  const settings: Partial<Settings> = {};
  if (Array.isArray(s.games)) settings.games = s.games.filter((g): g is string => typeof g === 'string' && !!DEFS[g]);
  if (Array.isArray(s.sections)) settings.sections = s.sections.filter((x): x is Settings['sections'][number] => (SECTIONS as readonly string[]).includes(x as string));
  if (obj(s.followed)) settings.followed = Object.fromEntries(Object.entries(s.followed).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, (v as unknown[]).filter(x => typeof x === 'string') as string[]]));
  if (s.theme === 'dark' || s.theme === 'light') settings.theme = s.theme;
  if (typeof s.hideSpoilers === 'boolean') settings.hideSpoilers = s.hideSpoilers;
  if (typeof s.reminderMinutes === 'number' && s.reminderMinutes >= 0 && s.reminderMinutes <= 1440) settings.reminderMinutes = s.reminderMinutes;
  return { exportedAt: typeof d.exportedAt === 'string' ? d.exportedAt : null, settings, favorites, manual, views, invalid };
}

/** Fusion : ajoute ce qui manque, garde l'existant en cas d'identifiant commun. */
export function mergeBackup(cur: { favorites: Favorite[]; manual: ManualMatch[]; views: SavedView[] }, inc: ParsedBackup) {
  const add = <T extends { id: string }>(a: T[], b: T[]) => { const ids = new Set(a.map(x => x.id)); const extra = b.filter(x => !ids.has(x.id)); return { list: [...a, ...extra], added: extra.length, dup: b.length - extra.length }; };
  const f = add(cur.favorites, inc.favorites), m = add(cur.manual, inc.manual), v = add(cur.views, inc.views);
  return { favorites: f.list, manual: m.list, views: v.list, added: f.added + m.added + v.added, duplicates: f.dup + m.dup + v.dup };
}
