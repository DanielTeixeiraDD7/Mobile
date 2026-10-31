import { Router, type Request } from 'express';
import type { Prisma, Rarity } from '@prisma/client';
import { z } from 'zod';
import { RARITIES, ageOn, type AdminStatsDTO, type AdminUserDTO } from '@nocturne/shared';
import { lockUsers, prisma, transaction } from '../../db';
import { requireAdmin, requireAuth, userOf } from '../../lib/auth';
import { body, notFound } from '../../lib/http';
import { invalidateCards } from '../catalog/routes';
import { balances, post } from '../economy/ledger';

export const router = Router();
router.use(requireAuth, requireAdmin);

const audit = (req: Request, action: string, target: string | null, payload?: unknown) =>
  prisma.auditLog.create({ data: { actorId: userOf(req).id, action, target, payload: payload as Prisma.InputJsonValue } });

router.get('/stats', async (_req, res) => {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const [users, pullsTotal, pullsToday, trades, ledgerEntries, rarity] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.pull.count(),
    prisma.pull.count({ where: { createdAt: { gte: today } } }),
    prisma.trade.count({ where: { status: 'COMPLETED' } }),
    prisma.ledgerEntry.count(),
    prisma.$queryRaw<{ rarity: Rarity; n: bigint }[]>`SELECT c.rarity, COUNT(*) AS n FROM "PullCard" pc JOIN "Card" c ON c.id = pc."cardId" GROUP BY c.rarity`,
  ]);
  const byRarity = Object.fromEntries(RARITIES.map(r => [r, Number(rarity.find(x => x.rarity === r)?.n ?? 0)])) as AdminStatsDTO['byRarity'];
  res.json({ users, pullsToday, pullsTotal, trades, ledgerEntries, byRarity } satisfies AdminStatsDTO);
});

router.get('/users', async (req, res) => {
  const q = String(req.query.q ?? '').slice(0, 100);
  const users = await prisma.user.findMany({
    where: { deletedAt: null, ...(q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }] } : {}) },
    orderBy: { createdAt: 'desc' }, take: 50, include: { _count: { select: { pulls: true } } },
  });
  const out: AdminUserDTO[] = [];
  for (const u of users) {
    out.push({ id: u.id, email: u.email, displayName: u.displayName, role: u.role, country: u.country, age: ageOn(u.birthDate, new Date()), createdAt: u.createdAt.toISOString(), blocked: !!u.blockedAt, balances: await balances(prisma, u.id), pulls: u._count.pulls });
  }
  res.json(out);
});

router.get('/users/:id/ledger', async (req, res) => {
  res.json(await prisma.ledgerEntry.findMany({ where: { userId: req.params.id }, orderBy: { createdAt: 'desc' }, take: 200 }));
});

router.post('/users/:id/grant', async (req, res) => {
  const { currency, amount, note } = body(z.object({ currency: z.enum(['SHARDS', 'EMBERS', 'DUST']), amount: z.number().int().min(-100_000).max(100_000).refine(n => n !== 0), note: z.string().min(3).max(200) }), req.body);
  const id = String(req.params.id);
  await transaction(async tx => {
    await lockUsers(tx, id);
    await post(tx, id, [{ currency, amount, reason: 'ADMIN', note, refType: 'admin', refId: userOf(req).id }]);
  });
  await audit(req, 'user.grant', id, { currency, amount, note });
  res.json(await balances(prisma, id));
});

router.post('/users/:id/block', async (req, res) => {
  const { blocked, reason } = body(z.object({ blocked: z.boolean(), reason: z.string().max(200).optional() }), req.body);
  const id = String(req.params.id);
  await prisma.user.update({ where: { id }, data: blocked ? { blockedAt: new Date(), blockedReason: reason ?? null, tokenVersion: { increment: 1 } } : { blockedAt: null, blockedReason: null } });
  await audit(req, blocked ? 'user.block' : 'user.unblock', id, { reason });
  res.status(204).end();
});

router.post('/users/:id/pass', async (req, res) => {
  const { days } = body(z.object({ days: z.number().int().min(0).max(365) }), req.body);
  const userId = String(req.params.id);
  const end = new Date(Date.now() + days * 86_400_000);
  await prisma.subscription.upsert({ where: { userId }, create: { userId, status: days ? 'active' : 'canceled', currentPeriodEnd: end }, update: { status: days ? 'active' : 'canceled', currentPeriodEnd: end } });
  await audit(req, 'user.pass', userId, { days });
  res.status(204).end();
});

router.get('/cards', async (_req, res) => {
  res.json(await prisma.card.findMany({ orderBy: [{ setId: 'asc' }, { number: 'asc' }] }));
});

