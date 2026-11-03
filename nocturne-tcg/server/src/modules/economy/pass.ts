import type { Subscription } from '@prisma/client';
import { FREE_PACKS_PER_DAY, PASS_FREE_PACKS_PER_DAY } from '@nocturne/shared';

export const passActive = (s: Subscription | null | undefined, now = new Date()) =>
  !!s && ['active', 'trialing', 'past_due'].includes(s.status) && s.currentPeriodEnd > now;

export const freePacksMax = (pass: boolean) => (pass ? PASS_FREE_PACKS_PER_DAY : FREE_PACKS_PER_DAY);
