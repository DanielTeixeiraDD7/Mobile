import * as THREE from 'three';
import { LANES, VIEW_DISTANCE, BEHIND } from '../sim/config.js';
import { sphere, cone, cyl, box, torus, mat, canvasTexture, checker } from './kit.js';

// Décor d'une zone : ciel, lumières, piste en dalles (avec trous), bas-côtés défilants, décor instancié,
// arrière-plan lointain. Le monde défile vers +Z ; une entité à z mètres devant le joueur est en -z.

const TILE = 1;
const TRACK_WIDTH = 2.6;
const FAR = VIEW_DISTANCE + 10;

// Palette et éléments propres à chaque zone.
const THEMES = {
  greenhill: {
    sky: ['#3d8bff', '#9fd6ff', '#e8f6ff'], fog: 0xbfe6ff, fogNear: 60, fogFar: 175,
    hemi: [0xdff3ff, 0x5c8a2e, 1.1], sun: [0xfff2d0, 1.6],
    top: checker('#4cc93f', '#3aa832', 2), side: checker('#9c5a24', '#7a4219', 4), shoulder: checker('#2f8f2a', '#2a8226', 2),
    under: { color: 0x1e7fd6, y: -7, emissive: 0x0a3a70 }, shoulderY: -3,
    decor: ['palm', 'palm', 'sunflower', 'totem', 'rock', 'palm'],
    background: 'hills',
  },
  chemical: {
    sky: ['#0b0f2e', '#24205a', '#5a2a7a'], fog: 0x2a2060, fogNear: 50, fogFar: 160,
    hemi: [0x9aa8ff, 0x2a1a4a, 1.0], sun: [0xc8d6ff, 1.2],
    top: checker('#7d8aa3', '#6a768e', 2), side: checker('#3a3f4a', '#2a2e38', 4), shoulder: checker('#2a2e44', '#323a58', 2),
    under: { color: 0xc52bff, y: -4, emissive: 0x6a0aa0 }, shoulderY: -2.5,
    decor: ['pipe', 'tank', 'pipe', 'tower', 'tank'],
    background: 'city',
  },
  sky: {
    sky: ['#4a7dff', '#bcd9ff', '#fff4e0'], fog: 0xe6f0ff, fogNear: 55, fogFar: 170,
    hemi: [0xffffff, 0xb0c4de, 1.15], sun: [0xfff0d8, 1.5],
    top: checker('#efe6cf', '#ddd2b6', 2), side: checker('#c9bd9e', '#b3a684', 4), shoulder: checker('#e9f2ff', '#dfeaff', 2),
    under: { color: 0xffffff, y: -14, emissive: 0x8899aa }, shoulderY: -8,
    decor: ['column', 'column', 'island', 'ruin'],
    background: 'islands',
  },
};

