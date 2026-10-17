import * as THREE from 'three';
import { sphere, cone, cyl, torus, box, mat, part, group, canvasTexture, checker } from './kit.js';
import { KINDS } from '../sim/kinds.js';

// Objets de la piste : ennemis (Badniks), écrans bonus, ressorts, accélérateurs, plateformes et obstacles par zone.
// Toutes les pièces partagent géométries et matériaux (kit.js) pour rester légères sur mobile.

const icon = (draw, bg = '#1b2a4a') => canvasTexture(64, (ctx, s) => {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s);
  draw(ctx, s);
});

let icons;
function monitorIcons() {
  icons ??= {
    magnet: icon((c, s) => { c.strokeStyle = '#ff3b3b'; c.lineWidth = 10; c.beginPath(); c.arc(s / 2, s / 2, 16, Math.PI, 0, true); c.stroke(); c.fillStyle = '#ddd'; c.fillRect(s / 2 - 21, s / 2, 10, 12); c.fillRect(s / 2 + 11, s / 2, 10, 12); }),
    shield: icon((c, s) => { const g = c.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, 22); g.addColorStop(0, '#bfe9ff'); g.addColorStop(1, '#2a7bff'); c.fillStyle = g; c.beginPath(); c.arc(s / 2, s / 2, 20, 0, 7); c.fill(); }),
    boost: icon((c, s) => { c.fillStyle = '#ffd319'; c.beginPath(); c.moveTo(36, 8); c.lineTo(18, 36); c.lineTo(30, 36); c.lineTo(24, 58); c.lineTo(46, 26); c.lineTo(33, 26); c.closePath(); c.fill(); }),
  };
  return icons;
}

let arrowTex;
const dashTexture = () => (arrowTex ??= canvasTexture(64, (c, s) => {
  c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, s, s);
  c.fillStyle = '#ffd319';
  for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(10, 30 + i * 30); c.lineTo(32, 8 + i * 30); c.lineTo(54, 30 + i * 30); c.lineTo(44, 30 + i * 30); c.lineTo(32, 18 + i * 30); c.lineTo(20, 30 + i * 30); c.fill(); }
}, { repeat: [1, 1] }));

const hazard = () => canvasTexture(64, (c, s) => {
  c.fillStyle = '#f5c518'; c.fillRect(0, 0, s, s); c.fillStyle = '#1a1a1a';
  for (let i = -s; i < s * 2; i += 22) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 11, 0); c.lineTo(i + 11 - s, s); c.lineTo(i - s, s); c.fill(); }
});
let hazardTex;

// --- Badniks ---
function motobug() {
  const g = new THREE.Group();
  part(g, sphere(0.55, 16, 10, ), mat(0xd81e2a, { shiny: true }), [0, 0.55, 0], [0, 0, 0], [1, 0.8, 1.1]);
  part(g, sphere(0.3, 12, 10), mat(0x2a5cff, { shiny: true }), [0, 0.5, -0.5]);
  for (const s of [-1, 1]) {
    part(g, sphere(0.09, 8, 6), mat(0xffffff), [s * 0.12, 0.6, -0.75]);
    part(g, sphere(0.04, 6, 6), mat(0x111111), [s * 0.12, 0.6, -0.83]);
    part(g, sphere(0.2, 10, 8), mat(0x111111), [s * 0.45, 0.45, 0], [0, 0, 0], [0.4, 1, 1]);
  }
  part(g, torus(0.2, 0.08, 6, 12), mat(0x222222), [0, 0.22, 0.1], [0, Math.PI / 2, 0]);
  part(g, cyl(0.02, 0.02, 0.4, 4), mat(0x888888), [0, 1.05, 0.2], [0.4, 0, 0]);
  part(g, sphere(0.06, 6, 6), mat(0xffd319), [0, 1.24, 0.28]);
  return g;
}

function buzzBomber() {
  const g = new THREE.Group();
  const body = group(g, [0, 1.75, 0], [0, 0, 0]);
  for (let i = 0; i < 4; i++) part(body, cyl(0.24, 0.24, 0.22, 10), mat(i % 2 ? 0x111111 : 0xffd319), [0, 0, 0.1 + i * 0.22 - 0.3], [Math.PI / 2, 0, 0]);
  part(body, sphere(0.3, 12, 10), mat(0x2a5cff, { shiny: true }), [0, 0.05, -0.45]);
  part(body, sphere(0.1, 8, 6), mat(0xff2222, { emissive: 0x880000 }), [0, 0.08, -0.72]);
  part(body, cone(0.12, 0.4, 8), mat(0xaaaaaa), [0, -0.15, 0.7], [-Math.PI / 2 - 0.6, 0, 0]);
  const wings = group(body, [0, 0.25, 0]);
  for (const s of [-1, 1]) part(wings, box(0.7, 0.02, 0.35), mat(0xcfefff, { transparent: true, opacity: 0.6 }), [s * 0.4, 0, 0], [0, 0, s * 0.3]);
  g.userData.wings = wings;
  return g;
}

