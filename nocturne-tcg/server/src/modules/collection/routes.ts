import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, userOf } from '../../lib/auth';
import { body } from '../../lib/http';
import * as col from './service';

export const router = Router();

router.get('/collection', requireAuth, async (req, res) => {
  res.json(await col.collection(userOf(req).id));
});

router.post('/collection/recycle', requireAuth, async (req, res) => {
  const { cardId } = body(z.object({ cardId: z.string().max(40).optional() }), req.body ?? {});
  res.json(await col.recycle(userOf(req).id, cardId));
});

router.post('/collection/craft', requireAuth, async (req, res) => {
  const { cardId } = body(z.object({ cardId: z.string().max(40) }), req.body);
  res.json(await col.craft(userOf(req).id, cardId));
});
