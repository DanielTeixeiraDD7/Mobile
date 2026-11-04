import { GOUTS_DEFAUT, MOMENTS, repasPour } from './aliments';
import type { BilanPlan, Etat, PhaseId, PlanEtat } from './etat';
import type { Niveau, TypeSeance } from './programmes';
import { ecartJours, iso, lireDate, lundi } from './dates';
import { imc, nutrition, poidsActuel } from './calculs';

/**
 * Plan « Objectif Foot » : ~24 semaines en 4 phases, progression conditionnée par des bilans (pas seulement le temps).
 * Logique pure (testée dans tests/plan.test.ts). Sources et justification : PLAN.md.
 * Les seuils des bilans sont des CHOIX DE CONCEPTION prudents (expliqués dans PLAN.md), pas des normes médicales.
 */

/** Pauses actives visées par journée de bureau en fin de progression : 1 par heure sur ~8 h assis (voir PLAN.md). */
export const OBJECTIF_PAUSES = 8;
/** Plafond des pas visés (Tudor-Locke 2011 ; Paluch 2022 : bénéfice qui se stabilise vers 8 000–10 000 avant 60 ans). */
export const PAS_MAX = 10_000;
/** Seuil de la règle de la douleur (genoux / dos, 0–10). */
export const DOULEUR_MAX = 3;

export interface Prescrit { type: TypeSeance; niveau: Niveau }
/** Une semaine type : index 0 = lundi … 6 = dimanche ; null = repos. */
export type Semaine = (Prescrit | null)[];

export interface Contexte {
  bilan: BilanPlan;
  /** Bilan de départ (le premier noté), pour mesurer les progrès. */
  depart?: BilanPlan;
  /** Jours avec au moins une séance (hors pause bureau) depuis le début de la phase. */
  seances: number;
  /** Nombre de séances d'un type (niveau minimal) faites depuis le début de la phase. */
  faites: (types: TypeSeance[], niveauMin: Niveau) => number;
  douleurOk: boolean;
  avisMedical: boolean;
}
export interface Critere {
  id: string;
  label: string;
  /** null = pas encore mesuré. */
  test: (c: Contexte) => boolean | null;
}
export interface Phase {
  id: PhaseId;
  nom: string;
  icone: string;
  /** Durée minimale (semaines). La phase est prolongée tant que son bilan n'est pas réussi. */
  semaines: number;
  but: string;
  contenu: string;
  /** Pauses actives visées par jour de bureau. */
  pauses: number;
  semaine: (semaineDansPhase: number) => Semaine;
  /** Critères pour passer à la phase suivante (ou, pour la dernière, pour être « prêt pour un entraînement »). */
  criteres: Critere[];
}

const P = (type: TypeSeance, niveau: Niveau): Prescrit => ({ type, niveau });
const def = (v: number | undefined): v is number => typeof v === 'number' && Number.isFinite(v);
/** Valeur mesurée ≥ seuil, null si pas mesurée. */
const auMoins = (v: number | undefined, seuil: number) => (def(v) ? v >= seuil : null);
const auPlus = (v: number | undefined, seuil: number) => (def(v) ? v <= seuil : null);
/** Progrès par rapport au départ (ratio), ou seuil absolu si pas de départ comparable. */
function progres(v: number | undefined, depart: number | undefined, ratio: number): boolean | null {
  if (!def(v)) return null;
  if (!def(depart) || depart <= 0) return true;
  return v >= depart * ratio;
}
const regularite = (n: number): Critere => ({ id: 'regularite', label: `Au moins ${n} séances faites pendant la phase`, test: c => c.seances >= n });
const douleur: Critere = { id: 'douleur', label: `Genoux et dos : aucune douleur > ${DOULEUR_MAX}/10 ces 14 derniers jours`, test: c => c.douleurOk };

