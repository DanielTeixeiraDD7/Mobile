/**
 * Backend de démonstration exécuté dans le navigateur (GitHub Pages) : mêmes règles que l'API,
 * même moteur partagé (tirage, pitié, combat), données en localStorage. Ne sert qu'à tester l'interface.
 */
import {
  ADULT_AGE, CRAFT_COST, DEFAULT_REVERSE_CHANCE, reverseKey, rollReverse, DAILY_LOGIN_EMBERS, DEFAULT_COSMETICS, DEFAULT_MINOR_CAP_CENTS, DEFAULT_MISSIONS, DEFAULT_SHOP, DEFAULT_SLOTS,
  FREE_PACKS_PER_DAY, MIN_AGE, PACK_PRICE_EMBERS, PACK_PRICE_SHARDS, PASS_FREE_PACKS_PER_DAY, RARITIES, SET1, SET1_CARDS, STREAK_BONUS_EMBERS,
  STREAK_BONUS_EVERY, WELCOME_EMBERS, abilityText, ageOn, buildEnemyDeck, consumeFreePack, createBattle, dayKey, dustFor, freePackState,
  openPack, periodKey, playerStep, rateTable, validateDeck,
  type AdminCountryDTO, type Balances, type BannerConfig, type BannerDTO, type BattleCard, type BattleDTO, type BattleState, type CardDTO,
  type CardLookup, type CollectionDTO, type ComplianceDTO, type CosmeticDTO, type Currency, type DeckDTO, type MeDTO, type MissionDTO,
  type MissionKind, type PullCardDTO, type PullDTO, type PullSource, type Rarity, type Rng, type SlotRates, type TradeDTO, type TradeItemDTO,
  type WalletDTO,
} from '@nocturne/shared';
import type { AdminAuditRow, AdminBanner, AdminCard, AdminLedgerRow, Api } from '../types';
import { ApiError } from '../types';

const KEY = 'nocturne-demo-v1';
const DAY = 86_400_000;
const BOTS = ['Morgane', 'Corvus', 'Lilas_Noir'];

interface DUser {
  id: string; email: string; passwordHash: string; displayName: string; birthDate: string; country: string; role: 'PLAYER' | 'ADMIN';
  emailVerifiedAt: string | null; parentalConsentAt: string | null; parentEmail: string | null; monthlySpendCapCents: number | null;
  freePacks: number; freePacksUpdatedAt: string; avatar: string | null; cardBack: string | null; frame: string | null; title: string | null;
  passUntil: string | null; createdAt: string; blockedAt: string | null; bot?: boolean;
}
interface DLedger { id: string; userId: string; currency: Currency; amount: number; reason: string; note: string | null; createdAt: string }
interface DPull { id: string; userId: string; bannerId: string; source: PullSource; pity: string | null; createdAt: string; cards: PullCardDTO[] }
interface DTrade { id: string; proposerId: string; receiverId: string; status: TradeDTO['status']; give: TradeItemDTO[]; get: TradeItemDTO[]; message: string | null; createdAt: string; updatedAt: string }
interface DBattle { id: string; userId: string; status: BattleDTO['status']; state: BattleState; createdAt: string; updatedAt: string }
interface DBanner extends AdminBanner { packCode: string }
interface DB {
  v: 1;
  session: string | null;
  users: DUser[];
  cards: Record<string, Record<string, number>>;
  ledger: DLedger[];
  pity: Record<string, { sinceEpic: number; sinceLegendary: number; totalPacks: number }>;
  pulls: DPull[];
  logins: Record<string, string[]>;
  missions: Record<string, { progress: number; claimedAt: string | null }>;
  trades: DTrade[];
  owned: Record<string, string[]>;
  decks: (DeckDTO & { userId: string })[];
  battles: DBattle[];
  tokens: { token: string; userId: string; type: 'VERIFY' | 'RESET'; expiresAt: string; used: boolean }[];
  mails: { to: string; subject: string; text: string; link: string | null }[];
  slots: SlotRates[];
  prices: { embers: number | null; shards: number | null };
  banners: DBanner[];
  countries: AdminCountryDTO[];
  settings: { minorDefaultCapCents: number };
  overrides: Record<string, Partial<AdminCard>>;
  audit: AdminAuditRow[];
}

const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 20);
const nowIso = () => new Date().toISOString();
const err = (status: number, msg: string, code?: string) => new ApiError(status, msg, code);
const wait = () => new Promise(r => setTimeout(r, 60 + Math.random() * 90));
const clone = <T>(v: T): T => structuredClone(v);

const cryptoRng: Rng = {
  int(max) {
    const limit = Math.floor(0x1_0000_0000 / max) * max;
    const buf = new Uint32Array(1);
    do crypto.getRandomValues(buf); while (buf[0]! >= limit);
    return buf[0]! % max;
  },
};