// Éléments de décor, chacun composé de pièces instanciées (une seule commande de dessin par pièce).
const DECOR = {
  palm: [
    [() => cyl(0.18, 0.25, 4.5, 6), () => mat(0x9c6a3a), [0, 2.25, 0], [0, 0, 0.12]],
    [() => cone(1.9, 1.2, 7), () => mat(0x2fa83a), [0.5, 4.6, 0], [Math.PI, 0, 0.12]],
    [() => sphere(0.35, 8, 6), () => mat(0x6b3b1a), [0.45, 4.2, 0]],
  ],
  sunflower: [
    [() => cyl(0.08, 0.08, 2.2, 5), () => mat(0x2f8a2a), [0, 1.1, 0]],
    [() => cyl(0.55, 0.55, 0.12, 10), () => mat(0xffd319), [0, 2.3, 0], [Math.PI / 2, 0, 0]],
    [() => cyl(0.25, 0.25, 0.16, 10), () => mat(0x7a3d10), [0, 2.3, 0.02], [Math.PI / 2, 0, 0]],
  ],
  totem: [
    [() => box(0.9, 3.2, 0.9), () => mat(0xd8722a), [0, 1.6, 0]],
    [() => box(1.6, 0.3, 0.4), () => mat(0x3aa34a), [0, 2.8, 0]],
    [() => box(0.5, 0.25, 0.1), () => mat(0x222222), [0, 2.2, 0.46]],
  ],
  rock: [[() => sphere(1.2, 7, 5), () => mat(0x9a8f7a), [0, 0.5, 0], [0, 0, 0], [1.2, 0.7, 1]]],
  pipe: [
    [() => cyl(0.6, 0.6, 9, 10), () => mat(0x6f7b8f, { shiny: true }), [0, 4.5, 0]],
    [() => torus(0.7, 0.15, 6, 12), () => mat(0x37e0ff, { emissive: 0x0a6a88 }), [0, 3, 0], [Math.PI / 2, 0, 0]],
    [() => torus(0.7, 0.15, 6, 12), () => mat(0xff2bd6, { emissive: 0x80106a }), [0, 6, 0], [Math.PI / 2, 0, 0]],
  ],
  tank: [
    [() => cyl(1.4, 1.4, 3.5, 12), () => mat(0x8a93a6, { shiny: true }), [0, 1.75, 0]],
    [() => sphere(1.4, 12, 8), () => mat(0x8a93a6, { shiny: true }), [0, 3.5, 0], [0, 0, 0], [1, 0.5, 1]],
    [() => box(0.4, 1.6, 0.1), () => mat(0x37e0ff, { emissive: 0x1a8aaa }), [0, 2, 1.42]],
  ],
  tower: [
    [() => box(2.4, 14, 2.4), () => mat(0x2a2e44), [0, 7, 0]],
    [() => box(2.5, 0.25, 2.5), () => mat(0xff2bd6, { emissive: 0xaa1a90 }), [0, 9, 0]],
    [() => box(2.5, 0.25, 2.5), () => mat(0x37e0ff, { emissive: 0x1a8aaa }), [0, 12, 0]],
  ],
  column: [
    [() => cyl(0.55, 0.6, 6, 10), () => mat(0xf1ead8), [0, 3, 0]],
    [() => box(1.6, 0.4, 1.6), () => mat(0xd9cfb4), [0, 6.2, 0]],
    [() => box(1.6, 0.4, 1.6), () => mat(0xd9cfb4), [0, 0.2, 0]],
  ],
  island: [
    [() => cone(3, 4, 7), () => mat(0xb9ad91), [0, -2, 0], [Math.PI, 0, 0]],
    [() => cyl(3, 3, 0.6, 7), () => mat(0x6fcf5a), [0, 0.3, 0]],
  ],
  ruin: [
    [() => box(3, 2.2, 0.8), () => mat(0xe6dcc2), [0, 1.1, 0]],
    [() => box(0.8, 3.5, 0.8), () => mat(0xe6dcc2), [1.2, 1.75, 0]],
  ],
};

