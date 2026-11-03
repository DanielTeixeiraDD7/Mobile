import { seededRng } from './gacha';
import type { AbilityKey, Rarity } from './types';

export const DECK_SIZE = 10;
export const MAX_COPIES = 2;
export const BENCH_SIZE = 2;
export const POINTS_TO_WIN = 3;
export const HAND_START = 3;
export const MAX_TURNS = 40;

export interface BattleCard { id: string; name: string; rarity: Rarity; hp: number; attack: number; abilityKey: AbilityKey; abilityValue: number }

export interface Unit { uid: string; cardId: string; name: string; rarity: Rarity; maxHp: number; hp: number; atk: number; key: AbilityKey; value: number; poison: number; stunned: boolean }

export type SideId = 'player' | 'enemy';

export interface Side { deck: string[]; hand: string[]; active: Unit | null; bench: Unit[]; points: number; deployed: boolean; retreated: boolean }

export interface BattleEvent { side: SideId; kind: 'draw' | 'deploy' | 'attack' | 'ko' | 'ability' | 'stun' | 'poison' | 'regen' | 'promote' | 'retreat' | 'turn' | 'end'; text: string; amount?: number; target?: string }

export interface BattleState {
  rng: number;
  turn: number;
  current: SideId;
  sides: Record<SideId, Side>;
  winner: SideId | 'draw' | null;
  events: BattleEvent[];
  uid: number;
}

export type BattleAction = { type: 'deploy'; handIndex: number } | { type: 'retreat'; benchIndex: number } | { type: 'attack' } | { type: 'end' };

export type CardLookup = Record<string, BattleCard>;

const other = (s: SideId): SideId => (s === 'player' ? 'enemy' : 'player');
const koPoints = (r: Rarity) => (r === 'LEGENDARY' || r === 'SECRET' ? 2 : 1);

export function validateDeck(cardIds: string[], owned: Record<string, number>): string | null {
  if (cardIds.length !== DECK_SIZE) return `Un deck contient exactement ${DECK_SIZE} cartes.`;
  const counts: Record<string, number> = {};
  for (const id of cardIds) counts[id] = (counts[id] ?? 0) + 1;
  for (const [id, n] of Object.entries(counts)) {
    if (n > MAX_COPIES) return `Maximum ${MAX_COPIES} exemplaires par carte.`;
    if ((owned[id] ?? 0) < n) return 'Tu ne possèdes pas assez d’exemplaires de cette carte.';
  }
  return null;
}

