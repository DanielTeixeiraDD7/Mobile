import { DAILY_LOGIN_EMBERS, STREAK_BONUS_EMBERS, STREAK_BONUS_EVERY, dayKey, freePackState, type WalletDTO } from '@nocturne/shared';
import { lockUsers, transaction, type Tx } from '../../db';
import { track } from '../missions/service';
import { balances, credit } from './ledger';
import { freePacksMax, passActive } from './pass';

async function streak(tx: Tx, userId: string, today: Date): Promise<number> {
  const rows = await tx.dailyLogin.findMany({ where: { userId }, orderBy: { day: 'desc' }, take: 400, select: { day: true } });
  let n = 0;
  const cursor = new Date(dayKey(today));
  for (const r of rows) {
    if (dayKey(r.day) !== dayKey(cursor)) break;
    n++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return n;
}

export async function walletTx(tx: Tx, userId: string, now = new Date(), loginReward: number | null = null): Promise<WalletDTO> {
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, include: { subscription: true } });
  return {
    balances: await balances(tx, userId),
    freePacks: freePackState(user.freePacks, user.freePacksUpdatedAt, now, freePacksMax(passActive(user.subscription, now))),
    loginStreak: await streak(tx, userId, now),
    loginReward,
  };
}

/** Récompense de connexion quotidienne (une fois par jour UTC), puis état du portefeuille. */
export function wallet(userId: string, now = new Date()): Promise<WalletDTO> {
  return transaction(async tx => {
    await lockUsers(tx, userId);
    const day = new Date(dayKey(now));
    const exists = await tx.dailyLogin.findUnique({ where: { userId_day: { userId, day } } });
    let reward: number | null = null;
    if (!exists) {
      await tx.dailyLogin.create({ data: { userId, day } });
      const s = await streak(tx, userId, now);
      reward = DAILY_LOGIN_EMBERS + (s % STREAK_BONUS_EVERY === 0 ? STREAK_BONUS_EMBERS : 0);
      await credit(tx, userId, 'EMBERS', reward, 'DAILY_LOGIN', { note: `Série de ${s} jour(s)` });
      await track(tx, userId, 'LOGIN', 1, now);
    }
    return walletTx(tx, userId, now, reward);
  });
}
