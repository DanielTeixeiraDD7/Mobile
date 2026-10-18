const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const nb = new Intl.NumberFormat('fr-FR');

export const euros = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? '—' : eur.format(n));
export const kms = (n: number | null | undefined) => (n == null ? '—' : `${nb.format(n)} km`);
export const nombre = (n: number | null | undefined) => (n == null ? '—' : nb.format(n));
export const dateCourte = (ms: number) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

/** Lit un nombre saisi librement : « 21 500 € », « 21.500 », « 21500,00 ». */
export function lireNombre(s: string): number | null {
  const t = s.replace(/[\s €kmKM]/g, '');
  if (!t) return null;
  // « 21.500 » / « 21,500 » sans décimales = séparateur de milliers.
  const n = /^\d{1,3}([.,]\d{3})+$/.test(t) ? Number(t.replace(/[.,]/g, '')) : Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
