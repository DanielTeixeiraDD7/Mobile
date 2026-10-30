import { describe, expect, it } from 'vitest';
import { prisma } from '../src/db';
import { bannerId, grant, player } from './helpers';

describe('gacha', () => {
  it('ouvre 2 boosters gratuits puis refuse le 3e', async () => {
    const { agent } = await player();
    const id = await bannerId();
    const r1 = await agent.post(`/api/banners/${id}/open`).send({ source: 'FREE' }).expect(200);
    expect(r1.body.pull.cards).toHaveLength(5);
    await agent.post(`/api/banners/${id}/open`).send({ source: 'FREE' }).expect(200);
    const r3 = await agent.post(`/api/banners/${id}/open`).send({ source: 'FREE' });
    expect(r3.status).toBe(400);
    expect(r3.body.code).toBe('NO_FREE_PACK');
    const col = await agent.get('/api/collection');
    expect(Object.values(col.body as Record<string, number>).reduce((a, b) => a + b, 0)).toBe(10);
  });

  it('débite les Braises via le ledger et refuse un solde insuffisant', async () => {
    const { agent, id: userId } = await player();
    const id = await bannerId();
    await agent.post(`/api/banners/${id}/open`).send({ source: 'EMBERS' }).expect(200);
    await agent.post(`/api/banners/${id}/open`).send({ source: 'EMBERS' }).expect(200);
    const r = await agent.post(`/api/banners/${id}/open`).send({ source: 'EMBERS' });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('INSUFFICIENT_FUNDS');
    const sum = await prisma.ledgerEntry.aggregate({ where: { userId, currency: 'EMBERS' }, _sum: { amount: true } });
    expect(sum._sum.amount).toBe(0);
  });

  it('sous concurrence, le solde ne devient jamais négatif', async () => {
    const { agent, id: userId } = await player();
    await agent.get('/api/wallet');
    const id = await bannerId();
    await grant(userId, 'EMBERS', 80);
    const results = await Promise.all(Array.from({ length: 6 }, () => agent.post(`/api/banners/${id}/open`).send({ source: 'EMBERS' })));
    expect(results.filter(r => r.status === 200)).toHaveLength(3);
    const sum = await prisma.ledgerEntry.aggregate({ where: { userId, currency: 'EMBERS' }, _sum: { amount: true } });
    expect(sum._sum.amount).toBe(0);
  });

  it('applique la pitié Épique et Légendaire', async () => {
    const { agent, id: userId } = await player();
    const id = await bannerId();
    await prisma.pityCounter.create({ data: { userId, bannerId: id, sinceEpic: 9, sinceLegendary: 99 } });
    const r = await agent.post(`/api/banners/${id}/open`).send({ source: 'FREE' }).expect(200);
    expect(r.body.pull.cards.some((c: { rarity: string }) => ['LEGENDARY', 'SECRET'].includes(c.rarity))).toBe(true);
    expect(r.body.pity).toMatchObject({ sinceEpic: 0, sinceLegendary: 0, totalPacks: 1 });
    const banners = await agent.get('/api/banners');
    expect(banners.body.find((b: { id: string }) => b.id === id).pity.totalPacks).toBe(1);
  });

  it('compteurs de pitié séparés par bannière', async () => {
    const { agent } = await player();
    await agent.post(`/api/banners/${await bannerId('BLOOD_MOON')}/open`).send({ source: 'FREE' }).expect(200);
    const banners = (await agent.get('/api/banners')).body as { code: string; pity: { totalPacks: number } }[];
    expect(banners.find(b => b.code === 'BLOOD_MOON')!.pity.totalPacks).toBe(1);
    expect(banners.find(b => b.code === 'NE1_STANDARD')!.pity.totalPacks).toBe(0);
  });

  it('publie des taux exacts qui somment à 100 % par slot', async () => {
    const { agent } = await player();
    const r = await agent.get(`/api/banners/${await bannerId('BLOOD_MOON')}/rates`).expect(200);
    for (const s of r.body.slots) expect(s.rates.reduce((a: number, x: { percent: number }) => a + x.percent, 0)).toBeCloseTo(100, 1);
    expect(r.body.cards.filter((c: { featured: boolean }) => c.featured)).toHaveLength(2);
  });

  it('bloque les boosters payants en Belgique', async () => {
    const { agent, id: userId } = await player({ country: 'BE' });
    await grant(userId, 'SHARDS', 500);
    const r = await agent.post(`/api/banners/${await bannerId()}/open`).send({ source: 'SHARDS' });
    expect(r.status).toBe(403);
    const { agent: fr, id: frId } = await player();
    await grant(frId, 'SHARDS', 500);
    await fr.post(`/api/banners/${await bannerId()}/open`).send({ source: 'SHARDS' }).expect(200);
  });

  it('historique des tirages', async () => {
    const { agent } = await player();
    await agent.post(`/api/banners/${await bannerId()}/open`).send({ source: 'FREE' }).expect(200);
    const h = await agent.get('/api/pulls').expect(200);
    expect(h.body).toHaveLength(1);
    expect(h.body[0].source).toBe('FREE');
  });
});

describe('ledger', () => {
  it('est immuable (trigger SQL)', async () => {
    const { id: userId } = await player();
    const e = await prisma.ledgerEntry.findFirstOrThrow({ where: { userId } });
    await expect(prisma.ledgerEntry.update({ where: { id: e.id }, data: { amount: 999_999 } })).rejects.toThrow(/immuable/);
    await expect(prisma.ledgerEntry.delete({ where: { id: e.id } })).rejects.toThrow(/immuable/);
  });
});
