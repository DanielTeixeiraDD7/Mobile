import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ADULT_AGE, ageOn } from '@nocturne/shared';
import { prisma, transaction } from '../../db';
import { clearSession, requireAuth, userOf } from '../../lib/auth';
import { HttpError, bad, body } from '../../lib/http';
import { me } from '../auth/service';
import { minorCapCents } from './compliance';

export const router = Router();

router.patch('/me/settings', requireAuth, async (req, res) => {
  const user = userOf(req);
  const { monthlySpendCapCents } = body(z.object({ monthlySpendCapCents: z.number().int().min(0).max(100_000).nullable() }), req.body);
  if (ageOn(user.birthDate, new Date()) < ADULT_AGE) {
    const cap = await minorCapCents(prisma);
    if (monthlySpendCapCents == null || monthlySpendCapCents > cap) throw bad(`Plafond maximum pour les mineurs : ${cap / 100} €`);
  }
  await prisma.user.update({ where: { id: user.id }, data: { monthlySpendCapCents } });
  res.json(await me(user.id));
});

/** Portabilité RGPD : toutes les données du joueur en JSON. */
router.get('/me/export', requireAuth, async (req, res) => {
  const id = userOf(req).id;
  const [user, cards, ledger, pulls, trades, purchases, missions, decks, logins] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id }, select: { id: true, email: true, displayName: true, birthDate: true, country: true, createdAt: true, emailVerifiedAt: true, parentalConsentAt: true, parentEmail: true, monthlySpendCapCents: true, acceptedTermsAt: true } }),
    prisma.userCard.findMany({ where: { userId: id } }),
    prisma.ledgerEntry.findMany({ where: { userId: id }, orderBy: { createdAt: 'asc' } }),
    prisma.pull.findMany({ where: { userId: id }, include: { cards: true } }),
    prisma.trade.findMany({ where: { OR: [{ proposerId: id }, { receiverId: id }] }, include: { items: true } }),
    prisma.purchase.findMany({ where: { userId: id } }),
    prisma.missionProgress.findMany({ where: { userId: id } }),
    prisma.deck.findMany({ where: { userId: id }, include: { cards: true } }),
    prisma.dailyLogin.findMany({ where: { userId: id } }),
  ]);
  res.setHeader('Content-Disposition', 'attachment; filename="nocturne-export.json"');
  res.json({ exportedAt: new Date().toISOString(), user, cards, ledger, pulls, trades, purchases, missions, decks, logins });
});

/** Suppression RGPD : données personnelles effacées ; le ledger et les achats sont conservés anonymisés (obligation comptable). */
router.delete('/me', requireAuth, async (req, res) => {
  const user = userOf(req);
  const { password } = body(z.object({ password: z.string().max(128) }), req.body);
  if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(401, 'Mot de passe incorrect');
  await transaction(async tx => {
    await tx.trade.updateMany({ where: { OR: [{ proposerId: user.id }, { receiverId: user.id }], status: { in: ['PENDING', 'ACCEPTED'] } }, data: { status: 'CANCELLED' } });
    for (const m of [tx.userCard, tx.pityCounter, tx.missionProgress, tx.dailyLogin, tx.userCosmetic, tx.deck, tx.battle, tx.emailToken] as unknown as { deleteMany(a: object): Promise<unknown> }[]) {
      await m.deleteMany({ where: { userId: user.id } });
    }
    await tx.user.update({
      where: { id: user.id },
      data: {
        email: `supprime-${user.id}@invalid`, displayName: `Disparu-${user.id.slice(-8)}`, passwordHash: null, parentEmail: null,
        birthDate: new Date('1900-01-01'), deletedAt: new Date(), tokenVersion: { increment: 1 }, avatarId: null, cardBackId: null, frameId: null, titleId: null,
      },
    });
  });
  clearSession(res);
  res.status(204).end();
});
