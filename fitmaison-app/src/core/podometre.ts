/**
 * Podomètre par l'accéléromètre (repris de la v1). Ne fonctionne que l'app ouverte et l'écran allumé
 * (limite des apps web sur iPhone) : l'écran est maintenu allumé pendant le comptage.
 */
export interface Podometre { actif: boolean; session: number; demarrer: () => Promise<string | null>; arreter: () => void }

export function creerPodometre(surPas: () => void, surErreur: (message: string) => void): Podometre {
  const st = { lisse: 9.81, moy: 9.81, haut: false, dernier: 0, recu: false, verrou: null as WakeLockSentinel | null };
  const p: Podometre = { actif: false, session: 0, demarrer, arreter };

  function mouvement(e: DeviceMotionEvent) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    st.recu = true;
    const m = Math.hypot(a.x, a.y, a.z);
    st.lisse = st.lisse * 0.7 + m * 0.3;
    st.moy = st.moy * 0.98 + m * 0.02;
    const now = performance.now();
    if (!st.haut && st.lisse > st.moy + 1.2) {
      st.haut = true;
      if (now - st.dernier > 300) { st.dernier = now; p.session++; surPas(); }
    } else if (st.haut && st.lisse < st.moy) st.haut = false;
  }

  /** Renvoie null si le comptage a démarré, sinon le message d'erreur à afficher. */
  async function demarrer(): Promise<string | null> {
    if (p.actif) return null;
    if (typeof DeviceMotionEvent === 'undefined') return 'Capteur de mouvement indisponible sur cet appareil.';
    const D = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof D.requestPermission === 'function') {
      try { if (await D.requestPermission() !== 'granted') return 'Autorise l’accès « Mouvement » pour compter tes pas.'; }
      catch { return 'Accès aux mouvements refusé.'; }
    }
    Object.assign(st, { lisse: 9.81, moy: 9.81, haut: false, dernier: 0, recu: false });
    p.session = 0; p.actif = true;
    window.addEventListener('devicemotion', mouvement);
    try { if ('wakeLock' in navigator) st.verrou = await navigator.wakeLock.request('screen'); } catch { /* ignoré */ }
    // Certains appareils n'envoient rien (ordinateur, capteur absent) : on prévient après 4 s.
    setTimeout(() => { if (p.actif && !st.recu) { arreter(); surErreur('Aucun signal du capteur de mouvement.'); } }, 4000);
    return null;
  }

  function arreter() {
    if (!p.actif) return;
    p.actif = false;
    window.removeEventListener('devicemotion', mouvement);
    st.verrou?.release().catch(() => {}); st.verrou = null;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && p.actif && 'wakeLock' in navigator) navigator.wakeLock.request('screen').then(l => (st.verrou = l)).catch(() => {});
  });
  return p;
}
