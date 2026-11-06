import { describe, expect, it } from 'vitest';
import { normaliser, type BilanPlan, type Etat, type SeanceFaite } from '../src/core/etat';
import type { Niveau, TypeSeance } from '../src/core/programmes';
import { TYPES } from '../src/core/programmes';
import { construire, duree, MARCHE_COURSE, PAUSE_BUREAU } from '../src/core/seance';
import {
  PHASES, OBJECTIF_PAUSES, PAS_MAX, DUREE_MIN_SEMAINES, avisMedicalConseille, chronologie, douleurOk, jalonsFoot, jourPlan, nouveauPlan,
  pasVises, planNutrition, prochainBilan, progresPhase, repriseConseillee, reprendre, semaineDuPlan, semainePlan,
} from '../src/core/plan';

// Lundi 2 novembre 2026.
const DEBUT = '2026-11-02';
const jour = (n: number) => { const d = new Date(2026, 10, 2 + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/** Dimanche de la semaine w du plan. */
const dimanche = (w: number) => jour(7 * w + 6);

function etat(o: Partial<Etat> = {}): Etat {
  const e = normaliser({
    profile: { name: 'Test', sex: 'h', age: 25, height: 180, goalWeight: 90, activity: 1.2, startWeight: 125, level: 1, createdAt: DEBUT },
    weights: [{ date: DEBUT, kg: 125 }],
    ...o,
  });
  e.plan ??= nouveauPlan(e, DEBUT);
  return e;
}
const seance = (date: string, type: TypeSeance = 'full', level: Niveau = 1): SeanceFaite => ({ date, type, level, duration: 900, kcal: 100, feel: 2 });
/** n séances (une par jour) à partir du jour k. */
const seances = (k: number, n: number, type: TypeSeance = 'full', level: Niveau = 1) => Array.from({ length: n }, (_, i) => seance(jour(k + i), type, level));
const bilanReveil = (date: string): BilanPlan => ({ date, parole: 1, marche6: 420, escaliers: 6, assisDebout: 10, gainage: 20, poids: 123 });

describe('plan : création et personnalisation', () => {
  it('commence par la phase Réveil pour un IMC ≥ 30, pas de départ par défaut', () => {
    const e = etat();
    expect(e.plan!.phaseForcee).toBeUndefined();
    expect(e.plan!.pasDepart).toBe(3000);
    expect(jourPlan(e, DEBUT)!.phase.id).toBe('reveil');
  });
  it('estime les pas de départ à partir des jours notés', () => {
    const days: Etat['days'] = {};
    [4000, 5000, 6000].forEach((s, i) => { days[jour(-1 - i)] = { water: 0, steps: s, habits: {}, food: [] }; });
    const e = etat({ days });
    expect(nouveauPlan(e, DEBUT).pasDepart).toBe(5000);
  });
  it('profil déjà actif (IMC < 30, niveau 2) : départ en Fondations', () => {
    const e = etat({ profile: { name: '', sex: 'h', age: 25, height: 180, goalWeight: 80, activity: 1.4, startWeight: 90, level: 2, createdAt: DEBUT }, weights: [{ date: DEBUT, kg: 90 }] });
    const p = nouveauPlan(e, DEBUT);
    expect(p.phaseForcee?.phase).toBe('fondations');
  });
  it('~24 semaines minimum en 4 phases', () => {
    expect(PHASES.map(p => p.id)).toEqual(['reveil', 'fondations', 'moteur', 'terrain']);
    expect(DUREE_MIN_SEMAINES).toBe(24);
  });
});

describe('plan : jour par jour', () => {
  const e = etat();
  it('semaine 1 : séances douces, repos le dimanche, bilan de départ proposé', () => {
    const s = semaineDuPlan(e, DEBUT);
    expect(s.map(j => j?.seance?.type ?? null)).toEqual(['full', 'souffle', 'foot', 'mobilite', null, 'souffle', null]);
    expect(s.every(j => j!.seance === null || j!.seance.niveau === 1)).toBe(true);
    expect(s[0]!.bilan).toBe('depart');
  });
  it('pauses bureau : du lundi au vendredi seulement, progressives jusqu’à OBJECTIF_PAUSES', () => {
    const s = semaineDuPlan(e, DEBUT);
    expect(s.map(j => j!.pauses)).toEqual([4, 4, 4, 4, 4, 0, 0]);
    expect(Math.max(...PHASES.map(p => p.pauses))).toBe(OBJECTIF_PAUSES);
  });
  it('pas : +500 par semaine depuis le départ, plafonnés à 10 000', () => {
    expect(jourPlan(e, jour(0))!.pas).toBe(3000);
    expect(jourPlan(e, jour(14))!.pas).toBe(4000);
    expect(pasVises(e.plan!, 40)).toBe(PAS_MAX);
    expect(pasVises({ ...e.plan!, pasDepart: 1200 }, 0)).toBe(2500);
  });
  it('avant le début ou sans plan : rien', () => {
    expect(jourPlan(e, jour(-1))).toBeNull();
    expect(jourPlan(normaliser({ profile: e.profile }), DEBUT)).toBeNull();
  });
});

describe('plan : passages de phase conditionnés par les bilans', () => {
  it('sans bilan réussi, la phase est prolongée (on répète sa dernière semaine)', () => {
    const e = etat({ sessions: seances(0, 3) });
    e.plan!.bilans = [{ date: DEBUT, marche6: 400, parole: 0, escaliers: 8 }];
    const j = jourPlan(e, jour(29))!; // mardi de la semaine 5
    expect(j.phase.id).toBe('reveil');
    expect(j.etape.prolongation).toBe(1);
    expect(j.seance).toEqual({ type: 'souffle', niveau: 1 });
  });
  it('bilan de passage le dimanche de la dernière semaine, puis toutes les 2 semaines', () => {
    const e = etat();
    e.plan!.bilans = [{ date: DEBUT, marche6: 400 }];
    expect(jourPlan(e, dimanche(3))!.bilan).toBe('passage');
    expect(jourPlan(e, dimanche(4))!.bilan).toBeNull();
    expect(jourPlan(e, dimanche(5))!.bilan).toBe('passage');
    expect(prochainBilan(e, DEBUT)!.date).toBe(dimanche(3));
  });
  it('bilan réussi + régularité : la phase suivante commence le lundi', () => {
    const e = etat({ sessions: seances(0, 8) });
    e.plan!.bilans = [{ date: DEBUT, marche6: 400, parole: 0, escaliers: 8, assisDebout: 8 }, bilanReveil(dimanche(3))];
    const ch = chronologie(e, jour(28));
    expect(ch[0]).toMatchObject({ statut: 'faite', fin: 4 });
    const lundi = jourPlan(e, jour(28))!;
    expect(lundi.phase.id).toBe('fondations');
    expect(lundi.seance?.type).toBe('full');
    expect(jourPlan(e, jour(29))!.seance).toEqual({ type: 'intervalles', niveau: 1 });
  });
  it('bilan trop tôt (avant la dernière semaine) : ne valide pas la phase', () => {
    const e = etat({ sessions: seances(0, 10) });
    e.plan!.bilans = [{ date: DEBUT, marche6: 400 }, bilanReveil(dimanche(1))];
    expect(jourPlan(e, jour(28))!.phase.id).toBe('reveil');
  });
  it('régularité insuffisante : bilan refusé, critère indiqué', () => {
    const e = etat({ sessions: seances(0, 5) });
    e.plan!.bilans = [{ date: DEBUT, marche6: 400 }, bilanReveil(dimanche(3))];
    expect(jourPlan(e, jour(28))!.phase.id).toBe('reveil');
    const p = progresPhase(e, dimanche(3));
    expect(p.reussi).toBe(false);
    expect(p.criteres.find(c => c.id === 'regularite')!.ok).toBe(false);
    expect(p.criteres.find(c => c.id === 'parole')!.ok).toBe(true);
  });
  it('bilan validé en milieu de semaine : on finit la semaine dans la phase validée', () => {
    const e = etat({ sessions: seances(0, 8) });
    e.plan!.bilans = [{ date: DEBUT, marche6: 400 }, bilanReveil(jour(23))]; // mercredi semaine 4
    expect(jourPlan(e, jour(25))!.phase.id).toBe('reveil');
    expect(jourPlan(e, jour(28))!.phase.id).toBe('fondations');
  });
  it('critère non mesuré = pas encore validé', () => {
    const e = etat({ sessions: seances(0, 8) });
    e.plan!.bilans = [{ date: dimanche(3), parole: 1, escaliers: 5 }];
    expect(progresPhase(e, dimanche(3)).criteres.find(c => c.id === 'marche6')!.ok).toBeNull();
    expect(jourPlan(e, jour(28))!.phase.id).toBe('reveil');
  });
  it('Fondations : progrès mesurés par rapport au bilan de départ', () => {
    const e = etat({ sessions: [...seances(0, 8), ...seances(28, 12)] });
    e.plan!.bilans = [{ date: DEBUT, marche6: 400, assisDebout: 9 }, bilanReveil(dimanche(3))];
    // fin des Fondations : semaine 9 (4 + 6 − 1)
    e.plan!.bilans.push({ date: dimanche(9), parole: 2, marche6: 415, assisDebout: 13, gainage: 35 });
    const p = progresPhase(e, dimanche(9));
    expect(p.criteres.find(c => c.id === 'marche6')!.ok).toBe(false); // 415 < 400 × 1,05
    expect(p.criteres.find(c => c.id === 'assisDebout')!.ok).toBe(true); // +4 depuis le départ
    e.plan!.bilans.push({ date: dimanche(11), parole: 2, marche6: 440, assisDebout: 13, gainage: 35 });
    expect(jourPlan(e, jour(84))!.phase.id).toBe('moteur');
  });
});

describe('plan : pas de saut ni de course avant la fin', () => {
  it('aucune séance marche/trottinement avant la phase Retour terrain', () => {
    const e = etat();
    for (let k = 0; k < 7 * 30; k++) expect(jourPlan(e, jour(k))!.seance?.type).not.toBe('marche_course');
    for (const p of PHASES.slice(0, 3)) for (let s = 0; s < p.semaines; s++) expect(p.semaine(s).some(x => x?.type === 'marche_course')).toBe(false);
    expect(PHASES[3]!.semaine(0).filter(x => x?.type === 'marche_course')).toHaveLength(2);
  });
  it('sauts autorisés seulement quand le plan est terminé', () => {
    const e = etat();
    expect(jourPlan(e, jour(200))!.sauts).toBe(false);
  });
  it('marche / trottinement niveau 2 = semaine 1 de Couch to 5K (NHS)', () => {
    const s = construire('marche_course', 2);
    expect(MARCHE_COURSE[2]).toEqual([60, 90, 7, 60]);
    expect(s.filter(x => x.cle === 'marche_course' || x.cle === 'marche_rapide' && x.phase === 'work').map(x => x.dur).slice(0, 8)).toEqual([60, 60, 60, 60, 60, 60, 60, 60]);
    expect(duree(s)).toBe(300 + 7 * 150 + 60 + 300 + 60);
  });
});

describe('plan : règle de la douleur', () => {
  const avecDouleur = (vals: Record<number, number>) => {
    const days: Etat['days'] = {};
    for (const [k, v] of Object.entries(vals)) days[jour(Number(k))] = { water: 0, steps: 0, habits: {}, food: [], douleur: v };
    return etat({ days });
  };
  it('douleur ≤ 3 qui redescend : séance normale', () => {
    const e = avecDouleur({ 7: 3, 8: 1 });
    expect(jourPlan(e, jour(9))!.seance).toEqual({ type: 'foot', niveau: 1 });
    expect(jourPlan(e, jour(9))!.allege).toBeUndefined();
  });
  it('douleur > 3 hier : la séance à impact devient souffle', () => {
    const e = avecDouleur({ 8: 4 });
    const j = jourPlan(e, jour(9))!; // mercredi : technique balle
    expect(j.prevue?.type).toBe('foot');
    expect(j.seance).toEqual({ type: 'souffle', niveau: 1 });
    expect(j.allege).toMatch(/Douleur/);
  });
  it('douleur forte (> 5) : mobilité seulement', () => {
    expect(jourPlan(avecDouleur({ 7: 7 }), jour(7))!.seance?.type).toBe('mobilite');
  });
  it('douleur qui ne redescend pas en 24 h : niveau allégé', () => {
    const e = avecDouleur({ 13: 2, 14: 2 });
    e.profile!.level = 2;
    const j = jourPlan(e, jour(15))!; // mardi de la semaine 3 : souffle
    expect(j.allege).toBeTruthy();
    const lundi = jourPlan(avecDouleur({ 12: 2, 13: 3 }), jour(14))!; // lundi : full
    expect(lundi.prevue?.type).toBe('full');
    expect(lundi.seance?.niveau).toBe(1);
  });
  it('le bilan échoue si une douleur > 3 a eu lieu dans les 14 jours', () => {
    const e = avecDouleur({ 20: 5 });
    expect(douleurOk(e, dimanche(3))).toBe(false);
    expect(douleurOk(e, jour(40))).toBe(true);
    expect(douleurOk(etat(), DEBUT, { date: DEBUT, douleur: 4 })).toBe(false);
  });
});

describe('plan : jours manqués', () => {
  it('après 7 jours sans séance, propose de reprendre ; le plan recule et allège la semaine', () => {
    const e = etat({ sessions: seances(0, 6) });
    const date = jour(18); // vendredi semaine 3, dernière séance le jour 5
    expect(repriseConseillee(e, date)).toBe(1);
    expect(semainePlan(e.plan!, date)).toBe(2);
    e.plan = reprendre(e.plan!, date, 1);
    expect(semainePlan(e.plan!, date)).toBe(1);
    const lundi = jourPlan(e, jour(14))!;
    expect(lundi.reprise).toBe(true);
    expect(lundi.semaine).toBe(1);
    expect(repriseConseillee(e, date)).toBe(0);
    // semaine suivante : plus de reprise, semaine 2 du plan
    expect(jourPlan(e, jour(21))!).toMatchObject({ reprise: false, semaine: 2 });
  });
  it('quelques jours manqués : rien ne casse, pas de reprise proposée', () => {
    const e = etat({ sessions: seances(0, 3) });
    expect(repriseConseillee(e, jour(6))).toBe(0);
    expect(jourPlan(e, jour(6))).not.toBeNull();
  });
  it('pause bureau ne compte pas comme séance', () => {
    const e = etat({ sessions: [...seances(0, 1), ...seances(1, 9, 'bureau')] });
    expect(repriseConseillee(e, jour(10))).toBe(1);
  });
});

describe('plan : phase choisie à la main et fin du plan', () => {
  it('forcer une phase saute les précédentes', () => {
    const e = etat();
    e.plan!.phaseForcee = { phase: 'terrain', depuis: jour(7) };
    const ch = chronologie(e, jour(8));
    expect(ch.slice(0, 3).every(c => c.sautee)).toBe(true);
    expect(jourPlan(e, jour(8))!.seance?.type).toBe('marche_course');
    expect(jourPlan(e, jour(1))!.phase.id).toBe('reveil');
  });
  it('fin : critères « prêt pour un entraînement » (dont avis médical), puis entretien', () => {
    const e = etat({ sessions: [...seances(7, 4, 'marche_course', 3), ...seances(11, 4, 'foot', 3), ...seances(15, 4, 'prevention', 3)] });
    e.plan!.phaseForcee = { phase: 'terrain', depuis: jour(7) };
    const b: BilanPlan = { date: dimanche(7), escaliers: 2, assisDebout: 26, gainage: 60 };
    e.plan!.bilans = [b];
    expect(jourPlan(e, jour(57))!.pret).toBe(false);
    expect(progresPhase(e, dimanche(7)).criteres.find(c => c.id === 'medecin')!.ok).toBe(false);
    e.plan!.sante = { date: DEBUT, oui: [], avisMedical: true };
    const j = jourPlan(e, jour(57))!;
    expect(j).toMatchObject({ pret: true, sauts: true, bilan: null });
    expect(jalonsFoot(e, jour(57)).find(x => x.id === 'pret')!.ok).toBe(true);
  });
});

describe('plan : santé et nutrition', () => {
  it('avis médical conseillé : IMC ≥ 35 et essoufflement', () => {
    const e = etat();
    expect(avisMedicalConseille(e).raisons[0]).toMatch(/IMC de 38,6/);
    e.plan!.sante = { date: DEBUT, oui: ['souffle', 'articulations'] };
    expect(avisMedicalConseille(e).raisons).toHaveLength(3);
  });
  it('nutrition : Mifflin-St Jeor ≈ 2 255 kcal de base, perte estimée dans la fourchette du NHS', () => {
    const n = planNutrition(etat());
    expect(n.bmr).toBe(2255); // 10×125 + 6,25×180 − 5×25 + 5
    expect(n.tdee).toBe(2706);
    expect(n.cible).toBe(2060);
    expect(n.perteHebdo).toBeGreaterThanOrEqual(n.perteSure[0]);
    expect(n.perteHebdo).toBeLessThanOrEqual(n.perteSure[1]);
    expect(Math.abs(n.repas.reduce((t, r) => t + r.kcal, 0) - n.cible)).toBeLessThanOrEqual(20);
  });
});

describe('nouvelles séances', () => {
  it('pause bureau ≈ 4 min, sans échauffement', () => {
    const s = construire('bureau', 1);
    expect(duree(s)).toBe(PAUSE_BUREAU.reduce((t, [, d]) => t + d, 0));
    expect(duree(s)).toBe(240);
    expect(s.every(x => x.phase === 'work')).toBe(true);
  });
  it('souffle, intervalles, foot, prévention : se construisent à tous les niveaux', () => {
    for (const t of TYPES) for (const n of [1, 2, 3] as const) expect(construire(t, n).length, `${t} ${n}`).toBeGreaterThan(0);
    expect(duree(construire('souffle', 1))).toBe(90 + 120 + 600 + 60);
    expect(construire('intervalles', 3).some(x => x.cle === 'step_up')).toBe(true);
    expect(construire('intervalles', 1).some(x => x.cle === 'step_up')).toBe(false);
  });
  it('données : le plan est conservé, un plan invalide est ignoré', () => {
    const e = etat();
    e.plan!.bilans.push({ date: DEBUT, marche6: 400 });
    const relu = normaliser(JSON.parse(JSON.stringify(e)));
    expect(relu.plan!.bilans).toHaveLength(1);
    expect(normaliser({ ...e, plan: { foo: 1 } as never }).plan).toBeUndefined();
    expect(normaliser({ ...e, plan: { debut: DEBUT } as never }).plan!.bilans).toEqual([]);
  });
});
