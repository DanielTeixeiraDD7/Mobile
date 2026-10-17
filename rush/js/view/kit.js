import * as THREE from 'three';

// Petits outils de modélisation : géométries et matériaux partagés (moins d'allocations, moins d'appels de dessin).
const geoCache = new Map();
const matCache = new Map();

export function geo(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}

export const sphere = (r = 1, w = 16, h = 12) => geo(`s${r}|${w}|${h}`, () => new THREE.SphereGeometry(r, w, h));
export const cone = (r = 1, h = 1, s = 10) => geo(`c${r}|${h}|${s}`, () => new THREE.ConeGeometry(r, h, s));
export const cyl = (rt = 1, rb = 1, h = 1, s = 10) => geo(`y${rt}|${rb}|${h}|${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
export const box = (x = 1, y = 1, z = 1) => geo(`b${x}|${y}|${z}`, () => new THREE.BoxGeometry(x, y, z));
export const torus = (r = 1, t = 0.2, rs = 8, ts = 20, arc = Math.PI * 2) => geo(`t${r}|${t}|${rs}|${ts}|${arc}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc));

// Matériau Lambert (éclairage par sommet, économique sur mobile) ou Phong pour les surfaces brillantes.
export function mat(color, { shiny = false, emissive = 0x000000, emissiveIntensity = 1, transparent = false, opacity = 1, map = null, side } = {}) {
  const key = `${color}|${shiny}|${emissive}|${emissiveIntensity}|${transparent}|${opacity}|${map?.uuid}|${side}`;
  if (!matCache.has(key)) {
    const Ctor = shiny ? THREE.MeshPhongMaterial : THREE.MeshLambertMaterial;
    const params = { color, emissive, emissiveIntensity, transparent, opacity, map };
    if (side !== undefined) params.side = side;
    if (shiny) params.shininess = 60;
    matCache.set(key, new Ctor(params));
  }
  return matCache.get(key);
}

// Crée une pièce et l'ajoute à un parent. p : position, r : rotation, s : échelle.
export function part(parent, geometry, material, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...p);
  m.rotation.set(...r);
  m.scale.set(...s);
  parent.add(m);
  return m;
}

export function group(parent, p = [0, 0, 0], r = [0, 0, 0]) {
  const g = new THREE.Group();
  g.position.set(...p);
  g.rotation.set(...r);
  parent?.add(g);
  return g;
}

// Textures dessinées dans un canvas (aucun fichier image à charger).
export function canvasTexture(size, draw, { repeat = [1, 1], nearest = false } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  if (nearest) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; }
  t.anisotropy = 4;
  return t;
}

export function checker(a, b, n = 2, size = 64) {
  return (ctx, s) => {
    const cell = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      ctx.fillStyle = (i + j) % 2 ? a : b;
      ctx.fillRect(i * cell, j * cell, cell, cell);
    }
  };
}
