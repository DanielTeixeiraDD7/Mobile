// Tests de la simulation (sans rendu). Lancer : node --test rush/tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PATTERNS } from '../js/sim/patterns.js';
import { buildSegment, createGenerator } from '../js/sim/generator.js';
import { createRng } from '../js/sim/rng.js';
import { ZONES } from '../js/sim/zones.js';
import { CHARACTERS } from '../js/sim/characters.js';
import { createRun } from '../js/sim/run.js';
import { createAutopilot } from '../js/sim/autopilot.js';
import { SPEED } from '../js/sim/config.js';
import { sanitize, loadSave, writeSave, recordRun, clearZone, defaultSave } from '../js/sim/save.js';
import { evaluate, runValues, MISSIONS } from '../js/sim/missions.js';

const SPEEDS = [SPEED.start, 22, 28, SPEED.max, SPEED.max * 1.06];

test('chaque motif est franchissable à toute vitesse, dans les deux sens, dans chaque zone', () => {
  for (const zone of ZONES) {
    for (const pattern of PATTERNS.filter(p => p.tags.includes('common') || p.tags.includes(zone.id))) {
      for (const speed of SPEEDS) {
        for (const mirror of [false, true]) {
          for (let seed = 1; seed <= 4; seed++) {
            const seg = buildSegment(pattern, { zone, rng: createRng(seed), speed, mirror });
            assert.ok(seg.path, `${zone.id}/${pattern.id} infranchissable à ${speed} m/s (miroir ${mirror})`);
          }
        }
      }
    }
  }
});

test('le générateur est déterministe pour une graine donnée', () => {
  const ids = seed => {
    const g = createGenerator({ zone: ZONES[0], rng: createRng(seed) });
    let z = 40, d = 0;
    return Array.from({ length: 30 }, () => { const s = g.next(d, 20, z); z = s.end; d += 50; return s.id; }).join(',');
  };
  assert.equal(ids(42), ids(42));
  assert.notEqual(ids(42), ids(43));
});

test('le générateur ne retombe presque jamais sur le motif de secours', () => {
  let fallback = 0, total = 0;
  for (const zone of ZONES) for (let seed = 1; seed <= 20; seed++) {
    const g = createGenerator({ zone, rng: createRng(seed) });
    let z = 40;
    for (let i = 0; i < 40; i++) { const s = g.next(i * 80, 16 + i * 0.5, z); z = s.end; total++; if (s.id === 'fallback') fallback++; }
  }
  assert.ok(fallback / total < 0.02, `${fallback}/${total} segments de secours`);
});

// Joue une course complète avec le pilote automatique, à 60 images/s.
function play({ zone, character = CHARACTERS[0], seed, mode = 'zone', seconds = 400 }) {
  const run = createRun({ zone, character, seed, mode });
  const pilot = createAutopilot(run);
  const log = { events: {} };
  for (let frame = 0; frame < seconds * 60 && run.status === 'playing'; frame++) {
    for (const a of pilot()) run.act(a);
    for (const e of run.update(1 / 60)) log.events[e.type] = (log.events[e.type] || 0) + 1;
  }
  return { run, log };
}

test('pilote automatique : chaque zone est terminable (boss battu) avec les vraies collisions', () => {
  const failures = [];
  for (const zone of ZONES) {
    for (let seed = 1; seed <= 6; seed++) {
      const { run, log } = play({ zone, seed });
      if (run.status !== 'won') failures.push(`${zone.id}#${seed}: ${run.status} (${run.player.deathCause}) à ${Math.round(run.stats.distance)} m, coups ${run.stats.hits}`);
      else assert.ok((log.events.bossHit || 0) >= run.boss.maxHp);
    }
  }
  assert.deepEqual(failures, []);
});

test('pilote automatique : le pilote suit le chemin sûr sans prendre de coups', () => {
  let hits = 0, runs = 0;
  for (const zone of ZONES) for (let seed = 10; seed <= 14; seed++) {
    const { run } = play({ zone, seed, mode: 'endless', seconds: 120 });
    hits += run.stats.hits; runs++;
    assert.equal(run.status, 'playing', `${zone.id}#${seed} mort : ${run.player.deathCause} à ${Math.round(run.stats.distance)} m`);
  }
  assert.ok(hits / runs < 1, `${hits} coups pour ${runs} courses de 2 min`);
});