function skyDome([top, mid, bottom]) {
  const geometry = new THREE.SphereGeometry(400, 24, 12);
  const colors = [];
  const c = [new THREE.Color(top), new THREE.Color(mid), new THREE.Color(bottom)];
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / 400;
    const col = t > 0.15 ? c[1].clone().lerp(c[0], Math.min(1, (t - 0.15) / 0.6)) : c[2].clone().lerp(c[1], Math.max(0, (t + 0.2) / 0.35));
    colors.push(col.r, col.g, col.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
}

function background(scene, kind, rng) {
  const g = new THREE.Group();
  if (kind === 'hills') {
    const tex = canvasTexture(64, (ctx, s) => {
      for (let y = 0; y < 8; y++) { ctx.fillStyle = y % 2 ? '#3aa832' : '#9c5a24'; ctx.fillRect(0, (y * s) / 8, s, s / 8); }
    });
    for (let i = 0; i < 9; i++) {
      const r = 25 + rng() * 30;
      const hill = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ map: tex }));
      hill.position.set((i - 4) * 55 + rng() * 20, -8, -200 - rng() * 80);
      hill.scale.y = 0.6 + rng() * 0.5;
      g.add(hill);
    }
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 400), new THREE.MeshLambertMaterial({ color: 0x2a8ce0, emissive: 0x0a3060 }));
    sea.rotation.x = -Math.PI / 2; sea.position.set(0, -9, -250);
    g.add(sea);
  } else if (kind === 'city') {
    for (let i = 0; i < 30; i++) {
      const h = 20 + rng() * 60;
      const t = new THREE.Mesh(box(8, 1, 8), new THREE.MeshLambertMaterial({ color: 0x1a1f3a, emissive: i % 3 ? 0x110a30 : 0x2a0a40 }));
      t.scale.y = h; t.position.set((i - 15) * 14 + rng() * 6, h / 2 - 10, -180 - rng() * 120);
      g.add(t);
      if (i % 2) {
        const glow = new THREE.Mesh(box(8.2, 0.6, 8.2), new THREE.MeshBasicMaterial({ color: i % 4 ? 0x37e0ff : 0xff2bd6 }));
        glow.position.set(t.position.x, h * 0.7 - 10, t.position.z);
        g.add(glow);
      }
    }
  } else {
    for (let i = 0; i < 14; i++) {
      const isl = new THREE.Group();
      const s = 4 + rng() * 10;
      isl.add(new THREE.Mesh(cone(s, s * 1.3, 7), mat(0xb9ad91)));
      isl.children[0].rotation.x = Math.PI;
      const grass = new THREE.Mesh(cyl(s, s, 1, 7), mat(0x6fcf5a));
      grass.position.y = s * 0.65 + 0.5;
      isl.add(grass);
      isl.position.set((i - 7) * 40 + rng() * 20, -10 + rng() * 40, -150 - rng() * 150);
      g.add(isl);
    }
    const clouds = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x99aabb }));
    clouds.rotation.x = -Math.PI / 2; clouds.position.set(0, -20, -200);
    g.add(clouds);
  }
  scene.add(g);
  return g;
}

