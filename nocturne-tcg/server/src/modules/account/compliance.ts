import type { User } from '@prisma/client';
import { ADULT_AGE, DEFAULT_MINOR_CAP_CENTS, ageOn, type ComplianceDTO } from '@nocturne/shared';
import type { Tx } from '../../db';

export const DEFAULT_DISABLED_PAID_PACKS = ['BE'];

export async function countryConfig(tx: Tx, country: string) {
  const c = await tx.countryConfig.findUnique({ where: { country } });
  return c ?? { country, paidPacksEnabled: !DEFAULT_DISABLED_PAID_PACKS.includes(country), purchasesEnabled: true };
}

export async function minorCapCents(tx: Tx): Promise<number> {
  const s = await tx.setting.findUnique({ where: { key: 'minorDefaultCapCents' } });
  return typeof s?.value === 'number' ? s.value : DEFAULT_MINOR_CAP_CENTS;
}

export async function compliance(tx: Tx, user: User, now = new Date()): Promise<ComplianceDTO> {
  const cfg = await countryConfig(tx, user.country);
  const isMinor = ageOn(user.birthDate, now) < ADULT_AGE;
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const spent = await tx.purchase.aggregate({ where: { userId: user.id, status: 'PAID', createdAt: { gte: monthStart } }, _sum: { amountCents: true } });
  const minorCap = isMinor ? await minorCapCents(tx) : null;
  const capCents = [user.monthlySpendCapCents, minorCap].filter((x): x is number => x != null).reduce<number | null>((a, b) => (a == null ? b : Math.min(a, b)), null);
  let reason: string | null = null;
  if (!cfg.purchasesEnabled) reason = 'Les achats ne sont pas disponibles dans ton pays.';
  else if (isMinor && !user.parentalConsentAt) reason = 'Achats réservés aux majeurs ou avec accord parental.';
  else if (!user.emailVerifiedAt) reason = 'Vérifie ton adresse email avant tout achat.';
  return {
    country: user.country, paidPacksEnabled: cfg.paidPacksEnabled, purchasesEnabled: cfg.purchasesEnabled,
    isMinor, canPurchase: !reason, reason, spentThisMonthCents: spent._sum.amountCents ?? 0, capCents,
  };
}
