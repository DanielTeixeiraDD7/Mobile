import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router, type RequestHandler } from 'express';
import helmet from 'helmet';
import { corsOrigins } from './env';
import { loadUser } from './lib/auth';
import { errorHandler, forbidden } from './lib/http';
import { globalLimiter } from './lib/limits';
import { router as account } from './modules/account/routes';
import { router as admin } from './modules/admin/routes';
import { router as auth } from './modules/auth/routes';
import { router as battle } from './modules/battle/routes';
import { router as catalog } from './modules/catalog/routes';
import { router as collection } from './modules/collection/routes';
import { router as economy } from './modules/economy/routes';
import { router as gacha } from './modules/gacha/routes';
import { router as missions } from './modules/missions/routes';
import { router as shop } from './modules/shop/routes';
import { router as trades } from './modules/trades/routes';

/** Anti-CSRF : les requêtes qui modifient l'état doivent venir d'une origine autorisée et être en JSON. */
const sameOrigin: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !corsOrigins.includes(origin) && origin !== `${req.protocol}://${req.get('host')}`) throw forbidden('Origine refusée');
  if (req.get('content-type') && !req.is('application/json')) throw forbidden('JSON attendu');
  next();
};

export function createApp(extra?: (api: Router) => void) {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(globalLimiter);

  const api = Router();
  api.use(loadUser, sameOrigin);
  api.get('/health', (_req, res) => { res.json({ ok: true }); });
  api.use('/auth', auth);
  for (const r of [catalog, gacha, economy, collection, missions, trades, shop, account, battle]) api.use(r);
  api.use('/admin', admin);
  extra?.(api);
  app.use('/api', api);
  app.use(errorHandler);
  return app;
}
