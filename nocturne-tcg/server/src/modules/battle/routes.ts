import { Router } from 'express';
import { randomInt } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { RARITIES, buildEnemyDeck, createBattle, playerStep, validateDeck, type BattleAction, type BattleCard, type BattleDTO, type BattleState, type CardLookup, type DeckDTO } from '@nocturne/shared';
import { lockUsers, prisma, transaction } from '../../db';
import { requireAuth, userOf } from '../../lib/auth';
import { bad, body, notFound } from '../../lib/http';
import { allCards } from '../catalog/routes';
import { credit } from '../economy/ledger';
import { track } from '../missions/service';

export const router = Router();

const WIN = { embers: 30, dust: 15 }, LOSS = { embers: 10, dust: 0 };
const REWARDED_PER_DAY = 5;

async function lookup(): Promise<CardLookup> {
  const cards = await allCards();
  return Object.fromEntries(cards.map(c => [c.id, { id: c.id, name: c.name, rarity: c.rarity, hp: c.hp, attack: c.attack, abilityKey: c.abilityKey, abilityValue: c.abilityValue } satisfies BattleCard]));
}

const deckDto = (d: { id: string; name: string; cards: { cardId: string; quantity: number }[] }): DeckDTO => ({
  id: d.id, name: d.name, cards: d.cards.flatMap(c => Array<string>(c.quantity).fill(c.cardId)),
});

const deckSchema = z.object({ name: z.string().trim().min(1).max(30), cards: z.array(z.string().max(40)).max(10) });

async function owned(userId: string) {
  return Object.fromEntries((await prisma.userCard.findMany({ where: { userId } })).map(c => [c.cardId, c.quantity]));
}

router.get('/decks', requireAuth, async (req, res) => {
  const decks = await prisma.deck.findMany({ where: { userId: userOf(req).id }, include: { cards: true }, orderBy: { updatedAt: 'desc' } });
  res.json(decks.map(deckDto));
});

router.put('/decks{/:id}', requireAuth, async (req, res) => {
  const userId = userOf(req).id;
  const input = body(deckSchema, req.body);
  const counts: Record<string, number> = {};
  for (const id of input.cards) counts[id] = (counts[id] ?? 0) + 1;
  const err = input.cards.length === 10 ? validateDeck(input.cards, await owned(userId)) : null;
  if (err) throw bad(err);
  const data = { name: input.name, cards: { create: Object.entries(counts).map(([cardId, quantity]) => ({ cardId, quantity })) } };
  const id = req.params.id as string | undefined;
  if (id) {
    const d = await prisma.deck.findFirst({ where: { id, userId } });
    if (!d) throw notFound('Deck introuvable');
    await prisma.deckCard.deleteMany({ where: { deckId: id } });
    res.json(deckDto(await prisma.deck.update({ where: { id }, data, include: { cards: true } })));
  } else {
    if ((await prisma.deck.count({ where: { userId } })) >= 10) throw bad('10 decks maximum');
    res.status(201).json(deckDto(await prisma.deck.create({ data: { ...data, userId }, include: { cards: true } })));
  }
});

router.delete('/decks/:id', requireAuth, async (req, res) => {
  await prisma.deck.deleteMany({ where: { id: String(req.params.id), userId: userOf(req).id } });
  res.status(204).end();
});

const battleDto = (b: { id: string; status: BattleDTO['status']; state: unknown }, reward: BattleDTO['reward'] = null): BattleDTO => ({ id: b.id, status: b.status, state: b.state as BattleState, reward });

router.get('/battles/active', requireAuth, async (req, res) => {
  const b = await prisma.battle.findFirst({ where: { userId: userOf(req).id, status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } });
  res.json(b ? battleDto(b) : null);
});

router.post('/battles', requireAuth, async (req, res) => {
  const userId = userOf(req).id;
  const { deckId } = body(z.object({ deckId: z.string().max(40) }), req.body);
  const deck = await prisma.deck.findFirst({ where: { id: deckId, userId }, include: { cards: true } });
  if (!deck) throw notFound('Deck introuvable');
  const cards = deckDto(deck).cards;
  const err = validateDeck(cards, await owned(userId));
  if (err) throw bad(err);
  const all = await lookup();
  const strength = cards.reduce((s, id) => s + RARITIES.indexOf(all[id]!.rarity), 0) / cards.length + 1;
  const seed = randomInt(2 ** 31);
  const state = createBattle(cards, buildEnemyDeck(Object.values(all), seed, strength), seed);
  await prisma.battle.updateMany({ where: { userId, status: 'ACTIVE' }, data: { status: 'ABANDONED' } });
  const b = await prisma.battle.create({ data: { userId, deckId, seed, state: state as unknown as Prisma.InputJsonValue } });
  res.status(201).json(battleDto(b));
});

router.post('/battles/:id/action', requireAuth, async (req, res) => {
  const userId = userOf(req).id;
  const action = body(z.object({ action: z.discriminatedUnion('type', [
    z.object({ type: z.literal('deploy'), handIndex: z.number().int().min(0).max(20) }),
    z.object({ type: z.literal('retreat'), benchIndex: z.number().int().min(0).max(2) }),
    z.object({ type: z.literal('attack') }),
    z.object({ type: z.literal('end') }),
  ]) }), req.body).action as BattleAction;
  const cards = await lookup();
  const out = await transaction(async tx => {
    await lockUsers(tx, userId);
    const b = await tx.battle.findFirst({ where: { id: String(req.params.id), userId } });
    if (!b) throw notFound('Combat introuvable');
    if (b.status !== 'ACTIVE') throw bad('Combat terminé');
    let state: BattleState;
    try { state = playerStep(b.state as unknown as BattleState, action, cards); } catch (e) { throw bad((e as Error).message); }
    const status = state.winner === 'player' ? 'WON' : state.winner ? 'LOST' : 'ACTIVE';
    let reward: BattleDTO['reward'] = null;
    if (status !== 'ACTIVE') {
      await track(tx, userId, 'BATTLE_PLAY');
      if (status === 'WON') await track(tx, userId, 'BATTLE_WIN');
      const today = new Date(new Date().toISOString().slice(0, 10));
      const done = await tx.battle.count({ where: { userId, status: { in: ['WON', 'LOST'] }, updatedAt: { gte: today } } });
      if (done < REWARDED_PER_DAY) {
        reward = status === 'WON' ? WIN : LOSS;
        await credit(tx, userId, 'EMBERS', reward.embers, 'MISSION', { refType: 'battle', refId: b.id, note: 'Combat' });
        await credit(tx, userId, 'DUST', reward.dust, 'MISSION', { refType: 'battle', refId: b.id, note: 'Combat' });
      }
    }
    const saved = await tx.battle.update({ where: { id: b.id }, data: { state: state as unknown as Prisma.InputJsonValue, status } });
    return battleDto(saved, reward);
  });
  res.json(out);
});

router.post('/battles/:id/abandon', requireAuth, async (req, res) => {
  await prisma.battle.updateMany({ where: { id: String(req.params.id), userId: userOf(req).id, status: 'ACTIVE' }, data: { status: 'ABANDONED' } });
  res.status(204).end();
});
