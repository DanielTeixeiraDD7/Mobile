import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL } from '@/config';
import type { Session as SessionVue } from '@/domain/screentime';
import { mediaTitle, totalUnits } from '@/domain/labels';
import type { LibraryEntry, MediaType, TitleLanguage } from '@/domain/types';

/**
 * Comptes et amis (Supabase). Chargé à la demande : sans compte, rien n'est téléchargé ni envoyé.
 * Envoyé au serveur : pseudo, temps d'écran par jour et catégorie, et — seulement si tu l'actives —
 * tes titres (titre, affiche, statut, progression, note). Jamais tes notes personnelles.
 */
export interface Profil { id: string; pseudo: string; code: string; couleur: string; partage_temps: boolean; partage_biblio: boolean }
export interface Amitie { demandeur: string; destinataire: string; statut: 'attente' | 'acceptee'; cree_le: string }
export interface StatJour { utilisateur: string; jour: string; categorie: MediaType; minutes: number; unites: number }
export interface TitrePartage { utilisateur: string; id: string; categorie: MediaType; titre: string; affiche: string | null; statut: string; progression: number; total: number | null; note: number | null; maj_le: string }

export const CLE_SESSION = 'screenpilot-auth';
let client: Promise<SupabaseClient> | null = null;

export function sb(): Promise<SupabaseClient> {
  client ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: CLE_SESSION, detectSessionInUrl: false },
  }));
  return client;
}

/** Une session existe sur cet appareil (sans charger la bibliothèque Supabase). */
export const sessionLocale = () => { try { return !!localStorage.getItem(CLE_SESSION); } catch { return false; } };

/** Messages d'erreur lisibles (Supabase répond en anglais). */
export function messageSocial(e: unknown): string {
  const m = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e);
  if (/Invalid login credentials/i.test(m)) return 'Email ou mot de passe incorrect.';
  if (/already registered|already exists/i.test(m)) return 'Un compte existe déjà avec cet email : connecte-toi.';
  if (/Password should be|weak/i.test(m)) return 'Mot de passe trop faible (8 caractères minimum).';
  if (/invalid.*email|email.*invalid/i.test(m)) return 'Adresse email invalide.';
  if (/Email not confirmed/i.test(m)) return 'Email pas encore confirmé (voir le lien reçu par email).';
  if (/rate limit|too many/i.test(m)) return 'Trop de tentatives, réessaie dans quelques minutes.';
  if (/does not exist|Could not find the (function|table)|schema cache/i.test(m)) return 'Le serveur n’est pas encore configuré (script SQL à exécuter dans Supabase).';
  if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Pas de connexion au serveur.';
  if (/JWT|session/i.test(m) && /expired|missing|invalid/i.test(m)) return 'Session expirée : reconnecte-toi.';
  return m.replace(/^.*?exception: /i, '');
}

const verifier = <T>(r: { data: T; error: unknown }): T => { if (r.error) throw r.error; return r.data; };

export async function utilisateurId(): Promise<string | null> {
  const { data } = await (await sb()).auth.getSession();
  return data.session?.user.id ?? null;
}

export async function inscrire(email: string, motDePasse: string, pseudo: string): Promise<Profil> {
  const s = await sb();
  const r = await s.auth.signUp({ email: email.trim(), password: motDePasse });
  if (r.error) throw r.error;
  if (!r.data.session) throw new Error('Compte créé, mais le serveur demande une confirmation par email : ouvre le lien reçu puis connecte-toi.');
  return creerProfil(pseudo);
}

export async function connecter(email: string, motDePasse: string): Promise<Profil | null> {
  const s = await sb();
  const r = await s.auth.signInWithPassword({ email: email.trim(), password: motDePasse });
  if (r.error) throw r.error;
  return monProfil();
}

export async function deconnecter() {
  await (await sb()).auth.signOut().catch(() => {});
  try { localStorage.removeItem(CLE_SESSION); } catch { /* ignoré */ }
}

export async function creerProfil(pseudo: string): Promise<Profil> {
  return verifier(await (await sb()).rpc('creer_profil', { p_pseudo: pseudo.trim() })) as Profil;
}

export async function monProfil(): Promise<Profil | null> {
  const id = await utilisateurId();
  if (!id) return null;
  return verifier(await (await sb()).from('profils').select('*').eq('id', id).maybeSingle()) as Profil | null;
}

export async function majProfil(id: string, p: Partial<Pick<Profil, 'pseudo' | 'couleur' | 'partage_temps' | 'partage_biblio'>>): Promise<Profil> {
  return verifier(await (await sb()).from('profils').update(p).eq('id', id).select().single()) as Profil;
}

export async function demanderAmi(code: string): Promise<{ pseudo: string; statut: 'attente' | 'acceptee' }> {
  return verifier(await (await sb()).rpc('demander_ami', { p_code: code.trim().toUpperCase() })) as { pseudo: string; statut: 'attente' | 'acceptee' };
}

export interface Reseau { amis: Profil[]; recues: Profil[]; envoyees: Profil[] }

