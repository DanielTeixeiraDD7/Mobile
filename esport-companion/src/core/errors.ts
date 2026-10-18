export type ApiErrorKind = 'offline' | 'rate_limited' | 'unavailable' | 'not_found' | 'http' | 'bad_data' | 'aborted' | 'missing_key';

export class ApiError extends Error {
  constructor(public kind: ApiErrorKind, message: string, public retryAfter = 0, public source = '') {
    super(message);
    this.name = 'ApiError';
  }
}

export const isAbort = (e: unknown) =>
  (e instanceof ApiError && e.kind === 'aborted') || (e instanceof DOMException && e.name === 'AbortError');

export function errorText(e: unknown): string {
  if (e instanceof ApiError) {
    const src = e.source ? ` (${e.source})` : '';
    switch (e.kind) {
      case 'offline': return `Hors-ligne : impossible de joindre la source${src}.`;
      case 'rate_limited': return `Limite de requêtes atteinte${src}. Réessaie dans ${Math.max(1, Math.ceil(e.retryAfter / 1000))} s.`;
      case 'unavailable': return `Source temporairement indisponible${src}.`;
      case 'not_found': return `Donnée introuvable${src}.`;
      case 'missing_key': return `Clé d'API manquante${src} : à configurer dans Sources.`;
      case 'bad_data': return `Réponse inattendue de la source${src} : format changé ?`;
      case 'aborted': return 'Annulé.';
      default: return `Erreur de la source${src} : ${e.message}`;
    }
  }
  return e instanceof Error ? e.message : String(e);
}
