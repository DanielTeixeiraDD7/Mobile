import * as THREE from 'three';
import { LANES } from '../sim/config.js';
import { makeProp, ringGeometry, ringMaterial } from './props.js';

// Affiche les entités de la simulation. Objets recyclés par type (pas de création pendant la course),
// anneaux dessinés en une seule commande (InstancedMesh).
const MAX_RINGS = 400;
const VISIBLE_Z = 150;

export function createEntityView(scene, zoneId) {
  const root = new THREE.Group();
  scene.add(root);
  const pools = new Map();     // kind → objets libres
  const active = new Map();    // id d'entité → objet
  const rings = new THREE.InstancedMesh(ringGeometry(), ringMaterial(), MAX_RINGS);
  rings.frustumCulled = false;
  root.add(rings);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  let spin = 0, time = 0;

  function acquire(e) {
    const key = e.kind === 'platform' ? `platform:${Math.round(e.len)}` : e.kind;
    const list = pools.get(key);
    const obj = list?.pop() ?? makeProp(e.kind, zoneId, e);
    obj.userData.key = key;
    obj.visible = true;
    root.add(obj);
    return obj;
  }

  function release(id) {
    const obj = active.get(id);
    active.delete(id);
    obj.visible = false;
    if (!pools.has(obj.userData.key)) pools.set(obj.userData.key, []);
    pools.get(obj.userData.key).push(obj);
  }

  function update(run, dt) {
    time += dt;
    spin += dt * 4;
    const seen = new Set();
    let ringCount = 0;
    for (const e of run.entities) {
      if (!e.alive || e.z > VISIBLE_Z) continue;
      if (e.kind === 'ring') {
        if (ringCount >= MAX_RINGS) continue;
        q.setFromAxisAngle(up, spin + e.z * 0.15);
        v.set(e.x ?? LANES[e.lane], e.y + 0.45, -e.z);
        m.compose(v, q, s);
        rings.setMatrixAt(ringCount++, m);
        continue;
      }
      if (e.kind === 'gap') continue;
      seen.add(e.id);
      let obj = active.get(e.id);
      if (!obj) { obj = acquire(e); active.set(e.id, obj); }
      obj.position.set(LANES[e.lane], 0, -e.z);
      animate(obj, e, run);
    }
    rings.count = ringCount;
    rings.instanceMatrix.needsUpdate = true;
    for (const id of [...active.keys()]) if (!seen.has(id)) release(id);
  }

  function animate(obj, e, run) {
    const u = obj.userData;
    switch (e.kind) {
      case 'platform':
        obj.rotation.y = Math.PI;  // la plateforme s'étend vers l'avant (-z)
        break;
      case 'bee':
        u.wings.rotation.z = Math.sin(time * 40) * 0.5;
        obj.position.y = Math.sin(time * 3 + e.id) * 0.12;
        break;
      case 'crab':
        obj.rotation.z = Math.sin(time * 10 + e.id) * 0.05;
        break;
      case 'magnet': case 'shield': case 'boostItem':
        obj.rotation.y = time * 1.5;
        break;
      case 'piston': {
        const down = run.pistonDown(e);
        u.head.position.y += ((down ? -1.65 : 0) - u.head.position.y) * 0.35;
        u.warn.material.opacity = down ? 0.55 : 0.15 + 0.15 * Math.sin(time * 12);
        break;
      }
      case 'boulder':
        u.ball.rotation.x -= 0.15;
        break;
      case 'bomb':
        u.light.visible = Math.sin(time * 20) > 0;
        break;
      case 'missile':
        obj.rotation.z = time * 6;
        break;
    }
  }

  function dispose() {
    scene.remove(root);
    rings.dispose();
  }

  return { update, dispose };
}