// --- Écran bonus (monitor) ---
function monitor(power) {
  const g = new THREE.Group();
  part(g, box(0.9, 0.9, 0.9), mat(0xcfd4dc, { shiny: true }), [0, 1.0, 0]);
  const screen = new THREE.MeshBasicMaterial({ map: monitorIcons()[power] });
  part(g, new THREE.PlaneGeometry(0.62, 0.55), screen, [0, 1.05, -0.46], [0, Math.PI, 0]);
  part(g, new THREE.PlaneGeometry(0.62, 0.55), screen, [0, 1.05, 0.46]);
  part(g, box(0.5, 0.5, 0.5), mat(0x777777), [0, 0.3, 0]);
  return g;
}

function spring() {
  const g = new THREE.Group();
  part(g, box(1.4, 0.15, 1.0), mat(0x444a55), [0, 0.08, 0]);
  part(g, cyl(0.35, 0.35, 0.25, 10), mat(0xc8ccd4, { shiny: true }), [0, 0.25, 0]);
  part(g, box(1.3, 0.18, 0.9), mat(0xffd319, { shiny: true }), [0, 0.45, 0]);
  part(g, box(1.1, 0.05, 0.7), mat(0xe0142a), [0, 0.56, 0]);
  return g;
}

function dashPad() {
  const g = new THREE.Group();
  part(g, new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: dashTexture() }), [0, 0.03, 0], [-Math.PI / 2, 0, 0]);
  return g;
}

// --- Obstacles propres à chaque zone ---
const OBSTACLES = {
  greenhill: {
    wall: () => {
      const g = new THREE.Group();
      // Totem à visages, façon Green Hill
      const colors = [0xd8722a, 0x3aa34a, 0x2a5cff, 0xd8722a];
      colors.forEach((c, i) => {
        part(g, box(1.6, 0.82, 1.1), mat(c), [0, 0.42 + i * 0.84, 0]);
        part(g, box(0.9, 0.18, 0.05), mat(0x222222), [0, 0.42 + i * 0.84, -0.56]);
      });
      part(g, cone(0.5, 0.6, 4), mat(0xf5c518), [0, 3.65, 0], [0, Math.PI / 4, 0]);
      return g;
    },
    hurdle: () => {
      const g = new THREE.Group();
      part(g, cyl(0.42, 0.42, 1.9, 12), mat(0x8a5a2b), [0, 0.42, 0], [0, 0, Math.PI / 2]);
      for (const s of [-1, 1]) part(g, cyl(0.42, 0.42, 0.05, 12), mat(0xd9b07a), [s * 0.96, 0.42, 0], [0, 0, Math.PI / 2]);
      return g;
    },
    spikes: () => spikesRow(0xc8ccd4),
    bar: () => beam(0x8a5a2b, 0x3aa34a),
  },
  chemical: {
    wall: () => {
      const g = new THREE.Group();
      hazardTex ??= hazard();
      part(g, cyl(0.85, 0.85, 3.2, 14), mat(0x6f7b8f, { shiny: true }), [0, 1.6, 0]);
      part(g, cyl(0.87, 0.87, 0.4, 14), new THREE.MeshLambertMaterial({ map: hazardTex }), [0, 2.4, 0]);
      part(g, sphere(0.6, 12, 8), mat(0x37e0ff, { emissive: 0x0a6a88 }), [0, 3.25, 0], [0, 0, 0], [1, 0.5, 1]);
      return g;
    },
    hurdle: () => {
      const g = new THREE.Group();
      hazardTex ??= hazard();
      part(g, box(1.9, 0.8, 0.5), new THREE.MeshLambertMaterial({ map: hazardTex }), [0, 0.45, 0]);
      return g;
    },
    laser: () => {
      const g = new THREE.Group();
      for (const s of [-1, 1]) part(g, box(0.18, 0.9, 0.18), mat(0x3a3f4a), [s * 1.05, 0.45, 0]);
      part(g, cyl(0.07, 0.07, 2.1, 6), new THREE.MeshBasicMaterial({ color: 0xff2bd6 }), [0, 0.35, 0], [0, 0, Math.PI / 2]);
      return g;
    },
    piston: () => {
      const g = new THREE.Group();
      part(g, box(2.0, 0.4, 1.8), mat(0x3a3f4a), [0, 6.2, 0]);
      const head = group(g, [0, 0, 0]);
      part(head, cyl(0.3, 0.3, 4, 10), mat(0x9aa3b2, { shiny: true }), [0, 4.2, 0]);
      part(head, box(1.9, 0.6, 1.6), mat(0x6f7b8f, { shiny: true }), [0, 2.0, 0]);
      hazardTex ??= hazard();
      part(head, box(1.92, 0.15, 1.62), new THREE.MeshLambertMaterial({ map: hazardTex }), [0, 1.65, 0]);
      g.userData.head = head;
      const warn = part(g, new THREE.PlaneGeometry(2, 1.8), new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.4 }), [0, 0.04, 0], [-Math.PI / 2, 0, 0]);
      g.userData.warn = warn;
      return g;
    },
    spikes: () => spikesRow(0x9aa3b2),
    bar: () => beam(0x6f7b8f, 0xf5c518, true),
  },
  sky: {
    wall: () => {
      const g = new THREE.Group();
      part(g, cyl(0.7, 0.8, 3.0, 10), mat(0xf1ead8), [0, 1.5, 0]);
      part(g, box(1.8, 0.35, 1.4), mat(0xd9cfb4), [0, 3.15, 0]);
      part(g, box(1.8, 0.3, 1.4), mat(0xd9cfb4), [0, 0.15, 0]);
      return g;
    },
    hurdle: () => {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) part(g, box(0.7, 0.6 + (i % 2) * 0.3, 0.8), mat(0xe6dcc2), [-0.65 + i * 0.65, 0.35, 0], [0, i * 0.4, 0.1 * i]);
      return g;
    },
    spikes: () => spikesRow(0x7fe3ff, true),
    bar: () => beam(0xe6dcc2, 0x3aa34a),
    boulder: () => {
      const g = new THREE.Group();
      const ball = part(g, sphere(1.1, 14, 10), mat(0xb9ad91), [0, 1.1, 0]);
      for (let i = 0; i < 5; i++) part(ball, box(0.4, 0.2, 0.5), mat(0x8f8670), [Math.cos(i) * 0.9, Math.sin(i * 2) * 0.6, Math.sin(i) * 0.9], [i, i * 2, 0]);
      g.userData.ball = ball;
      return g;
    },
  },
};

