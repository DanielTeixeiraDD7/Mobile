import * as THREE from 'three';
import { sphere, cone, cyl, torus, box, mat, part, group } from './kit.js';

// Modèles 3D des personnages, en fan-art construit à partir de primitives (pas de fichiers extraits des jeux).
// Le personnage regarde vers -Z ; la caméra le voit de dos. Racine aux pieds (y = 0).
// Chaque modèle expose les mêmes articulations pour l'animation procédurale (characterRig.js).

const C = {
  peach: 0xf2c49b, white: 0xffffff, black: 0x111111, red: 0xd81e2a, gold: 0xf5c518,
};

function eyes(head, iris, { z = -0.33, spread = 0.1 } = {}) {
  for (const s of [-1, 1]) {
    part(head, sphere(0.13, 14, 10), mat(C.white), [s * spread, 0.06, z], [0, s * 0.25, 0], [0.75, 1.2, 0.5]);
    part(head, sphere(0.055, 10, 8), mat(iris), [s * (spread - 0.01), 0.05, z - 0.06]);
    part(head, sphere(0.028, 8, 6), mat(C.black), [s * (spread - 0.01), 0.05, z - 0.09]);
  }
}

function muzzle(head, color = C.peach) {
  part(head, sphere(0.2, 14, 10), mat(color), [0, -0.13, -0.27], [0, 0, 0], [1.25, 0.75, 0.9]);
  part(head, sphere(0.05, 8, 6), mat(C.black, { shiny: true }), [0, -0.06, -0.48]);
}

function ears(head, color, inner) {
  for (const s of [-1, 1]) {
    part(head, cone(0.12, 0.28, 8), mat(color), [s * 0.22, 0.33, 0.02], [0, 0, -s * 0.45]);
    part(head, cone(0.07, 0.18, 8), mat(inner), [s * 0.21, 0.32, -0.03], [0, 0, -s * 0.45]);
  }
}

function gloves(arm, big = false) {
  part(arm, sphere(big ? 0.14 : 0.095, 12, 10), mat(C.white), [0, -0.4, 0]);
  part(arm, torus(big ? 0.1 : 0.075, 0.03, 6, 12), mat(C.white), [0, -0.33, 0], [Math.PI / 2, 0, 0]);
}

function shoes(leg, main, strap, sole = C.white) {
  part(leg, sphere(0.15, 14, 10), mat(main, { shiny: true }), [0, -0.44, -0.07], [0, 0, 0], [0.85, 0.7, 1.6]);
  part(leg, box(0.27, 0.06, 0.12), mat(strap), [0, -0.4, -0.06]);
  part(leg, sphere(0.15, 12, 8), mat(sole), [0, -0.5, -0.07], [0, 0, 0], [0.82, 0.25, 1.55]);
}

// Squelette commun : hanches, jambes, torse, tête, bras. Retourne les articulations.
function skeleton(root, { skin, belly = C.peach, arms = C.peach, legs }) {
  const hips = group(root, [0, 0.62, 0]);
  const legL = group(hips, [-0.12, 0, 0]);
  const legR = group(hips, [0.12, 0, 0]);
  for (const leg of [legL, legR]) part(leg, cyl(0.05, 0.05, 0.42, 8), mat(legs ?? skin), [0, -0.2, 0]);
  const torso = group(hips, [0, 0, 0]);
  part(torso, sphere(0.24, 16, 12), mat(skin), [0, 0.23, 0], [0, 0, 0], [1, 1.15, 0.9]);
  part(torso, sphere(0.17, 14, 10), mat(belly), [0, 0.22, -0.12], [0, 0, 0], [1, 1.2, 0.6]);
  const head = group(torso, [0, 0.66, 0]);
  part(head, sphere(0.4, 20, 16), mat(skin), [0, 0, 0]);
  const armL = group(torso, [-0.26, 0.38, 0]);
  const armR = group(torso, [0.26, 0.38, 0]);
  for (const arm of [armL, armR]) part(arm, cyl(0.045, 0.045, 0.34, 8), mat(arms), [0, -0.17, 0]);
  return { hips, legL, legR, torso, head, armL, armR };
}