export const PHASES: Phase[] = [
  {
    id: 'reveil', nom: 'Réveil', icone: '🌅', semaines: 4, pauses: 4,
    but: 'Créer l’habitude et apprivoiser le souffle, sans te faire mal.',
    contenu: 'Marche facile, respiration, renfo très doux, premiers contacts avec le ballon, pauses au bureau.',
    semaine: s => (s === 0
      ? [P('full', 1), P('souffle', 1), P('foot', 1), P('mobilite', 1), null, P('souffle', 1), null]
      : [P('full', 1), P('souffle', 1), P('foot', 1), P('mobilite', 1), P('renfo', 1), P('marche', 1), null]),
    criteres: [
      regularite(8),
      { id: 'marche6', label: '6 min de marche sans t’arrêter (distance notée)', test: c => auMoins(c.bilan.marche6, 1) },
      { id: 'parole', label: 'Pendant ces 6 min : tu peux encore dire des phrases courtes', test: c => auMoins(c.bilan.parole, 1) },
      { id: 'escaliers', label: 'Escaliers : essoufflement ≤ 7/10 ou en baisse depuis le départ', test: c => (def(c.bilan.escaliers) ? c.bilan.escaliers <= 7 || (def(c.depart?.escaliers) && c.bilan.escaliers < c.depart!.escaliers!) : null) },
      douleur,
    ],
  },
  {
    id: 'fondations', nom: 'Fondations', icone: '🧱', semaines: 6, pauses: 6,
    but: 'Construire les jambes, le tronc et l’endurance de marche.',
    contenu: 'Renfo 2×/semaine, intervalles de marche rapide, technique balle, marche longue le week-end.',
    semaine: s => (s < 3
      ? [P('full', 1), P('intervalles', 1), P('foot', 1), P('mobilite', 1), P('renfo', 1), P('marche', 2), null]
      : [P('full', 2), P('intervalles', 2), P('foot', 2), P('mobilite', 2), P('renfo', 2), P('marche', 2), null]),
    criteres: [
      regularite(12),
      { id: 'parole', label: 'Marche rapide 6 min en parlant en phrases complètes', test: c => auMoins(c.bilan.parole, 2) },
      { id: 'marche6', label: 'Distance en 6 min : +5 % par rapport au départ', test: c => progres(c.bilan.marche6, c.depart?.marche6, 1.05) },
      { id: 'assisDebout', label: 'Assis-debout en 30 s : au moins 15 (ou +3 depuis le départ)', test: c => (def(c.bilan.assisDebout) ? c.bilan.assisDebout >= 15 || (def(c.depart?.assisDebout) && c.bilan.assisDebout >= c.depart!.assisDebout! + 3) : null) },
      { id: 'gainage', label: 'Gainage tenu au moins 30 s', test: c => auMoins(c.bilan.gainage, 30) },
      douleur,
    ],
  },
  {
    id: 'moteur', nom: 'Moteur', icone: '🫀', semaines: 7, pauses: 8,
    but: 'Développer le « moteur » (cœur, souffle) et préparer les articulations au trot.',
    contenu: 'Intervalles plus longs avec montées de marche, prévention type FIFA 11+, technique balle niveau 2.',
    semaine: s => (s < 3
      ? [P('renfo', 2), P('intervalles', 2), P('foot', 2), P('mobilite', 2), P('prevention', 1), P('marche', 3), null]
      : [P('full', 2), P('intervalles', 3), P('foot', 2), P('mobilite', 2), P('prevention', 2), P('marche', 3), null]),
    criteres: [
      regularite(14),
      { id: 'endurance', label: 'Au moins 2 séances longues (marche 45 min ou intervalles niveau 3)', test: c => c.faites(['marche', 'intervalles'], 3) >= 2 },
      { id: 'escaliers', label: 'Escaliers : essoufflement ≤ 3/10', test: c => auPlus(c.bilan.escaliers, 3) },
      { id: 'assisDebout', label: 'Assis-debout en 30 s : au moins 20', test: c => auMoins(c.bilan.assisDebout, 20) },
      { id: 'gainage', label: 'Gainage tenu au moins 45 s', test: c => auMoins(c.bilan.gainage, 45) },
      { id: 'marche6', label: 'Distance en 6 min : +10 % par rapport au départ', test: c => progres(c.bilan.marche6, c.depart?.marche6, 1.1) },
      douleur,
    ],
  },
  {
    id: 'terrain', nom: 'Retour terrain', icone: '⚽', semaines: 7, pauses: 8,
    but: 'Revenir au trot et au ballon en mouvement, puis à un vrai entraînement.',
    contenu: 'Marche / trottinement progressif, technique balle niveau 3, prévention 11+, renfo.',
    semaine: s => (s < 2
      ? [P('renfo', 2), P('marche_course', 1), P('foot', 3), P('mobilite', 2), P('prevention', 2), P('marche_course', 1), null]
      : s < 5
        ? [P('renfo', 3), P('marche_course', 2), P('foot', 3), P('mobilite', 2), P('prevention', 3), P('marche_course', 2), null]
        : [P('renfo', 3), P('marche_course', 3), P('foot', 3), P('mobilite', 3), P('prevention', 3), P('marche_course', 3), null]),
    criteres: [
      { id: 'trot', label: 'Au moins 4 séances marche / trottinement au niveau 3', test: c => c.faites(['marche_course'], 3) >= 4 },
      { id: 'ballon', label: 'Au moins 4 séances technique balle niveau 3', test: c => c.faites(['foot'], 3) >= 4 },
      { id: 'prevention', label: 'Au moins 4 séances de prévention (habitude du 11+)', test: c => c.faites(['prevention'], 1) >= 4 },
      { id: 'escaliers', label: 'Escaliers : essoufflement ≤ 2/10', test: c => auPlus(c.bilan.escaliers, 2) },
      { id: 'assisDebout', label: 'Assis-debout en 30 s : au moins 25', test: c => auMoins(c.bilan.assisDebout, 25) },
      { id: 'gainage', label: 'Gainage tenu 60 s', test: c => auMoins(c.bilan.gainage, 60) },
      douleur,
      { id: 'medecin', label: 'Feu vert de ton médecin pour le football', test: c => c.avisMedical },
    ],
  },
];
export const phaseParId = (id: PhaseId) => PHASES.find(p => p.id === id)!;
export const DUREE_MIN_SEMAINES = PHASES.reduce((t, p) => t + p.semaines, 0);

