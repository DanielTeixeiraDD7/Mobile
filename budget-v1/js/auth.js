import * as db from './db.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let session = null;
let refreshing = null;

export async function loadSession() {
  session = (await db.get('sync', 'session'))?.value ?? null;
  return session;
}

async function storeSession(value) {
  session = value;
  if (value) await db.put('sync', { key: 'session', value });
  else await db.remove('sync', 'session');
}

async function authRequest(path, body, token) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('offline', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.msg || data.error_description || data.message || res.statusText, res.status, data.error_code);
  return data;
}

const toSession = data => ({
  access_token: data.access_token,
  refresh_token: data.refresh_token,
  expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
  user: { id: data.user.id, email: data.user.email },
});

// Renvoie true si le compte est utilisable tout de suite, false s'il faut d'abord confirmer l'e-mail.
export async function signUp(email, password) {
  const data = await authRequest('signup', { email, password });
  if (!data.access_token) return false;
  await storeSession(toSession(data));
  return true;
}

export async function signIn(email, password) {
  const data = await authRequest('token?grant_type=password', { email, password });
  await storeSession(toSession(data));
  return session.user;
}

export async function accessToken() {
  if (!session) return null;
  if (session.expires_at - 60 > Date.now() / 1000) return session.access_token;
  refreshing ??= authRequest('token?grant_type=refresh_token', { refresh_token: session.refresh_token })
    .then(data => storeSession(toSession(data)))
    .catch(async e => {
      if (e.status >= 400 && e.status < 500) await storeSession(null);
      throw e;
    })
    .finally(() => (refreshing = null));
  await refreshing;
  return session?.access_token ?? null;
}

export const currentUser = () => session?.user ?? null;

export async function signOut() {
  const token = session?.access_token;
  await storeSession(null);
  if (token) authRequest('logout', {}, token).catch(() => {});
}
