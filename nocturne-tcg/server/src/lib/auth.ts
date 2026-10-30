import type { RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';
import { prisma } from '../db';
import { env } from '../env';
import { HttpError, forbidden } from './http';

export const COOKIE = 'nt_session';
const MAX_AGE = 7 * 24 * 3600 * 1000;

declare global {
  namespace Express {
    interface Request { user?: User }
  }
}

export function setSession(res: Response, user: Pick<User, 'id' | 'tokenVersion'>) {
  const token = jwt.sign({ sub: user.id, v: user.tokenVersion }, env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: env.COOKIE_SECURE, maxAge: MAX_AGE, path: '/' });
}

export const clearSession = (res: Response) => res.clearCookie(COOKIE, { path: '/' });

export const loadUser: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[COOKIE];
  if (!token) return next();
  try {
    const p = jwt.verify(token, env.JWT_SECRET) as { sub: string; v: number };
    const user = await prisma.user.findUnique({ where: { id: p.sub } });
    if (user && user.tokenVersion === p.v && !user.deletedAt) req.user = user;
  } catch { /* jeton invalide : anonyme */ }
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) throw new HttpError(401, 'Connexion requise');
  if (req.user.blockedAt) throw forbidden('Compte suspendu');
  next();
};

export const requireVerified: RequestHandler = (req, _res, next) => {
  if (!req.user?.emailVerifiedAt) throw forbidden('Vérifie ton adresse email pour utiliser cette fonction');
  next();
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'ADMIN') throw forbidden();
  next();
};

export const userOf = (req: { user?: User }) => {
  if (!req.user) throw new HttpError(401, 'Connexion requise');
  return req.user;
};
