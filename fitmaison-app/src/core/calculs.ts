import { ecartJours, iso, lireDate, lundi, aujourdhui } from './dates';
import type { Etat, Profil } from './etat';

/** Calculs repris de FitMaison v1 (mêmes formules, mêmes résultats). */
export const peseesTriees = (e: Etat) => [...e.weights].sort((a, b) => a.date.localeCompare(b.date));
export function poidsActuel(e: Etat): number {
  const w = peseesTriees(e);
  return w.length ? w[w.length - 1]!.kg : e.profile?.startWeight ?? 0;
}
export const imc = (p: Profil, kg: number) => kg / (p.height / 100) ** 2;
export function libelleImc(v: number): string {
  if (v < 18.5) return 'Maigreur';
  if (v < 25) return 'Normal';
  if (v < 30) return 'Surpoids';
  if (v < 35) return 'Obésité modérée';
  if (v < 40) return 'Obésité sévère';
  return 'Obésité massive';
}

/** Mifflin-St Jeor, déficit modéré (~650 kcal), plancher de sécurité. */
export function nutrition(e: Etat) {
  const p = e.profile!;
  const kgActuel = poidsActuel(e);
  const bmr = 10 * kgActuel + 6.25 * p.height - 5 * p.age + (p.sex === 'h' ? 5 : -161);
  const tdee = bmr * p.activity;
  const plancher = p.sex === 'h' ? 1600 : 1300;
  const cible = Math.max(plancher, Math.round((tdee - 650) / 10) * 10);
  return {
    bmr: Math.round(bmr), tdee: Math.round(tdee), cible,
    proteines: Math.round(1.6 * p.goalWeight),
    eau: Math.min(3.5, Math.max(2, Math.round(kgActuel * 0.03 * 4) / 4)),
    perteHebdo: ((tdee - cible) * 7) / 7700,
  };
}

/** Tendance : régression linéaire sur les 28 derniers jours (kg/semaine) et date estimée de l'objectif. */
export function tendance(e: Etat, maintenant = Date.now()): { parSemaine: number; objectif?: Date } | null {
  const w = peseesTriees(e);
  if (w.length < 2) return null;
  const dernier = w[w.length - 1]!.date;
  const pts = w.filter(x => ecartJours(x.date, dernier) <= 28);
  if (pts.length < 2 || ecartJours(pts[0]!.date, dernier) < 5) return null;
  const xs = pts.map(x => ecartJours(pts[0]!.date, x.date));
  const ys = pts.map(x => x.kg);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i]! - mx) * (ys[i]! - my); den += (xs[i]! - mx) ** 2; }
  const pente = den ? num / den : 0;
  const r: { parSemaine: number; objectif?: Date } = { parSemaine: pente * 7 };
  if (pente < -0.005 && e.profile) {
    const restant = (poidsActuel(e) - e.profile.goalWeight) / -pente;
    if (restant > 0 && restant < 1500) r.objectif = new Date(maintenant + restant * 86_400_000);
  }
  return r;
}

export const kcalSeance = (etapes: { met: number; dur: number }[], kg: number) =>
  Math.round(etapes.reduce((t, s) => t + (s.met || 1.5) * kg * (s.dur / 3600), 0));

/** Dépense nette de la marche ≈ 0,4 kcal par kg et par 1000 pas. */
export const kcalPas = (pas: number, kgActuel: number) => Math.round(Math.max(0, pas) * kgActuel * 0.0004);

/** Calories brûlées un jour : séances + pas (sans compter deux fois les pas faits pendant une séance). */
export function brule(e: Etat, date: string) {
  const ses = e.sessions.filter(s => s.date === date);
  const seances = ses.reduce((t, s) => t + s.kcal, 0);
  const pasSeances = ses.reduce((t, s) => t + (s.steps || 0), 0);
  const pas = e.days[date]?.steps ?? 0;
  const marche = kcalPas(pas - pasSeances, poidsActuel(e));
  return { seances, marche, total: seances + marche };
}

export function serie(e: Etat, maintenant = new Date()): number {
  const dates = new Set(e.sessions.map(s => s.date));
  const d = new Date(maintenant);
  if (!dates.has(iso(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dates.has(iso(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const seancesSemaine = (e: Etat, maintenant = new Date()) => { const l = lundi(maintenant); return e.sessions.filter(s => s.date >= l); };
export function bruleSemaine(e: Etat, maintenant = new Date()): number {
  let total = 0;
  const d = lireDate(lundi(maintenant));
  for (let i = 0; i < 7; i++) { total += brule(e, iso(d)).total; d.setDate(d.getDate() + 1); }
  return total;
}
export const poidsMin = (e: Etat) => Math.min(e.profile?.startWeight ?? Infinity, ...e.weights.map(w => w.kg));

export const BADGES: { id: string; icone: string; label: string; test: (e: Etat) => boolean }[] = [
  { id: 'first', icone: '🎉', label: 'Première séance', test: e => e.sessions.length >= 1 },
  { id: 's10', icone: '💪', label: '10 séances', test: e => e.sessions.length >= 10 },
  { id: 's50', icone: '🦾', label: '50 séances', test: e => e.sessions.length >= 50 },
  { id: 'streak3', icone: '🔥', label: '3 jours de suite', test: e => serie(e) >= 3 },
  { id: 'week4', icone: '📅', label: '4 séances en 1 semaine', test: e => seancesSemaine(e).length >= 4 },
  { id: 'kg5', icone: '⚖️', label: '−5 kg', test: e => (e.profile?.startWeight ?? 0) - poidsMin(e) >= 5 },
  { id: 'kg10', icone: '🏅', label: '−10 kg', test: e => (e.profile?.startWeight ?? 0) - poidsMin(e) >= 10 },
  { id: 'kg20', icone: '🏆', label: '−20 kg', test: e => (e.profile?.startWeight ?? 0) - poidsMin(e) >= 20 },
  { id: 'goal', icone: '👑', label: 'Objectif atteint', test: e => !!e.profile && poidsMin(e) <= e.profile.goalWeight },
  { id: 'explorer', icone: '🧭', label: '20 exercices découverts', test: e => (e.vus?.length ?? 0) >= 20 },
];

export const estAujourdhui = (d: string) => d === aujourdhui();