async function hashPw(pw: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`nocturne:${pw}`));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function fresh(): DB {
  const t = Date.now();
  const db: DB = {
    v: 1, session: null, users: [], cards: {}, ledger: [], pity: {}, pulls: [], logins: {}, missions: {}, trades: [], owned: {}, decks: [], battles: [],
    tokens: [], mails: [], slots: clone(DEFAULT_SLOTS), prices: { embers: PACK_PRICE_EMBERS, shards: PACK_PRICE_SHARDS },
    banners: [
      { id: 'NE1_STANDARD', code: 'NE1_STANDARD', name: 'Nuit Éternelle', description: 'Le booster permanent du Set 1 : toutes les cartes, taux standard.', theme: 'night', startsAt: SET1.releasedAt, endsAt: null, featuredShare: 0, epicPityEvery: 10, legendaryPityAt: 100, featured: [], active: true, packCode: 'NE1_STANDARD' },
      { id: 'BLOOD_MOON', code: 'BLOOD_MOON', name: 'Lune de Sang', description: 'Taux augmenté : Dracula, Bête de la Nuit et Carmilla, Rose de Sang.', theme: 'blood', startsAt: new Date(t - DAY).toISOString(), endsAt: new Date(t + 14 * DAY).toISOString(), featuredShare: 50_000, epicPityEvery: 10, legendaryPityAt: 100, featured: ['NE1-012', 'NE1-011'], active: true, packCode: 'NE1_STANDARD' },
      { id: 'RLYEH_TIDE', code: 'RLYEH_TIDE', name: 'Marée de R’lyeh', description: 'Taux augmenté : Cthulhu et le Kraken remontent des abysses.', theme: 'abyss', startsAt: new Date(t - DAY).toISOString(), endsAt: new Date(t + 7 * DAY).toISOString(), featuredShare: 50_000, epicPityEvery: 10, legendaryPityAt: 100, featured: ['NE1-026', 'NE1-025'], active: true, packCode: 'NE1_STANDARD' },
    ],
    countries: [{ country: 'BE', paidPacksEnabled: false, purchasesEnabled: true }],
    settings: { minorDefaultCapCents: DEFAULT_MINOR_CAP_CENTS },
    overrides: {},
    audit: [],
  };
  BOTS.forEach((name, i) => {
    const id = `bot-${name.toLowerCase()}`;
    db.users.push({ id, email: `${name.toLowerCase()}@demo.nocturne`, passwordHash: '', displayName: name, birthDate: '2000-05-05', country: 'FR', role: 'PLAYER', emailVerifiedAt: nowIso(), parentalConsentAt: null, parentEmail: null, monthlySpendCapCents: null, freePacks: 2, freePacksUpdatedAt: nowIso(), avatar: 'AV_WOLF', cardBack: 'BACK_CLASSIC', frame: null, title: null, passUntil: null, createdAt: nowIso(), blockedAt: null, bot: true });
    db.cards[id] = Object.fromEntries(SET1_CARDS.filter((c, k) => (k + i) % 3 === 0 && c.rarity !== 'SECRET').map(c => [c.code, 1 + ((c.number + i) % 3)]));
  });
  return db;
}

let db: DB = load();

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as DB;
      if (d.v === 1) return d;
    }
  } catch { /* stockage indisponible */ }
  return fresh();
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* quota / navigation privée */ }
}

function current(): DUser {
  const u = db.users.find(x => x.id === db.session);
  if (!u) throw err(401, 'Connexion requise');
  if (u.blockedAt) throw err(403, 'Compte suspendu');
  return u;
}

function verified(u: DUser) {
  if (!u.emailVerifiedAt) throw err(403, 'Vérifie ton adresse email pour utiliser cette fonction');
}

const passActive = (u: DUser) => !!u.passUntil && new Date(u.passUntil) > new Date();

function cardList(): CardDTO[] {
  return SET1_CARDS.map(c => ({ ...c, ...db.overrides[c.code], id: c.code, set: SET1.code }))
    .filter(c => (c as { active?: boolean }).active !== false)
    .map(c => ({ ...c, abilityText: abilityText(c.abilityKey, c.abilityValue) }));
}
const cardById = (id: string) => cardList().find(c => c.id === id);

function balances(userId: string): Balances {
  const b: Balances = { SHARDS: 0, EMBERS: 0, DUST: 0 };
  for (const e of db.ledger) if (e.userId === userId) b[e.currency] += e.amount;
  return b;
}

function post(userId: string, entries: { currency: Currency; amount: number; reason: string; note?: string }[]) {
  const list = entries.filter(e => e.amount);
  const b = balances(userId);
  for (const e of list) b[e.currency] += e.amount;
  if (list.some(e => e.amount < 0) && Object.values(b).some(v => v < 0)) throw err(400, 'Solde insuffisant', 'INSUFFICIENT_FUNDS');
  for (const e of list) db.ledger.push({ id: uid(), userId, currency: e.currency, amount: e.amount, reason: e.reason, note: e.note ?? null, createdAt: nowIso() });
}

function track(userId: string, kind: MissionKind, amount = 1) {
  for (const m of DEFAULT_MISSIONS.filter(x => x.kind === kind)) {
    const k = `${userId}:${m.code}:${periodKey(m.period, new Date())}`;
    db.missions[k] = { progress: (db.missions[k]?.progress ?? 0) + amount, claimedAt: db.missions[k]?.claimedAt ?? null };
  }
}

function addCard(userId: string, cardId: string, n = 1) {
  const c = (db.cards[userId] ??= {});
  c[cardId] = (c[cardId] ?? 0) + n;
  if (c[cardId]! <= 0) delete c[cardId];
  const rk = reverseKey(cardId);
  if (!cardId.endsWith('#R') && (c[rk] ?? 0) > (c[cardId] ?? 0)) c[rk] = c[cardId] ?? 0;
  if (c[rk] === 0) delete c[rk];
}

function compliance(u: DUser): ComplianceDTO {
  const cfg = db.countries.find(c => c.country === u.country) ?? { country: u.country, paidPacksEnabled: true, purchasesEnabled: true };
  const isMinor = ageOn(new Date(u.birthDate), new Date()) < ADULT_AGE;
  const caps = [u.monthlySpendCapCents, isMinor ? db.settings.minorDefaultCapCents : null].filter((x): x is number => x != null);
  let reason: string | null = null;
  if (!cfg.purchasesEnabled) reason = 'Les achats ne sont pas disponibles dans ton pays.';
  else if (isMinor && !u.parentalConsentAt) reason = 'Achats réservés aux majeurs ou avec accord parental.';
  else if (!u.emailVerifiedAt) reason = 'Vérifie ton adresse email avant tout achat.';
  return { country: u.country, paidPacksEnabled: cfg.paidPacksEnabled, purchasesEnabled: cfg.purchasesEnabled, isMinor, canPurchase: !reason, reason, spentThisMonthCents: 0, capCents: caps.length ? Math.min(...caps) : null };
}

