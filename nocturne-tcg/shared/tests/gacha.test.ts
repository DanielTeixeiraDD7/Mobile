import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REVERSE_CHANCE, DEFAULT_SLOTS, RARITIES, REVERSE_RARITIES, SET1_CARDS, atLeast, effectiveWeights, openPack, rateTable, rollReverse, seededRng,
  type BannerConfig, type PityState, type Rng,
} from '../src';

const pool = SET1_CARDS.map(c => ({ id: c.code, rarity: c.rarity }));
const cfg = (over: Partial<BannerConfig> = {}): BannerConfig => ({
  slots: DEFAULT_SLOTS, pool, featuredIds: [], featuredShare: 0, epicPityEvery: 10, legendaryPityAt: 100, ...over,
});
const zero: PityState = { sinceEpic: 0, sinceLegendary: 0 };
const alwaysZero: Rng = { int: () => 0 };

describe('set 1', () => {
  it('contient ~60 cartes uniques couvrant toutes les raretés', () => {
    expect(SET1_CARDS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(SET1_CARDS.map(c => c.code)).size).toBe(SET1_CARDS.length);
    for (const r of RARITIES) expect(SET1_CARDS.some(c => c.rarity === r)).toBe(true);
  });
  it('associe chaque forme humaine à une forme monstre plus rare', () => {
    const pairs = new Set(SET1_CARDS.filter(c => c.pairCode).map(c => c.pairCode));
    for (const p of pairs) {
      const h = SET1_CARDS.find(c => c.pairCode === p && c.form === 'HUMAN')!;
      const m = SET1_CARDS.find(c => c.pairCode === p && c.form === 'MONSTER')!;
      expect(h && m).toBeTruthy();
      expect(atLeast(m.rarity, h.rarity) && m.rarity !== h.rarity).toBe(true);
    }
  });
});

describe('tirage', () => {
  it('produit 5 cartes dont les raretés respectent les slots', () => {
    const rng = seededRng(42);
    for (let i = 0; i < 200; i++) {
      const r = openPack(cfg(), zero, rng);
      expect(r.cards).toHaveLength(5);
      r.cards.forEach(c => expect(DEFAULT_SLOTS[c.slot]![c.rarity]).toBeGreaterThan(0));
      r.cards.forEach(c => expect(pool.find(p => p.id === c.cardId)!.rarity).toBe(c.rarity));
    }
  });

  it('respecte les taux configurés (distribution statistique)', () => {
    const rng = seededRng(7);
    const n = 40_000;
    let epicPlus = 0;
    for (let i = 0; i < n; i++) {
      const r = openPack(cfg({ epicPityEvery: 10_000, legendaryPityAt: 10_000 }), zero, rng);
      if (atLeast(r.cards[4]!.rarity, 'EPIC')) epicPlus++;
    }
    expect(epicPlus / n).toBeCloseTo(0.24, 1);
  });

  it('ignore les raretés sans carte dans le pool', () => {
    const small = pool.filter(c => c.rarity === 'COMMON' || c.rarity === 'RARE');
    expect(effectiveWeights(DEFAULT_SLOTS[0]!, small).map(([r]) => r)).toEqual(['COMMON', 'RARE']);
  });

  it('privilégie les cartes mises en avant selon featuredShare', () => {
    const featured = pool.filter(c => c.rarity === 'LEGENDARY').slice(0, 1).map(c => c.id);
    const t = rateTable(cfg({ featuredIds: featured, featuredShare: 50_000 }));
    const legs = t.cards.filter(c => c.rarity === 'LEGENDARY');
    const f = legs.find(c => c.featured)!;
    const other = legs.find(c => !c.featured)!;
    expect(f.perPackPercent).toBeGreaterThan(other.perPackPercent * 3);
  });

  it('table des taux : chaque slot somme à 100 %', () => {
    for (const s of rateTable(cfg()).slots) expect(s.rates.reduce((a, r) => a + r.percent, 0)).toBeCloseTo(100, 2);
  });
});

describe('pitié', () => {
  it('garantit un Épique ou mieux au Xe booster', () => {
    const r = openPack(cfg(), { sinceEpic: 9, sinceLegendary: 9 }, alwaysZero);
    expect(r.pityTriggered).toBe('EPIC');
    expect(atLeast(r.cards[4]!.rarity, 'EPIC')).toBe(true);
    expect(r.pity.sinceEpic).toBe(0);
  });

  it('garantit un Légendaire au 100e booster', () => {
    const r = openPack(cfg(), { sinceEpic: 3, sinceLegendary: 99 }, alwaysZero);
    expect(r.pityTriggered).toBe('LEGENDARY');
    expect(atLeast(r.cards[4]!.rarity, 'LEGENDARY')).toBe(true);
    expect(r.pity).toEqual({ sinceEpic: 0, sinceLegendary: 0 });
  });

  it('incrémente les compteurs sans déclenchement', () => {
    const r = openPack(cfg(), { sinceEpic: 2, sinceLegendary: 50 }, alwaysZero);
    expect(r.pityTriggered).toBeNull();
    expect(r.pity).toEqual({ sinceEpic: 3, sinceLegendary: 51 });
  });

  it('jamais plus de X boosters sans Épique, jamais plus de 100 sans Légendaire (simulation)', () => {
    const rng = seededRng(99);
    let pity = zero, maxE = 0, maxL = 0, runE = 0, runL = 0;
    for (let i = 0; i < 5000; i++) {
      const r = openPack(cfg(), pity, rng);
      pity = r.pity;
      runE = r.cards.some(c => atLeast(c.rarity, 'EPIC')) ? 0 : runE + 1;
      runL = r.cards.some(c => atLeast(c.rarity, 'LEGENDARY')) ? 0 : runL + 1;
      maxE = Math.max(maxE, runE);
      maxL = Math.max(maxL, runL);
    }
    expect(maxE).toBeLessThan(10);
    expect(maxL).toBeLessThan(100);
  });

  it('utilise des poids de secours si le dernier slot n’a pas de rareté éligible', () => {
    const slots = [...DEFAULT_SLOTS.slice(0, 4), { COMMON: 1 }];
    const r = openPack(cfg({ slots }), { sinceEpic: 9, sinceLegendary: 0 }, alwaysZero);
    expect(atLeast(r.cards[4]!.rarity, 'EPIC')).toBe(true);
  });
});

describe('versions et reverse', () => {
  it('chaque version pointe vers une carte classique du même personnage', () => {
    for (const c of SET1_CARDS.filter(x => x.baseCode)) {
      const base = SET1_CARDS.find(x => x.code === c.baseCode)!;
      expect(base.variant).toBe('NORMAL');
      expect(c.faction).toBe(base.faction);
      expect(atLeast(c.rarity, base.rarity) && c.rarity !== base.rarity).toBe(true);
      expect(c.craftable).toBe(false);
    }
  });

  it('au plus une carte reverse, uniquement sur Commune/Peu commune/Rare', () => {
    const rng = seededRng(5);
    let hits = 0;
    for (let i = 0; i < 4000; i++) {
      const r = openPack(cfg(), zero, rng);
      const slot = rollReverse(r.cards, () => true, DEFAULT_REVERSE_CHANCE, rng);
      if (slot != null) {
        hits++;
        expect(REVERSE_RARITIES).toContain(r.cards[slot]!.rarity);
      }
    }
    expect(hits / 4000).toBeCloseTo(DEFAULT_REVERSE_CHANCE / 100_000, 1);
  });
});