/** Séances qui chargent les articulations : allégées en cas de douleur. */
const IMPACT: TypeSeance[] = ['marche_course', 'intervalles', 'cardio', 'foot'];

// ---------- Dates du plan ----------
const ajouterJours = (d: string, n: number) => { const x = lireDate(d); x.setDate(x.getDate() + n); return iso(x); };
const lundiDe = (d: string) => lundi(lireDate(d));
const reculTotal = (plan: PlanEtat, date: string) => (plan.reprises ?? []).filter(r => r.date <= date).reduce((t, r) => t + r.semaines, 0);

/** Semaine du plan (0 = première) d'une date. Après une « reprise », le plan recule du nombre de semaines manquées. */
export function semainePlan(plan: PlanEtat, date: string): number {
  return Math.floor(ecartJours(lundiDe(plan.debut), lundiDe(date)) / 7) - reculTotal(plan, date);
}
/** Lundi (date) d'une semaine du plan, pour l'affichage (en tenant compte des reprises passées). */
export function lundiSemaine(plan: PlanEtat, semaine: number, aujourdhui: string): string {
  return ajouterJours(lundiDe(plan.debut), 7 * (semaine + reculTotal(plan, aujourdhui)));
}

// ---------- Suivi ----------
/** Dates (distinctes) avec une séance principale (une pause bureau n'en est pas une). */
function joursActifs(e: Etat, du: string, au: string) {
  return new Set(e.sessions.filter(s => s.type !== 'bureau' && s.date >= du && s.date <= au).map(s => s.date)).size;
}
const douleurDu = (e: Etat, d: string) => e.days[d]?.douleur ?? 0;

/** Règle de la douleur sur 14 jours : aucune douleur > 3/10 et pas de douleur qui ne redescend pas d'un jour à l'autre. */
export function douleurOk(e: Etat, date: string, bilan?: BilanPlan): boolean {
  if (def(bilan?.douleur) && bilan.douleur > DOULEUR_MAX) return false;
  for (let k = 0; k < 14; k++) {
    const d = ajouterJours(date, -k);
    const v = douleurDu(e, d);
    if (v > DOULEUR_MAX) return false;
    const veille = douleurDu(e, ajouterJours(d, -1));
    if (v > 0 && veille > 0 && v >= veille && douleurDu(e, ajouterJours(d, -2)) > 0) return false;
  }
  return true;
}

