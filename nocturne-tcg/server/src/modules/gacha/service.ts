import type { Banner, PullSource } from '@prisma/client';
import { openPack, rateTable, rollReverse, consumeFreePack, type BannerConfig, type BannerDTO, type OpenPackDTO, type PityDTO, type PullDTO, type RatesDTO, type SlotRates } from '@nocturne/shared';
import { lockUsers, prisma, transaction, type Tx } from '../../db';
import { bad, forbidden, notFound } from '../../lib/http';
import { cryptoRng } from '../../lib/rng';
import { countryConfig } from '../account/compliance';
import { debit } from '../economy/ledger';
import { freePacksMax, passActive } from '../economy/pass';
import { walletTx } from '../economy/wallet';
import { track } from '../missions/service';

const bannerInclude = { featured: true, packType: { include: { slots: { include: { rates: true }, orderBy: { index: 'asc' as const } } } } };

async function loadBanner(tx: Tx, bannerId: string) {
  const b = await tx.banner.findUnique({ where: { id: bannerId }, include: bannerInclude });
  if (!b) throw notFound('Bannière introuvable');
  return b;
}

type FullBanner = Awaited<ReturnType<typeof loadBanner>>;

export const isOpen = (b: Banner, now = new Date()) => b.active && b.startsAt <= now && (!b.endsAt || b.endsAt > now);

async function config(tx: Tx, b: FullBanner): Promise<BannerConfig> {
  const pool = await tx.card.findMany({ where: { setId: b.packType.setId, active: true }, select: { id: true, rarity: true } });
  return {
    slots: b.packType.slots.map(s => Object.fromEntries(s.rates.map(r => [r.rarity, r.weight])) as SlotRates),
    pool,
    featuredIds: b.featured.map(f => f.cardId),
    featuredShare: b.featuredShare,
    epicPityEvery: b.epicPityEvery,
    legendaryPityAt: b.legendaryPityAt,
  };
}

function pityDto(b: Banner, p?: { sinceEpic: number; sinceLegendary: number; totalPacks: number } | null): PityDTO {
  return { sinceEpic: p?.sinceEpic ?? 0, sinceLegendary: p?.sinceLegendary ?? 0, totalPacks: p?.totalPacks ?? 0, epicEvery: b.epicPityEvery, legendaryAt: b.legendaryPityAt };
}

export async function listBanners(userId: string | null, country: string | null, now = new Date()): Promise<BannerDTO[]> {
  const banners = await prisma.banner.findMany({ where: { active: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] }, include: { featured: true, packType: true }, orderBy: [{ endsAt: { sort: 'asc', nulls: 'last' } }] });
  const pity = userId ? await prisma.pityCounter.findMany({ where: { userId } }) : [];
  const paid = country ? (await countryConfig(prisma, country)).paidPacksEnabled : true;
  return banners.map(b => ({
    id: b.id, code: b.code, name: b.name, description: b.description, theme: b.theme,
    startsAt: b.startsAt.toISOString(), endsAt: b.endsAt?.toISOString() ?? null,
    packName: b.packType.name, priceEmbers: b.packType.priceEmbers, priceShards: b.packType.priceShards,
    featured: b.featured.map(f => f.cardId), featuredShare: b.featuredShare,
    pity: pityDto(b, pity.find(p => p.bannerId === b.id)), paidPacksAllowed: paid,
  }));
}

export async function bannerRates(bannerId: string): Promise<RatesDTO> {
  const b = await loadBanner(prisma, bannerId);
  return { bannerId, reversePercent: b.packType.reverseChance / 1000, ...rateTable(await config(prisma, b)) };
}

const pullDto = (p: { id: string; bannerId: string; source: PullSource; pity: string | null; createdAt: Date; banner: { name: string }; cards: { slot: number; cardId: string; isNew: boolean; reverse: boolean; card: { rarity: PullDTO['cards'][number]['rarity'] } }[] }): PullDTO => ({
  id: p.id, bannerId: p.bannerId, bannerName: p.banner.name, source: p.source, pity: p.pity, createdAt: p.createdAt.toISOString(),
  cards: [...p.cards].sort((a, b) => a.slot - b.slot).map(c => ({ slot: c.slot, cardId: c.cardId, rarity: c.card.rarity, isNew: c.isNew, reverse: c.reverse })),
});

