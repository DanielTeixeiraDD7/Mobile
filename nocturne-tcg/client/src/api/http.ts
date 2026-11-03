import type { Api } from './types';
import { ApiError } from './types';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`api${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'Erreur réseau', data?.code);
  return data as T;
}

const get = <T>(p: string) => req<T>('GET', p);
const post = <T>(p: string, b: unknown = {}) => req<T>('POST', p, b);
const put = <T>(p: string, b: unknown) => req<T>('PUT', p, b);
const patch = <T>(p: string, b: unknown) => req<T>('PATCH', p, b);
const del = <T>(p: string, b?: unknown) => req<T>('DELETE', p, b);
const enc = encodeURIComponent;

export const httpApi: Api = {
  mode: 'http',
  me: () => get('/auth/me'),
  register: i => post('/auth/register', i),
  login: i => post('/auth/login', i),
  logout: () => post('/auth/logout'),
  verify: token => post('/auth/verify', { token }),
  resend: () => post('/auth/resend'),
  forgot: email => post('/auth/forgot', { email }),
  reset: (token, password) => post('/auth/reset', { token, password }),

  cards: () => get('/cards'),
  banners: () => get('/banners'),
  rates: id => get(`/banners/${enc(id)}/rates`),
  open: (id, source) => post(`/banners/${enc(id)}/open`, { source }),
  pulls: () => get('/pulls'),

  wallet: () => get('/wallet'),
  ledger: () => get('/ledger'),
  collection: () => get('/collection'),
  recycle: cardId => post('/collection/recycle', cardId ? { cardId } : {}),
  craft: cardId => post('/collection/craft', { cardId }),

  missions: () => get('/missions'),
  claimMission: id => post(`/missions/${enc(id)}/claim`),

  trades: () => get('/trades'),
  createTrade: i => post('/trades', i),
  tradeAction: (id, action) => post(`/trades/${enc(id)}/${action}`),
  player: name => get(`/players/${enc(name)}`),

  cosmetics: () => get('/cosmetics'),
  buyCosmetic: code => post(`/cosmetics/${enc(code)}/buy`),
  equipCosmetic: code => post(`/cosmetics/${enc(code)}/equip`),
  products: () => get('/shop/products'),
  compliance: () => get('/compliance'),

  updateSettings: s => patch('/me/settings', s),
  exportData: () => get('/me/export'),
  deleteAccount: password => del('/me', { password }),

  decks: () => get('/decks'),
  saveDeck: (id, name, cards) => put(id ? `/decks/${enc(id)}` : '/decks', { name, cards }),
  deleteDeck: id => del(`/decks/${enc(id)}`),
  activeBattle: () => get('/battles/active'),
  startBattle: deckId => post('/battles', { deckId }),
  battleAction: (id, action) => post(`/battles/${enc(id)}/action`, { action }),
  abandonBattle: id => post(`/battles/${enc(id)}/abandon`),

  admin: {
    stats: () => get('/admin/stats'),
    users: q => get(`/admin/users?q=${enc(q)}`),
    userLedger: id => get(`/admin/users/${enc(id)}/ledger`),
    grant: (id, currency, amount, note) => post(`/admin/users/${enc(id)}/grant`, { currency, amount, note }),
    block: (id, blocked, reason) => post(`/admin/users/${enc(id)}/block`, { blocked, reason }),
    pass: (id, days) => post(`/admin/users/${enc(id)}/pass`, { days }),
    cards: () => get('/admin/cards'),
    updateCard: (id, p) => patch(`/admin/cards/${enc(id)}`, p),
    packs: () => get('/admin/packs'),
    setRates: (code, slots) => put(`/admin/packs/${enc(code)}/rates`, { slots }),
    banners: () => get('/admin/banners'),
    saveBanner: b => put('/admin/banners', b),
    countries: () => get('/admin/countries'),
    setCountry: c => put(`/admin/countries/${enc(c.country)}`, { paidPacksEnabled: c.paidPacksEnabled, purchasesEnabled: c.purchasesEnabled }),
    settings: () => get('/admin/settings'),
    setSetting: (key, value) => put(`/admin/settings/${enc(key)}`, { value }),
    transactions: () => get('/admin/transactions'),
    audit: () => get('/admin/audit'),
  },
};
