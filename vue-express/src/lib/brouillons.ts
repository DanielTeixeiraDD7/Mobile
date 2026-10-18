/** Code de l'utilisateur par leçon, gardé sur l'appareil. */
const key = (id: string) => `vue-express:brouillon:${id}`;

export function lireBrouillon(id: string): Record<string, string> | null {
  try { return JSON.parse(localStorage.getItem(key(id)) || 'null'); } catch { return null; }
}
export function ecrireBrouillon(id: string, files: Record<string, string>) {
  try { localStorage.setItem(key(id), JSON.stringify(files)); } catch { /* ignoré */ }
}
export function effacerBrouillon(id: string) {
  try { localStorage.removeItem(key(id)); } catch { /* ignoré */ }
}
