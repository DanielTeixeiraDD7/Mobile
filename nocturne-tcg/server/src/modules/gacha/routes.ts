import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, userOf } from '../../lib/auth';
import { body } from '../../lib/http';
import { pullLimiter } from '../../lib/limits';
import * as gacha from './service';

export const router = Router();

router.get('/banners', async (req, res) => {
  res.json(await gacha.listBanners(req.user?.id ?? null, req.user?.country ?? null));
});

router.get('/banners/:id/rates', async (req, res) => {
  res.json(await gacha.bannerRates(req.params.id));
});

router.post('/banners/:id/open', requireAuth, pullLimiter, async (req, res) => {
  const { source } = body(z.object({ source: z.enum(['FREE', 'EMBERS', 'SHARDS']) }), req.body);
  res.json(await gacha.open(userOf(req).id, req.params.id as string, source));
});

router.get('/pulls', requireAuth, async (req, res) => {
  const q = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50), before: z.string().datetime().optional() }).parse(req.query);
  res.json(await gacha.history(userOf(req).id, q.limit, q.before));
});
