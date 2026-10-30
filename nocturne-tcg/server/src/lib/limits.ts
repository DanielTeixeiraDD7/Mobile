import type { Request } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { env } from '../env';

const off = env.NODE_ENV === 'test';
const key = (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip ?? '0.0.0.0');
const base = { skip: () => off, message: { error: 'Trop de requêtes, réessaie dans un instant.' }, standardHeaders: 'draft-8' as const, legacyHeaders: false };

export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 20 });
export const pullLimiter = rateLimit({ ...base, windowMs: 60_000, limit: 30, keyGenerator: key });
export const paymentLimiter = rateLimit({ ...base, windowMs: 60_000, limit: 10, keyGenerator: key });
export const globalLimiter = rateLimit({ ...base, windowMs: 60_000, limit: 600 });
