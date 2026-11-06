/** Carte (copie compacte du catalogue TCGplayer publié par TCGCSV, voir scripts/donnees.ts). */
export interface Carte {
  id: string;
  /** Nom (avec la variante entre parenthèses, ex. « Jinx (Alternate Art) »). */
  n: string;
  /** Extension : code et nom. */
  s: string;
  sn: string;
  /** Numéro de collection (ex. « 010/298 »). */
  no: string;
  /** Rareté, type, domaines. */
  r: string;
  t: string;
  d: string[];
  img: string;
  url: string;
}
export type Finition = 'N' | 'F';
/** [prix du marché, plus bas, médian] en dollars ; null = pas de vente / d'offre connue. */
export type LignePrix = (number | null)[];
export interface Prix {
  /** Date de la copie TCGCSV utilisée. */
  maj: string;
  /** 1 EUR = usdParEur USD (taux de référence BCE). */
  usdParEur: number;
  dateTaux: string;
  p: Record<string, Partial<Record<Finition, LignePrix>>>;
}
export interface Historique { jours: string[]; p: Record<string, Partial<Record<Finition, (number | null)[]>>> }