function meDto(u: DUser): MeDTO {
  const age = ageOn(new Date(u.birthDate), new Date());
  return {
    id: u.id, email: u.email, displayName: u.displayName, role: u.role, emailVerified: !!u.emailVerifiedAt, country: u.country, age,
    isMinor: age < ADULT_AGE, parentalConsent: !!u.parentalConsentAt, monthlySpendCapCents: u.monthlySpendCapCents,
    pass: { active: passActive(u), until: u.passUntil, cancelAtPeriodEnd: false },
    avatar: u.avatar, cardBack: u.cardBack, frame: u.frame, title: u.title, createdAt: u.createdAt,
  };
}

function walletDto(u: DUser, loginReward: number | null = null): WalletDTO {
  const days = new Set(db.logins[u.id] ?? []);
  let streak = 0;
  const d = new Date(dayKey(new Date()));
  while (days.has(dayKey(d))) { streak++; d.setUTCDate(d.getUTCDate() - 1); }
  return {
    balances: balances(u.id),
    freePacks: freePackState(u.freePacks, new Date(u.freePacksUpdatedAt), new Date(), passActive(u) ? PASS_FREE_PACKS_PER_DAY : FREE_PACKS_PER_DAY),
    loginStreak: streak, loginReward,
  };
}

const isOpen = (b: DBanner, now = new Date()) => b.active && new Date(b.startsAt) <= now && (!b.endsAt || new Date(b.endsAt) > now);

function bannerConfig(b: DBanner): BannerConfig {
  return { slots: db.slots, pool: cardList().map(c => ({ id: c.id, rarity: c.rarity })), featuredIds: b.featured, featuredShare: b.featuredShare, epicPityEvery: b.epicPityEvery, legendaryPityAt: b.legendaryPityAt };
}

function pityOf(userId: string, b: DBanner) {
  const p = db.pity[`${userId}:${b.id}`] ?? { sinceEpic: 0, sinceLegendary: 0, totalPacks: 0 };
  return { ...p, epicEvery: b.epicPityEvery, legendaryAt: b.legendaryPityAt };
}

function sendMail(u: DUser, type: 'VERIFY' | 'RESET') {
  const token = uid() + uid();
  db.tokens.push({ token, userId: u.id, type, expiresAt: new Date(Date.now() + (type === 'VERIFY' ? 2 * DAY : DAY / 24)).toISOString(), used: false });
  const link = `#/${type === 'VERIFY' ? 'verifier' : 'mot-de-passe'}?token=${token}`;
  db.mails.push(type === 'VERIFY'
    ? { to: u.email, subject: 'Confirme ton adresse — Nocturne', text: `Bonsoir ${u.displayName}, confirme ton adresse pour débloquer les échanges et la boutique.`, link }
    : { to: u.email, subject: 'Réinitialise ton mot de passe — Nocturne', text: 'Lien valable 1 h.', link });
}

function consumeToken(token: string, type: 'VERIFY' | 'RESET') {
  const t = db.tokens.find(x => x.token === token && x.type === type);
  if (!t || t.used || new Date(t.expiresAt) < new Date()) throw err(400, 'Lien invalide ou expiré');
  t.used = true;
  return db.users.find(u => u.id === t.userId)!;
}

const tradeValue = (items: TradeItemDTO[]) => items.reduce((s, i) => s + CRAFT_COST[cardById(i.cardId)?.rarity ?? 'COMMON'] * i.quantity, 0);
const owns = (userId: string, items: TradeItemDTO[]) => items.every(i => (db.cards[userId]?.[i.cardId] ?? 0) >= i.quantity);
const nameOf = (id: string) => db.users.find(u => u.id === id)?.displayName ?? '?';

function tradeDto(t: DTrade): TradeDTO {
  return { id: t.id, status: t.status, proposer: { id: t.proposerId, displayName: nameOf(t.proposerId) }, receiver: { id: t.receiverId, displayName: nameOf(t.receiverId) }, give: t.give, get: t.get, message: t.message, createdAt: t.createdAt, updatedAt: t.updatedAt };
}

function completeTrade(t: DTrade) {
  if (!owns(t.proposerId, t.give) || !owns(t.receiverId, t.get)) throw err(400, 'Une des cartes n’est plus disponible');
  for (const i of t.give) { addCard(t.proposerId, i.cardId, -i.quantity); addCard(t.receiverId, i.cardId, i.quantity); }
  for (const i of t.get) { addCard(t.receiverId, i.cardId, -i.quantity); addCard(t.proposerId, i.cardId, i.quantity); }
  track(t.proposerId, 'TRADE');
  track(t.receiverId, 'TRADE');
  t.status = 'COMPLETED';
  t.updatedAt = nowIso();
}

