import { beforeEach, describe, expect, it } from 'vitest';
import { demoApi as api } from '../src/api/demo';

const reg = (name: string, birthDate = '2000-01-01') =>
  api.register({ email: `${name}@t.dev`, password: 'motdepasse-solide', displayName: name, birthDate, country: 'FR', acceptTerms: true });

describe('API de démo (même moteur que le serveur)', () => {
  beforeEach(() => { api.demo!.reset(); });

  it('inscription, bonus de bienvenue et boosters gratuits', async () => {
    const me = await reg('Alpha');
    expect(me.emailVerified).toBe(false);
    const w = await api.wallet();
    expect(w.balances.EMBERS).toBe(220);
    const banner = (await api.banners())[0]!;
    await api.open(banner.id, 'FREE');
    await api.open(banner.id, 'FREE');
    await expect(api.open(banner.id, 'FREE')).rejects.toThrow(/gratuit/);
    const col = await api.collection();
    expect(Object.values(col).reduce((a, b) => a + b, 0)).toBe(10);
  });

  it('refuse les moins de 13 ans', async () => {
    await expect(reg('Kid', '2020-01-01')).rejects.toThrow(/13 ans/);
  });

  it('vérification email via la boîte simulée puis échange avec un joueur simulé', async () => {
    await reg('Beta');
    const link = api.demo!.lastMail()!.link!;
    await api.verify(new URLSearchParams(link.split('?')[1]).get('token')!);
    const banner = (await api.banners())[0]!;
    await api.open(banner.id, 'FREE');
    const mine = Object.keys(await api.collection())[0]!;
    const bot = await api.player('Morgane');
    const theirs = Object.keys(bot.cards)[0]!;
    const t = await api.createTrade({ receiverName: 'Morgane', give: [{ cardId: mine, quantity: 1 }], get: [{ cardId: theirs, quantity: 1 }] });
    expect(t.status).toBe('PENDING');
  });

  it('pitié affichée et incrémentée par bannière', async () => {
    await reg('Gamma');
    const [b] = await api.banners();
    const r = await api.open(b!.id, 'FREE');
    expect(r.pity.totalPacks).toBe(1);
    expect(r.pity.epicEvery).toBe(10);
  });
});
