import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireVerified, userOf } from '../../lib/auth';
import { body } from '../../lib/http';
import * as trades from './service';

export const router = Router();

const items = z.array(z.object({ cardId: z.string().max(40), quantity: z.number().int().min(1).max(5) })).max(5);

router.get('/trades', requireAuth, async (req, res) => {
  res.json(await trades.list(userOf(req).id));
});

router.post('/trades', requireAuth, requireVerified, async (req, res) => {
  const input = body(z.object({ receiverName: z.string().min(1).max(20), give: items, get: items, message: z.string().max(140).optional() }), req.body);
  res.status(201).json(await trades.create(userOf(req).id, input));
});

router.post('/trades/:id/:action', requireAuth, requireVerified, async (req, res) => {
  const action = z.enum(['accept', 'confirm', 'decline', 'cancel']).parse(req.params.action);
  res.json(await trades.act(userOf(req).id, req.params.id as string, action));
});

router.get('/players/:name', requireAuth, async (req, res) => {
  res.json(await trades.findPlayer(String(req.params.name).slice(0, 20)));
});