export function open(userId: string, bannerId: string, source: PullSource, now = new Date()): Promise<OpenPackDTO> {
  return transaction(async tx => {
    await lockUsers(tx, userId);
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, include: { subscription: true } });
    const banner = await loadBanner(tx, bannerId);
    if (!isOpen(banner, now)) throw bad('Cette bannière n’est pas disponible');

    if (source === 'FREE') {
      const next = consumeFreePack(user.freePacks, user.freePacksUpdatedAt, now, freePacksMax(passActive(user.subscription, now)));
      if (!next) throw bad('Aucun booster gratuit disponible', 'NO_FREE_PACK');
      await tx.user.update({ where: { id: userId }, data: { freePacks: next.stored, freePacksUpdatedAt: next.updatedAt } });
    } else if (source === 'EMBERS') {
      if (banner.packType.priceEmbers == null) throw bad('Ce booster ne s’achète pas en Braises');
      await debit(tx, userId, 'EMBERS', banner.packType.priceEmbers, 'PACK_OPEN', { refType: 'banner', refId: bannerId });
    } else {
      if (banner.packType.priceShards == null) throw bad('Ce booster ne s’achète pas en Éclats');
      if (!(await countryConfig(tx, user.country)).paidPacksEnabled) throw forbidden('Les boosters payants sont désactivés dans ton pays');
      await debit(tx, userId, 'SHARDS', banner.packType.priceShards, 'PACK_OPEN', { refType: 'banner', refId: bannerId });
    }

    const key = { userId_bannerId: { userId, bannerId } };
    const pity = await tx.pityCounter.upsert({ where: key, create: { userId, bannerId }, update: {} });
    const result = openPack(await config(tx, banner), pity, cryptoRng);
    const newPity = await tx.pityCounter.update({ where: key, data: { ...result.pity, totalPacks: { increment: 1 } } });

    const ids = result.cards.map(c => c.cardId);
    const owned = new Map((await tx.userCard.findMany({ where: { userId, cardId: { in: ids } } })).map(c => [c.cardId, c.quantity]));
    const classics = new Set((await tx.card.findMany({ where: { id: { in: ids }, variant: 'NORMAL' }, select: { id: true } })).map(c => c.id));
    const reverseSlot = rollReverse(result.cards, c => classics.has(c.cardId), banner.packType.reverseChance, cryptoRng);
    const seen = new Set<string>();
    const cards = result.cards.map(c => {
      const isNew = !(owned.get(c.cardId) ?? 0) && !seen.has(c.cardId);
      seen.add(c.cardId);
      return { ...c, isNew, reverse: c.slot === reverseSlot };
    });
    for (const c of cards) {
      const rev = c.reverse ? 1 : 0;
      await tx.userCard.upsert({
        where: { userId_cardId: { userId, cardId: c.cardId } },
        create: { userId, cardId: c.cardId, quantity: 1, reverseQty: rev },
        update: { quantity: { increment: 1 }, reverseQty: { increment: rev } },
      });
    }
    const pull = await tx.pull.create({
      data: { userId, bannerId, source, pity: result.pityTriggered, cards: { create: cards.map(c => ({ slot: c.slot, cardId: c.cardId, isNew: c.isNew, reverse: c.reverse })) } },
      include: { banner: { select: { name: true } }, cards: { include: { card: { select: { rarity: true } } } } },
    });
    await track(tx, userId, 'OPEN_PACKS', 1, now);
    return { pull: pullDto(pull), wallet: await walletTx(tx, userId, now), pity: pityDto(banner, newPity) };
  });
}

export async function history(userId: string, limit = 50, before?: string): Promise<PullDTO[]> {
  const pulls = await prisma.pull.findMany({
    where: { userId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
    orderBy: { createdAt: 'desc' }, take: limit,
    include: { banner: { select: { name: true } }, cards: { include: { card: { select: { rarity: true } } } } },
  });
  return pulls.map(pullDto);
}
