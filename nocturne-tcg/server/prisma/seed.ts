import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_COSMETICS, DEFAULT_MISSIONS, DEFAULT_SHOP, DEFAULT_SLOTS, PACK_PRICE_EMBERS, PACK_PRICE_SHARDS, SET1, SET1_CARDS, abilityText } from '@nocturne/shared';

const prisma = new PrismaClient();
const DAY = 86_400_000;

export async function seed(db = prisma, opts: { demoPlayers?: boolean } = {}) {
  const set = await db.cardSet.upsert({ where: { code: SET1.code }, create: { code: SET1.code, name: SET1.name, releasedAt: new Date(SET1.releasedAt) }, update: { name: SET1.name } });

  for (const c of SET1_CARDS) {
    const data = {
      setId: set.id, number: c.number, name: c.name, rarity: c.rarity, faction: c.faction, hp: c.hp, attack: c.attack,
      abilityKey: c.abilityKey, abilityName: c.abilityName, abilityText: abilityText(c.abilityKey, c.abilityValue), abilityValue: c.abilityValue,
      lore: c.lore, imageUrl: c.imageUrl, silhouette: c.silhouette, variant: c.variant, form: c.form, pairCode: c.pairCode, baseCode: c.baseCode, craftable: c.craftable,
    };
    await db.card.upsert({ where: { code: c.code }, create: { id: c.code, code: c.code, ...data }, update: data });
  }

  const pack = await db.packType.upsert({
    where: { code: 'NE1_STANDARD' },
    create: { code: 'NE1_STANDARD', name: 'Booster Nuit Éternelle', setId: set.id, priceEmbers: PACK_PRICE_EMBERS, priceShards: PACK_PRICE_SHARDS },
    update: {},
  });
  if (!(await db.packSlot.count({ where: { packTypeId: pack.id } }))) {
    for (const [index, rates] of DEFAULT_SLOTS.entries()) {
      await db.packSlot.create({ data: { packTypeId: pack.id, index, rates: { create: Object.entries(rates).map(([rarity, weight]) => ({ rarity: rarity as never, weight: weight! })) } } });
    }
  }

  const now = Date.now();
  const banners = [
    { code: 'NE1_STANDARD', name: 'Nuit Éternelle', description: 'Le booster permanent du Set 1 : toutes les cartes, taux standard.', theme: 'night', startsAt: new Date(SET1.releasedAt), endsAt: null, featuredShare: 0, featured: [] as string[] },
    { code: 'BLOOD_MOON', name: 'Lune de Sang', description: 'Taux augmenté : Dracula, Bête de la Nuit et Carmilla, Rose de Sang.', theme: 'blood', startsAt: new Date(now - DAY), endsAt: new Date(now + 14 * DAY), featuredShare: 50_000, featured: ['NE1-012', 'NE1-011'] },
    { code: 'RLYEH_TIDE', name: 'Marée de R’lyeh', description: 'Taux augmenté : Cthulhu et le Kraken remontent des abysses.', theme: 'abyss', startsAt: new Date(now - DAY), endsAt: new Date(now + 7 * DAY), featuredShare: 50_000, featured: ['NE1-026', 'NE1-025'] },
  ];
  for (const { featured, ...b } of banners) {
    const banner = await db.banner.upsert({ where: { code: b.code }, create: { ...b, packTypeId: pack.id }, update: {} });
    if (!(await db.bannerFeature.count({ where: { bannerId: banner.id } }))) await db.bannerFeature.createMany({ data: featured.map(cardId => ({ bannerId: banner.id, cardId })) });
  }

  for (const m of DEFAULT_MISSIONS) await db.mission.upsert({ where: { code: m.code }, create: m, update: { title: m.title, target: m.target, rewardEmbers: m.rewardEmbers, rewardDust: m.rewardDust } });
  for (const c of DEFAULT_COSMETICS) await db.cosmetic.upsert({ where: { code: c.code }, create: c, update: { name: c.name, priceEmbers: c.priceEmbers, passExclusive: c.passExclusive } });
  for (const p of DEFAULT_SHOP) await db.shopProduct.upsert({ where: { code: p.code }, create: p, update: { name: p.name, priceCents: p.priceCents, shards: p.shards } });
  await db.countryConfig.upsert({ where: { country: 'BE' }, create: { country: 'BE', paidPacksEnabled: false, purchasesEnabled: true }, update: {} });
  await db.setting.upsert({ where: { key: 'minorDefaultCapCents' }, create: { key: 'minorDefaultCapCents', value: 3000 }, update: {} });

  const adminEmail = process.env.ADMIN_EMAIL, adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await db.user.upsert({
      where: { email: adminEmail },
      create: { email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), displayName: 'Gardien', birthDate: new Date('1990-01-01'), country: 'FR', role: 'ADMIN', emailVerifiedAt: new Date(), acceptedTermsAt: new Date() },
      update: { role: 'ADMIN' },
    });
  }

  if (opts.demoPlayers) {
    const hash = await bcrypt.hash('demo-nocturne-2026', 10);
    for (const [i, name] of ['Morgane', 'Corvus', 'Lilas_Noir'].entries()) {
      const u = await db.user.upsert({
        where: { email: `${name.toLowerCase()}@demo.nocturne` },
        create: { email: `${name.toLowerCase()}@demo.nocturne`, passwordHash: hash, displayName: name, birthDate: new Date('2000-05-05'), country: 'FR', emailVerifiedAt: new Date(), acceptedTermsAt: new Date() },
        update: {},
      });
      if (!(await db.userCard.count({ where: { userId: u.id } }))) {
        const picks = SET1_CARDS.filter((_, k) => (k + i) % 3 === 0 && SET1_CARDS[k]!.rarity !== 'SECRET');
        await db.userCard.createMany({ data: picks.map(c => ({ userId: u.id, cardId: c.code, quantity: 1 + ((c.number + i) % 3) })) });
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed(prisma, { demoPlayers: process.env.NODE_ENV !== 'production' })
    .then(() => console.info('Seed terminé'))
    .finally(() => prisma.$disconnect());
}