function spikesRow(color, crystal = false) {
  const g = new THREE.Group();
  part(g, box(1.9, 0.12, 1.0), mat(0x3a3f4a), [0, 0.06, 0]);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    part(g, cone(0.17, 0.55, crystal ? 5 : 8), mat(color, { shiny: true, emissive: crystal ? 0x0a5a70 : 0 }), [-0.7 + i * 0.47, 0.38, -0.22 + j * 0.44]);
  }
  return g;
}

function beam(post, top, metal = false) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) part(g, box(0.25, 3.4, 0.3), mat(post), [s * 1.0, 1.7, 0]);
  part(g, box(2.3, 0.7, 0.55), mat(top, { shiny: metal }), [0, 1.65, 0]);
  part(g, box(2.3, 1.4, 0.45), mat(post), [0, 2.75, 0]);
  return g;
}

function missile() {
  const g = new THREE.Group();
  part(g, cyl(0.28, 0.28, 1.1, 10), mat(0xc8ccd4, { shiny: true }), [0, 1.0, 0], [Math.PI / 2, 0, 0]);
  part(g, cone(0.28, 0.45, 10), mat(0xe0142a), [0, 1.0, -0.75], [-Math.PI / 2, 0, 0]);
  part(g, cone(0.22, 0.6, 8), new THREE.MeshBasicMaterial({ color: 0xffa21a }), [0, 1.0, 0.85], [Math.PI / 2, 0, 0]);
  return g;
}

function bomb() {
  const g = new THREE.Group();
  part(g, sphere(0.65, 14, 10), mat(0x1a1a22, { shiny: true }), [0, 0.65, 0]);
  part(g, cyl(0.12, 0.12, 0.25, 8), mat(0x555555), [0, 1.35, 0]);
  const light = part(g, sphere(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2222 }), [0, 1.52, 0]);
  g.userData.light = light;
  return g;
}

