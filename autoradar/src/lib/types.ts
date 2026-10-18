export type Pays = 'PT' | 'DE' | 'FR' | 'BE';

/** Critères d'une recherche, saisis une fois et appliqués à chaque site. */
export interface Criteres {
  modele: string; // id du catalogue (ex. « peugeot-e2008 »)
  prixMax: number | null;
  anneeMin: number | null;
  kmMax: number | null;
  tri: 'recent' | 'prix';
}

export interface Recherche {
  id: string;
  nom: string;
  criteres: Criteres;
  pays: Pays[];
  creeLe: number;
}

export type Statut = 'a-voir' | 'contacte' | 'vue' | 'ecartee' | 'favorite';
export type Vendeur = 'pro' | 'particulier' | 'inconnu';

/** Annonce suivie : saisie à la main à partir du lien (aucune copie automatique des sites). */
export interface Annonce {
  id: string;
  url: string;
  site: string | null; // id du site détecté depuis le domaine
  pays: Pays;
  titre: string;
  prix: number | null;
  annee: number | null;
  km: number | null;
  batterieKwh: number | null;
  soh: number | null; // état de santé batterie, %
  vendeur: Vendeur;
  pompeAChaleur: boolean | null;
  chargeur11kw: boolean | null;
  statut: Statut;
  notes: string;
  ajouteLe: number;
  majLe: number;
}

export const DRAPEAU: Record<Pays, string> = { PT: '🇵🇹', DE: '🇩🇪', FR: '🇫🇷', BE: '🇧🇪' };
export const NOM_PAYS: Record<Pays, string> = { PT: 'Portugal', DE: 'Allemagne', FR: 'France', BE: 'Belgique' };

export type ChampsAnnonce = Omit<Annonce, 'id' | 'ajouteLe' | 'majLe' | 'site'>;

export const STATUTS: { label: string; value: Statut; icon: string; classe: string }[] = [
  { label: 'À voir', value: 'a-voir', icon: 'pi pi-eye', classe: '' },
  { label: 'Contacté', value: 'contacte', icon: 'pi pi-comments', classe: 'blue' },
  { label: 'Vue en vrai', value: 'vue', icon: 'pi pi-check-circle', classe: 'good' },
  { label: 'Coup de cœur', value: 'favorite', icon: 'pi pi-heart-fill', classe: 'warn' },
  { label: 'Écartée', value: 'ecartee', icon: 'pi pi-ban', classe: 'bad' },
];
export const statut = (s: Statut) => STATUTS.find(x => x.value === s)!;

export const annonceVide = (): ChampsAnnonce => ({
  url: '', pays: 'PT', titre: '', prix: null, annee: null, km: null, batterieKwh: null, soh: null,
  vendeur: 'inconnu', pompeAChaleur: null, chargeur11kw: null, statut: 'a-voir', notes: '',
});
