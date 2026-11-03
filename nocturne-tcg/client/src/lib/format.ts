export const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
export const num = (n: number) => n.toLocaleString('fr-FR');
export const pct = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: n < 0.1 ? 4 : n < 1 ? 3 : 2 })} %`;

export function countdown(iso: string | null, now = Date.now()): string {
  if (!iso) return '';
  const s = Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d) return `${d} j ${h} h`;
  if (h) return `${h} h ${String(m).padStart(2, '0')} min`;
  return `${m} min ${String(sec).padStart(2, '0')} s`;
}

export const dateTime = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

export const LEDGER_REASON: Record<string, string> = {
  PURCHASE: 'Achat', PACK_OPEN: 'Booster', DUPLICATE_RECYCLE: 'Recyclage', CRAFT: 'Invocation', MISSION: 'Récompense', DAILY_LOGIN: 'Connexion',
  SUBSCRIPTION_BONUS: 'Pass Nocturne', COSMETIC: 'Cosmétique', REFUND: 'Remboursement', CHARGEBACK: 'Litige', ADMIN: 'Ajustement', WELCOME: 'Bienvenue',
};
