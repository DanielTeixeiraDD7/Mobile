import { airedEpisodes, behind, formatAiring } from './calendar';
import { formatNumber, mediaTitle, statusLabel, totalUnits } from './labels';
import { nextFromPlanning } from './recommend';
import { DEFAULT_EPISODE_MIN, formatDuration, typeStats } from './stats';
import { buildProfile } from './taste';
import type { EntryStatus, HistoryEvent, LibraryEntry, MediaType, TitleLanguage } from './types';

/**
 * Assistant à règles, 100 % local : pas d'IA, pas de réseau.
 * Il ne répond qu'à partir de ta bibliothèque ; s'il ne sait pas, il le dit.
 */
export interface Ctx {
  entries: LibraryEntry[];
  history: HistoryEvent[];
  lang: TitleLanguage;
  now: number; // ms
}

export interface Insight {
  id: string;
  text: string;
  entryId?: string;
  action?: { label: string; status: EntryStatus };
}

export interface Answer {
  text: string;
  entries?: LibraryEntry[];
}

const DAY = 86_400_000;
const STALE_DAYS = 30;
const t = (e: LibraryEntry, c: Ctx) => mediaTitle(e.media, c.lang);
const remaining = (e: LibraryEntry) => { const total = totalUnits(e.media); return total ? Math.max(0, total - e.progress) : null; };

/** Conseils proactifs, du plus utile au moins utile. */
export function insights(c: Ctx): Insight[] {
  const out: Insight[] = [];
  const nowSec = c.now / 1000;
  for (const e of c.entries) {
    const late = behind(e, nowSec);
    if (late > 0) out.push({ id: 'late:' + e.id, entryId: e.id, text: `${late} épisode${late > 1 ? 's' : ''} sorti${late > 1 ? 's' : ''} à rattraper sur ${t(e, c)}.` });
  }
  for (const e of c.entries) {
    const r = remaining(e);
    if ((e.status === 'CURRENT' || e.status === 'REWATCH') && r !== null && r > 0 && r <= 2 && (e.type === 'MANGA' || (airedEpisodes(e, nowSec) ?? 0) >= (totalUnits(e.media) ?? Infinity)))
      out.push({ id: 'end:' + e.id, entryId: e.id, text: `Plus que ${formatNumber(r)} ${e.type === 'ANIME' ? 'épisode' : 'chapitre'}${r > 1 ? 's' : ''} pour finir ${t(e, c)}.` });
  }
  for (const e of c.entries) {
    if (e.status === 'CURRENT' && c.now - e.updatedAt > STALE_DAYS * DAY)
      out.push({ id: 'stale:' + e.id, entryId: e.id, text: `${t(e, c)} n'a pas avancé depuis ${Math.floor((c.now - e.updatedAt) / DAY)} jours.`, action: { label: 'Mettre en pause', status: 'PAUSED' } });
  }
  for (const e of c.entries) {
    const n = e.media.nextAiring;
    if (e.type === 'ANIME' && n?.episode === 1 && n.airingAt > nowSec && n.airingAt - nowSec < 7 * 86400)
      out.push({ id: 'start:' + e.id, entryId: e.id, text: `${t(e, c)} commence ${formatAiring(n.airingAt, c.now)}.` });
  }
  const unrated = c.entries.filter(e => e.status === 'COMPLETED' && e.score === null).length;
  if (unrated >= 3) out.push({ id: 'unrated', text: `${unrated} titres terminés sans note : les noter affine tes recommandations.` });
  return out;
}

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’']/g, ' ');

/** Minutes disponibles dans la question (« j'ai 45 min », « 1h30 », « 2 heures »). */
export function parseMinutes(q: string): number | null {
  const s = norm(q);
  const hm = s.match(/(\d+)\s*h\s*(\d{1,2})\b/);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
  const h = s.match(/(\d+(?:[.,]\d+)?)\s*(h|heure)/);
  if (h) return Math.round(Number(h[1]!.replace(',', '.')) * 60);
  const m = s.match(/(\d+)\s*(min|mn|minute)/);
  if (m) return Number(m[1]);
  if (/une heure/.test(s)) return 60;
  if (/demi.?heure/.test(s)) return 30;
  return null;
}

