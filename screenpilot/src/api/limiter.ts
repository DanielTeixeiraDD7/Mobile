/**
 * Limiteur à fenêtre glissante : au plus `max` requêtes par `windowMs`,
 * plus un blocage total après un 429 (durée donnée par Retry-After).
 */
export class RateLimiter {
  private stamps: number[] = [];
  private blockedUntil = 0;

  constructor(
    private max: number,
    private windowMs = 60_000,
    private now: () => number = () => Date.now(),
    private sleep: (ms: number, signal?: AbortSignal) => Promise<void> = abortableSleep,
  ) {}

  /** Temps d'attente avant la prochaine requête possible (0 = tout de suite). */
  waitTime(): number {
    const t = this.now();
    this.stamps = this.stamps.filter(s => t - s < this.windowMs);
    const block = Math.max(0, this.blockedUntil - t);
    const window = this.stamps.length < this.max ? 0 : this.windowMs - (t - this.stamps[0]!);
    return Math.max(block, window);
  }

  /** Attend un créneau ; renvoie false si l'attente dépasserait `maxWait` (rien n'est consommé). */
  async acquire(signal?: AbortSignal, maxWait = Infinity): Promise<boolean> {
    for (;;) {
      signal?.throwIfAborted();
      const w = this.waitTime();
      if (w <= 0) break;
      if (w > maxWait) return false;
      await this.sleep(w, signal);
    }
    this.stamps.push(this.now());
    return true;
  }

  block(ms: number) {
    this.blockedUntil = Math.max(this.blockedUntil, this.now() + ms);
  }

  get blockedFor() {
    return Math.max(0, this.blockedUntil - this.now());
  }
}

export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve(); }, ms);
    const onAbort = () => { clearTimeout(t); reject(signal!.reason); };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
