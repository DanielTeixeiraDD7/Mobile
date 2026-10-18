/**
 * Serveur FICTIF pour les exercices (données inventées, aucune requête réseau).
 * Imite un back-end : latence, erreurs, et un traitement long pour le polling.
 */
export interface Salarie { id: number; nom: string; prenom: string; service: string; poste: string; entree: string; actif: boolean }
export interface Absence { id: number; salarieId: number; type: string; debut: string; fin: string; statut: 'brouillon' | 'soumise' | 'validee' | 'refusee' }

const SALARIES: Salarie[] = [
  { id: 1, nom: 'Martin', prenom: 'Léa', service: 'Comptabilité', poste: 'Comptable', entree: '2019-03-04', actif: true },
  { id: 2, nom: 'Bernard', prenom: 'Hugo', service: 'Informatique', poste: 'Développeur', entree: '2021-09-01', actif: true },
  { id: 3, nom: 'Petit', prenom: 'Chloé', service: 'RH', poste: 'Chargée RH', entree: '2017-01-16', actif: true },
  { id: 4, nom: 'Durand', prenom: 'Nathan', service: 'Informatique', poste: 'Chef de projet', entree: '2015-06-22', actif: false },
  { id: 5, nom: 'Leroy', prenom: 'Inès', service: 'Comptabilité', poste: 'Assistante', entree: '2023-02-13', actif: true },
  { id: 6, nom: 'Moreau', prenom: 'Lucas', service: 'RH', poste: 'Responsable paie', entree: '2012-10-08', actif: true },
];

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiError'; }
}

export interface FakeServerOptions { delay?: number }

export class FakeServer {
  delay: number;
  /** La prochaine requête échoue (une fois) avec ce statut. */
  failNext: number | null = null;
  /** Nombre d'appels par fonction (pour les tests). */
  calls: Record<string, number> = {};
  /** Polling : nombre de réponses « en cours » avant « termine ». */
  pendingSteps = 3;
  absences: Absence[] = [];
  private seq = 100;

  constructor(o: FakeServerOptions = {}) { this.delay = o.delay ?? 400; }

  private async respond<T>(name: string, value: () => T): Promise<T> {
    this.calls[name] = (this.calls[name] ?? 0) + 1;
    await new Promise(r => setTimeout(r, this.delay));
    if (this.failNext !== null) {
      const s = this.failNext; this.failNext = null;
      throw new ApiError(s, s === 404 ? 'Introuvable' : s === 400 ? 'Données invalides' : 'Erreur serveur');
    }
    return structuredClone(value());
  }

  /** Module « @/lib/api » tel que vu par le code de l'exercice. */
  module() {
    return {
      ApiError,
      fetchSalaries: (filtre?: { service?: string; actif?: boolean }) => this.respond('fetchSalaries', () =>
        SALARIES.filter(s => (!filtre?.service || s.service === filtre.service) && (filtre?.actif === undefined || s.actif === filtre.actif))),
      fetchSalarie: (id: number | string) => this.respond('fetchSalarie', () => {
        const s = SALARIES.find(x => x.id === Number(id));
        if (!s) throw new ApiError(404, 'Salarié introuvable');
        return s;
      }),
      saveAbsence: (a: Omit<Absence, 'id' | 'statut'> & { statut?: Absence['statut'] }) => this.respond('saveAbsence', () => {
        if (!a.debut || !a.fin || a.fin < a.debut) throw new ApiError(400, 'Dates invalides');
        const saved: Absence = { ...a, id: ++this.seq, statut: a.statut ?? 'soumise' };
        this.absences.push(saved);
        return saved;
      }),
      fetchStatutExport: () => this.respond('fetchStatutExport', () => {
        if (this.pendingSteps > 0) { this.pendingSteps--; return { statut: 'en_cours' as const }; }
        return { statut: 'termine' as const, fichier: 'export-fictif.csv' };
      }),
    };
  }
}

export const SALARIES_FICTIFS = SALARIES;
