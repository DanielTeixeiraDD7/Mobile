import { describe, expect, it } from 'vitest';
import { charger, lireSauvegarde, normaliser, CLE, type Etat } from '../src/core/etat';
import { brule, nutrition, serie, tendance, kcalSeance } from '../src/core/calculs';
import { construire, duree, materielSeance, exercicesSeance, DUREE_DEMO } from '../src/core/seance';
import { EXERCICES } from '../src/core/exercices';
import { SEANCES, ECHAUFFEMENT, RETOUR_CALME, MOBILITE } from '../src/core/programmes';

// Sauvegarde telle que l'écrit FitMaison v1.
const v1 = {
  profile: { name: 'Dani', sex: 'h', age: 30, height: 178, goalWeight: 99, activity: 1.2, startWeight: 125, level: 1, createdAt: '2026-09-01' },
  weights: [{ date: '2026-09-01', kg: 125 }, { date: '2026-09-15', kg: 122.4 }, { date: '2026-09-29', kg: 120.1 }],
  sessions: [{ date: '2026-10-17', type: 'full', level: 1, duration: 1100, kcal: 210, feel: 2 }, { date: '2026-10-18', type: 'marche', level: 1, duration: 1400, kcal: 180, feel: 1, steps: 2100 }],
  days: { '2026-10-18': { water: 6, steps: 9000, habits: { sommeil: true }, food: [{ label: 'Repas', kcal: 600 }] } },
  settings: { voice: true, sound: false, vibrate: true },
};

describe('données (compatibles v1)', () => {
  it('relit une sauvegarde v1 sans rien perdre et complète les réglages', () => {
    const store = { getItem: (k: string) => (k === CLE ? JSON.stringify(v1) : null) };
    const e = charger(store);
    expect(e.profile?.name).toBe('Dani');
    expect(e.weights).toHaveLength(3);
    expect(e.days['2026-10-18']!.steps).toBe(9000);
    expect(e.settings).toMatchObject({ voice: true, sound: false, vibrate: true, demo: true });
  });
  it('import : refuse ce qui n’est pas une sauvegarde FitMaison', () => {
    expect(() => lireSauvegarde('{"foo":1}')).toThrow();
    expect(() => lireSauvegarde('pas du json')).toThrow();
    expect(lireSauvegarde(JSON.stringify(v1)).sessions).toHaveLength(2);
  });
});

describe('calculs (mêmes formules que la v1)', () => {
  const e = normaliser(v1 as unknown as Etat);
  it('nutrition Mifflin-St Jeor', () => {
    const n = nutrition(e);
    // BMR = 10×120,1 + 6,25×178 − 5×30 + 5 = 2168,5 ; TDEE ×1,2 = 2602
    expect(n.bmr).toBe(2169);
    expect(n.tdee).toBe(2602);
    expect(n.cible).toBe(1950);
    expect(n.proteines).toBe(158);
    expect(n.eau).toBe(3.5);
  });
  it('tendance et date estimée', () => {
    const t = tendance(e, new Date('2026-10-01').getTime())!;
    expect(t.parSemaine).toBeCloseTo(-1.2, 1);
    expect(t.objectif).toBeInstanceOf(Date);
  });
  it('calories brûlées : séance + pas, sans compter deux fois les pas de la séance', () => {
    const b = brule(e, '2026-10-18');
    expect(b.seances).toBe(180);
    expect(b.marche).toBe(Math.round((9000 - 2100) * 120.1 * 0.0004));
  });
  it('série de jours', () => { expect(serie(e, new Date('2026-10-18T20:00:00'))).toBe(2); });
  it('kcal d’une séance', () => { expect(kcalSeance([{ met: 5, dur: 3600 }], 100)).toBe(500); });
});

describe('séances', () => {
  it('mêmes durées que la v1', () => {
    expect(duree(construire('full', 1))).toBe(4 * 45 + 6 * 30 * 2 + 5 * 30 * 2 + 60 + 4 * 30);
    expect(duree(construire('marche', 1))).toBe(120 + 4 * 300 + 60);
    expect(duree(construire('mobilite', 2))).toBe(MOBILITE.length * 60);
  });
  it('tous les exercices des programmes existent et ont une animation', () => {
    const ids = new Set([...ECHAUFFEMENT, ...RETOUR_CALME, ...MOBILITE, 'marche_normale', 'marche_rapide', ...Object.values(SEANCES).flatMap(s => (s.circuit ? Object.values(s.circuit).flat() : []))]);
    for (const id of ids) { expect(EXERCICES[id], id).toBeDefined(); expect(EXERCICES[id]!.anim.poses.length).toBeGreaterThan(0); }
  });
  it('démo de 15 s avant chaque exercice jamais fait (une seule fois)', () => {
    const s = construire('full', 1, { demo: true, vus: ['squat_chaise'] });
    const demos = s.filter(x => x.phase === 'demo');
    expect(demos.map(d => d.cle)).toEqual(['pompes_mur', 'marche_genoux', 'pont', 'bird_dog', 'planche_genoux']);
    expect(demos.every(d => d.dur === DUREE_DEMO)).toBe(true);
    expect(s.indexOf(demos[0]!)).toBe(s.findIndex(x => x.cle === 'pompes_mur' && x.phase === 'work') - 1);
  });
  it('remplacement par la version plus facile', () => {
    const s = construire('full', 2, { remplacements: { squat: 'squat_chaise' } });
    expect(s.some(x => x.cle === 'squat')).toBe(false);
    expect(s.filter(x => x.cle === 'squat_chaise' && x.phase === 'work')).toHaveLength(3);
  });
  it('matériel et exercices de la séance', () => {
    const s = construire('renfo', 1);
    expect(materielSeance(s).sort()).toEqual(['mur', 'marche', 'porte', 'tapis'].sort());
    expect(exercicesSeance(s)).toContain('chaise_mur');
  });
  it('chaque exercice a un guide complet et une version facile valide', () => {
    for (const e of Object.values(EXERCICES)) {
      expect(e.etapes.length, e.id).toBeGreaterThan(0);
      expect(e.cles.length, e.id).toBeGreaterThan(0);
      expect(e.erreurs.length, e.id).toBeGreaterThan(0);
      expect(e.sensation, e.id).toBeTruthy();
      if (e.versionFacile) expect(EXERCICES[e.versionFacile], `${e.id} → ${e.versionFacile}`).toBeDefined();
    }
  });
});