/** Amis acceptés, demandes reçues et envoyées (la RLS ne renvoie que les profils en relation). */
export async function reseau(moi: string): Promise<Reseau> {
  const s = await sb();
  const [amities, profils] = await Promise.all([
    s.from('amities').select('*').then(verifier) as Promise<Amitie[]>,
    s.from('profils').select('*').neq('id', moi).then(verifier) as Promise<Profil[]>,
  ]);
  const parId = new Map(profils.map(p => [p.id, p]));
  const r: Reseau = { amis: [], recues: [], envoyees: [] };
  for (const a of amities) {
    const autre = parId.get(a.demandeur === moi ? a.destinataire : a.demandeur);
    if (!autre) continue;
    if (a.statut === 'acceptee') r.amis.push(autre);
    else (a.destinataire === moi ? r.recues : r.envoyees).push(autre);
  }
  r.amis.sort((x, y) => x.pseudo.localeCompare(y.pseudo, 'fr'));
  return r;
}

export async function accepter(moi: string, autre: string) {
  verifier(await (await sb()).from('amities').update({ statut: 'acceptee' }).eq('demandeur', autre).eq('destinataire', moi));
}

/** Refuser une demande, l'annuler, ou retirer un ami (une seule ligne par paire). */
export async function retirer(moi: string, autre: string) {
  const s = await sb();
  verifier(await s.from('amities').delete().or(`and(demandeur.eq.${moi},destinataire.eq.${autre}),and(demandeur.eq.${autre},destinataire.eq.${moi})`));
}

export async function statsDepuis(jour: string): Promise<StatJour[]> {
  return verifier(await (await sb()).from('stats_jour').select('utilisateur,jour,categorie,minutes,unites').gte('jour', jour)) as StatJour[];
}

export async function titresDe(utilisateur: string): Promise<TitrePartage[]> {
  return verifier(await (await sb()).from('titres').select('*').eq('utilisateur', utilisateur).order('maj_le', { ascending: false })) as TitrePartage[];
}

export const jourLocal = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Agrégat jour × catégorie des sessions locales, à partir du jour `depuis` (AAAA-MM-JJ). */
export function agreger(sessions: SessionVue[], depuis: string): Omit<StatJour, 'utilisateur'>[] {
  const m = new Map<string, Omit<StatJour, 'utilisateur'>>();
  for (const s of sessions) {
    const jour = jourLocal(s.at);
    if (jour < depuis) continue;
    const k = `${jour}|${s.type}`;
    const v = m.get(k) ?? { jour, categorie: s.type, minutes: 0, unites: 0 };
    v.minutes += s.minutes; v.unites += s.unites;
    m.set(k, v);
  }
  return [...m.values()].map(v => ({ ...v, minutes: Math.round(v.minutes), unites: Math.round(v.unites * 10) / 10 }));
}

/** Envoie le temps d'écran des `jours` derniers jours (recalculé : une annulation corrige aussi le serveur). */
export async function pousserStats(moi: string, sessions: SessionVue[], jours = 60) {
  const s = await sb();
  const depuis = jourLocal(Date.now() - jours * 86_400_000);
  const lignes = agreger(sessions, depuis).map(l => ({ ...l, utilisateur: moi }));
  const existantes = verifier(await s.from('stats_jour').select('jour,categorie').eq('utilisateur', moi).gte('jour', depuis)) as { jour: string; categorie: string }[];
  const gardees = new Set(lignes.map(l => `${l.jour}|${l.categorie}`));
  const obsoletes = existantes.filter(e => !gardees.has(`${e.jour}|${e.categorie}`));
  if (lignes.length) verifier(await s.from('stats_jour').upsert(lignes.map(l => ({ ...l, maj_le: new Date().toISOString() }))));
  for (const o of obsoletes) verifier(await s.from('stats_jour').delete().eq('utilisateur', moi).eq('jour', o.jour).eq('categorie', o.categorie));
}

const AFFICHE_OK = /^https:\/\/(image\.tmdb\.org|s4\.anilist\.co)\//;

/** Titres partagés : tout (sans notes perso) si le partage est actif, rien sinon. */
export async function pousserTitres(moi: string, entries: LibraryEntry[], partage: boolean, lang: TitleLanguage) {
  const s = await sb();
  if (!partage) { verifier(await s.from('titres').delete().eq('utilisateur', moi)); return; }
  const lignes = entries.map(e => ({
    utilisateur: moi, id: e.id, categorie: e.type, titre: mediaTitle(e.media, lang).slice(0, 300),
    affiche: e.media.cover && AFFICHE_OK.test(e.media.cover) ? e.media.cover : null,
    statut: e.status, progression: e.progress, total: totalUnits(e.media), note: e.score, maj_le: new Date(e.updatedAt).toISOString(),
  }));
  for (let i = 0; i < lignes.length; i += 400) verifier(await s.from('titres').upsert(lignes.slice(i, i + 400)));
  const ids = new Set(lignes.map(l => l.id));
  const serveur = verifier(await s.from('titres').select('id').eq('utilisateur', moi)) as { id: string }[];
  const enTrop = serveur.map(x => x.id).filter(id => !ids.has(id));
  for (let i = 0; i < enTrop.length; i += 100) verifier(await s.from('titres').delete().eq('utilisateur', moi).in('id', enTrop.slice(i, i + 100)));
}

export async function supprimerCompte() {
  verifier(await (await sb()).rpc('supprimer_mon_compte'));
  await deconnecter();
}