// Piquants : cônes partant de l'arrière de la tête. tilt > 0 : vers le bas (Sonic), < 0 : relevés (Shadow).
function quills(head, color, layout, { tilt = 0.35, length = 0.62, radius = 0.14, stripe = null } = {}) {
  for (const [x, y] of layout) {
    const q = group(head, [x, y, 0.2], [Math.PI / 2 + tilt - y * 0.6, 0, -x * 0.9]);
    part(q, cone(radius, length, 8), mat(color), [0, length / 2, 0]);
    if (stripe) part(q, cone(radius * 0.55, length * 0.6, 6), mat(stripe), [0, length * 0.5, -radius * 0.55]);
  }
}

// Boule de rotation (saut, glissade, Spin Dash).
function spinBall(root, color, accent) {
  const ball = group(root, [0, 0.55, 0]);
  part(ball, sphere(0.5, 16, 12), mat(color, { shiny: true }), [0, 0, 0]);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    part(ball, cone(0.16, 0.35, 6), mat(color), [Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0], [0, 0, a - Math.PI / 2]);
  }
  part(ball, torus(0.56, 0.05, 6, 24), mat(accent, { transparent: true, opacity: 0.6 }), [0, 0, 0], [0, Math.PI / 2, 0]);
  ball.visible = false;
  return ball;
}

function sonic() {
  const root = new THREE.Group();
  const blue = 0x1f5fff;
  const j = skeleton(root, { skin: blue, legs: blue });
  muzzle(j.head);
  eyes(j.head, 0x2fbf3f);
  ears(j.head, blue, C.peach);
  quills(j.head, blue, [[0, 0.24], [-0.2, 0.12], [0.2, 0.12], [0, 0.0], [-0.18, -0.14], [0.18, -0.14], [0, -0.26]]);
  for (const s of [-1, 1]) part(j.torso, cone(0.08, 0.25, 6), mat(blue), [s * 0.08, 0.3, 0.22], [Math.PI / 2 + 0.3, 0, 0]);
  gloves(j.armL); gloves(j.armR);
  shoes(j.legL, 0xe0142a, C.white); shoes(j.legR, 0xe0142a, C.white);
  for (const leg of [j.legL, j.legR]) part(leg, box(0.05, 0.05, 0.05), mat(C.gold, { shiny: true }), [0.14, -0.4, -0.06]);
  const ball = spinBall(root, blue, 0x9fd3ff);
  return { root, ...j, ball, trail: 0x4f9cff };
}

function tails() {
  const root = new THREE.Group();
  const orange = 0xff9a1f;
  const j = skeleton(root, { skin: orange, belly: C.white, legs: orange });
  muzzle(j.head, C.white);
  eyes(j.head, 0x2a7bff);
  ears(j.head, orange, C.white);
  // Mèches sur le front et touffes de joues
  for (const [x, rz] of [[-0.09, 0.4], [0, 0], [0.09, -0.4]]) part(j.head, cone(0.06, 0.22, 6), mat(orange), [x, 0.33, -0.22], [-0.9, 0, rz]);
  for (const s of [-1, 1]) part(j.head, cone(0.09, 0.25, 6), mat(orange), [s * 0.36, -0.12, -0.05], [0, 0, s * 1.9]);
  for (let i = 0; i < 3; i++) part(j.torso, cone(0.07, 0.18, 6), mat(C.white), [-0.07 + i * 0.07, 0.38, -0.16], [-1.2, 0, 0]);
  gloves(j.armL); gloves(j.armR);
  shoes(j.legL, 0xd8212b, C.white); shoes(j.legR, 0xd8212b, C.white);
  // Deux queues (hélice en vol)
  const tailPivot = group(j.hips, [0, 0.05, 0.2]);
  for (const s of [-1, 1]) {
    const t = group(tailPivot, [0, 0, 0], [0.9, s * 0.45, 0]);
    part(t, cone(0.17, 0.62, 10), mat(orange), [0, 0.3, 0], [Math.PI, 0, 0]);
    part(t, sphere(0.15, 10, 8), mat(C.white), [0, 0.62, 0], [0, 0, 0], [1, 1.3, 1]);
  }
  const ball = spinBall(root, orange, 0xffe2a8);
  return { root, ...j, ball, tails: tailPivot, trail: 0xffc266 };
}

