import { Router } from 'express';
import { requireAuth, userOf } from '../../lib/auth';
import { claimMission, listMissions } from './service';

export const router = Router();

router.get('/missions', requireAuth, async (req, res) => {
  res.json(await listMissions(userOf(req).id));
});

router.post('/missions/:id/claim', requireAuth, async (req, res) => {
  await claimMission(userOf(req).id, req.params.id as string);
  res.json(await listMissions(userOf(req).id));
});
