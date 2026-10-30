import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db';
import { clearSession, requireAuth, setSession, userOf } from '../../lib/auth';
import { bad, body } from '../../lib/http';
import { authLimiter } from '../../lib/limits';
import * as auth from './service';

export const router = Router();

const password = z.string().min(10, 'Mot de passe : 10 caractères minimum').max(128);

const registerSchema = z.object({
  email: z.string().email('Email invalide').max(200),
  password,
  displayName: z.string().trim().min(3, 'Pseudo : 3 caractères minimum').max(20).regex(/^[\p{L}\p{N}_-]+$/u, 'Pseudo : lettres, chiffres, _ et - uniquement'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance invalide'),
  country: z.string().regex(/^[A-Za-z]{2}$/, 'Pays invalide'),
  acceptTerms: z.literal(true, { message: 'Tu dois accepter les CGU et la politique de confidentialité' }),
  parentalConsent: z.boolean().optional(),
  parentEmail: z.string().email().optional().or(z.literal('').transform(() => undefined)),
});

router.post('/register', authLimiter, async (req, res) => {
  const user = await auth.register(body(registerSchema, req.body));
  setSession(res, user);
  res.status(201).json(await auth.me(user.id));
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = body(z.object({ email: z.string().max(200), password: z.string().max(128) }), req.body);
  const user = await auth.login(email, password);
  setSession(res, user);
  res.json(await auth.me(user.id));
});

router.post('/logout', (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

router.post('/logout-all', requireAuth, async (req, res) => {
  await prisma.user.update({ where: { id: userOf(req).id }, data: { tokenVersion: { increment: 1 } } });
  clearSession(res);
  res.status(204).end();
});

router.get('/me', async (req, res) => {
  res.json(req.user ? await auth.me(req.user.id) : null);
});

router.post('/verify', authLimiter, async (req, res) => {
  const { token } = body(z.object({ token: z.string().min(10).max(200) }), req.body);
  const user = await auth.verifyEmail(token);
  res.json(await auth.me(user.id));
});

router.post('/resend', authLimiter, requireAuth, async (req, res) => {
  const user = userOf(req);
  if (user.emailVerifiedAt) throw bad('Adresse déjà vérifiée');
  await auth.sendVerification(user);
  res.status(204).end();
});

router.post('/forgot', authLimiter, async (req, res) => {
  await auth.forgotPassword(body(z.object({ email: z.string().max(200) }), req.body).email);
  res.status(204).end();
});

router.post('/reset', authLimiter, async (req, res) => {
  const { token, password: pw } = body(z.object({ token: z.string().min(10).max(200), password }), req.body);
  await auth.resetPassword(token, pw);
  clearSession(res);
  res.status(204).end();
});
