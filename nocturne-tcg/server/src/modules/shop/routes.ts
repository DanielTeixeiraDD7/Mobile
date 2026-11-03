import { Router } from 'express';
import { z } from 'zod';
import type { CosmeticDTO, ShopProductDTO } from '@nocturne/shared';
import { lockUsers, prisma, transaction } from '../../db';
import { env } from '../../env';
import { requireAuth, userOf } from '../../lib/auth';
import { bad, body, notFound } from '../../lib/http';
import { compliance } from '../account/compliance';
import { debit } from '../economy/ledger';
import { passActive } from '../economy/pass';

export const router = Router();

const slot = { AVATAR: 'avatarId', CARD_BACK: 'cardBackId', FRAME: 'frameId', TITLE: 'titleId' } as const;

async function cosmetics(userId: string): Promise<CosmeticDTO[]> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { subscription: true, cosmetics: true } });
  const pass = passActive(user.subscription);
  const all = await prisma.cosmetic.findMany({ orderBy: [{ kind: 'asc' }, { code: 'asc' }] });
  return all.map(c => ({
    id: c.id, code: c.code, name: c.name, kind: c.kind, priceEmbers: c.priceEmbers, passExclusive: c.passExclusive,
    owned: user.cosmetics.some(o => o.cosmeticId === c.id) || (c.passExclusive && pass),
    equipped: user[slot[c.kind]] === c.id,
  }));
}

router.get('/cosmetics', requireAuth, async (req, res) => {
  res.json(await cosmetics(userOf(req).id));
});

router.post('/cosmetics/:code/buy', requireAuth, async (req, res) => {
  const userId = userOf(req).id;
  await transaction(async tx => {
    await lockUsers(tx, userId);
    const c = await tx.cosmetic.findUnique({ where: { code: String(req.params.code) } });
    if (!c) throw notFound();
    if (c.passExclusive || c.priceEmbers == null) throw bad('Exclusivité du Pass Nocturne');
    if (await tx.userCosmetic.findUnique({ where: { userId_cosmeticId: { userId, cosmeticId: c.id } } })) throw bad('Déjà possédé');
    await debit(tx, userId, 'EMBERS', c.priceEmbers, 'COSMETIC', { refType: 'cosmetic', refId: c.id });
    await tx.userCosmetic.create({ data: { userId, cosmeticId: c.id } });
  });
  res.json(await cosmetics(userId));
});

router.post('/cosmetics/:code/equip', requireAuth, async (req, res) => {
  const user = userOf(req);
  const c = await prisma.cosmetic.findUnique({ where: { code: String(req.params.code) } });
  if (!c) throw notFound();
  const list = await cosmetics(user.id);
  if (!list.find(x => x.id === c.id)?.owned) throw bad('Cosmétique non possédé');
  await prisma.user.update({ where: { id: user.id }, data: { [slot[c.kind]]: c.id } });
  res.json(await cosmetics(user.id));
});

router.get('/shop/products', requireAuth, async (req, res) => {
  const c = await compliance(prisma, userOf(req));
  const products = await prisma.shopProduct.findMany({ where: { active: true }, orderBy: { priceCents: 'asc' } });
  const stripeReady = !!env.STRIPE_SECRET_KEY;
  res.json(products.map((p): ShopProductDTO => {
    const reason = !stripeReady ? 'Paiements bientôt disponibles' : c.reason ?? (c.capCents != null && c.spentThisMonthCents + p.priceCents > c.capCents ? 'Plafond de dépense mensuel atteint' : null);
    return { code: p.code, name: p.name, kind: p.kind as ShopProductDTO['kind'], priceCents: p.priceCents, shards: p.shards, available: !reason, reason };
  }));
});

router.get('/compliance', requireAuth, async (req, res) => {
  res.json(await compliance(prisma, userOf(req)));
});

