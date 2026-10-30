import type {
  AdminBannerInput, AdminCountryDTO, AdminStatsDTO, AdminUserDTO, BannerDTO, BattleAction, BattleDTO, CardDTO, CollectionDTO,
  ComplianceDTO, CosmeticDTO, Currency, DeckDTO, Faction, LedgerDTO, LoginInput, MeDTO, MissionDTO, OpenPackDTO, PlayerSearchDTO,
  PullDTO, PullSource, Rarity, RatesDTO, RegisterInput, ShopProductDTO, TradeCreateInput, TradeDTO, WalletDTO,
} from '@nocturne/shared';

export type TradeAction = 'accept' | 'confirm' | 'decline' | 'cancel';

export interface AdminPack { id: string; code: string; name: string; priceEmbers: number | null; priceShards: number | null; slots: Partial<Record<Rarity, number>>[] }
export interface AdminBanner extends AdminBannerInput { id: string; packCode: string }
export interface AdminCard { id: string; code: string; name: string; rarity: Rarity; hp: number; attack: number; lore: string; imageUrl: string | null; active: boolean; craftable: boolean; abilityValue: number; faction: Faction }
export interface AdminLedgerRow { id: string; currency: Currency; amount: number; reason: string; note: string | null; createdAt: string; user?: { displayName: string } }
export interface AdminAuditRow { id: string; action: string; target: string | null; createdAt: string; actor: { displayName: string } | null; payload: unknown }

export interface AdminApi {
  stats(): Promise<AdminStatsDTO>;
  users(q: string): Promise<AdminUserDTO[]>;
  userLedger(id: string): Promise<AdminLedgerRow[]>;
  grant(id: string, currency: Currency, amount: number, note: string): Promise<void>;
  block(id: string, blocked: boolean, reason?: string): Promise<void>;
  pass(id: string, days: number): Promise<void>;
  cards(): Promise<AdminCard[]>;
  updateCard(id: string, patch: Partial<AdminCard>): Promise<void>;
  packs(): Promise<AdminPack[]>;
  setRates(code: string, slots: Partial<Record<Rarity, number>>[]): Promise<void>;
  banners(): Promise<AdminBanner[]>;
  saveBanner(input: AdminBannerInput & { packCode?: string }): Promise<void>;
  countries(): Promise<AdminCountryDTO[]>;
  setCountry(c: AdminCountryDTO): Promise<void>;
  settings(): Promise<Record<string, unknown>>;
  setSetting(key: string, value: number): Promise<void>;
  transactions(): Promise<AdminLedgerRow[]>;
  audit(): Promise<AdminAuditRow[]>;
}

export interface Api {
  mode: 'http' | 'demo';
  me(): Promise<MeDTO | null>;
  register(i: RegisterInput): Promise<MeDTO>;
  login(i: LoginInput): Promise<MeDTO>;
  logout(): Promise<void>;
  verify(token: string): Promise<MeDTO>;
  resend(): Promise<void>;
  forgot(email: string): Promise<void>;
  reset(token: string, password: string): Promise<void>;

  cards(): Promise<CardDTO[]>;
  banners(): Promise<BannerDTO[]>;
  rates(bannerId: string): Promise<RatesDTO>;
  open(bannerId: string, source: PullSource): Promise<OpenPackDTO>;
  pulls(): Promise<PullDTO[]>;

  wallet(): Promise<WalletDTO>;
  ledger(): Promise<LedgerDTO[]>;
  collection(): Promise<CollectionDTO>;
  recycle(cardId?: string): Promise<{ dust: number; count: number }>;
  craft(cardId: string): Promise<{ cost: number }>;

  missions(): Promise<MissionDTO[]>;
  claimMission(id: string): Promise<MissionDTO[]>;

  trades(): Promise<TradeDTO[]>;
  createTrade(i: TradeCreateInput): Promise<TradeDTO>;
  tradeAction(id: string, action: TradeAction): Promise<TradeDTO>;
  player(name: string): Promise<PlayerSearchDTO>;

  cosmetics(): Promise<CosmeticDTO[]>;
  buyCosmetic(code: string): Promise<CosmeticDTO[]>;
  equipCosmetic(code: string): Promise<CosmeticDTO[]>;
  products(): Promise<ShopProductDTO[]>;
  compliance(): Promise<ComplianceDTO>;

  updateSettings(s: { monthlySpendCapCents: number | null }): Promise<MeDTO>;
  exportData(): Promise<unknown>;
  deleteAccount(password: string): Promise<void>;

  decks(): Promise<DeckDTO[]>;
  saveDeck(id: string | null, name: string, cards: string[]): Promise<DeckDTO>;
  deleteDeck(id: string): Promise<void>;
  activeBattle(): Promise<BattleDTO | null>;
  startBattle(deckId: string): Promise<BattleDTO>;
  battleAction(id: string, action: BattleAction): Promise<BattleDTO>;
  abandonBattle(id: string): Promise<void>;

  admin: AdminApi;

  /** Démo uniquement : simule ce qui dépend d'un vrai serveur (emails, paiements). */
  demo?: {
    lastMail(): { subject: string; text: string; link: string | null } | null;
    setPass(active: boolean): Promise<void>;
    setAdmin(active: boolean): Promise<void>;
    reset(): void;
  };
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}
