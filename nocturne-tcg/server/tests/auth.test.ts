import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, player } from './helpers';

const base = { password: 'motdepasse-solide', country: 'FR', acceptTerms: true };

describe('auth', () => {
  it('inscrit, connecte, déconnecte', async () => {
    const { agent, name } = await player({ verified: false });
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body).toMatchObject({ displayName: name, emailVerified: false });
    await agent.post('/api/auth/logout').expect(204);
    expect((await agent.get('/api/auth/me')).body).toBeNull();
    await agent.post('/api/auth/login').send({ email: `${name}@test.dev`, password: 'motdepasse-solide' }).expect(200);
    await agent.post('/api/auth/login').send({ email: `${name}@test.dev`, password: 'mauvais-mdp' }).expect(401);
  });

  it('refuse les moins de 13 ans et les CGU non acceptées', async () => {
    const r = await request(app).post('/api/auth/register').send({ ...base, email: 'kid@test.dev', displayName: 'kidkid', birthDate: '2020-01-01' });
    expect(r.status).toBe(400);
    const r2 = await request(app).post('/api/auth/register').send({ ...base, email: 'x@test.dev', displayName: 'xxxx1', birthDate: '2000-01-01', acceptTerms: false });
    expect(r2.status).toBe(400);
  });

  it('marque les mineurs et leur interdit les achats sans accord parental', async () => {
    const { agent } = await player({ birthDate: '2011-06-01' });
    const me = await agent.get('/api/auth/me');
    expect(me.body.isMinor).toBe(true);
    const c = await agent.get('/api/compliance');
    expect(c.body.canPurchase).toBe(false);
    expect(c.body.capCents).toBe(3000);
    await agent.patch('/api/me/settings').send({ monthlySpendCapCents: 10_000 }).expect(400);
  });

  it('protège les routes et refuse les origines étrangères', async () => {
    await request(app).get('/api/collection').expect(401);
    const { agent } = await player();
    await agent.post('/api/auth/logout').set('Origin', 'https://evil.example').expect(403);
  });

  it('crédite le bonus de bienvenue dans le ledger', async () => {
    const { agent } = await player();
    const w = await agent.get('/api/wallet').expect(200);
    expect(w.body.balances.EMBERS).toBe(200 + w.body.loginReward);
    expect(w.body.freePacks.available).toBe(2);
  });
});