router.patch('/cards/:id', async (req, res) => {
  const data = body(z.object({
    name: z.string().min(1).max(60), hp: z.number().int().min(1).max(500), attack: z.number().int().min(0).max(200),
    lore: z.string().max(600), imageUrl: z.string().max(500).regex(/^(https:\/\/|cards\/)/, 'URL https:// ou chemin cards/…').nullable(), active: z.boolean(), craftable: z.boolean(),
    rarity: z.enum(RARITIES), abilityValue: z.number().int().min(0).max(100),
  }).partial(), req.body);
  const card = await prisma.card.update({ where: { id: String(req.params.id) }, data });
  invalidateCards();
  await audit(req, 'card.update', card.id, data);
  res.json(card);
});

router.get('/packs', async (_req, res) => {
  const packs = await prisma.packType.findMany({ include: { slots: { include: { rates: true }, orderBy: { index: 'asc' } } } });
  res.json(packs.map(p => ({ id: p.id, code: p.code, name: p.name, priceEmbers: p.priceEmbers, priceShards: p.priceShards, slots: p.slots.map(s => Object.fromEntries(s.rates.map(r => [r.rarity, r.weight]))) })));
});

router.put('/packs/:code/rates', async (req, res) => {
  const { slots } = body(z.object({ slots: z.array(z.partialRecord(z.enum(RARITIES), z.number().int().min(0).max(100_000))).min(1).max(10) }), req.body);
  const pack = await prisma.packType.findUnique({ where: { code: String(req.params.code) } });
  if (!pack) throw notFound();
  await transaction(async tx => {
    await tx.packSlot.deleteMany({ where: { packTypeId: pack.id } });
    for (const [index, rates] of slots.entries()) {
      await tx.packSlot.create({ data: { packTypeId: pack.id, index, rates: { create: Object.entries(rates).filter(([, w]) => w > 0).map(([rarity, weight]) => ({ rarity: rarity as Rarity, weight })) } } });
    }
  });
  await audit(req, 'pack.rates', pack.code, slots);
  res.status(204).end();
});

router.put('/packs/:code/prices', async (req, res) => {
  const data = body(z.object({ priceEmbers: z.number().int().min(1).nullable(), priceShards: z.number().int().min(1).nullable() }), req.body);
  await prisma.packType.update({ where: { code: String(req.params.code) }, data });
  await audit(req, 'pack.prices', String(req.params.code), data);
  res.status(204).end();
});

const bannerSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_]{3,30}$/), name: z.string().min(1).max(60), description: z.string().max(300),
  startsAt: z.string().datetime(), endsAt: z.string().datetime().nullable(), featuredShare: z.number().int().min(0).max(100_000),
  epicPityEvery: z.number().int().min(1).max(100), legendaryPityAt: z.number().int().min(1).max(500), theme: z.string().max(20),
  featured: z.array(z.string()).max(10), active: z.boolean(), packCode: z.string().default('NE1_STANDARD'),
});

router.get('/banners', async (_req, res) => {
  const list = await prisma.banner.findMany({ include: { featured: true, packType: true }, orderBy: { startsAt: 'desc' } });
  res.json(list.map(b => ({ ...b, featured: b.featured.map(f => f.cardId), packCode: b.packType.code })));
});

router.put('/banners', async (req, res) => {
  const { featured, packCode, ...input } = body(bannerSchema, req.body);
  const pack = await prisma.packType.findUnique({ where: { code: packCode } });
  if (!pack) throw notFound('Booster inconnu');
  const data = { ...input, startsAt: new Date(input.startsAt), endsAt: input.endsAt ? new Date(input.endsAt) : null, packTypeId: pack.id };
  const b = await prisma.banner.upsert({ where: { code: input.code }, create: data, update: data });
  await prisma.bannerFeature.deleteMany({ where: { bannerId: b.id } });
  await prisma.bannerFeature.createMany({ data: featured.map(cardId => ({ bannerId: b.id, cardId })) });
  await audit(req, 'banner.upsert', b.code, input);
  res.json(b);
});

router.get('/countries', async (_req, res) => {
  res.json(await prisma.countryConfig.findMany({ orderBy: { country: 'asc' } }));
});

router.put('/countries/:country', async (req, res) => {
  const data = body(z.object({ paidPacksEnabled: z.boolean(), purchasesEnabled: z.boolean() }), req.body);
  const country = String(req.params.country).toUpperCase().slice(0, 2);
  await prisma.countryConfig.upsert({ where: { country }, create: { country, ...data }, update: data });
  await audit(req, 'country.update', country, data);
  res.status(204).end();
});

router.get('/settings', async (_req, res) => {
  res.json(Object.fromEntries((await prisma.setting.findMany()).map(s => [s.key, s.value])));
});

router.put('/settings/:key', async (req, res) => {
  const key = z.enum(['minorDefaultCapCents']).parse(req.params.key);
  const { value } = body(z.object({ value: z.number().int().min(0).max(100_000) }), req.body);
  await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  await audit(req, 'setting.update', key, { value });
  res.status(204).end();
});

router.get('/transactions', async (_req, res) => {
  res.json(await prisma.ledgerEntry.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { user: { select: { displayName: true } } } }));
});

router.get('/audit', async (_req, res) => {
  res.json(await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { actor: { select: { displayName: true } } } }));
});