export interface Evaluation { criteres: { id: string; label: string; ok: boolean | null }[]; reussi: boolean }
export function evaluer(e: Etat, phase: Phase, bilan: BilanPlan, debutPhase: string): Evaluation {
  const plan = e.plan!;
  const depart = [...plan.bilans].sort((a, b) => a.date.localeCompare(b.date))[0];
  const dans = e.sessions.filter(s => s.type !== 'bureau' && s.date >= debutPhase && s.date <= bilan.date);
  const c: Contexte = {
    bilan, depart: depart && depart !== bilan ? depart : undefined,
    seances: joursActifs(e, debutPhase, bilan.date),
    faites: (types, n) => dans.filter(s => types.includes(s.type) && s.level >= n).length,
    douleurOk: douleurOk(e, bilan.date, bilan),
    avisMedical: !!plan.sante?.avisMedical,
  };
  const criteres = phase.criteres.map(k => ({ id: k.id, label: k.label, ok: k.test(c) }));
  return { criteres, reussi: criteres.every(k => k.ok === true) };
}

export interface EtapePhase {
  phase: Phase;
  index: number;
  /** Semaine du plan où la phase commence (projetée pour les phases à venir). */
  debut: number;
  debutDate?: string;
  /** Semaine (exclue) de fin : connue quand le bilan est réussi. */
  fin?: number;
  statut: 'faite' | 'en_cours' | 'a_venir';
  /** Bilan qui a validé la phase. */
  valide?: BilanPlan;
  /** Semaines au-delà de la durée minimale (bilan pas encore réussi). */
  prolongation: number;
  /** Phase sautée (phase choisie à la main plus loin). */
  sautee?: boolean;
}

/** Chronologie des phases à une date : bilans réussis, phase en cours (prolongée si besoin), phases à venir projetées. */
export function chronologie(e: Etat, date: string): EtapePhase[] {
  const plan = e.plan!;
  const actuelle = semainePlan(plan, date);
  const force = plan.phaseForcee && plan.phaseForcee.depuis <= date ? plan.phaseForcee : undefined;
  const iForce = force ? PHASES.findIndex(p => p.id === force.phase) : -1;
  const bilans = plan.bilans.filter(b => b.date <= date).sort((a, b) => a.date.localeCompare(b.date));
  const r: EtapePhase[] = [];
  let debut = force ? semainePlan(plan, force.depuis) : 0;
  let debutDate: string | undefined = force ? force.depuis : plan.debut;
  let enCours = false;
  PHASES.forEach((phase, index) => {
    if (index < iForce) { r.push({ phase, index, debut: 0, statut: 'faite', prolongation: 0, sautee: true }); return; }
    const finMin = debut + phase.semaines;
    if (enCours || debutDate === undefined) {
      r.push({ phase, index, debut, statut: 'a_venir', prolongation: 0 });
      debut = finMin;
      return;
    }
    const dd: string = debutDate;
    const valide = bilans.find(b => b.date >= dd && semainePlan(plan, b.date) >= finMin - 1 && evaluer(e, phase, b, dd).reussi);
    if (valide) {
      const fin = semainePlan(plan, valide.date) + 1;
      r.push({ phase, index, debut, debutDate: dd, fin, statut: 'faite', valide, prolongation: Math.max(0, fin - finMin) });
      debut = fin;
      debutDate = ajouterJours(lundiDe(valide.date), 7);
      return;
    }
    enCours = true;
    r.push({ phase, index, debut, debutDate: dd, statut: actuelle >= debut ? 'en_cours' : 'a_venir', prolongation: Math.max(0, actuelle - finMin + 1) });
    debut = Math.max(finMin, actuelle + 1);
    debutDate = undefined;
  });
  return r;
}

export interface JourPlan {
  date: string;
  semaine: number;
  phase: Phase;
  etape: EtapePhase;
  semaineDansPhase: number;
  /** Séance principale (null = repos). */
  seance: Prescrit | null;
  /** Séance prévue avant allègement (douleur / reprise). */
  prevue: Prescrit | null;
  /** Pas visés ce jour. */
  pas: number;
  /** Pauses actives visées (jours de bureau, du lundi au vendredi). */
  pauses: number;
  /** Bilan à faire ce jour (dimanche de fin de phase, puis toutes les 2 semaines tant qu'il n'est pas réussi). */
  bilan: 'depart' | 'passage' | 'etape' | null;
  /** Semaine de reprise après une pause : niveaux allégés. */
  reprise: boolean;
  /** Message d'allègement (règle de la douleur). */
  allege?: string;
  /** Plan terminé : critères « prêt pour un entraînement de foot » réussis. */
  pret: boolean;
  /** Petits sauts autorisés (uniquement en fin de plan, critères réussis). */
  sauts: boolean;
}

