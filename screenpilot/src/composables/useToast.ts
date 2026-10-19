/** Toasts (avec action « Annuler »), affichés par ToastHost. */
export interface Toast { id: number; texte: string; type: '' | 'warn' | 'danger' | 'ok'; action?: string; onAction?: () => void; duree: number }

const toasts = ref<Toast[]>([]);
let n = 0;

export function vibrer(motif: number | number[] = 15) {
  try { navigator.vibrate?.(motif); } catch { /* non supporté */ }
}

export function toast(texte: string, o: Partial<Omit<Toast, 'id' | 'texte'>> = {}) {
  const t: Toast = { id: ++n, texte, type: '', duree: o.action ? 5000 : 2600, ...o };
  toasts.value = [...toasts.value.slice(-2), t];
  setTimeout(() => fermerToast(t.id), t.duree);
}
export function fermerToast(id: number) { toasts.value = toasts.value.filter(t => t.id !== id); }
export const useToasts = () => toasts;
