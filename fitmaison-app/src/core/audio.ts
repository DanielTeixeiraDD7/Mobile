/** Bips, voix et vibrations du lecteur de séance. */
let ctx: AudioContext | null = null;

export function bip(freq = 880, ms = 120) {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx ??= new AC();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
    o.start(); o.stop(ctx.currentTime + ms / 1000);
  } catch { /* audio indisponible */ }
}

export function dire(texte: string) {
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = 'fr-FR';
    u.rate = 1.02;
    const v = speechSynthesis.getVoices().find(x => x.lang?.startsWith('fr'));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch { /* synthèse vocale indisponible */ }
}

export function vibrer(motif: number | number[]) {
  try { navigator.vibrate?.(motif); } catch { /* non supporté */ }
}

export function taireVoix() { try { speechSynthesis.cancel(); } catch { /* ignoré */ } }
if (typeof window !== 'undefined' && 'speechSynthesis' in window) speechSynthesis.getVoices();