const baisser = (n: Niveau): Niveau => Math.max(1, n - 1) as Niveau;
const arrondi250 = (n: number) => Math.round(n / 250) * 250;

/** Pas visés : départ mesuré (au moins 2 500), +500 par semaine de plan (≈ +1 000 toutes les 2 semaines), plafonné à 10 000. */
export function pasVises(plan: PlanEtat, semaine: number, reprise = false): number {
  const base = Math.max(2500, plan.pasDepart ?? 3000);
  const v = Math.min(PAS_MAX, arrondi250(base + 500 * Math.max(0, semaine)));
  return reprise ? Math.max(arrondi250(base), v - 1000) : v;
}

/** Pas moyens des jours notés (14 derniers jours avec des pas), pour estimer le départ. */
export function pasMoyens(e: Etat, date: string): number | undefined {
  const v: number[] = [];
  for (let k = 1; k <= 14; k++) { const s = e.days[ajouterJours(date, -k)]?.steps ?? 0; if (s > 0) v.push(s); }
  return v.length >= 3 ? Math.round(v.reduce((a, b) => a + b) / v.length) : undefined;
}

/** Bilan prévu ce jour ? */
function bilanDu(plan: PlanEtat, etape: EtapePhase, date: string, semaine: number): JourPlan['bilan'] {
  if (!plan.bilans.length) return 'depart';
  if (lireDate(date).getDay() !== 0) return null;
  const s = semaine - etape.debut;
  const W = etape.phase.semaines;
  if (s >= W - 1 && (s - (W - 1)) % 2 === 0) return 'passage';
  if (W >= 6 && s === Math.floor(W / 2) - 1) return 'etape';
  return null;
}

/** Ce que le plan prévoit pour une date (null : pas de plan ou date avant le début). */
export function jourPlan(e: Etat, date: string): JourPlan | null {
  const plan = e.plan;
  if (!plan || date < plan.debut) return null;
  const semaine = semainePlan(plan, date);
  const chrono = chronologie(e, date);
  // Phase de cette semaine : validée (début ≤ semaine < fin), sinon celle en cours / à venir ; au-delà de la dernière : plan terminé.
  const etape = chrono.find(c => !c.sautee && c.fin !== undefined && c.debut <= semaine && semaine < c.fin)
    ?? chrono.find(c => c.statut !== 'faite');
  if (!etape) return jourFinal(e, date, semaine, chrono[chrono.length - 1]!);
  const phase = etape.phase;
  const semaineDansPhase = Math.max(0, semaine - etape.debut);
  const reprise = (plan.reprises ?? []).some(r => r.date === lundiDe(date));
  const j = (lireDate(date).getDay() + 6) % 7;
  const prevue = phase.semaine(Math.min(semaineDansPhase, phase.semaines - 1))[j] ?? null;
  // Renfo : suit le niveau du profil (ajusté par le ressenti des séances).
  const bonus = Math.max(0, (e.profile?.level ?? 1) - 1);
  let seance: Prescrit | null = prevue && (prevue.type === 'full' || prevue.type === 'renfo')
    ? { ...prevue, niveau: Math.min(3, prevue.niveau + bonus) as Niveau }
    : prevue && { ...prevue };
  if (seance && reprise) seance.niveau = baisser(seance.niveau);
  // Règle de la douleur : > 3/10 hier ou aujourd'hui, ou douleur qui ne redescend pas → on allège.
  let allege: string | undefined;
  const d0 = douleurDu(e, date), d1 = douleurDu(e, ajouterJours(date, -1)), d2 = douleurDu(e, ajouterJours(date, -2));
  const forte = Math.max(d0, d1) > DOULEUR_MAX;
  const persiste = d1 > 0 && d2 > 0 && d1 >= d2;
  if (seance && (forte || persiste)) {
    allege = forte
      ? `Douleur > ${DOULEUR_MAX}/10 : séance allégée. Si ça ne passe pas en quelques jours, demande l’avis d’un médecin ou d’un kiné.`
      : 'La douleur ne redescend pas d’un jour à l’autre : on allège aujourd’hui.';
    seance = IMPACT.includes(seance.type) || Math.max(d0, d1) > 5
      ? { type: Math.max(d0, d1) > 5 ? 'mobilite' : 'souffle', niveau: 1 }
      : { ...seance, niveau: baisser(seance.niveau) };
  }
  const jourBureau = j < 5;
  return {
    date, semaine, phase, etape, semaineDansPhase, seance, prevue, reprise, allege,
    pas: pasVises(plan, semaine, reprise),
    pauses: jourBureau ? phase.pauses : 0,
    bilan: bilanDu(plan, etape, date, semaine),
    pret: false,
    sauts: false,
  };
}

