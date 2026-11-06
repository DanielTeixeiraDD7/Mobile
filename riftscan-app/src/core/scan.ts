import { cadresAutour, chercher, empreinte, type Cadre, type Candidat, type Index, type Pixels } from './empreinte';

/** Seuils mesurés sur 250 photos simulées : bonne carte ≥ 0,75, fond sans carte ≤ 0,35. */
export const SEUIL_SUR = 0.62;
export const SEUIL_POSSIBLE = 0.5;

/** Candidats pour une image où la carte est attendue dans `cadre`. */
export function reconnaitre(index: Index, px: Pixels, cadre: Cadre, n = 6): Candidat[] {
  return chercher(index, cadresAutour(cadre).map(c => empreinte(px, c)), n);
}

/**
 * Photo importée : la carte peut occuper une partie de l'image. On essaie plusieurs tailles de cadre
 * (au format carte 63 × 88) centrées sur l'image.
 */
export function reconnaitrePhoto(index: Index, px: Pixels, n = 6): Candidat[] {
  const ratio = 63 / 88;
  const cadres: Cadre[] = [];
  for (const s of [1, 0.85, 0.7, 0.55]) {
    let h = px.height * s, l = h * ratio;
    if (l > px.width * s) { l = px.width * s; h = l / ratio; }
    cadres.push(...cadresAutour({ x: (px.width - l) / 2, y: (px.height - h) / 2, l, h }));
  }
  return chercher(index, cadres.map(c => empreinte(px, c)), n);
}
