import type { BattleAction, BattleState } from './battle';
import type { CosmeticKind, FreePackState, MissionKind } from './economy';
import type { RateTable } from './gacha';
import type { CardDef, Currency, Rarity } from './types';

export interface CardDTO extends CardDef { id: string; set: string; abilityText: string }

export interface MeDTO {
  id: string;
  email: string;
  displayName: string;
  role: 'PLAYER' | 'ADMIN';
  emailVerified: boolean;
  country: string;
  age: number;
  isMinor: boolean;
  parentalConsent: boolean;
  monthlySpendCapCents: number | null;
  pass: { active: boolean; until: string | null; cancelAtPeriodEnd: boolean };
  avatar: string | null;
  cardBack: string | null;
  frame: string | null;
  title: string | null;
  createdAt: string;
}

export type Balances = Record<Currency, number>;

export interface WalletDTO {
  balances: Balances;
  freePacks: FreePackState;
  loginStreak: number;
  loginReward: number | null;
}

export interface PityDTO { sinceEpic: number; sinceLegendary: number; totalPacks: number; epicEvery: number; legendaryAt: number }

export interface BannerDTO {
  id: string;
  code: string;
  name: string;
  description: string;
  theme: string;
  startsAt: string;
  endsAt: string | null;
  packName: string;
  priceEmbers: number | null;
  priceShards: number | null;
  featured: string[];
  featuredShare: number;
  pity: PityDTO;
  paidPacksAllowed: boolean;
}

export type RatesDTO = RateTable & { bannerId: string };

export type PullSource = 'FREE' | 'EMBERS' | 'SHARDS';

export interface PullCardDTO { slot: number; cardId: string; rarity: Rarity; isNew: boolean }

export interface PullDTO { id: string; bannerId: string; bannerName: string; source: PullSource; pity: string | null; createdAt: string; cards: PullCardDTO[] }

export interface OpenPackDTO { pull: PullDTO; wallet: WalletDTO; pity: PityDTO }

export type CollectionDTO = Record<string, number>;

export interface TradeUserDTO { id: string; displayName: string }

export interface TradeItemDTO { cardId: string; quantity: number }

export interface TradeDTO {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED' | 'CANCELLED';
  proposer: TradeUserDTO;
  receiver: TradeUserDTO;
  give: TradeItemDTO[];
  get: TradeItemDTO[];
  message: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeCreateInput { receiverName: string; give: TradeItemDTO[]; get: TradeItemDTO[]; message?: string }

export interface PlayerSearchDTO { id: string; displayName: string; cards: CollectionDTO }

export interface MissionDTO { id: string; code: string; title: string; period: 'DAILY' | 'WEEKLY'; kind: MissionKind; target: number; progress: number; claimed: boolean; rewardEmbers: number; rewardDust: number; periodKey: string; resetsAt: string }

export interface CosmeticDTO { id: string; code: string; name: string; kind: CosmeticKind; priceEmbers: number | null; passExclusive: boolean; owned: boolean; equipped: boolean }

export interface ShopProductDTO { code: string; name: string; kind: 'SHARDS' | 'PASS'; priceCents: number; shards: number; available: boolean; reason: string | null }

export interface LedgerDTO { id: string; currency: Currency; amount: number; reason: string; note: string | null; createdAt: string }

export interface DeckDTO { id: string; name: string; cards: string[] }

export interface BattleDTO { id: string; status: 'ACTIVE' | 'WON' | 'LOST' | 'ABANDONED'; state: BattleState; reward: { embers: number; dust: number } | null }

export interface BattleActionInput { action: BattleAction }

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  birthDate: string;
  country: string;
  acceptTerms: boolean;
  parentalConsent?: boolean;
  parentEmail?: string;
}

export interface LoginInput { email: string; password: string }

export interface ComplianceDTO { country: string; paidPacksEnabled: boolean; purchasesEnabled: boolean; isMinor: boolean; canPurchase: boolean; reason: string | null; spentThisMonthCents: number; capCents: number | null }

export interface AdminStatsDTO { users: number; pullsToday: number; pullsTotal: number; trades: number; ledgerEntries: number; byRarity: Record<Rarity, number> }

export interface AdminUserDTO { id: string; email: string; displayName: string; role: string; country: string; age: number; createdAt: string; blocked: boolean; balances: Balances; pulls: number }

export interface AdminBannerInput { code: string; name: string; description: string; startsAt: string; endsAt: string | null; featuredShare: number; epicPityEvery: number; legendaryPityAt: number; theme: string; featured: string[]; active: boolean }

export interface AdminSlotRatesDTO { packCode: string; slots: Partial<Record<Rarity, number>>[] }

export interface AdminCountryDTO { country: string; paidPacksEnabled: boolean; purchasesEnabled: boolean }
