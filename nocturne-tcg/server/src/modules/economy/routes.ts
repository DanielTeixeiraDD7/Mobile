import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db';
import { requireAuth, userOf } from '../../lib/auth';
import { wallet } from './wallet';

export const router = Router();

router.get('/wallet', requireAuth, async (req, res) => {
  res.json(await wallet(userOf(req).id));
});

router.get('/ledger', requireAuth, async (req, res) => {
  const { limit } = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) }).parse(req.query);
  const rows = await prisma.ledgerEntry.findMany({ where: { userId: userOf(req).id }, orderBy: { createdAt: 'desc' }, take: limit });
  res.json(rows.map(r => ({ id: r.id, currency: r.currency, amount: r.amount, reason: r.reason, note: r.note, createdAt: r.createdAt.toISOString() })));
});
