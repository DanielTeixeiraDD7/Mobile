/** Modèles pris en charge (chaque site a ses propres codes de marque / modèle, voir sites.ts). */
export interface Modele { id: string; marque: string; nom: string; electrique: boolean }

export const MODELES: Modele[] = [
  { id: 'peugeot-e2008', marque: 'Peugeot', nom: 'e-2008', electrique: true },
];

export const modeleParId = (id: string) => MODELES.find(m => m.id === id) ?? MODELES[0]!;
export const nomModele = (id: string) => { const m = modeleParId(id); return `${m.marque} ${m.nom}`; };
