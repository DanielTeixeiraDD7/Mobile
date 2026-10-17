import * as THREE from 'three';
import { LANES, PHYS } from '../sim/config.js';
import { buildCharacter } from './characters.js';

// Animation procédurale du personnage : machine à états (repos, course, sprint, saut, chute, réception,
// glissade/roulade, blessure, mort, victoire) et transitions lissées entre les poses.
// Un modèle glTF avec ces animations pourra remplacer le modèle procédural sans toucher au gameplay.

export const ANIM_STATES = ['idle', 'run', 'sprint', 'jump', 'fall', 'land', 'roll', 'fly', 'hurt', 'death', 'victory'];

const lerp = (a, b, t) => a + (b - a) * t;

export function createRig(characterId) {
  const model = buildCharacter(characterId);
  const root = new THREE.Group();
  root.add(model.root);
  let state = 'idle', stateT = 0, phase = 0, landT = 0, lastGrounded = true;
  const pose = { lean: 0, legSwing: 0, armSwing: 0, crouch: 0, armUp: 0, headTilt: 0 };

  function setState(next) { if (next !== state) { state = next; stateT = 0; } }

  // Choisit l'état d'animation à partir de l'état de jeu.
  function decide(run) {
    if (!run) return 'idle';
    const p = run.player;
    if (run.status === 'won' || run.victory) return 'victory';
    if (p.dead) return 'death';
    if (p.hurtT > PHYS.hurtInvulnerability - 0.35) return 'hurt';
    if (!p.grounded) {
      if (p.airKind === 'fly') return 'fly';
      if (p.airKind === 'fall' && p.vy < -2) return 'fall';
      return 'jump';
    }
    if (p.slideT > 0) return 'roll';
    if (landT > 0) return 'land';
    return run.power.boost > 0 ? 'sprint' : 'run';
  }

  function update(dt, run, { menuSpin = false } = {}) {
    const p = run?.player;
    if (p && p.grounded && !lastGrounded) landT = 0.12;
    lastGrounded = p ? p.grounded : true;
    landT = Math.max(0, landT - dt);
    setState(decide(run));
    stateT += dt;

    const speed = run ? run.speed : 0;
    phase += dt * (state === 'sprint' ? 22 : state === 'run' ? 6 + speed * 0.35 : 3);
    const k = Math.min(1, dt * 14);
    const target = { lean: 0, legSwing: 0, armSwing: 0, crouch: 0, armUp: 0, headTilt: 0 };
    let ball = false;

    switch (state) {
      case 'idle':
        target.armSwing = 0.05 * Math.sin(phase); target.crouch = 0.02 * Math.sin(phase * 1.5);
        break;
      case 'run':
        target.lean = 0.25; target.legSwing = 0.9 * Math.sin(phase); target.armSwing = 0.8 * Math.sin(phase);
        break;
      case 'sprint':
        target.lean = 0.45; target.legSwing = 1.3 * Math.sin(phase); target.armSwing = -0.2; target.armUp = -0.9;
        break;
      case 'jump': case 'roll':
        ball = true;
        break;
      case 'fly':
        target.lean = 0.1; target.armUp = 1.4; target.legSwing = 0.2 * Math.sin(phase * 2);
        break;
      case 'fall':
        target.armUp = 1.2; target.legSwing = 0.3 * Math.sin(phase * 2); target.lean = -0.1;
        break;
      case 'land':
        target.crouch = 0.18; target.lean = 0.3;
        break;
      case 'hurt':
        target.lean = -0.6; target.armUp = 1.0; target.headTilt = -0.4;
        break;
      case 'death':
        target.lean = -1.2; target.armUp = 1.6; target.headTilt = -0.5;
        break;
      case 'victory':
        target.armUp = stateT < 0.6 ? 2.6 : 0.3; target.lean = 0;
        break;
    }
    for (const key in pose) pose[key] = lerp(pose[key], target[key], k);

    model.ball.visible = ball;
    model.hips.visible = !ball;
    if (ball) {
      model.ball.rotation.x -= dt * (state === 'roll' ? 28 : 20);
      model.ball.position.y = state === 'roll' ? 0.45 : 0.6;
      model.ball.scale.setScalar(state === 'roll' ? 0.85 : 1);
    }
    model.hips.rotation.x = -pose.lean;
    model.hips.position.y = 0.62 - pose.crouch;
    model.head.rotation.x = pose.headTilt + pose.lean * 0.3;
    model.legL.rotation.x = pose.legSwing;
    model.legR.rotation.x = -pose.legSwing;
    model.armL.rotation.x = -pose.armSwing - pose.armUp * 0.6;
    model.armR.rotation.x = pose.armSwing - pose.armUp * 0.6;
    model.armL.rotation.z = -pose.armUp * 0.5;
    model.armR.rotation.z = pose.armUp * 0.5;
    if (model.tails) model.tails.rotation.z += dt * (state === 'fly' ? 30 : state === 'idle' ? 2 : 8);
    for (const leg of [model.legL, model.legR]) if (leg.userData.jet) leg.userData.jet.visible = state === 'sprint';

    if (p) {
      root.position.set(p.x, p.y, 0);
      root.rotation.z = (LANES[p.targetLane] - p.x) * -0.08;
      // Clignotement pendant l'invulnérabilité après un choc
      model.root.visible = state === 'death' || p.hurtT <= 0 || Math.sin(p.hurtT * 40) > -0.3;
      if (state === 'death') { root.position.y = p.y + Math.min(2.5, stateT * 6 - stateT * stateT * 6); root.rotation.x = -stateT * 4; }
      if (state === 'victory') root.position.y = p.y + Math.max(0, Math.sin(Math.min(Math.PI, stateT * 4))) * 1.5;
    } else if (menuSpin) {
      root.rotation.y += dt * 0.6;
    }
  }

  return { root, model, update, get state() { return state; }, trail: model.trail };
}
