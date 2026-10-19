import { toast, vibrer } from './useToast';

/** Confettis + toast (paliers de poids, objectifs du jour). */
export function celebrer(message: string) {
  const el = document.createElement('div');
  el.className = 'confettis';
  el.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('i');
    c.style.left = `${Math.random() * 100}%`;
    c.style.animationDelay = `${Math.random() * 0.6}s`;
    c.style.background = `hsl(${Math.random() * 360} 90% 60%)`;
    el.appendChild(c);
  }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
  vibrer([100, 50, 100]);
  toast(message, { type: 'ok', duree: 3500 });
}
