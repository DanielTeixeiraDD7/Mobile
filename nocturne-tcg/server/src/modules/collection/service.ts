import { CRAFT_COST, dustFor, type CollectionDTO } from '@nocturne/shared';
import { lockUsers, prisma, transaction } from '../../db';
import { bad, notFound } from '../../lib/http';
import { credit, debit } from '../economy/ledger';
import { passActive } from '../economy/pass';
import { track } from '../missions/service';

export async function collection(userId: string): Promise<CollectionDTO> {
  const rows = await prisma.userCard.findMany({ where: { userId, quantity: { gt: 0 } } });
  return Object.fromEntries(rows.map(r => [r.cardId, r.quantity]));
}

/** Convertit en poussière tous les exemplaires au-delà du premier (d'une carte ou de toute la collection). */
export function recycle(userId: string, cardId?: string, keep = 1) {
  return transaction(async tx => {
    await lockUsers(tx, userId);
    const sub = await tx.subscription.findUnique({ where: { userId } });
    const rows = await tx.userCard.findMany({ where: { userId, quantity: { gt: keep }, ...(cardId ? { cardId } : {}) }, include: { card: true } });
    if (!rows.length) throw bad('Aucun doublon à recycler');
    let dust = 0, count = 0;
    for (const r of rows) {
      const extra = r.quantity - keep;
      dust += extra * dustFor(r.card.rarity, passActive(sub));
      count += extra;
      await tx.userCard.update({ where: { userId_cardId: { userId, cardId: r.cardId } }, data: { quantity: keep } });
    }
    await credit(tx, userId, 'DUST', dust, 'DUPLICATE_RECYCLE', { note: `${count} doublon(s)` });
    await track(tx, userId, 'RECYCLE', 1);
    return { dust, count };
  });
}

export function craft(userId: string, cardId: string) {
  return transaction(async tx => {
    await lockUsers(tx, userId);
    const card = await tx.card.findUnique({ where: { id: cardId } });
    if (!card || !card.active) throw notFound('Carte introuvable');
    if (!card.craftable) throw bad('Cette carte ne peut pas être invoquée avec la poussière');
    const cost = CRAFT_COST[card.rarity];
    await debit(tx, userId, 'DUST', cost, 'CRAFT', { refType: 'card', refId: cardId });
    await tx.userCard.upsert({ where: { userId_cardId: { userId, cardId } }, create: { userId, cardId, quantity: 1 }, update: { quantity: { increment: 1 } } });
    await track(tx, userId, 'CRAFT', 1);
    return { cost };
  });
}