function platform(len) {
  const g = new THREE.Group();
  const top = KINDS.platform.top;
  const texture = canvasTexture(64, checker('#7a4a21', '#a4682f', 2), { repeat: [1, Math.max(1, Math.round(len / 2))] });
  part(g, box(2.3, 0.7, len), new THREE.MeshLambertMaterial({ map: texture }), [0, top - 0.35, len / 2]);
  part(g, box(2.4, 0.18, len), mat(0x3fbf3f), [0, top + 0.02, len / 2]);
  for (let z = 1; z < len; z += 5) part(g, cyl(0.25, 0.3, top - 0.6, 8), mat(0x8a5a2b), [0, (top - 0.6) / 2, z]);
  return g;
}

export function makeProp(kind, zoneId, entity) {
  switch (kind) {
    case 'crab': return motobug();
    case 'bee': return buzzBomber();
    case 'magnet': return monitor('magnet');
    case 'shield': return monitor('shield');
    case 'boostItem': return monitor('boost');
    case 'spring': return spring();
    case 'pad': return dashPad();
    case 'platform': return platform(entity.len);
    case 'missile': return missile();
    case 'bomb': return bomb();
    default: {
      const set = OBSTACLES[zoneId] || OBSTACLES.greenhill;
      return (set[kind] || OBSTACLES.greenhill[kind] || OBSTACLES.chemical[kind] || OBSTACLES.sky[kind])();
    }
  }
}

// --- Dr. Eggman dans son Egg Mobile armé ---
export function buildBoss() {
  const g = new THREE.Group();
  const pod = group(g);
  const half = new THREE.SphereGeometry(1.4, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  part(pod, half, mat(0xc8ccd4, { shiny: true }), [0, 0, 0]);
  part(pod, torus(1.4, 0.12, 8, 24), mat(0x2a2a33), [0, 0, 0], [Math.PI / 2, 0, 0]);
  part(pod, box(0.9, 0.25, 0.1), mat(0xe0142a), [0, -0.4, -1.32]);
  for (const s of [-1, 1]) part(pod, cyl(0.2, 0.3, 0.6, 8), mat(0x555a66), [s * 0.8, -1.2, 0]);
  const flames = group(pod, [0, -1.6, 0]);
  for (const s of [-1, 1]) part(flames, cone(0.18, 0.6, 8), new THREE.MeshBasicMaterial({ color: 0xffa21a }), [s * 0.8, 0, 0], [Math.PI, 0, 0]);
  // Eggman
  const egg = group(pod, [0, 0.4, 0.1]);
  part(egg, sphere(0.85, 16, 12), mat(0xd81e2a), [0, 0.1, 0], [0, 0, 0], [1, 0.9, 0.9]);
  part(egg, box(0.25, 0.6, 0.05), mat(0xf5c518), [0, 0.1, -0.78]);
  const head = group(egg, [0, 1.0, -0.1]);
  part(head, sphere(0.5, 16, 12), mat(0xf6b98f), [0, 0, 0]);
  part(head, sphere(0.14, 10, 8), mat(0xf29a7a), [0, -0.05, -0.5]);
  for (const s of [-1, 1]) {
    part(head, cone(0.12, 0.75, 8), mat(0xb5642b), [s * 0.36, -0.18, -0.4], [0, 0, s * (Math.PI / 2 + 0.25)]);
    part(head, torus(0.11, 0.025, 6, 12), mat(0x2a2a33), [s * 0.17, 0.1, -0.46]);
    part(head, sphere(0.09, 8, 6), mat(0x7fd3ff, { transparent: true, opacity: 0.7 }), [s * 0.17, 0.1, -0.47]);
  }
  part(head, torus(0.4, 0.05, 6, 16), mat(0x2a2a33), [0, 0.32, 0], [Math.PI / 2 + 0.3, 0, 0]);
  for (const s of [-1, 1]) {
    const arm = group(pod, [s * 1.5, 0.1, 0]);
    part(arm, box(0.4, 0.4, 1.4), mat(0x6f7b8f, { shiny: true }), [0, 0, 0]);
    part(arm, cyl(0.16, 0.16, 0.7, 8), mat(0x2a2a33), [0, 0, -0.9], [Math.PI / 2, 0, 0]);
  }
  part(pod, sphere(1.1, 16, 10, ), mat(0x9fe2ff, { transparent: true, opacity: 0.18 }), [0, 0.5, 0], [0, 0, 0], [1.1, 1.1, 1.1]);
  g.userData = { pod, flames, head };
  return g;
}

// Anneau doré (géométrie et matériau partagés, rendu instancié dans entities.js).
export const ringGeometry = () => torus(0.42, 0.1, 8, 18);
export const ringMaterial = () => mat(0xffc81f, { shiny: true, emissive: 0x5a3a00 });
