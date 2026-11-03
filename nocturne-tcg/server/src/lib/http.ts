import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError, type ZodType } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

export const bad = (msg: string, code?: string) => new HttpError(400, msg, code);
export const forbidden = (msg = 'Accès refusé') => new HttpError(403, msg);
export const notFound = (msg = 'Introuvable') => new HttpError(404, msg);
export const conflict = (msg: string) => new HttpError(409, msg);

export const body = <T>(schema: ZodType<T>, data: unknown): T => schema.parse(data);

export const validate = (schema: ZodType): RequestHandler => (req, _res, next) => {
  req.body = schema.parse(req.body);
  next();
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0]?.message ?? 'Données invalides', issues: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })) });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON invalide' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
};
