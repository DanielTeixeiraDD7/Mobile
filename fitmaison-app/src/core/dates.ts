export const iso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const aujourdhui = () => iso();
export const lireDate = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y!, m! - 1, d); };
export const ecartJours = (a: string, b: string) => Math.round((lireDate(b).getTime() - lireDate(a).getTime()) / 86_400_000);
export const dateCourte = (s: string) => lireDate(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
export const dateLongue = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
export const kg = (n: number) => (Math.round(n * 10) / 10).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const minutes = (s: number) => `${Math.round(s / 60)} min`;
export function lundi(d = new Date()): string {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return iso(r);
}
