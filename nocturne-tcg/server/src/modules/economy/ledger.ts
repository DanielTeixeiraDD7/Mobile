import type { Currency, LedgerReason } from '@prisma/client';
import type { Balances } from '@nocturne/shared';
import type { Tx } from '../../db';
import { bad } from '../../lib/http';

export interface Entry { currency: Currency; amount: number; reason: LedgerReason; refType?: string; refId?: string; note?: string }

export async function balances(tx: Tx, userId: string): Promise<Balances> {
  const rows = await tx.ledgerEntry.groupBy({ by: ['currency'], where: { userId }, _sum: { amount: true } });
  const b: Balances = { SHARDS: 0, EMBERS: 0, DUST: 0 };
  for (const r of rows) b[r.currency] = r._sum.amount ?? 0;
  return b;
}

/** À appeler sous lockUsers(). Refuse tout débit qui rendrait un solde négatif. */
export async function post(tx: Tx, userId: string, entries: Entry[], allowNegative = false) {
  const list = entries.filter(e => e.amount !== 0);
  if (!list.length) return;
  if (!allowNegative && list.some(e => e.amount < 0)) {
    const b = await balances(tx, userId);
    for (const e of list) b[e.currency] += e.amount;
    if (Object.values(b).some(v => v < 0)) throw bad('Solde insuffisant', 'INSUFFICIENT_FUNDS');
  }
  await tx.ledgerEntry.createMany({ data: list.map(e => ({ userId, ...e })) });
}

export const credit = (tx: Tx, userId: string, currency: Currency, amount: number, reason: LedgerReason, ref?: Omit<Entry, 'currency' | 'amount' | 'reason'>) =>
  post(tx, userId, [{ currency, amount, reason, ...ref }]);

export const debit = (tx: Tx, userId: string, currency: Currency, amount: number, reason: LedgerReason, ref?: Omit<Entry, 'currency' | 'amount' | 'reason'>) =>
  post(tx, userId, [{ currency, amount: -amount, reason, ...ref }]);