function shuffle(ids: string[], rng: ReturnType<typeof seededRng>): string[] {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function createBattle(playerDeck: string[], enemyDeck: string[], seed: number): BattleState {
  const rng = seededRng(seed);
  const side = (deck: string[]): Side => {
    const d = shuffle(deck, rng);
    return { deck: d.slice(HAND_START), hand: d.slice(0, HAND_START), active: null, bench: [], points: 0, deployed: false, retreated: false };
  };
  const s: BattleState = { rng: 0, turn: 1, current: 'player', sides: { player: side(playerDeck), enemy: side(enemyDeck) }, winner: null, events: [], uid: 0 };
  s.rng = rng.state();
  s.events.push({ side: 'player', kind: 'turn', text: 'Le combat commence. À toi de jouer !' });
  return s;
}

function mkUnit(s: BattleState, c: BattleCard): Unit {
  return { uid: `u${++s.uid}`, cardId: c.id, name: c.name, rarity: c.rarity, maxHp: c.hp, hp: c.hp, atk: c.attack, key: c.abilityKey, value: c.abilityValue, poison: 0, stunned: false };
}

function ko(s: BattleState, owner: SideId, u: Unit) {
  const side = s.sides[owner];
  const foe = s.sides[other(owner)];
  foe.points += koPoints(u.rarity);
  s.events.push({ side: owner, kind: 'ko', text: `${u.name} est vaincu(e) (+${koPoints(u.rarity)} pt).`, target: u.uid });
  if (side.active?.uid === u.uid) side.active = null;
  side.bench = side.bench.filter(b => b.uid !== u.uid);
  if (u.key === 'LAST_WORDS' && foe.active) {
    s.events.push({ side: owner, kind: 'ability', text: `Dernier souffle de ${u.name} : ${u.value} dégâts.`, amount: u.value, target: foe.active.uid });
    damage(s, other(owner), foe.active, u.value);
  }
  promote(s, owner);
}

function promote(s: BattleState, owner: SideId) {
  const side = s.sides[owner];
  if (!side.active && side.bench.length) {
    side.active = side.bench.shift()!;
    s.events.push({ side: owner, kind: 'promote', text: `${side.active.name} passe en première ligne.`, target: side.active.uid });
  }
}

function damage(s: BattleState, owner: SideId, u: Unit, amount: number) {
  u.hp = Math.max(0, u.hp - amount);
  if (u.hp === 0) ko(s, owner, u);
}

function checkWinner(s: BattleState) {
  if (s.winner) return;
  for (const id of ['player', 'enemy'] as SideId[]) {
    if (s.sides[id].points >= POINTS_TO_WIN) s.winner = id;
  }
  if (s.winner) return;
  for (const id of ['player', 'enemy'] as SideId[]) {
    const sd = s.sides[id];
    if (!sd.active && !sd.bench.length && !sd.hand.length && !sd.deck.length) s.winner = other(id);
  }
  if (!s.winner && s.turn > MAX_TURNS) {
    const p = s.sides.player.points, e = s.sides.enemy.points;
    s.winner = p === e ? 'draw' : p > e ? 'player' : 'enemy';
  }
  if (s.winner) s.events.push({ side: s.winner === 'draw' ? 'player' : s.winner, kind: 'end', text: s.winner === 'draw' ? 'Égalité.' : s.winner === 'player' ? 'Victoire !' : 'Défaite…' });
}

function startTurn(s: BattleState) {
  const id = s.current;
  const side = s.sides[id];
  side.deployed = false;
  side.retreated = false;
  s.events.push({ side: id, kind: 'turn', text: id === 'player' ? `Tour ${s.turn} : à toi.` : `Tour ${s.turn} : l’adversaire joue.` });
  const a = side.active;
  if (a && a.poison > 0) {
    s.events.push({ side: id, kind: 'poison', text: `${a.name} subit ${a.poison} dégâts de poison.`, amount: a.poison, target: a.uid });
    damage(s, id, a, a.poison);
  }
  if (side.active && side.active.key === 'REGEN' && side.active.hp < side.active.maxHp) {
    const u = side.active;
    const heal = Math.min(u.value, u.maxHp - u.hp);
    u.hp += heal;
    s.events.push({ side: id, kind: 'regen', text: `${u.name} régénère ${heal} PV.`, amount: heal, target: u.uid });
  }
  const drawn = side.deck.shift();
  if (drawn) {
    side.hand.push(drawn);
    s.events.push({ side: id, kind: 'draw', text: id === 'player' ? 'Tu pioches une carte.' : 'L’adversaire pioche.' });
  }
  checkWinner(s);
}

function endTurn(s: BattleState) {
  if (s.winner) return;
  s.current = other(s.current);
  s.turn++;
  checkWinner(s);
  if (!s.winner) startTurn(s);
}

export function legalActions(s: BattleState, cards: CardLookup): BattleAction[] {
  if (s.winner) return [];
  const side = s.sides[s.current];
  const acts: BattleAction[] = [{ type: 'end' }];
  if (!side.deployed && (!side.active || side.bench.length < BENCH_SIZE)) side.hand.forEach((id, handIndex) => cards[id] && acts.push({ type: 'deploy', handIndex }));
  if (!side.retreated && side.active) side.bench.forEach((_, benchIndex) => acts.push({ type: 'retreat', benchIndex }));
  if (side.active && s.sides[other(s.current)].active && !(s.turn === 1)) acts.push({ type: 'attack' });
  return acts;
}

export function applyAction(state: BattleState, action: BattleAction, cards: CardLookup): BattleState {
  const s: BattleState = structuredClone(state);
  s.events = [];
  if (s.winner) throw new Error('Combat terminé');
  const id = s.current;
  const side = s.sides[id];
  const foeId = other(id);
  const foe = s.sides[foeId];
  const rng = seededRng(s.rng);

  switch (action.type) {
    case 'deploy': {
      if (side.deployed) throw new Error('Une seule invocation par tour');
      const cardId = side.hand[action.handIndex];
      const c = cardId ? cards[cardId] : undefined;
      if (!c) throw new Error('Carte introuvable');
      if (side.active && side.bench.length >= BENCH_SIZE) throw new Error('Banc complet');
      side.hand.splice(action.handIndex, 1);
      const u = mkUnit(s, c);
      if (!side.active) side.active = u;
      else side.bench.push(u);
      side.deployed = true;
      s.events.push({ side: id, kind: 'deploy', text: `${u.name} entre en jeu.`, target: u.uid });
      if (u.key === 'RALLY' && side.active && side.active.uid !== u.uid) {
        side.active.atk += u.value;
        s.events.push({ side: id, kind: 'ability', text: `Ralliement : ${side.active.name} gagne +${u.value} ATQ.`, amount: u.value, target: side.active.uid });
      }
      break;
    }
    case 'retreat': {
      if (side.retreated || !side.active) throw new Error('Repli impossible');
      const b = side.bench[action.benchIndex];
      if (!b) throw new Error('Carte de banc introuvable');
      side.bench[action.benchIndex] = side.active;
      side.active = b;
      side.retreated = true;
      s.events.push({ side: id, kind: 'retreat', text: `${b.name} prend la première ligne.`, target: b.uid });
      break;
    }
    case 'attack': {
      const a = side.active, t = foe.active;
      if (!a || !t) throw new Error('Aucune cible');
      if (s.turn === 1) throw new Error('Pas d’attaque au premier tour');
      if (a.stunned) {
        a.stunned = false;
        s.events.push({ side: id, kind: 'stun', text: `${a.name} est paralysé(e) par l’effroi et ne peut pas attaquer.`, target: a.uid });
      } else {
        let dmg = a.atk + (a.key === 'FURY' && a.hp * 2 < a.maxHp ? a.value : 0);
        if (t.key === 'SHIELD') dmg -= t.value;
        dmg = Math.max(1, dmg);
        s.events.push({ side: id, kind: 'attack', text: `${a.name} attaque ${t.name} : ${dmg} dégâts.`, amount: dmg, target: t.uid });
        const splash = a.key === 'SPLASH' ? [...foe.bench] : [];
        if (a.key === 'DRAIN' && a.hp < a.maxHp) {
          const heal = Math.min(a.value, a.maxHp - a.hp);
          a.hp += heal;
          s.events.push({ side: id, kind: 'ability', text: `${a.name} draine ${heal} PV.`, amount: heal, target: a.uid });
        }
        if (a.key === 'CURSE') {
          t.atk = Math.max(5, t.atk - a.value);
          s.events.push({ side: id, kind: 'ability', text: `Malédiction : ATQ de ${t.name} réduite à ${t.atk}.`, target: t.uid });
        }
        if (a.key === 'POISON') {
          t.poison = a.value;
          s.events.push({ side: id, kind: 'ability', text: `${t.name} est empoisonné(e).`, target: t.uid });
        }
        if (a.key === 'STUN' && rng.int(100) < a.value) {
          t.stunned = true;
          s.events.push({ side: id, kind: 'ability', text: `Effroi : ${t.name} est paralysé(e).`, target: t.uid });
        }
        damage(s, foeId, t, dmg);
        for (const b of splash) {
          if (!s.sides[foeId].bench.some(x => x.uid === b.uid)) continue;
          s.events.push({ side: id, kind: 'ability', text: `Onde : ${b.name} subit ${a.value} dégâts.`, amount: a.value, target: b.uid });
          damage(s, foeId, b, a.value);
        }
      }
      s.rng = rng.state();
      checkWinner(s);
      endTurn(s);
      return s;
    }
    case 'end':
      endTurn(s);
      return s;
  }
  s.rng = rng.state();
  checkWinner(s);
  return s;
}

/** IA simple : invoque la meilleure carte, se replie si en danger, attaque. */
export function aiTurn(state: BattleState, cards: CardLookup): BattleState {
  let s = state;
  const me = s.current;
  const power = (id: string) => (cards[id] ? cards[id]!.hp + cards[id]!.attack * 2 : 0);
  for (let guard = 0; guard < 6 && !s.winner && s.current === me; guard++) {
    const side = s.sides[me];
    const acts = legalActions(s, cards);
    const deploys = acts.filter((a): a is Extract<BattleAction, { type: 'deploy' }> => a.type === 'deploy');
    if (deploys.length) {
      const best = deploys.reduce((x, y) => (power(side.hand[y.handIndex]!) > power(side.hand[x.handIndex]!) ? y : x));
      s = merge(s, applyAction(s, best, cards));
      continue;
    }
    const a = side.active;
    const healthier = side.bench.findIndex(b => a && b.hp > a.hp * 2);
    if (a && !side.retreated && a.hp * 4 < a.maxHp && healthier >= 0) {
      s = merge(s, applyAction(s, { type: 'retreat', benchIndex: healthier }, cards));
      continue;
    }
    const act: BattleAction = acts.some(x => x.type === 'attack') ? { type: 'attack' } : { type: 'end' };
    s = merge(s, applyAction(s, act, cards));
  }
  return s;
}

function merge(prev: BattleState, next: BattleState): BattleState {
  return { ...next, events: [...prev.events, ...next.events] };
}

/** Action joueur puis tour complet de l'IA ; renvoie l'état et tous les événements. */
export function playerStep(state: BattleState, action: BattleAction, cards: CardLookup): BattleState {
  if (state.current !== 'player') throw new Error('Ce n’est pas ton tour');
  let s = applyAction(state, action, cards);
  if (!s.winner && s.current === 'enemy') s = merge(s, aiTurn({ ...s, events: [] }, cards));
  return s;
}

/** Deck adverse : 10 cartes tirées pondérées vers la puissance du joueur. */
export function buildEnemyDeck(pool: BattleCard[], seed: number, strength: number): string[] {
  const rng = seededRng(seed ^ 0x9e3779b9);
  const order = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
  const maxRank = Math.min(order.length - 1, Math.max(1, Math.round(strength)));
  const eligible = pool.filter(c => order.indexOf(c.rarity) >= 0 && order.indexOf(c.rarity) <= maxRank);
  const deck: string[] = [];
  const counts: Record<string, number> = {};
  for (let guard = 0; deck.length < DECK_SIZE && eligible.length && guard < 1000; guard++) {
    const c = eligible[rng.int(eligible.length)]!;
    if ((counts[c.id] ?? 0) >= MAX_COPIES) continue;
    counts[c.id] = (counts[c.id] ?? 0) + 1;
    deck.push(c.id);
  }
  return deck;
}