function typeOf(q: string): MediaType | null {
  if (/manga|lire|lecture|chapitre|scan/.test(q)) return 'MANGA';
  if (/anime|regarder|voir|episode|serie|film/.test(q)) return 'ANIME';
  return null;
}

function whatNext(c: Ctx, type: MediaType, minutes: number | null): Answer {
  const nowSec = c.now / 1000;
  const current = c.entries
    .filter(e => e.type === type && (e.status === 'CURRENT' || e.status === 'REWATCH'))
    .filter(e => type === 'MANGA' || remaining(e) !== 0)
    .sort((a, b) => behind(b, nowSec) - behind(a, nowSec) || b.updatedAt - a.updatedAt);
  const verb = type === 'ANIME' ? 'regarder' : 'lire';
  if (minutes && type === 'ANIME') {
    const fits = current
      .map(e => ({ e, d: e.media.duration ?? DEFAULT_EPISODE_MIN }))
      .filter(x => x.d <= minutes && (behind(x.e, nowSec) > 0 || x.e.media.status === 'FINISHED'));
    if (fits.length) {
      const { e, d } = fits[0]!;
      const n = Math.max(1, Math.min(Math.floor(minutes / d), behind(e, nowSec) || remaining(e) || 1));
      return { text: `Avec ${formatDuration(minutes)} : ${n} épisode${n > 1 ? 's' : ''} de ${t(e, c)} (${d} min chacun).`, entries: fits.slice(0, 3).map(x => x.e) };
    }
    const planned = nextFromPlanning(c.entries, type).filter(e => (e.media.duration ?? DEFAULT_EPISODE_MIN) <= minutes);
    if (planned.length) return { text: `Rien en cours ne tient en ${formatDuration(minutes)} ; dans ta liste à regarder, essaie ${t(planned[0]!, c)}.`, entries: planned.slice(0, 3) };
    return { text: `Aucun épisode disponible ne tient en ${formatDuration(minutes)} dans ta bibliothèque.` };
  }
  if (current.length) {
    const e = current[0]!;
    const late = behind(e, nowSec);
    const why = late > 0 ? `${late} épisode${late > 1 ? 's' : ''} t'attend${late > 1 ? 'ent' : ''}` : `tu en es ${type === 'ANIME' ? "à l'épisode" : 'au chapitre'} ${formatNumber(e.progress)}`;
    return { text: `Continue ${t(e, c)} : ${why}.`, entries: current.slice(0, 3) };
  }
  const planned = nextFromPlanning(c.entries, type);
  if (planned.length) return { text: `Rien en cours. Dans ta liste « ${statusLabel(type, 'PLANNING')} », ${t(planned[0]!, c)} correspond le mieux à tes goûts.`, entries: planned.slice(0, 3) };
  return { text: `Ta bibliothèque ne contient rien à ${verb}. Ajoute des titres depuis l'onglet ${type === 'ANIME' ? 'Anime' : 'Manga'}, ou consulte les recommandations ci-dessous.` };
}

export const HELP = [
  'Que regarder ce soir ?',
  "J'ai 45 min, quoi regarder ?",
  'Quel manga lire ?',
  "Combien de temps j'ai passé à regarder ?",
  'Où en suis-je en retard ?',
  'Quels sont mes genres préférés ?',
  'Prochaines sorties ?',
  "Combien j'ai fini de titres cette année ?",
];

