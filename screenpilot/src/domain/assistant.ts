import { airedEpisodes, behind, formatAiring } from './calendar';
import { formatNumber, mediaTitle, statusLabel, totalUnits, unitLabel, unitShort, TYPE_LABELS } from './labels';
import { nextFromPlanning } from './recommend';
import { formatDuration, typeStats } from './stats';
import { minutesParUnite } from './screentime';
import { buildProfile } from './taste';
import { isReading, MEDIA_TYPES, type EntryStatus, type HistoryEvent, type LibraryEntry, type MediaType, type TitleLanguage } from './types';

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
const minEp = (e: LibraryEntry) => minutesParUnite(e, { minutesPerChapter: 5 }).minutes;
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
      out.push({ id: 'end:' + e.id, entryId: e.id, text: `Plus que ${formatNumber(r)} ${unitLabel(e.type, r)} pour finir ${t(e, c)}.` });
  }
  for (const e of c.entries) {
    if (e.status === 'CURRENT' && c.now - e.updatedAt > STALE_DAYS * DAY)
      out.push({ id: 'stale:' + e.id, entryId: e.id, text: `${t(e, c)} n'a pas avancé depuis ${Math.floor((c.now - e.updatedAt) / DAY)} jours.`, action: { label: 'Mettre en pause', status: 'PAUSED' } });
  }
  for (const e of c.entries) {
    const n = e.media.nextAiring;
    if ((e.type === 'ANIME' || e.type === 'TV') && n?.episode === 1 && n.airingAt > nowSec && n.airingAt - nowSec < 7 * 86400)
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
  if (/film|cinema/.test(q)) return 'MOVIE';
  if (/serie/.test(q)) return 'TV';
  if (/anime/.test(q)) return 'ANIME';
  return null;
}
/** Sans précision : tout ce qui se regarde. */
const VIDEO: MediaType[] = ['TV', 'ANIME', 'MOVIE'];

function whatNext(c: Ctx, type: MediaType | null, minutes: number | null): Answer {
  const nowSec = c.now / 1000;
  const types = type ? [type] : VIDEO;
  const lecture = type === 'MANGA';
  const current = c.entries
    .filter(e => types.includes(e.type) && (e.status === 'CURRENT' || e.status === 'REWATCH'))
    .filter(e => isReading(e.type) || remaining(e) !== 0)
    .sort((a, b) => behind(b, nowSec) - behind(a, nowSec) || b.updatedAt - a.updatedAt);
  const verb = lecture ? 'lire' : 'regarder';
  if (minutes && !lecture) {
    const fits = current
      .map(e => ({ e, d: minEp(e) }))
      .filter(x => x.d <= minutes && (behind(x.e, nowSec) > 0 || x.e.media.status === 'FINISHED'));
    if (fits.length) {
      const { e, d } = fits[0]!;
      const n = Math.max(1, Math.min(Math.floor(minutes / d), behind(e, nowSec) || remaining(e) || 1));
      return { text: `Avec ${formatDuration(minutes)} : ${n} ${unitLabel(e.type, n)} de ${t(e, c)} (${d} min chacun).`, entries: fits.slice(0, 3).map(x => x.e) };
    }
    const planned = types.flatMap(ty => nextFromPlanning(c.entries, ty)).filter(e => minEp(e) <= minutes);
    if (planned.length) return { text: `Rien en cours ne tient en ${formatDuration(minutes)} ; dans ta liste à regarder, essaie ${t(planned[0]!, c)}.`, entries: planned.slice(0, 3) };
    return { text: `Aucun épisode disponible ne tient en ${formatDuration(minutes)} dans ta bibliothèque.` };
  }
  if (current.length) {
    const e = current[0]!;
    const late = behind(e, nowSec);
    const why = late > 0 ? `${late} épisode${late > 1 ? 's' : ''} t'attend${late > 1 ? 'ent' : ''}` : `tu en es ${isReading(e.type) ? 'au chapitre' : "à l'épisode"} ${formatNumber(e.progress)}`;
    return { text: `Continue ${t(e, c)} : ${why}.`, entries: current.slice(0, 3) };
  }
  const planned = types.flatMap(ty => nextFromPlanning(c.entries, ty));
  if (planned.length) return { text: `Rien en cours. Dans ta liste « ${statusLabel(planned[0]!.type, 'PLANNING')} », ${t(planned[0]!, c)} correspond le mieux à tes goûts.`, entries: planned.slice(0, 3) };
  return { text: `Ta bibliothèque ne contient rien à ${verb}. Ajoute des titres avec la recherche, ou consulte les recommandations.` };
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
    if (!late.length) return { text: 'Tu es à jour sur tes anime et séries en cours (d\'après les dernières infos AniList / TMDB).' };
    return { text: late.map(e => `${t(e, c)} : ${behind(e, nowSec)} ép.`).join(' · '), entries: late.slice(0, 5) };
  }

  if (/prochain|sortie|diffus|quand|calendrier|planning/.test(q)) {
    const up = c.entries.filter(e => (e.type === 'ANIME' || e.type === 'TV') && e.media.nextAiring && e.media.nextAiring.airingAt > nowSec && e.status !== 'DROPPED')
      .sort((a, b) => a.media.nextAiring!.airingAt - b.media.nextAiring!.airingAt);
    if (!up.length) return { text: 'Aucune sortie connue pour tes anime et séries suivis.' };
    return { text: up.slice(0, 5).map(e => `${t(e, c)} ép. ${e.media.nextAiring!.episode} : ${formatAiring(e.media.nextAiring!.airingAt, c.now)}`).join(' · '), entries: up.slice(0, 5) };
  }

  if (/temps|heure|duree|passe/.test(q) && !minutes) {
    const parts = MEDIA_TYPES.map(ty => ({ ty, st: typeStats(c.entries, ty) })).filter(x => x.st.units.value > 0);
    if (!parts.length) return { text: 'Rien de compté pour l’instant : marque des épisodes ou des films comme vus.' };
    return { text: parts.map(x => `${TYPE_LABELS[x.ty].plusieurs} : ${formatDuration(x.st.minutes.value)} (${formatNumber(x.st.units.value)} ${unitLabel(x.ty, x.st.units.value)})`).join(' · ') + '. Estimations d’après les durées des sources ; détail dans l’onglet Temps.' };
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
    return { text: MEDIA_TYPES.map(ty => typeStats(c.entries, ty)).map((st, i) => `${st.total} ${TYPE_LABELS[MEDIA_TYPES[i]!].plusieurs.toLowerCase()} (${st.byStatus.CURRENT} en cours, ${st.byStatus.COMPLETED} terminés)`).join(', ') + '.' };
  }

  if (/court|rapide|petit/.test(q)) {
    const type = typeOf(q) ?? 'TV';
    const short = c.entries.filter(e => e.type === type && e.status === 'PLANNING' && totalUnits(e.media))
      .sort((a, b) => totalUnits(a.media)! - totalUnits(b.media)!);
    if (!short.length) return { text: 'Aucun titre de longueur connue dans ta liste à regarder.' };
    return { text: `Le plus court de ta liste : ${t(short[0]!, c)} (${totalUnits(short[0]!.media)} ${unitShort(type)}).`, entries: short.slice(0, 3) };
  }

  const type = typeOf(q);
  if (type || minutes || /quoi|que faire|regarder|voir|lire|conseil|suggest|ce soir|maintenant/.test(q)) return whatNext(c, type, minutes);

  return { text: "Je n'ai pas compris (je suis un assistant à règles, pas une IA). Essaie : " + HELP.slice(0, 4).join(' · ') };
}
