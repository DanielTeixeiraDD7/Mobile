import { describe, expect, it, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBudgetStore } from '../src/stores/budget';
import * as core from '../src/core/store.js';
import * as db from '../src/core/db.js';
import { rythme, cumul, joursEcoules, joursSansDepense, regulieres, variationCategorie } from '../src/lib/insights';
import { recents, notesConnues } from '../src/lib/saisie';

const tx = (date: string, amount: number, categoryId = 'groceries', note = '', type: 'expense' | 'income' = 'expense') =>
  ({ id: crypto.randomUUID(), type, amount, categoryId, date, note, createdAt: Date.parse(date) });

describe('pont Pinia ↔ cœur v1 (IndexedDB)', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await core.replaceAll({});
  });
  it('écrit dans IndexedDB et rafraîchit les computed', async () => {
    const b = useBudgetStore();
    await b.demarrer();
    const avant = b.tick;
    await b.enregistrer({ type: 'expense', amount: 1250, categoryId: 'groceries', date: '2026-10-05', note: 'Pain' });
    expect(b.tick).toBeGreaterThan(avant);
    expect(b.transactions.some(t => t.note === 'Pain')).toBe(true);
    // Relu depuis IndexedDB : aucun Proxy Vue n'y a été écrit.
    const stockees = await db.getAll('transactions');
    expect(stockees.find((t: { note: string }) => t.note === 'Pain').amount).toBe(1250);
  });
  it('suppression puis restauration (annuler)', async () => {
    const b = useBudgetStore();
    await b.demarrer();
    const t = await b.enregistrer({ type: 'expense', amount: 500, categoryId: 'transport', date: '2026-10-06', note: 'Bus' });
    await b.supprimer(t.id);
    expect(b.transactions.find(x => x.id === t.id)).toBeUndefined();
    await b.restaurer(t);
    expect((await db.get('transactions', t.id)).note).toBe('Bus');
  });
  it('réglage local « theme » stocké sans casser les réglages v1', async () => {
    const b = useBudgetStore();
    await b.demarrer();
    await b.reglage('theme', 'sombre');
    await b.reglage('monthlyBudget', 150000);
    const s = await db.getAll('settings');
    expect(s.find((x: { key: string }) => x.key === 'theme').value).toBe('sombre');
    expect(s.find((x: { key: string }) => x.key === 'monthlyBudget').value).toBe(150000);
  });
});

describe('analyses', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await core.replaceAll({
      transactions: [
        tx('2026-09-02', 3000, 'groceries', 'Lidl'), tx('2026-09-10', 2000), tx('2026-09-20', 50000, 'rent', 'Loyer'),
        tx('2026-08-03', 3000, 'groceries', 'Lidl'), tx('2026-08-20', 50000, 'rent', 'Loyer'),
        tx('2026-10-01', 1000, 'groceries', 'Lidl'), tx('2026-10-03', 4000), tx('2026-10-10', 50000, 'rent', 'Loyer'),
        tx('2026-10-05', 200000, 'salary', 'Salaire', 'income'),
      ],
    });
  });
  it('jours écoulés et cumul', () => {
    expect(joursEcoules('2026-10', '2026-10-18')).toBe(18);
    expect(joursEcoules('2026-09', '2026-10-18')).toBe(30);
    expect(joursEcoules('2026-11', '2026-10-18')).toBe(0);
    const c = cumul('2026-10', 'expense', 10);
    expect(c[0]).toBe(1000); expect(c[2]).toBe(5000); expect(c[9]).toBe(55000);
  });
  it('rythme : projection, reste par jour, comparaison à la même date', () => {
    const r = rythme('2026-10', 100000, '2026-10-10');
    expect(r.depense).toBe(55000);
    expect(r.projection).toBe(55000 + (5000 / 10) * 21); // loyer exclu du rythme
    expect(r.resteParJour).toBe(Math.floor(45000 / 22));
    expect(r.memeDateAvant).toBe(5000); // septembre jusqu'au 10
    expect(r.ecartMemeDate).toBe(10);
  });
  it('jours sans dépense, régulières, variation', () => {
    expect(joursSansDepense('2026-10', '2026-10-10')).toBe(7);
    const reg = regulieres('2026-10');
    expect(reg.map(r => r.note)).toEqual(['Loyer', 'Lidl']);
    expect(variationCategorie('2026-10', '2026-10-10')).toBeNull(); // écarts < 10 €
  });
  it('saisies récentes et notes connues', () => {
    const all = core.state.transactions;
    expect(recents(all, 'expense').map(t => `${t.note}:${t.amount}`)).toEqual(['Loyer:50000', 'Lidl:1000', 'Lidl:3000']);
    expect(notesConnues(all)[0]).toBe('Lidl');
  });
});
