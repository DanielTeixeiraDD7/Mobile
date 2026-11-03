import type { MissionKind } from '@prisma/client';
import { periodKey, type MissionDTO } from '@nocturne/shared';
import { lockUsers, prisma, transaction, type Tx } from '../../db';
import { bad, notFound } from '../../lib/http';
import { post } from '../economy/ledger';

export async function track(tx: Tx, userId: string, kind: MissionKind, amount = 1, now = new Date()) {
  const missions = await tx.mission.findMany({ where: { kind, active: true } });
  for (const m of missions) {
    const key = periodKey(m.period, now);
    await tx.missionProgress.upsert({
      where: { userId_missionId_periodKey: { userId, missionId: m.id, periodKey: key } },
      create: { userId, missionId: m.id, periodKey: key, progress: amount },
      update: { progress: { increment: amount } },
    });
  }
}

function resetsAt(period: 'DAILY' | 'WEEKLY', now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  if (period === 'WEEKLY') d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7));
  return d.toISOString();
}

export async function listMissions(userId: string, now = new Date()): Promise<MissionDTO[]> {
  const missions = await prisma.mission.findMany({ where: { active: true }, orderBy: [{ period: 'asc' }, { code: 'asc' }] });
  const progress = await prisma.missionProgress.findMany({ where: { userId, missionId: { in: missions.map(m => m.id) } } });
  return missions.map(m => {
    const key = periodKey(m.period, now);
    const p = progress.find(x => x.missionId === m.id && x.periodKey === key);
    return {
      id: m.id, code: m.code, title: m.title, period: m.period, kind: m.kind, target: m.target,
      progress: Math.min(m.target, p?.progress ?? 0), claimed: !!p?.claimedAt,
      rewardEmbers: m.rewardEmbers, rewardDust: m.rewardDust, periodKey: key, resetsAt: resetsAt(m.period, now),
    };
  });
}

export function claimMission(userId: string, missionId: string, now = new Date()) {
  return transaction(async tx => {
    await lockUsers(tx, userId);
    const m = await tx.mission.findUnique({ where: { id: missionId } });
    if (!m || !m.active) throw notFound('Mission introuvable');
    const key = periodKey(m.period, now);
    const p = await tx.missionProgress.findUnique({ where: { userId_missionId_periodKey: { userId, missionId, periodKey: key } } });
    if (!p || p.progress < m.target) throw bad('Mission non terminée');
    if (p.claimedAt) throw bad('Récompense déjà récupérée');
    await tx.missionProgress.update({ where: { userId_missionId_periodKey: { userId, missionId, periodKey: key } }, data: { claimedAt: now } });
    await post(tx, userId, [
      { currency: 'EMBERS', amount: m.rewardEmbers, reason: 'MISSION', refType: 'mission', refId: m.id },
      { currency: 'DUST', amount: m.rewardDust, reason: 'MISSION', refType: 'mission', refId: m.id },
    ]);
  });
}