/** Les joueurs simulés répondent aux échanges et en proposent parfois. */
function botsAct(u: DUser) {
  const now = Date.now();
  for (const t of db.trades) {
    const age = now - new Date(t.updatedAt).getTime();
    if (age < 2500) continue;
    const bot = db.users.find(x => x.bot && (x.id === t.receiverId || x.id === t.proposerId));
    if (!bot) continue;
    if (t.status === 'PENDING' && t.receiverId === bot.id) {
      const fair = tradeValue(t.get) <= tradeValue(t.give) * 1.5 && owns(bot.id, t.get);
      t.status = fair ? 'ACCEPTED' : 'DECLINED';
      t.updatedAt = nowIso();
    } else if (t.status === 'ACCEPTED' && t.proposerId === bot.id) {
      try { completeTrade(t); } catch { t.status = 'CANCELLED'; t.updatedAt = nowIso(); }
    }
  }
  const mine = db.cards[u.id] ?? {};
  const dup = Object.entries(mine).find(([id, q]) => q > 1 && cardById(id))?.[0];
  if (dup && !db.trades.some(t => t.receiverId === u.id && db.users.find(b => b.id === t.proposerId)?.bot)) {
    const rarity = cardById(dup)?.rarity;
    const bot = db.users.find(b => b.bot)!;
    const offer = Object.keys(db.cards[bot.id] ?? {}).find(id => cardById(id)?.rarity === rarity && !mine[id]);
    if (offer) {
      db.trades.push({ id: uid(), proposerId: bot.id, receiverId: u.id, status: 'PENDING', give: [{ cardId: offer, quantity: 1 }], get: [{ cardId: dup, quantity: 1 }], message: 'Ton doublon contre une carte qui te manque ?', createdAt: nowIso(), updatedAt: nowIso() });
    }
  }
}

function lookup(): CardLookup {
  return Object.fromEntries(cardList().map(c => [c.id, { id: c.id, name: c.name, rarity: c.rarity, hp: c.hp, attack: c.attack, abilityKey: c.abilityKey, abilityValue: c.abilityValue } satisfies BattleCard]));
}

function cosmeticsOf(u: DUser): CosmeticDTO[] {
  const owned = db.owned[u.id] ?? [];
  return DEFAULT_COSMETICS.map(c => ({
    id: c.code, code: c.code, name: c.name, kind: c.kind, priceEmbers: c.priceEmbers, passExclusive: c.passExclusive,
    owned: owned.includes(c.code) || (c.passExclusive && passActive(u)),
    equipped: [u.avatar, u.cardBack, u.frame, u.title].includes(c.code),
  }));
}

function missionsOf(u: DUser): MissionDTO[] {
  const now = new Date();
  return DEFAULT_MISSIONS.map(m => {
    const key = periodKey(m.period, now);
    const p = db.missions[`${u.id}:${m.code}:${key}`];
    const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    if (m.period === 'WEEKLY') reset.setUTCDate(reset.getUTCDate() + ((8 - reset.getUTCDay()) % 7));
    return { ...m, id: m.code, progress: Math.min(m.target, p?.progress ?? 0), claimed: !!p?.claimedAt, periodKey: key, resetsAt: reset.toISOString() };
  });
}

function requireAdmin() {
  const u = current();
  if (u.role !== 'ADMIN') throw err(403, 'Accès refusé');
  return u;
}

function audit(action: string, target: string | null, payload?: unknown) {
  const u = current();
  db.audit.unshift({ id: uid(), action, target, createdAt: nowIso(), actor: { displayName: u.displayName }, payload });
}

const plain = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

/** Encapsule chaque appel : latence simulée, copies défensives (les proxys Vue ne se clonent pas), sauvegarde. */
function op<A extends unknown[], R>(fn: (...a: A) => R | Promise<R>) {
  return async (...a: A): Promise<R> => {
    await wait();
    try {
      return clone(await fn(...(a.map(plain) as A)));
    } finally {
      save();
    }
  };
}

