import { LANES, PHYS, SPEED, RINGS, POWER, SCORE, VIEW_DISTANCE, BEHIND, speedAt } from './config.js';
import { KINDS, isSolid } from './kinds.js';
import { createRng } from './rng.js';
import { createGenerator } from './generator.js';
import { createBoss } from './boss.js';

const LANE_HALF = 1.0;      // demi-largeur occupée par un obstacle dans son couloir
const STEP = 1 / 240;       // pas de simulation fixe : collisions fiables même à grande vitesse

// Une course complète. Aucune dépendance au rendu : testable en Node.
// mode 'zone' : boss à la distance objectif de la zone ; 'endless' : course infinie.
export function createRun({ zone, character, seed, mode = 'zone' }) {
  const rng = createRng(seed);
  const generator = createGenerator({ zone, rng });
  const events = [];
  const emit = (type, data = {}) => events.push({ type, ...data });

  const player = {
    lane: 1, targetLane: 1, x: LANES[1], y: 0, vy: 0,
    grounded: true, groundY: 0, airKind: null, coyote: 0, jumpBuffer: 0,
    slideT: 0, flyUsed: false, hurtT: 0, slowT: 0, dead: false, deathCause: null,
    anim: 'run', animT: 0,
  };
  const power = { magnet: 0, shield: false, boost: 0, meter: 0 };
  const stats = {
    distance: 0, rings: 0, ringsTotal: 0, score: 0, combo: 1, streak: 0, enemies: 0,
    jumps: 0, slides: 0, boosts: 0, powerups: 0, hits: 0, bossHits: 0, time: 0,
  };

  const state = {
    zone, character, seed, mode, player, power, stats, events,
    entities: [], status: 'playing', speed: speedAt(0) * character.speedMul,
    boss: null, victory: false, spawnZ: 40,
    plan: [],            // chemin sûr calculé par le validateur (utilisé par les tests automatiques)
  };
  let nextId = 1;
  const add = e => { e.id = nextId++; e.alive = true; state.entities.push(e); return e; };

  // Premières lignes d'anneaux pour démarrer sans danger.
  for (let k = 0; k < 8; k++) add({ kind: 'ring', lane: 1, z: 12 + k * 2.4, y: 1 });

  function fill() {
    const bossTime = mode === 'zone' && stats.distance + state.spawnZ >= zone.goal;
    while (state.spawnZ < VIEW_DISTANCE && !bossTime) {
      // Vitesse normale prévue quand le joueur atteindra ce segment (sans boost ni ralentissement).
      const expected = speedAt(stats.distance + state.spawnZ) * character.speedMul;
      const seg = generator.next(stats.distance + state.spawnZ, expected, state.spawnZ);
      seg.entities.forEach(add);
      state.plan.push(...seg.plan);
      state.spawnZ = seg.end;
      if (mode === 'zone' && stats.distance + state.spawnZ >= zone.goal) break;
    }
  }
  fill();

  const height = () => (player.slideT > 0 ? PHYS.slideHeight : player.grounded ? PHYS.standHeight : 1.1);
  const laneOf = x => LANES.reduce((best, lx, i) => (Math.abs(lx - x) < Math.abs(LANES[best] - x) ? i : best), 0);

  // Hauteur du sol sous le joueur : null s'il est au-dessus d'un trou.
  function groundAt() {
    const lane = laneOf(player.x);
    let ground = 0;
    for (const e of state.entities) {
      if (!e.alive || e.lane !== lane) continue;
      if (e.kind === 'gap' && e.z <= 0 && e.z + e.len > 0) ground = null;
    }
    // En boost, le joueur file au-dessus des trous (invincible) : la vitesse accrue ne rend pas un trou impossible.
    if (ground === null && power.boost > 0 && player.y >= -0.1) return 0;
    for (const e of state.entities) {
      if (!e.alive || e.kind !== 'platform' || e.lane !== lane) continue;
      if (e.z <= 0.3 && e.z + e.len > 0 && player.y >= KINDS.platform.top - 0.5) return KINDS.platform.top;
    }
    return ground;
  }

  // --- Entrées ---
  function act(action) {
    if (player.dead || state.status !== 'playing') return;
    switch (action) {
      case 'left':
      case 'right': {
        const t = player.targetLane + (action === 'left' ? -1 : 1);
        if (t >= 0 && t <= 2) { player.targetLane = t; emit('lane'); }
        break;
      }
      case 'up':
        if (player.grounded || player.coyote > 0) jump();
        else if (character.canFly && !player.flyUsed) {
          player.flyUsed = true; player.vy = 11; player.airKind = 'fly'; emit('fly');
        } else player.jumpBuffer = PHYS.jumpBuffer;
        break;
      case 'down':
        if (player.grounded) {
          player.slideT = PHYS.slideTime; stats.slides++; emit('slide');
        } else {
          player.vy = Math.min(player.vy, PHYS.stompVelocity); player.airKind = 'stomp'; emit('stomp');
        }
        break;
      case 'boost':
        if (power.meter >= 1 && power.boost <= 0) {
          power.meter = 0; power.boost = character.boostDuration; stats.boosts++; emit('boost');
        }
        break;
    }
  }

  function jump(velocity = PHYS.jumpVelocity, kind = 'jump') {
    player.vy = velocity; player.grounded = false; player.coyote = 0; player.slideT = 0;
    player.airKind = kind; player.flyUsed = false;
    if (kind === 'jump') { stats.jumps++; emit('jump'); }
  }

  // --- Collisions ---
  function overlaps(e) {
    const k = KINDS[e.kind];
    const len = e.len ?? k.len;
    if (!(e.z < PHYS.depth / 2 && e.z + len > -PHYS.depth / 2)) return false;
    if (Math.abs(player.x - LANES[e.lane]) >= PHYS.width / 2 + LANE_HALF) return false;
    const y0 = (e.y ?? 0) + (k.y0 ?? 0), y1 = (e.y ?? 0) + (k.y1 ?? 0);
    return player.y < y1 && player.y + height() > y0;
  }

  function addRings(n) {
    stats.rings += n; stats.ringsTotal += n; stats.streak += n;
    stats.combo = Math.min(SCORE.comboMax, 1 + Math.floor(stats.streak / SCORE.comboStep));
    stats.score += SCORE.perRing * n * stats.combo;
    power.meter = Math.min(1, power.meter + RINGS.boostFill * n * character.boostFill);
  }

  function defeat(e) {
    e.alive = false; stats.enemies++;
    stats.score += SCORE.perEnemy * stats.combo;
    power.meter = Math.min(1, power.meter + RINGS.enemyFill * character.boostFill);
    emit('enemy', { kind: e.kind, lane: e.lane });
  }

  function hurt(cause, e) {
    if (power.boost > 0 || player.hurtT > 0) return;
    if (e) e.alive = false;
    stats.hits++; stats.streak = 0; stats.combo = 1;
    if (power.shield) {
      power.shield = false; player.hurtT = PHYS.hurtInvulnerability; emit('shieldBreak');
    } else if (stats.rings > 0) {
      emit('ringLoss', { count: Math.min(stats.rings, RINGS.scatterMax) });
      stats.rings = 0; player.hurtT = PHYS.hurtInvulnerability; player.slowT = SPEED.hurtRecovery;
      emit('hurt', { cause });
    } else die(cause);
  }

  function die(cause) {
    if (player.dead) return;
    player.dead = true; player.deathCause = cause; state.status = 'dead';
    emit('death', { cause });
  }

  function collide() {
    for (const e of state.entities) {
      if (!e.alive || e.z > 3 || e.z < -3) continue;
      const k = KINDS[e.kind];
      if (e.kind === 'ring') continue;
      if (k.ground) {
        // Face avant d'une plateforme : un mur si on arrive en dessous du dessus.
        if (e.kind === 'platform' && e.z > -0.2 && e.z < 0.4 && Math.abs(player.x - LANES[e.lane]) < PHYS.width / 2 + LANE_HALF
          && player.y < k.top - 0.5) hurt('platform', null);
        continue;
      }
      if (!overlaps(e)) continue;
      if (k.power) {
        e.alive = false; stats.powerups++;
        if (k.power === 'magnet') power.magnet = RINGS.magnetDuration * character.magnetMul;
        if (k.power === 'shield') power.shield = true;
        if (k.power === 'boost') power.boost = Math.max(power.boost, POWER.itemBoostDuration);
        emit('power', { power: k.power });
        continue;
      }
      if (k.trigger === 'spring') {
        if (player.vy <= 0) { e.used = true; jump(PHYS.springVelocity, 'spring'); emit('spring'); }
        continue;
      }
      if (k.trigger === 'pad') {
        if (!e.used) { e.used = true; power.boost = Math.max(power.boost, POWER.padBoostDuration); emit('pad'); }
        continue;
      }
      if (e.kind === 'piston' && !pistonDown(e)) continue;
      if (k.enemy) {
        const attacking = power.boost > 0 || player.slideT > 0 || !player.grounded;
        if (attacking) {
          defeat(e);
          if (!player.grounded && player.vy < 0) { player.vy = PHYS.bounceVelocity; player.airKind = 'bounce'; }
        } else hurt('enemy', e);
        continue;
      }
      if (power.boost > 0 && k.breakable) { e.alive = false; emit('smash', { kind: e.kind }); continue; }
      if (character.smash?.includes(e.kind)) { e.alive = false; emit('smash', { kind: e.kind }); continue; }
      if (isSolid(e.kind)) hurt(e.kind, e);
    }
  }

  // Les pistons descendent 0,9 s toutes les 2,4 s ; leur phase dépend de leur identifiant.
  const pistonDown = e => ((stats.time + (e.id % 7) * 0.31) % 2.4) < 0.9;

  function collectRings(dt) {
    const px = player.x, py = player.y + 0.8;
    for (const e of state.entities) {
      if (!e.alive || e.kind !== 'ring' || e.z > RINGS.magnetRadius + 2 || e.z < -2) continue;
      const ex = e.x ?? LANES[e.lane];
      if (power.magnet > 0 || power.boost > 0) {
        const dx = px - ex, dy = py - e.y, dist = Math.hypot(dx, dy, e.z);
        if (e.attract || dist < RINGS.magnetRadius) {
          e.attract = true;
          const pull = Math.min(1, dt * 14);
          e.x = ex + dx * pull; e.y += dy * pull; e.z -= e.z * pull;
        }
      }
      if (Math.abs((e.x ?? LANES[e.lane]) - px) < RINGS.pickupRadius && Math.abs(e.z) < RINGS.pickupRadius && Math.abs(e.y - py) < 1.3) {
        e.alive = false; addRings(1); emit('ring');
      }
    }
  }

  // --- Pas de simulation ---
  function step(dt) {
    stats.time += dt;
    for (const key of ['hurtT', 'slowT', 'slideT', 'coyote', 'jumpBuffer']) player[key] = Math.max(0, player[key] - dt);
    power.magnet = Math.max(0, power.magnet - dt);
    if (power.boost > 0) { power.boost = Math.max(0, power.boost - dt); if (power.boost === 0) emit('boostEnd'); }

    const base = speedAt(stats.distance) * character.speedMul;
    const slow = player.slowT > 0 ? SPEED.hurtFactor + (1 - SPEED.hurtFactor) * (1 - player.slowT / SPEED.hurtRecovery) : 1;
    state.speed = base * (power.boost > 0 ? SPEED.boostFactor : 1) * slow;
    const dz = state.speed * dt;
    stats.distance += dz;
    stats.score += SCORE.perMeter * dz;
    state.spawnZ -= dz;

    for (const p of state.plan) { p.z -= dz; p.gapEnd = p.gapEnd.map(g => (g == null ? null : g - dz)); }
    for (const e of state.entities) {
      e.z -= dz;
      const moving = KINDS[e.kind].moving;
      if (moving && e.alive) e.z -= moving * dt;
    }

    // Latéral
    const tx = LANES[player.targetLane];
    const lateral = (LANES[1] - LANES[0]) / PHYS.laneSwitchTime;
    player.x += Math.sign(tx - player.x) * Math.min(Math.abs(tx - player.x), lateral * dt);
    player.lane = laneOf(player.x);

    // Vertical
    const ground = groundAt();
    if (player.grounded) {
      if (ground === null || ground < player.y - 0.05) {
        player.grounded = false; player.coyote = PHYS.coyoteTime; player.airKind = 'fall'; player.vy = 0;
      } else player.y = ground;
    }
    if (!player.grounded) {
      const glide = player.airKind === 'fly' && player.vy < 0 ? 0.35 : 1;
      const prevY = player.y;
      player.vy -= PHYS.gravity * glide * dt;
      player.y += player.vy * dt;
      // On n'atterrit que par le dessus : tombé dans un trou, on ne remonte pas sur le bord suivant.
      if (ground !== null && player.vy <= 0 && player.y <= ground && prevY >= ground - 0.02) {
        player.y = ground; player.vy = 0; player.grounded = true;
        const wasStomp = player.airKind === 'stomp';
        player.airKind = null; player.flyUsed = false;
        emit('land');
        if (wasStomp) player.slideT = PHYS.slideTime * 0.6;
        if (player.jumpBuffer > 0) { player.jumpBuffer = 0; jump(); }
      }
      if (player.y < PHYS.fallDeathY) die('fall');
    }

    collide();
    collectRings(dt);
    if (state.boss) state.boss.update(dt);
  }

  function cleanup() {
    state.entities = state.entities.filter(e => e.alive && e.z + (e.len ?? KINDS[e.kind].len ?? 0) > -BEHIND);
    state.plan = state.plan.filter(p => p.z > -BEHIND);
  }

  function update(dt) {
    events.length = 0;
    if (state.status !== 'playing') return events;
    let remaining = Math.min(dt, 0.1);
    while (remaining > 1e-6 && state.status === 'playing') {
      const h = Math.min(STEP, remaining);
      step(h);
      remaining -= h;
    }
    cleanup();
    fill();
    if (mode === 'zone' && !state.boss && stats.distance >= zone.goal && state.status === 'playing') {
      state.boss = createBoss({ run: state, rng, add, hurt, emit, player, stats, power, onWin: win });
      emit('bossStart');
    }
    return events;
  }

  function win() {
    state.victory = true; state.status = 'won';
    stats.score += SCORE.bossVictory;
    emit('victory');
  }

  return Object.assign(state, { update, act, pistonDown, height, laneOf });
}