export function answer(question: string, c: Ctx): Answer {
  const q = norm(question.trim());
  if (!q) return { text: 'Pose-moi une question sur ta bibliothèque.' };
  const nowSec = c.now / 1000;
  const minutes = parseMinutes(q);

  if (/^(aide|help|\?)|que sais.tu|tu peux faire/.test(q)) return { text: 'Je réponds à partir de ta bibliothèque, sans internet. Exemples : ' + HELP.join(' · ') };

  if (/retard|rattraper|manque/.test(q)) {
    const late = c.entries.filter(e => behind(e, nowSec) > 0).sort((a, b) => behind(b, nowSec) - behind(a, nowSec));
    if (!late.length) return { text: 'Tu es à jour sur tous tes anime en cours (d\'après les dernières infos AniList).' };
    return { text: late.map(e => `${t(e, c)} : ${behind(e, nowSec)} ép.`).join(' · '), entries: late.slice(0, 5) };
  }

  if (/prochain|sortie|diffus|quand|calendrier|planning/.test(q)) {
    const up = c.entries.filter(e => e.type === 'ANIME' && e.media.nextAiring && e.media.nextAiring.airingAt > nowSec && e.status !== 'DROPPED')
      .sort((a, b) => a.media.nextAiring!.airingAt - b.media.nextAiring!.airingAt);
    if (!up.length) return { text: 'Aucune sortie connue pour tes anime suivis.' };
    return { text: up.slice(0, 5).map(e => `${t(e, c)} ép. ${e.media.nextAiring!.episode} : ${formatAiring(e.media.nextAiring!.airingAt, c.now)}`).join(' · '), entries: up.slice(0, 5) };
  }

  if (/temps|heure|duree|passe/.test(q) && !minutes) {
    const a = typeStats(c.entries, 'ANIME');
    const m = typeStats(c.entries, 'MANGA');
    return { text: `Environ ${formatDuration(a.minutes.value)} d'anime (${a.units.value} épisodes) et ${formatDuration(m.minutes.value)} de lecture (${formatNumber(m.units.value)} chapitres). Estimations : durée AniList par épisode, ${5} min par chapitre.` };
  }

  if (/genre|gout|profil|aime|prefer/.test(q)) {
    const p = buildProfile(c.entries);
    if (!p.topGenres.length) return { text: 'Pas encore assez de données : termine ou note quelques titres.' };
    return { text: `Tes genres favoris : ${p.topGenres.slice(0, 4).map(g => g.name).join(', ')}.${p.disliked.length ? ` Moins ton truc : ${p.disliked.slice(0, 2).map(g => g.name).join(', ')}.` : ''}${p.weak ? ' (profil basé sur peu de titres)' : ''}` };
  }

  if (/fini|termine|complete/.test(q)) {
    const year = new Date(c.now).getFullYear();
    const done = c.entries.filter(e => e.completedAt?.startsWith(String(year)));
    const all = c.entries.filter(e => e.status === 'COMPLETED').length;
    return { text: `${done.length} titre${done.length > 1 ? 's' : ''} terminé${done.length > 1 ? 's' : ''} en ${year}, ${all} au total.`, entries: done.slice(0, 5) };
  }

  if (/combien|stat|nombre|total/.test(q)) {
    const a = typeStats(c.entries, 'ANIME');
    const m = typeStats(c.entries, 'MANGA');
    return { text: `${a.total} anime (${a.byStatus.CURRENT} en cours, ${a.byStatus.COMPLETED} terminés) et ${m.total} manga (${m.byStatus.CURRENT} en cours, ${m.byStatus.COMPLETED} terminés).` };
  }

  if (/court|rapide|petit/.test(q)) {
    const type = typeOf(q) ?? 'ANIME';
    const short = c.entries.filter(e => e.type === type && e.status === 'PLANNING' && totalUnits(e.media))
      .sort((a, b) => totalUnits(a.media)! - totalUnits(b.media)!);
    if (!short.length) return { text: 'Aucun titre de longueur connue dans ta liste à regarder.' };
    return { text: `Le plus court de ta liste : ${t(short[0]!, c)} (${totalUnits(short[0]!.media)} ${type === 'ANIME' ? 'ép.' : 'ch.'}).`, entries: short.slice(0, 3) };
  }

  const type = typeOf(q);
  if (type || minutes || /quoi|que faire|conseil|suggest|ce soir|maintenant/.test(q)) return whatNext(c, type ?? 'ANIME', minutes);

  return { text: "Je n'ai pas compris (je suis un assistant à règles, pas une IA). Essaie : " + HELP.slice(0, 4).join(' · ') };
}
