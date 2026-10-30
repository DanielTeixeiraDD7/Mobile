import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { TokenType, User } from '@prisma/client';
import { ADULT_AGE, MIN_AGE, WELCOME_EMBERS, ageOn, type MeDTO, type RegisterInput } from '@nocturne/shared';
import { prisma, transaction } from '../../db';
import { env } from '../../env';
import { HttpError, bad, conflict } from '../../lib/http';
import { credit } from '../economy/ledger';
import { passActive } from '../economy/pass';
import { sendMail } from './mailer';

const DUMMY_HASH = bcrypt.hashSync('nocturne-dummy', 12);
const hash = (t: string) => createHash('sha256').update(t).digest('hex');
const TTL: Record<TokenType, number> = { VERIFY_EMAIL: 48 * 3600_000, RESET_PASSWORD: 3600_000 };

async function issueToken(userId: string, type: TokenType) {
  const token = randomBytes(32).toString('base64url');
  await prisma.emailToken.create({ data: { userId, type, tokenHash: hash(token), expiresAt: new Date(Date.now() + TTL[type]) } });
  return token;
}

export async function sendVerification(user: Pick<User, 'id' | 'email' | 'displayName'>) {
  const token = await issueToken(user.id, 'VERIFY_EMAIL');
  await sendMail(user.email, 'Confirme ton adresse — Nocturne',
    `Bonsoir ${user.displayName},\n\nConfirme ton adresse pour débloquer les échanges et la boutique :\n${env.APP_URL}/#/verifier?token=${token}\n\nCe lien expire dans 48 h.`);
  return token;
}

export async function register(input: RegisterInput, now = new Date()) {
  const birth = new Date(input.birthDate);
  const age = ageOn(birth, now);
  if (age < MIN_AGE) throw bad(`Nocturne est réservé aux joueurs de ${MIN_AGE} ans et plus.`);
  if (age < ADULT_AGE && input.parentalConsent && !input.parentEmail) throw bad('Indique l’email du parent qui donne son accord.');
  const email = input.email.toLowerCase().trim();
  if (await prisma.user.findFirst({ where: { OR: [{ email }, { displayName: { equals: input.displayName, mode: 'insensitive' } }] } })) {
    throw conflict('Cet email ou ce pseudo est déjà utilisé');
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const free = await prisma.cosmetic.findMany({ where: { priceEmbers: 0 } });
  const user = await transaction(async tx => {
    const u = await tx.user.create({
      data: {
        email, passwordHash, displayName: input.displayName, birthDate: birth, country: input.country.toUpperCase(),
        acceptedTermsAt: now,
        parentalConsentAt: age < ADULT_AGE && input.parentalConsent ? now : null,
        parentEmail: age < ADULT_AGE ? input.parentEmail ?? null : null,
        avatarId: free.find(c => c.kind === 'AVATAR')?.id, cardBackId: free.find(c => c.kind === 'CARD_BACK')?.id,
        cosmetics: { create: free.map(c => ({ cosmeticId: c.id })) },
      },
    });
    await credit(tx, u.id, 'EMBERS', WELCOME_EMBERS, 'WELCOME');
    return u;
  });
  await sendVerification(user);
  return user;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  const ok = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : await bcrypt.compare(password, DUMMY_HASH);
  if (!user || !ok || user.deletedAt) throw new HttpError(401, 'Email ou mot de passe incorrect');
  if (user.blockedAt) throw new HttpError(403, 'Compte suspendu');
  return user;
}

async function consumeToken(token: string, type: TokenType) {
  const t = await prisma.emailToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!t || t.type !== type || t.usedAt || t.expiresAt < new Date()) throw bad('Lien invalide ou expiré');
  await prisma.emailToken.update({ where: { id: t.id }, data: { usedAt: new Date() } });
  return t.userId;
}

export async function verifyEmail(token: string) {
  const userId = await consumeToken(token, 'VERIFY_EMAIL');
  return prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || user.deletedAt) return;
  const token = await issueToken(user.id, 'RESET_PASSWORD');
  await sendMail(user.email, 'Réinitialise ton mot de passe — Nocturne', `Lien valable 1 h :\n${env.APP_URL}/#/mot-de-passe?token=${token}`);
}

export async function resetPassword(token: string, password: string) {
  const userId = await consumeToken(token, 'RESET_PASSWORD');
  return prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(password, 12), tokenVersion: { increment: 1 } } });
}

export async function me(userId: string, now = new Date()): Promise<MeDTO> {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { subscription: true } });
  const codes = await prisma.cosmetic.findMany({ where: { id: { in: [u.avatarId, u.cardBackId, u.frameId, u.titleId].filter((x): x is string => !!x) } } });
  const code = (id: string | null) => codes.find(c => c.id === id)?.code ?? null;
  const age = ageOn(u.birthDate, now);
  return {
    id: u.id, email: u.email, displayName: u.displayName, role: u.role, emailVerified: !!u.emailVerifiedAt, country: u.country,
    age, isMinor: age < ADULT_AGE, parentalConsent: !!u.parentalConsentAt, monthlySpendCapCents: u.monthlySpendCapCents,
    pass: { active: passActive(u.subscription, now), until: u.subscription?.currentPeriodEnd.toISOString() ?? null, cancelAtPeriodEnd: u.subscription?.cancelAtPeriodEnd ?? false },
    avatar: code(u.avatarId), cardBack: code(u.cardBackId), frame: code(u.frameId), title: code(u.titleId),
    createdAt: u.createdAt.toISOString(),
  };
}