/** Après le plan : semaine d'entretien (dernière semaine de « Retour terrain »), petits sauts possibles. */
function jourFinal(e: Etat, date: string, semaine: number, etape: EtapePhase): JourPlan {
  const phase = etape.phase;
  const j = (lireDate(date).getDay() + 6) % 7;
  const prevue = phase.semaine(phase.semaines - 1)[j] ?? null;
  return {
    date, semaine, phase, etape, semaineDansPhase: Math.max(0, semaine - etape.debut), seance: prevue, prevue, reprise: false,
    pas: pasVises(e.plan!, semaine), pauses: j < 5 ? phase.pauses : 0, bilan: null, pret: true, sauts: true,
  };
}

/** La semaine (lundi → dimanche) qui contient la date. */
export function semaineDuPlan(e: Etat, date: string): (JourPlan | null)[] {
  const l = lundiDe(date);
  return Array.from({ length: 7 }, (_, k) => jourPlan(e, ajouterJours(l, k)));
}

/** Prochain bilan prévu (dans les 8 semaines). */
export function prochainBilan(e: Etat, date: string): JourPlan | null {
  for (let k = 0; k < 56; k++) { const j = jourPlan(e, ajouterJours(date, k)); if (j?.bilan) return j; }
  return null;
}

/** Évaluation du bilan le plus récent pour la phase en cours (progrès vers le passage). */
export function progresPhase(e: Etat, date: string): Evaluation & { bilan?: BilanPlan } {
  const j = jourPlan(e, date);
  if (!j || !e.plan) return { criteres: [], reussi: false };
  const debutDate = j.etape.debutDate ?? e.plan.debut;
  const bilan = [...e.plan.bilans].filter(b => b.date >= debutDate && b.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
  // Mesures du dernier bilan, séances et douleur comptées jusqu'à aujourd'hui.
  const ev = evaluer(e, j.phase, { ...(bilan ?? {}), date }, debutDate);
  return { ...ev, bilan };
}

/** Jours sans séance (pause bureau exclue) depuis la dernière, ou depuis le début du plan. */
export function joursSansSeance(e: Etat, date: string): number {
  if (!e.plan) return 0;
  const derniere = e.sessions.filter(s => s.type !== 'bureau' && s.date <= date && s.date >= e.plan!.debut).map(s => s.date).sort().pop();
  return Math.max(0, ecartJours(derniere ?? e.plan.debut, date) - (derniere ? 1 : 0));
}
/** Après au moins 7 jours sans séance : proposer de reprendre là où on s'était arrêté (semaines à reculer). */
export function repriseConseillee(e: Etat, date: string): number {
  const plan = e.plan;
  if (!plan) return 0;
  const n = joursSansSeance(e, date);
  if (n < 7) return 0;
  // Déjà repris cette semaine : rien de plus.
  if ((plan.reprises ?? []).some(r => r.date === lundiDe(date))) return 0;
  return Math.min(Math.floor(n / 7), Math.max(0, semainePlan(plan, date)));
}
/** Ajoute une reprise : le plan recule de `semaines` à partir de cette semaine (niveaux allégés cette semaine). */
export function reprendre(plan: PlanEtat, date: string, semaines: number): PlanEtat {
  if (semaines <= 0) return plan;
  return { ...plan, reprises: [...(plan.reprises ?? []), { date: lundiDe(date), semaines }] };
}

/** Phase conseillée au démarrage selon le profil. */
export function phaseDeDepart(e: Etat): PhaseId {
  const p = e.profile;
  if (!p) return 'reveil';
  return imc(p, poidsActuel(e)) >= 30 || p.level === 1 ? 'reveil' : 'fondations';
}

/** Création du plan : départ à la date donnée, pas de départ estimés, phase conseillée. */
export function nouveauPlan(e: Etat, debut: string, pasDepart?: number): PlanEtat {
  const phase = phaseDeDepart(e);
  return {
    debut, bilans: [], pasDepart: pasDepart ?? pasMoyens(e, debut) ?? 3000,
    ...(phase !== 'reveil' ? { phaseForcee: { phase, depuis: debut } } : {}),
    rappel: { actif: false, minutes: 60, debut: 9, fin: 18 },
  };
}

// ---------- Jalons football ----------
export interface Jalon { id: string; label: string; icone: string; ok: boolean }
export function jalonsFoot(e: Etat, date: string): Jalon[] {
  const s = e.sessions;
  const chrono = e.plan ? chronologie(e, date) : [];
  const phaseFaite = (id: PhaseId) => chrono.some(c => c.phase.id === id && c.statut === 'faite');
  return [
    { id: 'ballon', label: 'Premières touches de balle', icone: '⚽', ok: s.some(x => x.type === 'foot') },
    { id: 'fondations', label: 'Souffle de base validé', icone: '🌬️', ok: phaseFaite('reveil') },
    { id: 'moteur', label: 'Jambes et tronc solides', icone: '🧱', ok: phaseFaite('fondations') },
    { id: 'trot', label: 'Premier trottinement', icone: '🏃', ok: s.some(x => x.type === 'marche_course') },
    { id: 'terrain', label: 'Trot 90 s × 5 sans douleur', icone: '🛡️', ok: s.some(x => x.type === 'marche_course' && x.level >= 3) },
    { id: 'pret', label: 'Prêt pour un entraînement de foot', icone: '🏆', ok: phaseFaite('terrain') },
  ];
}

// ---------- Santé ----------
/**
 * Questions de sécurité inspirées des 7 questions générales du PAR-Q+ (paraphrasées : le vrai questionnaire, à ne pas modifier,
 * est sur eparmedx.com) + l'essoufflement anormal à l'effort léger (signe qui justifie un avis médical selon l'ACSM).
 */
export const QUESTIONS_SANTE = [
  { id: 'coeur', q: 'Un médecin t’a-t-il déjà parlé d’un problème cardiaque ou d’hypertension ?' },
  { id: 'poitrine', q: 'As-tu des douleurs dans la poitrine, au repos, au quotidien ou à l’effort ?' },
  { id: 'malaise', q: 'As-tu perdu connaissance, ou eu des vertiges avec perte d’équilibre, ces 12 derniers mois ?' },
  { id: 'maladie', q: 'As-tu une autre maladie chronique diagnostiquée (diabète, asthme, etc.) ?' },
  { id: 'medicaments', q: 'Prends-tu des médicaments pour une maladie chronique ?' },
  { id: 'articulations', q: 'As-tu un problème d’os, d’articulation, de muscle ou de tendon (genoux, dos…) qui pourrait s’aggraver en bougeant plus ?' },
  { id: 'supervision', q: 'Un médecin t’a-t-il dit de ne faire de l’activité physique que sous surveillance médicale ?' },
  { id: 'souffle', q: 'Es-tu très essoufflé pour un petit effort (monter un étage, aller chercher le courrier) ?' },
];
/** Avis médical conseillé avant de commencer : une réponse « oui », ou IMC ≥ 35. */
export function avisMedicalConseille(e: Etat): { conseille: boolean; raisons: string[] } {
  const raisons: string[] = [];
  const p = e.profile;
  if (p) { const v = imc(p, poidsActuel(e)); if (v >= 35) raisons.push(`IMC de ${v.toFixed(1).replace('.', ',')}, au-dessus de 35`); }
  const oui = e.plan?.sante?.oui ?? [];
  if (oui.includes('souffle')) raisons.push('essoufflement marqué pour un petit effort');
  const autres = oui.filter(o => o !== 'souffle').length;
  if (autres) raisons.push(`${autres} autre${autres > 1 ? 's' : ''} réponse${autres > 1 ? 's' : ''} « oui » au questionnaire`);
  return { conseille: raisons.length > 0, raisons };
}

/** Signaux d'arrêt immédiat (affichés dans le plan et avant les séances). */
export const SIGNAUX_ARRET = [
  'Douleur, serrement ou pression dans la poitrine, le bras, la mâchoire',
  'Malaise, vertige, vision trouble, sueurs froides',
  'Essoufflement anormal : tu ne peux plus dire quelques mots, ou il ne se calme pas après 2–3 min de repos',
  'Cœur qui bat de façon irrégulière ou très rapide sans raison',
  'Douleur vive ou qui monte au-dessus de 3/10 dans un genou ou le dos',
];

/** Intensité : le test de la parole (CDC) et l'échelle 0–10. */
export const INTENSITE = {
  facile: 'Facile : tu peux parler sans effort, presque chanter (moins de 5/10).',
  moderee: 'Modérée : tu peux parler mais pas chanter (≈ 5–6/10).',
  soutenue: 'Soutenue : quelques mots seulement avant de reprendre ton souffle (≈ 7–8/10).',
};

/** Consigne d'intensité selon le type de séance. */
export function consigneIntensite(t: TypeSeance): string {
  if (t === 'souffle' || t === 'mobilite' || t === 'bureau') return INTENSITE.facile;
  if (t === 'marche_course') return 'Trot très lent : tu dois pouvoir parler en phrases courtes. Sinon, marche.';
  return INTENSITE.moderee;
}

// ---------- Nutrition ----------
/** Objectif calorique (calculs.nutrition, Mifflin-St Jeor) + perte réaliste + repères de repas. */
export function planNutrition(e: Etat) {
  const n = nutrition(e);
  // Idées tirées des repas compatibles avec les goûts (aliments exclus, fruits aimés).
  const gouts = e.gouts ?? GOUTS_DEFAUT;
  const repas = MOMENTS.map(m => {
    const options = repasPour(m.id, gouts, n.cible);
    const idee = options.length ? options.slice(0, 3).map(o => o.repas.nom).join(' · ') : 'Ajoute des aliments que tu aimes dans Nutrition › Mes goûts.';
    return { id: m.id, nom: m.nom, part: m.part, idee, kcal: Math.round((n.cible * m.part) / 10) * 10 };
  });
  return {
    ...n,
    deficit: n.tdee - n.cible,
    /** Fourchette « sûre et durable » du NHS (0,5 à 1 kg par semaine). */
    perteSure: [0.5, 1] as const,
    repas,
  };
}

/** Objectifs du jour pour l'accueil : ceux du plan s'il existe, sinon valeurs par défaut (8 000 pas, OBJECTIF_PAUSES). */
export function objectifsDuJour(e: Etat, date: string): { pas: number; pauses: number } {
  const j = jourPlan(e, date);
  return j ? { pas: j.pas, pauses: j.pauses } : { pas: 8000, pauses: OBJECTIF_PAUSES };
}

/** Sources principales (détail et dates de consultation : PLAN.md). */
export const SOURCES = [
  { nom: 'OMS 2020 – Lignes directrices activité physique et sédentarité (Bull et al., BJSM)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/' },
  { nom: 'ACSM 2009 – Activité physique et perte de poids (Donnelly et al.)', url: 'https://pubmed.ncbi.nlm.nih.gov/19127177/' },
  { nom: 'NHS – Couch to 5K, plan de course', url: 'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/' },
  { nom: 'NHS – Recommandations d’activité 19–64 ans', url: 'https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/' },
  { nom: 'NHS – Traitement de l’obésité (perte de 0,5 à 1 kg/semaine)', url: 'https://www.nhs.uk/conditions/obesity/treatment/' },
  { nom: 'CDC – Mesurer l’intensité (test de la parole, échelle 0–10)', url: 'https://www.cdc.gov/physical-activity-basics/measuring/index.html' },
  { nom: 'PAR-Q+ 2025 (questionnaire officiel)', url: 'https://eparmedx.com/' },
  { nom: 'HAS – Parcours de soins surpoids et obésité de l’adulte', url: 'https://www.has-sante.fr/jcms/p_3408871/' },
  { nom: 'FIFA 11+ – revue (Bizzini & Dvorak, BJSM 2015)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4413741/' },
  { nom: 'Pas par jour (Tudor-Locke et al., 2011)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3197470/' },
  { nom: 'Rompre la position assise (Dunstan et al., Diabetes Care 2012)', url: 'https://pubmed.ncbi.nlm.nih.gov/22374636/' },
];