export function createWorld(scene, zoneId, { reduced = false } = {}) {
  const theme = THEMES[zoneId] || THEMES.greenhill;
  let seed = 1234;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const disposables = [];
  const root = new THREE.Group();
  scene.add(root);

  scene.fog = new THREE.Fog(theme.fog, theme.fogNear, theme.fogFar);
  scene.background = new THREE.Color(theme.fog);
  root.add(skyDome(theme.sky));
  const hemi = new THREE.HemisphereLight(...theme.hemi);
  const sun = new THREE.DirectionalLight(...theme.sun);
  sun.position.set(-20, 40, 10);
  root.add(hemi, sun);
  const bg = background(root, theme.background, rng);

  // Piste : dalles instanciées par couloir. Une dalle au-dessus d'un trou est masquée.
  const topTex = canvasTexture(64, (ctx, size) => {
    theme.top(ctx, size);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 0, 3, size); ctx.fillRect(size - 3, 0, 3, size);
  }, { repeat: [1, 1] });
  const sideTex = canvasTexture(64, theme.side, { repeat: [1, 3] });
  const tileGeo = new THREE.BoxGeometry(TRACK_WIDTH, 4, TILE);
  tileGeo.translate(0, -2, 0);
  const tileMats = [sideTex, sideTex, topTex, sideTex, sideTex, sideTex].map(map => new THREE.MeshLambertMaterial({ map }));
  const perLane = Math.ceil((FAR + BEHIND) / TILE) + 1;
  const tiles = new THREE.InstancedMesh(tileGeo, tileMats, perLane * 3);
  tiles.frustumCulled = false;
  root.add(tiles);
  disposables.push(tileGeo, topTex, sideTex, ...tileMats);

  // Bas-côtés : grands plans dont la texture défile (aucune géométrie à déplacer).
  const shoulderTex = canvasTexture(64, theme.shoulder, { repeat: [12, 60] });
  const shoulders = [];
  for (const s of [-1, 1]) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(48, 240), new THREE.MeshLambertMaterial({ map: shoulderTex }));
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(s * (LANES[2] + TRACK_WIDTH / 2 + 24), theme.shoulderY, -100);
    root.add(plane);
    shoulders.push(plane);
  }

  // Sous la piste : eau (Green Hill), liquide toxique (Chemical Plant), mer de nuages (Sky Sanctuary).
  const under = new THREE.Mesh(new THREE.PlaneGeometry(9, 300), new THREE.MeshLambertMaterial({ color: theme.under.color, emissive: theme.under.emissive }));
  under.rotation.x = -Math.PI / 2;
  under.position.set(0, theme.under.y, -120);
  root.add(under);

  // Décor instancié le long de la piste, recyclé quand il passe derrière la caméra.
  const SLOTS = reduced ? 20 : 34;
  const slots = Array.from({ length: SLOTS }, (_, i) => ({
    type: theme.decor[i % theme.decor.length],
    side: i % 2 ? 1 : -1,
    x: 6 + rng() * 9,
    z: (i / SLOTS) * (FAR + 40),
    rot: rng() * Math.PI * 2,
    scale: 0.8 + rng() * 0.5,
  }));
  const decorMeshes = {};
  for (const type of new Set(theme.decor)) {
    const count = slots.filter(s => s.type === type).length;
    decorMeshes[type] = DECOR[type].map(([g, m, p, r = [0, 0, 0], sc = [1, 1, 1]]) => {
      const im = new THREE.InstancedMesh(g(), m(), count);
      im.frustumCulled = false;
      im.userData.local = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...sc));
      root.add(im);
      return im;
    });
  }

  // Grande arche-loop (moment fort de Green Hill) et autres pièces décoratives ponctuelles.
  const loopTex = canvasTexture(64, checker('#2a5cff', '#f5c518', 2), { repeat: [16, 1] });
  const loopArch = new THREE.Mesh(new THREE.TorusGeometry(9, 0.9, 10, 48), new THREE.MeshLambertMaterial({ map: loopTex }));
  loopArch.visible = false;
  root.add(loopArch);
  disposables.push(loopTex);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), tmp = new THREE.Matrix4();
  const base = new THREE.Matrix4(), euler = new THREE.Euler();
  let travelled = 0;

  function update(distance, entities, dt) {
    const step = distance - travelled;
    travelled = distance;

    // Dalles de piste
    const gaps = entities.filter(e => e.kind === 'gap');
    const frac = distance % TILE;
    let i = 0;
    for (let lane = 0; lane < 3; lane++) {
      for (let k = 0; k < perLane; k++) {
        const z = -BEHIND + k * TILE - frac + TILE / 2;
        const hole = gaps.some(g => g.lane === lane && z > g.z && z < g.z + g.len);
        v.set(LANES[lane], 0, -z);
        sc.setScalar(hole ? 0 : 1);
        m.compose(v, q.identity(), sc);
        tiles.setMatrixAt(i++, m);
      }
    }
    tiles.instanceMatrix.needsUpdate = true;

    shoulderTex.offset.y = (shoulderTex.offset.y + (step / 240) * 60) % 1;

    // Décor
    const counters = {};
    for (const s of slots) {
      s.z -= step;
      if (s.z < -BEHIND - 10) { s.z += FAR + 40; s.x = 6 + rng() * 9; s.rot = rng() * Math.PI * 2; }
      const idx = (counters[s.type] = (counters[s.type] ?? -1) + 1);
      base.compose(v.set(s.side * (LANES[2] + s.x), theme.shoulderY, -s.z), q.setFromEuler(euler.set(0, s.rot, 0)), sc.setScalar(s.scale));
      for (const im of decorMeshes[s.type]) {
        tmp.multiplyMatrices(base, im.userData.local);
        im.setMatrixAt(idx, tmp);
      }
    }
    for (const parts of Object.values(decorMeshes)) for (const im of parts) im.instanceMatrix.needsUpdate = true;

    // Arche-loop : apparaît avec le motif « loop-run ».
    const piece = entities.find(e => e.piece === 'loop-run' && e.z > -20);
    loopArch.visible = !!piece && zoneId === 'greenhill';
    if (piece) { loopArch.position.set(0, 0, -(piece.z + 8)); loopArch.rotation.z += dt * 0.2; }

    bg.position.x = Math.sin(distance / 900) * 6;
  }

  function dispose() {
    scene.remove(root);
    root.traverse(o => { if (o.isInstancedMesh) o.dispose(); });
    disposables.forEach(d => d.dispose?.());
  }

  return { update, dispose, theme };
}
