import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { accessToken, ApiError } from './auth.js';

export async function rest(path, { method = 'GET', body, prefer } = {}) {
  const token = await accessToken();
  if (!token) throw new ApiError('signed out', 401);
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(prefer && { Prefer: prefer }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('offline', 0);
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(data?.message || res.statusText, res.status, data?.code);
  return data;
}

export const rpc = (fn, args = {}) => rest(`rpc/${fn}`, { method: 'POST', body: args });

export async function restAll(path, pageSize = 1000) {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await rest(`${path}${path.includes('?') ? '&' : '?'}limit=${pageSize}&offset=${offset}`);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