function knuckles() {
  const root = new THREE.Group();
  const red = 0xe3262f;
  const j = skeleton(root, { skin: red, legs: red });
  muzzle(j.head);
  eyes(j.head, 0x8e3bd9);
  // Dreadlocks : longues mèches tombantes
  quills(j.head, red, [[0, 0.22], [-0.2, 0.1], [0.2, 0.1], [-0.22, -0.08], [0.22, -0.08], [0, -0.04]], { tilt: 0.95, length: 0.72, radius: 0.13 });
  // Croissant blanc sur la poitrine
  part(j.torso, torus(0.12, 0.035, 6, 14, Math.PI), mat(C.white), [0, 0.32, -0.19], [0, 0, Math.PI]);
  for (const arm of [j.armL, j.armR]) {
    gloves(arm, true);
    for (const s of [-1, 1]) part(arm, cone(0.035, 0.12, 6), mat(C.white), [s * 0.05, -0.43, -0.13], [-Math.PI / 2, 0, 0]);
  }
  shoes(j.legL, 0x22a046, 0xf5c518); shoes(j.legR, 0x22a046, 0xf5c518);
  const ball = spinBall(root, red, 0xff9aa0);
  return { root, ...j, ball, trail: 0xff5a5a };
}

function shadow() {
  const root = new THREE.Group();
  const black = 0x26262e, stripe = 0xd4141c;
  const j = skeleton(root, { skin: black, legs: black });
  muzzle(j.head);
  eyes(j.head, 0xd4141c);
  ears(j.head, black, C.peach);
  // Piquants relevés à bandes rouges
  quills(j.head, black, [[0, 0.26], [-0.2, 0.14], [0.2, 0.14], [-0.18, -0.06], [0.18, -0.06], [0, 0.02]], { tilt: -0.25, length: 0.64, stripe });
  // Touffe blanche sur la poitrine
  for (let i = 0; i < 3; i++) part(j.torso, cone(0.08, 0.22, 6), mat(C.white), [-0.07 + i * 0.07, 0.36, -0.17], [-1.1, 0, (i - 1) * 0.4]);
  for (const arm of [j.armL, j.armR]) { gloves(arm); part(arm, torus(0.08, 0.025, 6, 12), mat(C.gold, { shiny: true }), [0, -0.29, 0], [Math.PI / 2, 0, 0]); }
  for (const leg of [j.legL, j.legR]) {
    shoes(leg, C.white, stripe, 0x333333);
    part(leg, torus(0.065, 0.022, 6, 12), mat(C.gold, { shiny: true }), [0, -0.33, 0], [Math.PI / 2, 0, 0]);
    // Réacteurs des chaussures (visibles en boost)
    leg.userData.jet = part(leg, cone(0.07, 0.25, 8), mat(0xffa21a, { emissive: 0xff6a00 }), [0, -0.47, 0.22], [-Math.PI / 2, 0, 0]);
    leg.userData.jet.visible = false;
  }
  const ball = spinBall(root, black, 0xff4a4a);
  return { root, ...j, ball, trail: 0xff3b3b };
}

const BUILDERS = { sonic, tails, knuckles, shadow };

export function buildCharacter(id) {
  const model = (BUILDERS[id] || sonic)();
  model.body = [model.hips];
  model.root.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return model;
}
