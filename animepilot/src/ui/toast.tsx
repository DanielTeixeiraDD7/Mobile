import { useSyncExternalStore } from 'react';

export interface ToastItem {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
  kind?: 'info' | 'error';
}

let current: ToastItem | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export function toast(text: string, opts: { action?: ToastItem['action']; kind?: ToastItem['kind']; duration?: number } = {}) {
  clearTimeout(timer);
  current = { id: ++seq, text, action: opts.action, kind: opts.kind };
  emit();
  timer = setTimeout(dismiss, opts.duration ?? (opts.action ? 6000 : 3000));
}

export function dismiss() {
  current = null;
  emit();
}

export function Toaster() {
  const t = useSyncExternalStore(l => (listeners.add(l), () => listeners.delete(l)), () => current);
  if (!t) return null;
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      <div className={`toast ${t.kind ?? ''}`} key={t.id}>
        <span className="grow">{t.text}</span>
        {t.action && <button type="button" onClick={() => { t.action!.run(); dismiss(); }}>{t.action.label}</button>}
      </div>
    </div>
  );
}
