import { LANES, PHYS, SCORE } from './config.js';
import { ZONES } from './zones.js';

// Combat contre le robot du Dr. Eggman.
// Déroulé : arrivée → (2 attaques signalées → piqué vulnérable) en boucle → défaite.
// Attaques : missiles (couloir rouge puis tir) et bombes (cible au sol puis impact).
// Piqué : le robot descend dans un couloir signalé en doré ; il faut être dans ce couloir et en l'air
// (ou en boost) au moment du contact pour le toucher. Au sol, c'est le joueur qui est touché.

const TELEGRAPH = { missile: 1.0, bomb: 0.9, swoop: 1.2 };

export function createBoss({ run, rng, add, hurt, emit, player, stats, power, onWin }) {
  const zoneIndex = Math.max(0, ZONES.findIndex(z => z.id === run.zone.id));
  const boss = {
    maxHp: 5 + zoneIndex,
    hp: 5 + zoneIndex,
    phase: 'approach',
    t: 0,
    x: 0, y: 7, z: 70,
    targetLane: 1,
    telegraph: null,      // { kind, lanes, t, duration, z }
    attacksLeft: 2,
    ringTimer: 0,
    hitFlash: 0,
  };

  const set = (phase, t = 0) => { boss.phase = phase; boss.t = t; };
  const pickLanes = count => {
    const lanes = [0, 1, 2];
    for (let i = lanes.length - 1; i > 0; i--) { const j = rng.int(0, i); [lanes[i], lanes[j]] = [lanes[j], lanes[i]]; }
    return lanes.slice(0, count).sort();
  };
  const approach = (target, speed, dt) => target + (boss.x - target) * Math.exp(-speed * dt);

  function startAttack() {
    const kind = rng.chance(0.5) ? 'missile' : 'bomb';
    const lanes = pickLanes(rng.chance(0.4 + zoneIndex * 0.15) ? 2 : 1);
    boss.telegraph = { kind, lanes, t: 0, duration: TELEGRAPH[kind], z: kind === 'bomb' ? 26 : 0 };
    set('attack');
    emit('bossTelegraph', { kind, lanes });
  }

  function fire() {
    const { kind, lanes, z } = boss.telegraph;
    for (const lane of lanes) {
      if (kind === 'missile') add({ kind: 'missile', lane, z: boss.z - 2 });
      else add({ kind: 'bomb', lane, z });
    }
    emit('bossFire', { kind });
    boss.telegraph = null;
  }

  function startSwoop() {
    boss.targetLane = rng.int(0, 2);
    boss.telegraph = { kind: 'swoop', lanes: [boss.targetLane], t: 0, duration: TELEGRAPH.swoop, z: 0 };
    set('swoopWarn');
    emit('bossTelegraph', { kind: 'swoop', lanes: [boss.targetLane] });
  }

  function update(dt) {
    boss.t += dt;
    boss.hitFlash = Math.max(0, boss.hitFlash - dt);
    if (boss.telegraph) boss.telegraph.t += dt;

    // Anneaux réguliers pendant le combat, pour garder une protection.
    boss.ringTimer -= dt;
    if (boss.ringTimer <= 0 && boss.phase !== 'defeated') {
      boss.ringTimer = 3;
      const lane = rng.int(0, 2);
      for (let k = 0; k < 5; k++) add({ kind: 'ring', lane, z: 34 + k * 2.4, y: 1 });
    }

    switch (boss.phase) {
      case 'approach': {
        // Attend que les derniers obstacles de la zone soient passés.
        const busy = run.entities.some(e => e.alive && e.kind !== 'ring' && e.z > -1);
        boss.z += (24 - boss.z) * Math.min(1, dt * 1.2);
        if (!busy && boss.t > 1.5) { set('intro'); emit('bossIntro'); }
        break;
      }
      case 'intro':
        boss.z += (22 - boss.z) * Math.min(1, dt * 2);
        boss.y += (6 - boss.y) * Math.min(1, dt * 2);
        if (boss.t > 2.5) { boss.attacksLeft = 2; startAttack(); }
        break;
      case 'attack':
        boss.x = approach(LANES[boss.telegraph?.lanes[0] ?? 1], 3, dt);
        if (boss.telegraph && boss.telegraph.t >= boss.telegraph.duration) { fire(); set('cooldown'); }
        break;
      case 'cooldown':
        if (boss.t > 1.1) {
          boss.attacksLeft -= 1;
          if (boss.attacksLeft > 0) startAttack(); else startSwoop();
        }
        break;
      case 'swoopWarn':
        boss.x = approach(LANES[boss.targetLane], 4, dt);
        boss.y += (1.3 - boss.y) * Math.min(1, dt * 2.5);
        if (boss.telegraph.t >= boss.telegraph.duration) { boss.telegraph = null; set('swoop'); }
        break;
      case 'swoop': {
        boss.x = approach(LANES[boss.targetLane], 6, dt);
        boss.z -= (run.speed * 0.55 + 6) * dt;
        const touching = Math.abs(boss.z) < 1.4 && Math.abs(player.x - boss.x) < 1.4;
        if (touching) {
          const airborne = !player.grounded && player.y > 0.4;
          if (airborne || power.boost > 0) {
            boss.hp -= 1; boss.hitFlash = 0.4; stats.bossHits++;
            stats.score += SCORE.perBossHit;
            player.vy = PHYS.bounceVelocity; player.grounded = false; player.airKind = 'bounce';
            emit('bossHit', { hp: boss.hp });
            if (boss.hp <= 0) { set('defeated'); emit('bossDefeated'); } else set('retreat');
          } else {
            hurt('boss', null);
            set('retreat');
          }
        } else if (boss.z < -3) { emit('bossMiss'); set('retreat'); }
        break;
      }
      case 'retreat':
        boss.z += (22 - boss.z) * Math.min(1, dt * 2.2);
        boss.y += (6 - boss.y) * Math.min(1, dt * 2.2);
        if (boss.t > 1.4) { boss.attacksLeft = 2 + (boss.hp <= 2 ? 1 : 0); startAttack(); }
        break;
      case 'defeated':
        boss.y -= dt * 1.5;
        boss.z += dt * 4;
        if (boss.t > 2.2) { set('done'); onWin(); }
        break;
    }
  }

  return Object.assign(boss, { update });
}
