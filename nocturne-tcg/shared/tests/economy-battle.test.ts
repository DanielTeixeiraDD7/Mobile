import { describe, expect, it } from 'vitest';
import {
  SET1_CARDS, abilityText, ageOn, applyAction, buildEnemyDeck, consumeFreePack, createBattle, dustFor, freePackState,
  legalActions, playerStep, validateDeck, weekKey, type BattleCard, type CardLookup,
} from '../src';

const H = 3_600_000;

describe('boosters gratuits', () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  it('recharge 1 booster toutes les 12 h, plafonné à 2', () => {
    expect(freePackState(0, t0, new Date(t0.getTime() + 11 * H), 2).available).toBe(0);
    expect(freePackState(0, t0, new Date(t0.getTime() + 12 * H), 2).available).toBe(1);
    const full = freePackState(0, t0, new Date(t0.getTime() + 100 * H), 2);
    expect(full).toMatchObject({ available: 2, nextAt: null });
  });
  it('conserve la progression partielle après consommation', () => {
    const c = consumeFreePack(0, t0, new Date(t0.getTime() + 18 * H), 2)!;
    expect(c.stored).toBe(0);
    expect(freePackState(c.stored, c.updatedAt, new Date(t0.getTime() + 24 * H), 2).available).toBe(1);
  });
  it('refuse sans charge', () => {
    expect(consumeFreePack(0, t0, new Date(t0.getTime() + H), 2)).toBeNull();
  });
});

describe('économie', () => {
  it('bonus de poussière du Pass', () => {
    expect(dustFor('RARE', false)).toBe(30);
    expect(dustFor('RARE', true)).toBe(38);
  });
  it('âge exact', () => {
    expect(ageOn(new Date('2008-10-31'), new Date('2026-10-30'))).toBe(17);
    expect(ageOn(new Date('2008-10-30'), new Date('2026-10-30'))).toBe(18);
  });
  it('semaine ISO', () => {
    expect(weekKey(new Date('2026-01-01T12:00:00Z'))).toBe('2026-W01');
    expect(weekKey(new Date('2026-10-30T12:00:00Z'))).toBe('2026-W44');
  });
  it('textes de capacité', () => {
    for (const c of SET1_CARDS) expect(abilityText(c.abilityKey, c.abilityValue)).toMatch(/\d/);
  });
});

describe('combat', () => {
  const cards: CardLookup = {};
  for (const c of SET1_CARDS) cards[c.code] = { id: c.code, name: c.name, rarity: c.rarity, hp: c.hp, attack: c.attack, abilityKey: c.abilityKey, abilityValue: c.abilityValue };
  const pool = Object.values(cards);
  const deck = buildEnemyDeck(pool, 1, 2);

  it('valide les decks', () => {
    expect(deck).toHaveLength(10);
    const owned = Object.fromEntries(deck.map(id => [id, 2]));
    expect(validateDeck(deck, owned)).toBeNull();
    expect(validateDeck(deck.slice(0, 9), owned)).toMatch(/10/);
    expect(validateDeck([...Array(10)].map(() => deck[0]!), { [deck[0]!]: 10 })).toMatch(/Maximum/);
  });

  it('interdit l’attaque au premier tour', () => {
    let s = createBattle(deck, buildEnemyDeck(pool, 2, 2), 5);
    s = applyAction(s, { type: 'deploy', handIndex: 0 }, cards);
    expect(legalActions(s, cards).some(a => a.type === 'attack')).toBe(false);
  });

  it('une partie IA contre IA se termine toujours', () => {
    for (let seed = 1; seed <= 30; seed++) {
      let s = createBattle(buildEnemyDeck(pool, seed, 3), buildEnemyDeck(pool, seed + 100, 3), seed);
      for (let i = 0; i < 200 && !s.winner; i++) {
        const acts = legalActions(s, cards);
        const act = acts.find(a => a.type === 'deploy') ?? acts.find(a => a.type === 'attack') ?? { type: 'end' as const };
        s = playerStep(s, act, cards);
      }
      expect(s.winner).not.toBeNull();
    }
  });

  it('est déterministe pour une même graine', () => {
    const run = () => {
      let s = createBattle(deck, deck, 77);
      for (let i = 0; i < 50 && !s.winner; i++) {
        const acts = legalActions(s, cards);
        s = playerStep(s, acts.find(a => a.type === 'deploy') ?? acts.find(a => a.type === 'attack') ?? { type: 'end' }, cards);
      }
      return s;
    };
    expect(run()).toEqual(run());
  });
});
