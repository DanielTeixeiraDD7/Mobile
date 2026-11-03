import { describe, expect, it } from 'vitest';
import { prisma } from '../src/db';
import { bannerId, grant, player } from './helpers';

describe('collection & poussière', () => {
  it('recycle les doublons et invoque une carte', async () => {
    const { agent, id: userId } = await player();
    await prisma.userCard.create({ data: { userId, cardId: 'NE1-001', quantity: 4 } });
    const r = await agent.post('/api/collection/recycle').send({}).expect(200);
    expect(r.body).toEqual({ dust: 15, count: 3 });
    expect((await agent.get('/api/collection')).body['NE1-001']).toBe(1);
    await agent.post('/api/collection/craft').send({ cardId: 'NE1-002' }).expect(400);
    await grant(userId, 'DUST', 25);
    await agent.post('/api/collection/craft').send({ cardId: 'NE1-002' }).expect(200);
    expect((await agent.get('/api/collection')).body['NE1-002']).toBe(1);
    await grant(userId, 'DUST', 20000);
    await agent.post('/api/collection/craft').send({ cardId: 'NE1-063' }).expect(400);
  });
});

describe('missions', () => {
  it('progresse et se réclame une seule fois', async () => {
    const { agent } = await player();
    const id = await bannerId();
    await agent.post(`/api/banners/${id}/open`).send({ source: 'FREE' });
    await agent.post(`/api/banners/${id}/open`).send({ source: 'FREE' });
    const list = (await agent.get('/api/missions')).body as { id: string; code: string; progress: number }[];
    const m = list.find(x => x.code === 'D_PACKS')!;
    expect(m.progress).toBe(2);
    const before = (await agent.get('/api/wallet')).body.balances.EMBERS;
    await agent.post(`/api/missions/${m.id}/claim`).expect(200);
    await agent.post(`/api/missions/${m.id}/claim`).expect(400);
    expect((await agent.get('/api/wallet')).body.balances.EMBERS).toBe(before + 25);
  });
});

describe('échanges', () => {
  it('carte contre carte avec double confirmation', async () => {
    const a = await player(), b = await player();
    await prisma.userCard.createMany({ data: [{ userId: a.id, cardId: 'NE1-001', quantity: 2 }, { userId: b.id, cardId: 'NE1-013', quantity: 1 }] });
    const t = await a.agent.post('/api/trades').send({ receiverName: b.name, give: [{ cardId: 'NE1-001', quantity: 1 }], get: [{ cardId: 'NE1-013', quantity: 1 }] }).expect(201);
    await a.agent.post(`/api/trades/${t.body.id}/confirm`).expect(400);
    await a.agent.post(`/api/trades/${t.body.id}/accept`).expect(400);
    await b.agent.post(`/api/trades/${t.body.id}/accept`).expect(200);
    const done = await a.agent.post(`/api/trades/${t.body.id}/confirm`).expect(200);
    expect(done.body.status).toBe('COMPLETED');
    expect((await a.agent.get('/api/collection')).body).toMatchObject({ 'NE1-001': 1, 'NE1-013': 1 });
    expect((await b.agent.get('/api/collection')).body).toMatchObject({ 'NE1-001': 1 });
    expect((await b.agent.get('/api/collection')).body['NE1-013']).toBeUndefined();
  });

  it('refuse un échange sans contrepartie en cartes ou non vérifié', async () => {
    const a = await player(), b = await player(), c = await player({ verified: false });
    await prisma.userCard.create({ data: { userId: a.id, cardId: 'NE1-001', quantity: 1 } });
    await a.agent.post('/api/trades').send({ receiverName: b.name, give: [{ cardId: 'NE1-001', quantity: 1 }], get: [] }).expect(400);
    await c.agent.post('/api/trades').send({ receiverName: b.name, give: [], get: [] }).expect(403);
  });

  it('échoue si une carte a disparu entre-temps', async () => {
    const a = await player(), b = await player();
    await prisma.userCard.createMany({ data: [{ userId: a.id, cardId: 'NE1-001', quantity: 1 }, { userId: b.id, cardId: 'NE1-013', quantity: 1 }] });
    const t = await a.agent.post('/api/trades').send({ receiverName: b.name, give: [{ cardId: 'NE1-001', quantity: 1 }], get: [{ cardId: 'NE1-013', quantity: 1 }] }).expect(201);
    await b.agent.post(`/api/trades/${t.body.id}/accept`).expect(200);
    await prisma.userCard.update({ where: { userId_cardId: { userId: a.id, cardId: 'NE1-001' } }, data: { quantity: 0 } });
    await a.agent.post(`/api/trades/${t.body.id}/confirm`).expect(400);
  });
});

describe('compte', () => {
  it('exporte puis supprime en anonymisant', async () => {
    const { agent, id } = await player();
    const exp = await agent.get('/api/me/export').expect(200);
    expect(exp.body.user.id).toBe(id);
    await agent.delete('/api/me').send({ password: 'mauvais' }).expect(401);
    await agent.delete('/api/me').send({ password: 'motdepasse-solide' }).expect(204);
    const u = await prisma.user.findUniqueOrThrow({ where: { id } });
    expect(u.email).toMatch(/@invalid$/);
    expect(u.passwordHash).toBeNull();
    expect(await prisma.ledgerEntry.count({ where: { userId: id } })).toBeGreaterThan(0);
  });
});

describe('combat', () => {
  it('crée un deck et joue un combat jusqu’au bout', async () => {
    const { agent, id } = await player();
    const ids = ['NE1-001', 'NE1-002', 'NE1-013', 'NE1-014', 'NE1-016'];
    await prisma.userCard.createMany({ data: ids.map(cardId => ({ userId: id, cardId, quantity: 2 })) });
    const deck = await agent.put('/api/decks').send({ name: 'Test', cards: ids.flatMap(c => [c, c]) }).expect(201);
    let b = (await agent.post('/api/battles').send({ deckId: deck.body.id }).expect(201)).body;
    for (let i = 0; i < 120 && b.status === 'ACTIVE'; i++) {
      const s = b.state;
      const me = s.sides.player;
      const action = !me.deployed && me.hand.length && (!me.active || me.bench.length < 2) ? { type: 'deploy', handIndex: 0 }
        : me.active && s.sides.enemy.active && s.turn > 1 ? { type: 'attack' } : { type: 'end' };
      b = (await agent.post(`/api/battles/${b.id}/action`).send({ action }).expect(200)).body;
    }
    expect(['WON', 'LOST']).toContain(b.status);
    expect(b.reward).not.toBeNull();
  });
});
