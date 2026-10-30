import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/db';
import { outbox } from '../src/modules/auth/mailer';

export const app = createApp();
let n = 0;

export async function player(opts: { verified?: boolean; birthDate?: string; country?: string } = {}) {
  const agent = request.agent(app);
  const name = `p${Date.now().toString(36)}${n++}`;
  const res = await agent.post('/api/auth/register').send({
    email: `${name}@test.dev`, password: 'motdepasse-solide', displayName: name, birthDate: opts.birthDate ?? '2000-01-01',
    country: opts.country ?? 'FR', acceptTerms: true,
  });
  if (res.status !== 201) throw new Error(JSON.stringify(res.body));
  if (opts.verified !== false) {
    const mail = outbox.filter(m => m.to === `${name}@test.dev`).pop()!;
    const token = /token=([\w-]+)/.exec(mail.text)![1];
    await agent.post('/api/auth/verify').send({ token }).expect(200);
  }
  return { agent, id: res.body.id as string, name };
}

export const bannerId = async (code = 'NE1_STANDARD') => (await prisma.banner.findUniqueOrThrow({ where: { code } })).id;

export async function grant(userId: string, currency: 'SHARDS' | 'EMBERS' | 'DUST', amount: number) {
  await prisma.ledgerEntry.create({ data: { userId, currency, amount, reason: 'ADMIN', note: 'test' } });
}
