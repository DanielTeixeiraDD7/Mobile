export interface Serie { valeurs: number[]; couleur: string; pointilles?: boolean; aire?: boolean; epaisseur?: number; libelle?: string }
export interface Part { id: string; valeur: number; couleur: string }
export interface Barre { libelle: string; valeur: number; actif?: boolean; couleur?: string }
