import type { Prisma } from '@prisma/client';
import type { TradeCreateInput, TradeDTO } from '@nocturne/shared';
import { lockUsers, prisma, transaction, type Tx } from '../../db';
import { bad, forbidden, notFound } from '../../lib/http';
import { track } from '../missions/service';

const include = { items: true, proposer: { select: { id: true, displayName: true } }, receiver: { select: { id: true, displayName: true } } } satisfies Prisma.TradeInclude;
type Full = Prisma.TradeGetPayload<{ include: typeof include }>;

const dto = (t: Full): TradeDTO => ({
  id: t.id, status: t.status, proposer: t.proposer, receiver: t.receiver, message: t.message,
  give: t.items.filter(i => i.side === 'PROPOSER').map(i => ({ cardId: i.cardId, quantity: i.quantity })),
  get: t.items.filter(i => i.side === 'RECEIVER').map(i => ({ cardId: i.cardId, quantity: i.quantity })),
  createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
});

async function assertOwns(tx: Tx, userId: string, items: { cardId: string; quantity: number }[], who: string) {
  const rows = await tx.userCard.findMany({ where: { userId, cardId: { in: items.map(i => i.cardId) } } });
  for (const i of items) {
    if ((rows.find(r => r.cardId === i.cardId)?.quantity ?? 0) < i.quantity) throw bad(`${who} ne possède plus toutes les cartes de l’échange`);
  }
}

const merge = (items: { cardId: string; quantity: number }[]) => {
  const m = new Map<string, number>();
  for (const i of items) m.set(i.cardId, (m.get(i.cardId) ?? 0) + i.quantity);
  return [...m].map(([cardId, quantity]) => ({ cardId, quantity }));
};

export async function list(userId: string): Promise<TradeDTO[]> {
  const rows = await prisma.trade.findMany({ where: { OR: [{ proposerId: userId }, { receiverId: userId }] }, include, orderBy: { updatedAt: 'desc' }, take: 100 });
  return rows.map(dto);
}

export async function create(userId: string, input: TradeCreateInput): Promise<TradeDTO> {
  const receiver = await prisma.user.findFirst({ where: { displayName: { equals: input.receiverName, mode: 'insensitive' }, deletedAt: null } });
  if (!receiver) throw notFound('Joueur introuvable');
  if (receiver.id === userId) throw bad('Tu ne peux pas échanger avec toi-même');
  if (!receiver.emailVerifiedAt || receiver.blockedAt) throw bad('Ce joueur ne peut pas échanger pour le moment');
  const give = merge(input.give), get = merge(input.get);
  if (!give.length || !get.length) throw bad('Un échange se fait carte contre carte');
  const ids = [...give, ...get].map(i => i.cardId);
  const cards = await prisma.card.findMany({ where: { id: { in: ids }, active: true } });
  if (cards.length !== new Set(ids).size) throw bad('Carte inconnue');
  return transaction(async tx => {
    await assertOwns(tx, userId, give, 'Tu');
    await assertOwns(tx, receiver.id, get, receiver.displayName);
    const pending = await tx.trade.count({ where: { proposerId: userId, status: { in: ['PENDING', 'ACCEPTED'] } } });
    if (pending >= 20) throw bad('Trop d’échanges en attente');
    const t = await tx.trade.create({
      data: {
        proposerId: userId, receiverId: receiver.id, message: input.message || null,
        items: { create: [...give.map(i => ({ ...i, side: 'PROPOSER' as const })), ...get.map(i => ({ ...i, side: 'RECEIVER' as const }))] },
      },
      include,
    });
    return dto(t);
  });
}

type Act = 'accept' | 'confirm' | 'decline' | 'cancel';

export function act(userId: string, tradeId: string, action: Act): Promise<TradeDTO> {
  return transaction(async tx => {
    const t0 = await tx.trade.findUnique({ where: { id: tradeId } });
    if (!t0) throw notFound('Échange introuvable');
    await lockUsers(tx, t0.proposerId, t0.receiverId);
    const t = await tx.trade.findUniqueOrThrow({ where: { id: tradeId }, include });
    const isProposer = t.proposerId === userId, isReceiver = t.receiverId === userId;
    if (!isProposer && !isReceiver) throw forbidden();
    const give = t.items.filter(i => i.side === 'PROPOSER'), get = t.items.filter(i => i.side === 'RECEIVER');

    const setStatus = (status: Full['status']) => tx.trade.update({ where: { id: t.id }, data: { status }, include });

    switch (action) {
      case 'accept':
        if (!isReceiver || t.status !== 'PENDING') throw bad('Action impossible');
        await assertOwns(tx, t.receiverId, get, 'Tu');
        return dto(await setStatus('ACCEPTED'));
      case 'decline':
        if (!isReceiver || !['PENDING', 'ACCEPTED'].includes(t.status)) throw bad('Action impossible');
        return dto(await setStatus('DECLINED'));
      case 'cancel':
        if (!isProposer || !['PENDING', 'ACCEPTED'].includes(t.status)) throw bad('Action impossible');
        return dto(await setStatus('CANCELLED'));
      case 'confirm': {
        if (!isProposer || t.status !== 'ACCEPTED') throw bad('L’autre joueur doit d’abord accepter');
        await assertOwns(tx, t.proposerId, give, 'Tu');
        await assertOwns(tx, t.receiverId, get, t.receiver.displayName);
        const move = async (from: string, to: string, items: typeof give) => {
          for (const i of items) {
            await tx.userCard.update({ where: { userId_cardId: { userId: from, cardId: i.cardId } }, data: { quantity: { decrement: i.quantity } } });
            await tx.$executeRaw`UPDATE "UserCard" SET "reverseQty" = LEAST("reverseQty", quantity) WHERE "userId" = ${from} AND "cardId" = ${i.cardId}`;
            await tx.userCard.upsert({ where: { userId_cardId: { userId: to, cardId: i.cardId } }, create: { userId: to, cardId: i.cardId, quantity: i.quantity }, update: { quantity: { increment: i.quantity } } });
          }
        };
        await move(t.proposerId, t.receiverId, give);
        await move(t.receiverId, t.proposerId, get);
        await track(tx, t.proposerId, 'TRADE');
        await track(tx, t.receiverId, 'TRADE');
        await tx.auditLog.create({ data: { actorId: userId, action: 'trade.completed', target: t.id, payload: { give, get } as unknown as Prisma.InputJsonValue } });
        return dto(await setStatus('COMPLETED'));
      }
    }
  });
}

export async function findPlayer(name: string) {
  const u = await prisma.user.findFirst({ where: { displayName: { equals: name, mode: 'insensitive' }, deletedAt: null, blockedAt: null }, include: { cards: { where: { quantity: { gt: 0 } } } } });
  if (!u) throw notFound('Joueur introuvable');
  return { id: u.id, displayName: u.displayName, cards: Object.fromEntries(u.cards.map(c => [c.cardId, c.quantity])) };
}
