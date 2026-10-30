import { Router } from 'express';
import { abilityText, type CardDTO } from '@nocturne/shared';
import { prisma } from '../../db';

export const router = Router();

let cache: { at: number; cards: CardDTO[] } | null = null;

export async function allCards(): Promise<CardDTO[]> {
  if (cache && Date.now() - cache.at < 30_000) return cache.cards;
  const rows = await prisma.card.findMany({ where: { active: true }, include: { set: true }, orderBy: [{ set: { releasedAt: 'asc' } }, { number: 'asc' }] });
  const cards = rows.map(c => ({
    id: c.id, code: c.code, set: c.set.code, number: c.number, name: c.name, rarity: c.rarity, faction: c.faction,
    hp: c.hp, attack: c.attack, abilityKey: c.abilityKey as CardDTO['abilityKey'], abilityName: c.abilityName, abilityValue: c.abilityValue,
    abilityText: abilityText(c.abilityKey as CardDTO['abilityKey'], c.abilityValue), lore: c.lore, silhouette: c.silhouette,
    variant: c.variant, form: c.form, pairCode: c.pairCode, craftable: c.craftable, imageUrl: c.imageUrl,
  }));
  cache = { at: Date.now(), cards };
  return cards;
}

export const invalidateCards = () => { cache = null; };

router.get('/cards', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60').json(await allCards());
});

router.get('/sets', async (_req, res) => {
  res.json(await prisma.cardSet.findMany({ orderBy: { releasedAt: 'asc' }, select: { code: true, name: true, releasedAt: true, _count: { select: { cards: true } } } }));
});