export const demoApi: Api = {
  mode: 'demo',
  me: op(() => {
    const u = db.users.find(x => x.id === db.session);
    return u ? meDto(u) : null;
  }),
  register: op(async i => {
    const birth = new Date(i.birthDate);
    const age = ageOn(birth, new Date());
    if (Number.isNaN(birth.getTime())) throw err(400, 'Date de naissance invalide');
    if (age < MIN_AGE) throw err(400, `Nocturne est réservé aux joueurs de ${MIN_AGE} ans et plus.`);
    if (!i.acceptTerms) throw err(400, 'Tu dois accepter les CGU et la politique de confidentialité');
    if (i.password.length < 10) throw err(400, 'Mot de passe : 10 caractères minimum');
    if (!/^[\p{L}\p{N}_-]{3,20}$/u.test(i.displayName)) throw err(400, 'Pseudo : 3 à 20 lettres, chiffres, _ ou -');
    if (!/^\S+@\S+\.\S+$/.test(i.email)) throw err(400, 'Email invalide');
    const email = i.email.toLowerCase().trim();
    if (db.users.some(u => u.email === email || u.displayName.toLowerCase() === i.displayName.toLowerCase())) throw err(409, 'Cet email ou ce pseudo est déjà utilisé');
    const u: DUser = {
      id: uid(), email, passwordHash: await hashPw(i.password), displayName: i.displayName, birthDate: i.birthDate, country: i.country.toUpperCase(), role: 'PLAYER',
      emailVerifiedAt: null, parentalConsentAt: age < ADULT_AGE && i.parentalConsent ? nowIso() : null, parentEmail: age < ADULT_AGE ? i.parentEmail ?? null : null,
      monthlySpendCapCents: null, freePacks: FREE_PACKS_PER_DAY, freePacksUpdatedAt: nowIso(), avatar: 'AV_BAT', cardBack: 'BACK_CLASSIC', frame: null, title: null,
      passUntil: null, createdAt: nowIso(), blockedAt: null,
    };
    db.users.push(u);
    db.owned[u.id] = DEFAULT_COSMETICS.filter(c => c.priceEmbers === 0).map(c => c.code);
    post(u.id, [{ currency: 'EMBERS', amount: WELCOME_EMBERS, reason: 'WELCOME' }]);
    sendMail(u, 'VERIFY');
    db.session = u.id;
    return meDto(u);
  }),
  login: op(async ({ email, password }) => {
    const u = db.users.find(x => x.email === email.toLowerCase().trim() && !x.bot);
    if (!u || u.passwordHash !== (await hashPw(password))) throw err(401, 'Email ou mot de passe incorrect');
    if (u.blockedAt) throw err(403, 'Compte suspendu');
    db.session = u.id;
    return meDto(u);
  }),
  logout: op(() => { db.session = null; }),
  verify: op(token => {
    const u = consumeToken(token, 'VERIFY');
    u.emailVerifiedAt = nowIso();
    return meDto(u);
  }),
  resend: op(() => {
    const u = current();
    if (u.emailVerifiedAt) throw err(400, 'Adresse déjà vérifiée');
    sendMail(u, 'VERIFY');
  }),
  forgot: op(email => {
    const u = db.users.find(x => x.email === email.toLowerCase().trim());
    if (u) sendMail(u, 'RESET');
  }),
  reset: op(async (token, password) => {
    if (password.length < 10) throw err(400, 'Mot de passe : 10 caractères minimum');
    const u = consumeToken(token, 'RESET');
    u.passwordHash = await hashPw(password);
    db.session = null;
  }),

  cards: op(() => cardList()),
  banners: op(() => {
    const u = db.users.find(x => x.id === db.session);
    const paid = u ? db.countries.find(c => c.country === u.country)?.paidPacksEnabled ?? true : true;
    return db.banners.filter(b => isOpen(b)).sort((a, b) => (a.endsAt ?? '9999').localeCompare(b.endsAt ?? '9999')).map((b): BannerDTO => ({
      id: b.id, code: b.code, name: b.name, description: b.description, theme: b.theme, startsAt: b.startsAt, endsAt: b.endsAt,
      packName: 'Booster Nuit Éternelle', priceEmbers: db.prices.embers, priceShards: db.prices.shards, featured: b.featured, featuredShare: b.featuredShare,
      pity: u ? pityOf(u.id, b) : { sinceEpic: 0, sinceLegendary: 0, totalPacks: 0, epicEvery: b.epicPityEvery, legendaryAt: b.legendaryPityAt }, paidPacksAllowed: paid,
    }));
  }),
  rates: op(id => {
    const b = db.banners.find(x => x.id === id);
    if (!b) throw err(404, 'Bannière introuvable');
    return { bannerId: id, reversePercent: DEFAULT_REVERSE_CHANCE / 1000, ...rateTable(bannerConfig(b)) };
  }),
  open: op((bannerId, source) => {
    const u = current();
    const b = db.banners.find(x => x.id === bannerId);
    if (!b || !isOpen(b)) throw err(400, 'Cette bannière n’est pas disponible');
    if (source === 'FREE') {
      const next = consumeFreePack(u.freePacks, new Date(u.freePacksUpdatedAt), new Date(), passActive(u) ? PASS_FREE_PACKS_PER_DAY : FREE_PACKS_PER_DAY);
      if (!next) throw err(400, 'Aucun booster gratuit disponible', 'NO_FREE_PACK');
      u.freePacks = next.stored;
      u.freePacksUpdatedAt = next.updatedAt.toISOString();
    } else if (source === 'EMBERS') {
      if (db.prices.embers == null) throw err(400, 'Ce booster ne s’achète pas en Braises');
      post(u.id, [{ currency: 'EMBERS', amount: -db.prices.embers, reason: 'PACK_OPEN' }]);
    } else {
      if (db.prices.shards == null) throw err(400, 'Ce booster ne s’achète pas en Éclats');
      if (!compliance(u).paidPacksEnabled) throw err(403, 'Les boosters payants sont désactivés dans ton pays');
      post(u.id, [{ currency: 'SHARDS', amount: -db.prices.shards, reason: 'PACK_OPEN' }]);
    }
    const key = `${u.id}:${b.id}`;
    const pity = db.pity[key] ?? { sinceEpic: 0, sinceLegendary: 0, totalPacks: 0 };
    const r = openPack(bannerConfig(b), pity, cryptoRng);
    db.pity[key] = { ...r.pity, totalPacks: pity.totalPacks + 1 };
    const reverseSlot = rollReverse(r.cards, c => cardById(c.cardId)?.variant === 'NORMAL', DEFAULT_REVERSE_CHANCE, cryptoRng);
    const seen = new Set<string>();
    const cards = r.cards.map(c => {
      const isNew = !(db.cards[u.id]?.[c.cardId]) && !seen.has(c.cardId);
      seen.add(c.cardId);
      return { slot: c.slot, cardId: c.cardId, rarity: c.rarity, isNew, reverse: c.slot === reverseSlot };
    });
    cards.forEach(c => {
      addCard(u.id, c.cardId);
      if (c.reverse) addCard(u.id, reverseKey(c.cardId));
    });
    const pull: DPull = { id: uid(), userId: u.id, bannerId: b.id, source, pity: r.pityTriggered, createdAt: nowIso(), cards };
    db.pulls.unshift(pull);
    track(u.id, 'OPEN_PACKS');
    return { pull: { ...pull, bannerName: b.name }, wallet: walletDto(u), pity: pityOf(u.id, b) };
  }),
  pulls: op(() => {
    const u = current();
    return db.pulls.filter(p => p.userId === u.id).slice(0, 50).map((p): PullDTO => ({ ...p, bannerName: db.banners.find(b => b.id === p.bannerId)?.name ?? '' }));
  }),

  wallet: op(() => {
    const u = current();
    const today = dayKey(new Date());
    const days = (db.logins[u.id] ??= []);
    let reward: number | null = null;
    if (!days.includes(today)) {
      days.push(today);
      const streak = walletDto(u).loginStreak;
      reward = DAILY_LOGIN_EMBERS + (streak % STREAK_BONUS_EVERY === 0 ? STREAK_BONUS_EMBERS : 0);
      post(u.id, [{ currency: 'EMBERS', amount: reward, reason: 'DAILY_LOGIN', note: `Série de ${streak} jour(s)` }]);
      track(u.id, 'LOGIN');
    }
    return walletDto(u, reward);
  }),
  ledger: op(() => {
    const u = current();
    return db.ledger.filter(e => e.userId === u.id).slice(-50).reverse().map(({ userId: _, ...e }) => e);
  }),
  collection: op((): CollectionDTO => ({ ...(db.cards[current().id] ?? {}) })),
  recycle: op(cardId => {
    const u = current();
    let dust = 0, count = 0;
    const mine = db.cards[u.id] ?? {};
    for (const [id, q] of Object.entries(mine)) {
      const c = cardById(id);
      if (!c || (cardId && id !== cardId)) continue;
      const kept = Math.max(1, mine[reverseKey(id)] ?? 0);
      if (q <= kept) continue;
      dust += (q - kept) * dustFor(c.rarity, passActive(u));
      count += q - kept;
      mine[id] = kept;
    }
    if (!count) throw err(400, 'Aucun doublon à recycler');
    post(u.id, [{ currency: 'DUST', amount: dust, reason: 'DUPLICATE_RECYCLE', note: `${count} doublon(s)` }]);
    track(u.id, 'RECYCLE');
    return { dust, count };
  }),
  craft: op(cardId => {
    const u = current();
    const c = cardById(cardId);
    if (!c) throw err(404, 'Carte introuvable');
    if (!c.craftable) throw err(400, 'Cette carte ne peut pas être invoquée avec la poussière');
    const cost = CRAFT_COST[c.rarity];
    post(u.id, [{ currency: 'DUST', amount: -cost, reason: 'CRAFT' }]);
    addCard(u.id, cardId);
    track(u.id, 'CRAFT');
    return { cost };
  }),

  missions: op(() => missionsOf(current())),
  claimMission: op(id => {
    const u = current();
    const m = DEFAULT_MISSIONS.find(x => x.code === id);
    if (!m) throw err(404, 'Mission introuvable');
    const k = `${u.id}:${m.code}:${periodKey(m.period, new Date())}`;
    const p = db.missions[k];
    if (!p || p.progress < m.target) throw err(400, 'Mission non terminée');
    if (p.claimedAt) throw err(400, 'Récompense déjà récupérée');
    p.claimedAt = nowIso();
    post(u.id, [{ currency: 'EMBERS', amount: m.rewardEmbers, reason: 'MISSION' }, { currency: 'DUST', amount: m.rewardDust, reason: 'MISSION' }]);
    return missionsOf(u);
  }),

  trades: op(() => {
    const u = current();
    botsAct(u);
    return db.trades.filter(t => t.proposerId === u.id || t.receiverId === u.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(tradeDto);
  }),
  createTrade: op(i => {
    const u = current();
    verified(u);
    const r = db.users.find(x => x.displayName.toLowerCase() === i.receiverName.toLowerCase());
    if (!r) throw err(404, 'Joueur introuvable');
    if (r.id === u.id) throw err(400, 'Tu ne peux pas échanger avec toi-même');
    if (!i.give.length || !i.get.length) throw err(400, 'Un échange se fait carte contre carte');
    if (!owns(u.id, i.give)) throw err(400, 'Tu ne possèdes plus toutes les cartes de l’échange');
    if (!owns(r.id, i.get)) throw err(400, `${r.displayName} ne possède plus toutes les cartes de l’échange`);
    const t: DTrade = { id: uid(), proposerId: u.id, receiverId: r.id, status: 'PENDING', give: i.give, get: i.get, message: i.message || null, createdAt: nowIso(), updatedAt: nowIso() };
    db.trades.push(t);
    return tradeDto(t);
  }),
  tradeAction: op((id, action) => {
    const u = current();
    verified(u);
    const t = db.trades.find(x => x.id === id);
    if (!t) throw err(404, 'Échange introuvable');
    const isP = t.proposerId === u.id, isR = t.receiverId === u.id;
    if (!isP && !isR) throw err(403, 'Accès refusé');
    const set = (s: DTrade['status']) => { t.status = s; t.updatedAt = nowIso(); };
    if (action === 'accept') {
      if (!isR || t.status !== 'PENDING') throw err(400, 'Action impossible');
      if (!owns(u.id, t.get)) throw err(400, 'Tu ne possèdes plus toutes les cartes de l’échange');
      set('ACCEPTED');
    } else if (action === 'decline') {
      if (!isR || !['PENDING', 'ACCEPTED'].includes(t.status)) throw err(400, 'Action impossible');
      set('DECLINED');
    } else if (action === 'cancel') {
      if (!isP || !['PENDING', 'ACCEPTED'].includes(t.status)) throw err(400, 'Action impossible');
      set('CANCELLED');
    } else {
      if (!isP || t.status !== 'ACCEPTED') throw err(400, 'L’autre joueur doit d’abord accepter');
      completeTrade(t);
    }
    return tradeDto(t);
  }),
  player: op(name => {
    current();
    const p = db.users.find(x => x.displayName.toLowerCase() === name.toLowerCase());
    if (!p) throw err(404, 'Joueur introuvable');
    return { id: p.id, displayName: p.displayName, cards: { ...(db.cards[p.id] ?? {}) } };
  }),

  cosmetics: op(() => cosmeticsOf(current())),
  buyCosmetic: op(code => {
    const u = current();
    const c = DEFAULT_COSMETICS.find(x => x.code === code);
    if (!c) throw err(404, 'Introuvable');
    if (c.passExclusive || c.priceEmbers == null) throw err(400, 'Exclusivité du Pass Nocturne');
    if ((db.owned[u.id] ??= []).includes(code)) throw err(400, 'Déjà possédé');
    post(u.id, [{ currency: 'EMBERS', amount: -c.priceEmbers, reason: 'COSMETIC' }]);
    db.owned[u.id]!.push(code);
    return cosmeticsOf(u);
  }),
  equipCosmetic: op(code => {
    const u = current();
    const c = cosmeticsOf(u).find(x => x.code === code);
    if (!c?.owned) throw err(400, 'Cosmétique non possédé');
    const slot = ({ AVATAR: 'avatar', CARD_BACK: 'cardBack', FRAME: 'frame', TITLE: 'title' } as const)[c.kind];
    u[slot] = code;
    return cosmeticsOf(u);
  }),
  products: op(() => {
    current();
    return DEFAULT_SHOP.map(p => ({ ...p, available: false, reason: 'Paiements bientôt disponibles' }));
  }),
  compliance: op(() => compliance(current())),

  updateSettings: op(({ monthlySpendCapCents }) => {
    const u = current();
    if (ageOn(new Date(u.birthDate), new Date()) < ADULT_AGE && (monthlySpendCapCents == null || monthlySpendCapCents > db.settings.minorDefaultCapCents)) {
      throw err(400, `Plafond maximum pour les mineurs : ${db.settings.minorDefaultCapCents / 100} €`);
    }
    u.monthlySpendCapCents = monthlySpendCapCents;
    return meDto(u);
  }),
  exportData: op(() => {
    const u = current();
    const { passwordHash: _, ...user } = u;
    return { exportedAt: nowIso(), user, cards: db.cards[u.id], ledger: db.ledger.filter(e => e.userId === u.id), pulls: db.pulls.filter(p => p.userId === u.id), trades: db.trades.filter(t => t.proposerId === u.id || t.receiverId === u.id), decks: db.decks.filter(d => d.userId === u.id) };
  }),
  deleteAccount: op(async password => {
    const u = current();
    if (u.passwordHash !== (await hashPw(password))) throw err(401, 'Mot de passe incorrect');
    db.trades.forEach(t => { if ((t.proposerId === u.id || t.receiverId === u.id) && ['PENDING', 'ACCEPTED'].includes(t.status)) t.status = 'CANCELLED'; });
    delete db.cards[u.id];
    db.decks = db.decks.filter(d => d.userId !== u.id);
    db.battles = db.battles.filter(b => b.userId !== u.id);
    Object.assign(u, { email: `supprime-${u.id}@invalid`, displayName: `Disparu-${u.id.slice(-8)}`, passwordHash: '!', birthDate: '1900-01-01', parentEmail: null });
    db.session = null;
  }),

  decks: op(() => db.decks.filter(d => d.userId === current().id).map(({ userId: _, ...d }) => d)),
  saveDeck: op((id, name, cards) => {
    const u = current();
    if (!name.trim()) throw err(400, 'Nom requis');
    if (cards.length > 10) throw err(400, 'Un deck contient exactement 10 cartes.');
    const e = cards.length === 10 ? validateDeck(cards, db.cards[u.id] ?? {}) : null;
    if (e) throw err(400, e);
    let d = id ? db.decks.find(x => x.id === id && x.userId === u.id) : undefined;
    if (id && !d) throw err(404, 'Deck introuvable');
    if (!d) {
      d = { id: uid(), userId: u.id, name, cards };
      db.decks.unshift(d);
    } else Object.assign(d, { name, cards });
    const { userId: _, ...out } = d;
    return out;
  }),
  deleteDeck: op(id => { db.decks = db.decks.filter(d => !(d.id === id && d.userId === current().id)); }),
  activeBattle: op(() => {
    const b = db.battles.find(x => x.userId === current().id && x.status === 'ACTIVE');
    return b ? { id: b.id, status: b.status, state: b.state, reward: null } : null;
  }),
  startBattle: op(deckId => {
    const u = current();
    const d = db.decks.find(x => x.id === deckId && x.userId === u.id);
    if (!d) throw err(404, 'Deck introuvable');
    const e = validateDeck(d.cards, db.cards[u.id] ?? {});
    if (e) throw err(400, e);
    const all = lookup();
    const strength = d.cards.reduce((s, id) => s + RARITIES.indexOf(all[id]!.rarity), 0) / d.cards.length + 1;
    const seed = cryptoRng.int(2 ** 31);
    db.battles.forEach(b => { if (b.userId === u.id && b.status === 'ACTIVE') b.status = 'ABANDONED'; });
    const b: DBattle = { id: uid(), userId: u.id, status: 'ACTIVE', state: createBattle(d.cards, buildEnemyDeck(Object.values(all), seed, strength), seed), createdAt: nowIso(), updatedAt: nowIso() };
    db.battles.unshift(b);
    db.battles = db.battles.slice(0, 30);
    return { id: b.id, status: b.status, state: b.state, reward: null };
  }),
  battleAction: op((id, action) => {
    const u = current();
    const b = db.battles.find(x => x.id === id && x.userId === u.id);
    if (!b) throw err(404, 'Combat introuvable');
    if (b.status !== 'ACTIVE') throw err(400, 'Combat terminé');
    try { b.state = playerStep(b.state, action, lookup()); } catch (e) { throw err(400, (e as Error).message); }
    b.status = b.state.winner === 'player' ? 'WON' : b.state.winner ? 'LOST' : 'ACTIVE';
    b.updatedAt = nowIso();
    let reward: BattleDTO['reward'] = null;
    if (b.status !== 'ACTIVE') {
      track(u.id, 'BATTLE_PLAY');
      if (b.status === 'WON') track(u.id, 'BATTLE_WIN');
      const today = dayKey(new Date());
      const done = db.battles.filter(x => x.userId === u.id && x.status !== 'ACTIVE' && x.status !== 'ABANDONED' && x.updatedAt.startsWith(today)).length;
      if (done <= 5) {
        reward = b.status === 'WON' ? { embers: 30, dust: 15 } : { embers: 10, dust: 0 };
        post(u.id, [{ currency: 'EMBERS', amount: reward.embers, reason: 'MISSION', note: 'Combat' }, { currency: 'DUST', amount: reward.dust, reason: 'MISSION', note: 'Combat' }]);
      }
    }
    return { id: b.id, status: b.status, state: b.state, reward };
  }),
  abandonBattle: op(id => {
    const b = db.battles.find(x => x.id === id && x.userId === current().id);
    if (b && b.status === 'ACTIVE') b.status = 'ABANDONED';
  }),

  admin: {
    stats: op(() => {
      requireAdmin();
      const today = dayKey(new Date());
      const byRarity = Object.fromEntries(RARITIES.map(r => [r, 0])) as Record<Rarity, number>;
      db.pulls.forEach(p => p.cards.forEach(c => byRarity[c.rarity]++));
      return { users: db.users.length, pullsToday: db.pulls.filter(p => p.createdAt.startsWith(today)).length, pullsTotal: db.pulls.length, trades: db.trades.filter(t => t.status === 'COMPLETED').length, ledgerEntries: db.ledger.length, byRarity };
    }),
    users: op(q => {
      requireAdmin();
      const s = q.toLowerCase();
      return db.users.filter(u => !s || u.email.includes(s) || u.displayName.toLowerCase().includes(s)).map(u => ({
        id: u.id, email: u.email, displayName: u.displayName, role: u.role, country: u.country, age: ageOn(new Date(u.birthDate), new Date()),
        createdAt: u.createdAt, blocked: !!u.blockedAt, balances: balances(u.id), pulls: db.pulls.filter(p => p.userId === u.id).length,
      }));
    }),
    userLedger: op(id => { requireAdmin(); return db.ledger.filter(e => e.userId === id).slice().reverse() as AdminLedgerRow[]; }),
    grant: op((id, currency, amount, note) => {
      requireAdmin();
      post(id, [{ currency, amount, reason: 'ADMIN', note }]);
      audit('user.grant', id, { currency, amount, note });
    }),
    block: op((id, blocked, reason) => {
      requireAdmin();
      const u = db.users.find(x => x.id === id);
      if (!u) throw err(404, 'Introuvable');
      if (u.id === db.session) throw err(400, 'Tu ne peux pas te bloquer toi-même');
      u.blockedAt = blocked ? nowIso() : null;
      audit(blocked ? 'user.block' : 'user.unblock', id, { reason });
    }),
    pass: op((id, days) => {
      requireAdmin();
      const u = db.users.find(x => x.id === id);
      if (!u) throw err(404, 'Introuvable');
      u.passUntil = days ? new Date(Date.now() + days * DAY).toISOString() : null;
      audit('user.pass', id, { days });
    }),
    cards: op(() => { requireAdmin(); return SET1_CARDS.map(c => ({ ...c, active: true, ...db.overrides[c.code], id: c.code }) as AdminCard); }),
    updateCard: op((id, patch) => {
      requireAdmin();
      db.overrides[id] = { ...db.overrides[id], ...patch };
      audit('card.update', id, patch);
    }),
    packs: op(() => { requireAdmin(); return [{ id: 'NE1_STANDARD', code: 'NE1_STANDARD', name: 'Booster Nuit Éternelle', priceEmbers: db.prices.embers, priceShards: db.prices.shards, slots: db.slots }]; }),
    setRates: op((_code, slots) => {
      requireAdmin();
      if (!slots.length || slots.some(s => !Object.values(s).some(w => (w ?? 0) > 0))) throw err(400, 'Chaque slot doit avoir au moins un poids positif');
      db.slots = slots;
      audit('pack.rates', 'NE1_STANDARD', slots);
    }),
    banners: op(() => { requireAdmin(); return db.banners; }),
    saveBanner: op(input => {
      requireAdmin();
      if (!/^[A-Z0-9_]{3,30}$/.test(input.code)) throw err(400, 'Code : 3 à 30 caractères A-Z, 0-9, _');
      const b = db.banners.find(x => x.code === input.code);
      const next: DBanner = { ...input, id: input.code, packCode: 'NE1_STANDARD' };
      if (b) Object.assign(b, next);
      else db.banners.push(next);
      audit('banner.upsert', input.code, input);
    }),
    countries: op(() => { requireAdmin(); return db.countries; }),
    setCountry: op(c => {
      requireAdmin();
      const x = db.countries.find(y => y.country === c.country);
      if (x) Object.assign(x, c);
      else db.countries.push(c);
      audit('country.update', c.country, c);
    }),
    settings: op(() => { requireAdmin(); return { ...db.settings }; }),
    setSetting: op((key, value) => {
      requireAdmin();
      if (key === 'minorDefaultCapCents') db.settings.minorDefaultCapCents = value;
      audit('setting.update', key, { value });
    }),
    transactions: op(() => { requireAdmin(); return db.ledger.slice(-200).reverse().map(e => ({ ...e, user: { displayName: nameOf(e.userId) } })); }),
    audit: op(() => { requireAdmin(); return db.audit.slice(0, 200); }),
  },

  demo: {
    lastMail: () => {
      const u = db.users.find(x => x.id === db.session);
      return u ? [...db.mails].reverse().find(m => m.to === u.email) ?? null : null;
    },
    setPass: op(active => { current().passUntil = active ? new Date(Date.now() + 30 * DAY).toISOString() : null; }),
    setAdmin: op(active => { current().role = active ? 'ADMIN' : 'PLAYER'; }),
    reset: () => {
      db = fresh();
      save();
    },
  },
};