test('tous les personnages fonctionnent', () => {
  for (const character of CHARACTERS) {
    const { run } = play({ zone: ZONES[0], character, seed: 7, mode: 'endless', seconds: 60 });
    assert.equal(run.status, 'playing', `${character.id} : ${run.player.deathCause}`);
    assert.ok(run.stats.distance > 900);
  }
});

test('sans action, le joueur finit par perdre (obstacles réellement dangereux)', () => {
  const run = createRun({ zone: ZONES[0], character: CHARACTERS[0], seed: 3, mode: 'endless' });
  for (let f = 0; f < 60 * 120 && run.status === 'playing'; f++) run.update(1 / 60);
  assert.equal(run.status, 'dead');
});

test('sauter, glisser, changer de couloir', () => {
  const run = createRun({ zone: ZONES[0], character: CHARACTERS[0], seed: 1 });
  run.act('up'); run.update(0.1);
  assert.ok(run.player.y > 0.5 && !run.player.grounded);
  for (let i = 0; i < 60; i++) run.update(1 / 60);
  assert.ok(run.player.grounded);
  run.act('down'); run.update(1 / 60);
  assert.ok(run.player.slideT > 0);
  run.act('left'); for (let i = 0; i < 30; i++) run.update(1 / 60);
  assert.equal(run.player.lane, 0);
  run.act('left'); assert.equal(run.player.targetLane, 0);
});

test('anneaux, choc et mort', () => {
  const run = createRun({ zone: ZONES[0], character: CHARACTERS[0], seed: 1 });
  for (let i = 0; i < 120; i++) run.update(1 / 60);
  assert.ok(run.stats.rings > 0, 'les anneaux de départ sont ramassés');
  const rings = run.stats.rings;
  run.entities.push({ id: 9999, kind: 'wall', lane: run.player.lane, z: 0.2, len: 1.2, alive: true });
  run.update(1 / 60);
  assert.equal(run.stats.rings, 0, `perte des ${rings} anneaux`);
  assert.equal(run.status, 'playing');
  run.player.hurtT = 0;
  run.entities.push({ id: 10000, kind: 'wall', lane: run.player.lane, z: 0.2, len: 1.2, alive: true });
  run.update(1 / 60);
  assert.equal(run.status, 'dead');
});

test('sauvegarde : valeurs par défaut, données corrompues, aller-retour', () => {
  assert.deepEqual(sanitize(null).bestScore, 0);
  const corrupt = sanitize({ bestScore: 'abc', totalRings: -5, unlockedZones: 'x', settings: { music: 9 } });
  assert.equal(corrupt.bestScore, 0);
  assert.equal(corrupt.totalRings, 0);
  assert.deepEqual(corrupt.unlockedZones, ['greenhill']);
  assert.equal(corrupt.settings.music, defaultSave().settings.music);
  const store = new Map();
  const storage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  store.set('sonicrush3d.save', '{not json');
  assert.equal(loadSave(storage).bestScore, 0);
  const save = loadSave(storage);
  save.bestScore = 1234;
  writeSave(save, storage);
  assert.equal(loadSave(storage).bestScore, 1234);
  assert.equal(loadSave(storage).missions.active.length, 3);
});

test('records, missions et déblocage de zone', () => {
  const { run } = play({ zone: ZONES[0], seed: 2 });
  const save = sanitize(null);
  const values = runValues(run);
  const records = recordRun(save, run, values);
  assert.ok(records.score && records.distance);
  const done = evaluate(save, values);
  assert.ok(done.length >= 1, 'au moins une mission accomplie');
  assert.equal(save.missions.active.length, 3);
  if (run.victory) clearZone(save, 'greenhill', ZONES);
  assert.ok(save.unlockedZones.includes('chemical'));
  assert.ok(MISSIONS.every(m => m.goal > 0));
});
