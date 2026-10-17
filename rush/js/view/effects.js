import * as THREE from 'three';
import { LANES } from '../sim/config.js';
import { ringGeometry, ringMaterial, buildBoss } from './props.js';
import { canvasTexture } from './kit.js';

// Effets : particules (une seule commande de dessin), anneaux perdus, bouclier, aimant, traînée de boost,
// ombre au sol, signalement des attaques du boss et le boss lui-même.
const MAX_PARTICLES = 260;
const SCATTER = 20;

export function createEffects(scene, { reduced = false, trailColor = 0x4f9cff } = {}) {
  const root = new THREE.Group();
  scene.add(root);

  // Particules
  const positions = new Float32Array(MAX_PARTICLES * 3);
  const colors = new Float32Array(MAX_PARTICLES * 3);
  const particles = Array.from({ length: MAX_PARTICLES }, () => ({ life: 0 }));
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const dot = canvasTexture(32, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, s, s);
  });
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.45, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  points.frustumCulled = false;
  root.add(points);
  let cursor = 0;
  const col = new THREE.Color();

  function burst({ x, y, z, count = 10, color = 0xffd319, speed = 4, life = 0.5, up = 2 }) {
    if (reduced) count = Math.ceil(count / 3);
    col.set(color);
    for (let i = 0; i < count; i++) {
      const p = particles[cursor];
      cursor = (cursor + 1) % MAX_PARTICLES;
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
      Object.assign(p, {
        x, y, z, life, max: life, r: col.r, g: col.g, b: col.b,
        vx: Math.cos(a) * Math.cos(b) * speed, vy: Math.sin(b) * speed + up, vz: Math.sin(a) * Math.cos(b) * speed,
      });
    }
  }

  // Anneaux éjectés lors d'un choc
  const scatter = new THREE.InstancedMesh(ringGeometry(), ringMaterial(), SCATTER);
  scatter.count = 0;
  scatter.frustumCulled = false;
  root.add(scatter);
  let scattered = [];

  // Bouclier, aimant, traînée de boost, ombre
  const shield = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 14), new THREE.MeshBasicMaterial({ color: 0x5ab8ff, transparent: true, opacity: 0.28, depthWrite: false }));
  const magnet = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: 0x5aff8a, transparent: true, opacity: 0.6 }));
  magnet.rotation.x = Math.PI / 2;
  const trailMat = new THREE.MeshBasicMaterial({ color: trailColor, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending });
  const trail = new THREE.Mesh(new THREE.ConeGeometry(0.6, 6, 12, 1, true), trailMat);
  trail.rotation.x = -Math.PI / 2;
  const shadowTex = canvasTexture(32, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, s, s);
  });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  // Pont d'énergie au-dessus des trous pendant le boost
  const bridge = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 14), new THREE.MeshBasicMaterial({ color: trailColor, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  bridge.rotation.x = -Math.PI / 2;
  root.add(shield, magnet, trail, blob, bridge);

  // Signalement des attaques du boss : bandes au sol sur les couloirs visés.
  const markers = LANES.map(x => {
    const mk = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 40), new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0, depthWrite: false }));
    mk.rotation.x = -Math.PI / 2;
    mk.position.set(x, 0.05, -22);
    root.add(mk);
    return mk;
  });

  let boss = null;
  let time = 0;
  const m = new THREE.Matrix4(), v = new THREE.Vector3(), quat = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);

  function update(run, dt) {
    time += dt;
    const p = run.player;

    // Particules
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const q = particles[i];
      if (q.life > 0) {
        q.life -= dt;
        q.vy -= 9 * dt;
        q.x += q.vx * dt; q.y += q.vy * dt; q.z += (q.vz + run.speed) * dt;
        const f = Math.max(0, q.life / q.max);
        positions[i * 3] = q.x; positions[i * 3 + 1] = q.y; positions[i * 3 + 2] = q.z;
        colors[i * 3] = q.r * f; colors[i * 3 + 1] = q.g * f; colors[i * 3 + 2] = q.b * f;
      } else positions[i * 3 + 1] = -999;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;

    // Anneaux éjectés
    scattered = scattered.filter(r => (r.life -= dt) > 0);
    scattered.forEach((r, i) => {
      r.vy -= 18 * dt; r.x += r.vx * dt; r.y = Math.max(0.2, r.y + r.vy * dt); r.z += r.vz * dt;
      if (r.y <= 0.2) r.vy = Math.abs(r.vy) * 0.6;
      quat.setFromAxisAngle(v.set(0, 1, 0), time * 8 + i);
      s.setScalar(Math.min(1, r.life * 2));
      m.compose(v.set(r.x, r.y, r.z), quat, s);
      scatter.setMatrixAt(i, m);
    });
    scatter.count = scattered.length;
    scatter.instanceMatrix.needsUpdate = true;

    const px = p.x, py = p.y;
    shield.visible = run.power.shield;
    shield.position.set(px, py + 0.85, 0);
    shield.material.opacity = 0.22 + 0.08 * Math.sin(time * 6);
    magnet.visible = run.power.magnet > 0 && (run.power.magnet > 2 || Math.sin(time * 20) > 0);
    magnet.position.set(px, py + 0.3, 0);
    magnet.scale.setScalar(1 + 0.15 * Math.sin(time * 8));
    trail.visible = run.power.boost > 0 && !reduced;
    trail.position.set(px, py + 0.8, 3.2);
    trail.material.opacity = 0.3 + 0.15 * Math.sin(time * 30);
    blob.visible = !p.dead && run.groundShadow !== null;
    blob.position.set(px, (run.groundShadow ?? 0) + 0.03, 0);
    blob.scale.setScalar(Math.max(0.4, 1 - (py - (run.groundShadow ?? 0)) * 0.12));
    bridge.visible = run.power.boost > 0 && run.overGap;
    bridge.position.set(px, 0.02, -4);

    // Boss
    const b = run.boss;
    if (b && !boss) { boss = buildBoss(); root.add(boss); }
    if (boss) {
      boss.visible = !!b && b.phase !== 'done';
      if (b) {
        boss.position.set(b.x, b.y + Math.sin(time * 2) * 0.25, -b.z);
        boss.rotation.z = Math.sin(time * 1.3) * 0.08;
        boss.rotation.y = Math.PI;
        boss.userData.flames.scale.y = 0.8 + Math.random() * 0.5;
        boss.traverse(o => { if (o.isMesh && o.material.emissive) o.material.emissiveIntensity = b.hitFlash > 0 ? 1 : 0; });
        if (b.phase === 'defeated' && Math.random() < 0.3) burst({ x: b.x + (Math.random() - 0.5) * 3, y: b.y + Math.random() * 2, z: -b.z, count: 12, color: 0xffa21a, speed: 6 });
      }
      const tg = b?.telegraph;
      markers.forEach((mk, lane) => {
        const on = tg && tg.lanes.includes(lane);
        mk.material.color.set(tg?.kind === 'swoop' ? 0xffd319 : 0xff2222);
        mk.material.opacity = on ? 0.25 + 0.2 * Math.sin(time * 18) : Math.max(0, mk.material.opacity - dt * 2);
      });
    }
  }

  // Réagit aux événements de la simulation.
  function onEvent(e, run) {
    const p = run.player;
    const at = { x: p.x, y: p.y + 0.9, z: 0 };
    switch (e.type) {
      case 'ring': burst({ ...at, z: -0.5, count: 5, color: 0xffd319, speed: 2.5, life: 0.35 }); break;
      case 'enemy': case 'smash': burst({ x: LANES[e.lane ?? p.lane], y: 1, z: -1.5, count: 22, color: 0xffa21a, speed: 7, life: 0.6 }); break;
      case 'ringLoss':
        scattered = Array.from({ length: e.count }, (_, i) => {
          const a = (i / e.count) * Math.PI * 2;
          return { x: p.x, y: p.y + 1, z: 0, vx: Math.cos(a) * 6, vy: 8 + Math.random() * 4, vz: Math.sin(a) * 4 - 2, life: 1.6 };
        });
        break;
      case 'land': burst({ x: p.x, y: p.y + 0.1, z: 0.3, count: 6, color: 0xffffff, speed: 1.5, life: 0.3, up: 1 }); break;
      case 'boost': case 'pad': burst({ ...at, count: 20, color: run.character.color, speed: 5, life: 0.5 }); break;
      case 'power': burst({ ...at, count: 18, color: 0x7fe3ff, speed: 4, life: 0.5 }); break;
      case 'shieldBreak': burst({ ...at, count: 24, color: 0x5ab8ff, speed: 6, life: 0.5 }); break;
      case 'spring': burst({ x: p.x, y: 0.4, z: 0, count: 10, color: 0xffd319, speed: 3, life: 0.4 }); break;
      case 'bossHit': burst({ x: run.boss.x, y: run.boss.y, z: -run.boss.z, count: 30, color: 0xffffff, speed: 8, life: 0.6 }); break;
    }
  }

  function dispose() { scene.remove(root); pGeo.dispose(); scatter.dispose(); }

  return { update, onEvent, dispose };
}
