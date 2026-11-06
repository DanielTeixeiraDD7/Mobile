/**
 * Empreinte visuelle d'une carte : petite vignette couleur (12 × 17) normalisée par canal.
 * La normalisation (moyenne 0, écart-type 1 par canal) rend la comparaison peu sensible à l'éclairage
 * et à la balance des blancs ; la comparaison se fait par produit scalaire (similarité cosinus).
 *
 * Même code côté navigateur (photo) et côté script de données (images de référence) :
 * les deux empreintes sont donc calculées exactement de la même façon.
 */
export const LARG = 12;
export const HAUT = 17;
export const DIM = LARG * HAUT * 3;
/** Facteur de quantification en entiers 8 bits (les composantes dépassent rarement ±0,3). */
export const ECHELLE = 400;

/** Image brute RGBA (ImageData ou décodeur JPEG). */
export interface Pixels { data: Uint8Array | Uint8ClampedArray; width: number; height: number }
export interface Cadre { x: number; y: number; l: number; h: number }

/** Couleur interpolée (bilinéaire) au point (x, y) en pixels source. */
function echantillon(p: Pixels, x: number, y: number, sortie: Float32Array, k: number) {
  const w = p.width, h = p.height;
  const cx = Math.min(w - 1, Math.max(0, x)), cy = Math.min(h - 1, Math.max(0, y));
  const x0 = Math.floor(cx), y0 = Math.floor(cy), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
  const fx = cx - x0, fy = cy - y0;
  for (let c = 0; c < 3; c++) {
    const a = p.data[(y0 * w + x0) * 4 + c]!, b = p.data[(y0 * w + x1) * 4 + c]!;
    const d = p.data[(y1 * w + x0) * 4 + c]!, e = p.data[(y1 * w + x1) * 4 + c]!;
    sortie[k + c] = (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy;
  }
}

/**
 * Empreinte du cadre donné (par défaut toute l'image) : 4 × 4 échantillons bilinéaires moyennés par case
 * de la grille 12 × 17, puis normalisation par canal et norme 1.
 * `rotation` : 0, 90 ou 270 (cartes de champ de bataille, au format paysage).
 */
export function empreinte(p: Pixels, cadre: Cadre = { x: 0, y: 0, l: p.width, h: p.height }, rotation: 0 | 90 | 270 = 0): Float32Array {
  const v = new Float32Array(DIM);
  const tmp = new Float32Array(3);
  const S = 4;
  for (let gy = 0; gy < HAUT; gy++) {
    for (let gx = 0; gx < LARG; gx++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          // Coordonnées normalisées dans la vignette portrait (0..1).
          const u = (gx + (sx + 0.5) / S) / LARG, w = (gy + (sy + 0.5) / S) / HAUT;
          // Rotation : la vignette portrait lit une image paysage tournée.
          const [ux, uy] = rotation === 90 ? [w, 1 - u] : rotation === 270 ? [1 - w, u] : [u, w];
          echantillon(p, cadre.x + ux * cadre.l - 0.5, cadre.y + uy * cadre.h - 0.5, tmp, 0);
          r += tmp[0]!; g += tmp[1]!; b += tmp[2]!;
        }
      }
      const k = (gy * LARG + gx) * 3;
      v[k] = r / (S * S); v[k + 1] = g / (S * S); v[k + 2] = b / (S * S);
    }
  }
  return normaliser(v);
}

function normaliser(v: Float32Array): Float32Array {
  const n = LARG * HAUT;
  for (let c = 0; c < 3; c++) {
    let m = 0;
    for (let i = 0; i < n; i++) m += v[i * 3 + c]!;
    m /= n;
    let s = 0;
    for (let i = 0; i < n; i++) s += (v[i * 3 + c]! - m) ** 2;
    s = Math.sqrt(s / n) + 1e-6;
    for (let i = 0; i < n; i++) v[i * 3 + c] = (v[i * 3 + c]! - m) / s;
  }
  let norme = 0;
  for (let i = 0; i < v.length; i++) norme += v[i]! ** 2;
  norme = Math.sqrt(norme) || 1;
  for (let i = 0; i < v.length; i++) v[i] = v[i]! / norme;
  return v;
}

export function quantifier(v: Float32Array): Int8Array {
  const q = new Int8Array(v.length);
  for (let i = 0; i < v.length; i++) q[i] = Math.max(-127, Math.min(127, Math.round(v[i]! * ECHELLE)));
  return q;
}

/** Index des empreintes de référence (lignes quantifiées) et de la carte de chaque ligne. */
export interface Index { ids: string[]; lignes: Int8Array }

/**
 * Cadres de recherche autour du cadre de visée : 3 échelles × 3 × 3 décalages,
 * pour tolérer une carte un peu trop près, trop loin ou décentrée.
 */
export function cadresAutour(c: Cadre): Cadre[] {
  const out: Cadre[] = [];
  const pas = c.l * 0.03;
  for (const s of [0.92, 1, 1.08]) {
    for (const dx of [-pas, 0, pas]) {
      for (const dy of [-pas, 0, pas]) {
        const l = c.l * s, h = c.h * s;
        out.push({ x: c.x + (c.l - l) / 2 + dx, y: c.y + (c.h - h) / 2 + dy, l, h });
      }
    }
  }
  return out;
}

export interface Candidat { id: string; score: number }

/** Meilleures cartes pour un ensemble d'empreintes de la photo (score = meilleure similarité cosinus). */
export function chercher(index: Index, requetes: Float32Array[], n = 5): Candidat[] {
  const nb = index.ids.length;
  const meilleur = new Map<string, number>();
  for (let l = 0; l < nb; l++) {
    const off = l * DIM;
    let max = -Infinity;
    for (const q of requetes) {
      let s = 0;
      for (let i = 0; i < DIM; i++) s += q[i]! * index.lignes[off + i]!;
      if (s > max) max = s;
    }
    const score = max / ECHELLE;
    const id = index.ids[l]!;
    if ((meilleur.get(id) ?? -Infinity) < score) meilleur.set(id, score);
  }
  return [...meilleur].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score).slice(0, n);
}
