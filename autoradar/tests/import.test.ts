import { describe, expect, it } from 'vitest';
import { calculer, estNeuveTva, HYPOTHESES_DEFAUT } from '../src/lib/import';

const oct2026 = new Date(2026, 9, 18);

describe('calcul import', () => {
  it('achat au Portugal : prix + registo (en ligne −15 %)', () => {
    const c = calculer({ pays: 'PT', prix: 20000, annee: 2022, km: 40000 }, HYPOTHESES_DEFAUT, oct2026);
    expect(c.total).toBe(20000 + 55.25);
    expect(c.alertes).toEqual([]);
  });
  it('import d’Allemagne : ISV et IUC à 0, frais officiels + estimations', () => {
    const c = calculer({ pays: 'DE', prix: 18000, annee: 2022, km: 40000 }, HYPOTHESES_DEFAUT, oct2026);
    const parLib = Object.fromEntries(c.lignes.map(l => [l.libelle, l.montant]));
    expect(parLib['ISV']).toBe(0);
    expect(parLib['IUC (taxe annuelle)']).toBe(0);
    expect(parLib['Inspection catégorie B']).toBe(93.52);
    expect(parLib['Matrícula portugaise (IMT)']).toBe(45);
    expect(parLib['Registo inicial (IRN)']).toBe(46.75);
    expect(c.total).toBe(18000 + 1480 + 93.52 + 45 + 46.75 + 20);
  });
  it('sans CoC : matrícula à 165 € et alerte', () => {
    const c = calculer({ pays: 'FR', prix: 15000, annee: 2021, km: 50000 }, { ...HYPOTHESES_DEFAUT, coc: false }, oct2026);
    expect(c.lignes.find(l => l.libelle.startsWith('Matrícula'))!.montant).toBe(165);
    expect(c.alertes.some(a => a.includes('CoC'))).toBe(true);
  });
  it('voiture « neuve » (≤ 6 000 km) : IVA 23 % au Portugal', () => {
    const c = calculer({ pays: 'BE', prix: 30000, annee: 2025, km: 4000 }, HYPOTHESES_DEFAUT, oct2026);
    expect(c.lignes.find(l => l.libelle.startsWith('IVA'))!.montant).toBe(6900);
  });
  it('règle des 6 mois / 6 000 km', () => {
    expect(estNeuveTva({ annee: 2020, km: 5000 }, oct2026)).toBe(true);
    expect(estNeuveTva({ annee: 2024, km: 30000 }, oct2026)).toBe(false);
    expect(estNeuveTva({ annee: 2025, km: 30000 }, oct2026)).toBe(false); // ≥ 7 mois en octobre
    expect(estNeuveTva({ annee: 2025, km: 30000 }, new Date(2026, 1, 1))).toBeNull(); // février : peut-être < 6 mois
    expect(estNeuveTva({ annee: 2026, km: 9000 }, oct2026)).toBeNull();
    expect(estNeuveTva({ annee: null, km: null }, oct2026)).toBeNull();
  });
  it('sans prix : pas de total', () => {
    expect(calculer({ pays: 'DE', prix: null, annee: 2022, km: 1 }).total).toBeNull();
  });
});
