import * as THREE from 'three';
import { createRun } from './sim/run.js';
import { ZONES, zoneById } from './sim/zones.js';
import { characterById } from './sim/characters.js';
import { createAutopilot } from './sim/autopilot.js';
import { randomSeed } from './sim/rng.js';
import { loadSave, writeSave, recordRun, clearZone, defaultSave, sanitize } from './sim/save.js';
import { evaluate, runValues } from './sim/missions.js';
import { createWorld } from './view/world.js';
import { createEntityView } from './view/entities.js';
import { createEffects } from './view/effects.js';
import { createRig } from './view/rig.js';
import { createInput } from './core/input.js';
import { createAudio } from './core/audio.js';
import { createUI } from './ui/ui.js';

const params = new URLSearchParams(location.search);
const TEST = params.has('test');
const AUTOPILOT = params.has('autopilot');
const FIXED_SEED = params.has('seed') ? Number(params.get('seed')) : null;
const TIME_SCALE = TEST ? Math.max(1, Math.min(8, Number(params.get('timescale')) || 1)) : 1; // tests uniquement

let save = loadSave();
const audio = createAudio(save.settings);
const canvas = document.getElementById('game');

// --- Rendu ---
const renderer = new THREE.WebGLRenderer({ canvas, antialias: save.settings.quality === 'high', powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 600);
let pixelRatioCap = { low: 1, auto: 1.75, high: 2 }[save.settings.quality];

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Écran étroit (portrait) : champ plus large pour voir les trois couloirs.
  camera.userData.baseFov = w / h < 0.7 ? 70 : 60;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// --- État de l'application ---
const app = {
  state: 'menu',          // menu | playing | paused | ending | results
  run: null, world: null, entities: null, effects: null, rig: null, pilot: null,
  zoneId: save.zone, mode: 'zone', endingT: 0, menuDistance: 0, shake: 0,
  fps: 60, frames: 0, fpsT: 0, lowFpsTime: 0,
};

const ui = createUI(document.getElementById('ui'), {
  click: () => { audio.unlock(); audio.play('ui'); },
  action: onUiAction,
  setting: onSetting,
});

function clearScene() {
  app.world?.dispose(); app.entities?.dispose(); app.effects?.dispose();
  if (app.rig) scene.remove(app.rig.root);
  app.world = app.entities = app.effects = app.rig = null;
}

// Menu : le personnage choisi pose dans le décor de la zone sélectionnée.
function enterMenu(screen = 'menu') {
  clearScene();
  app.state = 'menu';
  app.run = null;
  app.world = createWorld(scene, save.zone, { reduced: save.settings.reducedEffects });
  app.rig = createRig(save.character);
  app.rig.root.rotation.y = Math.PI + 0.5;
  scene.add(app.rig.root);
  ui.renderMenu(save);
  ui.renderChars(save);
  ui.renderZones(save, app.mode);
  ui.renderMissions(save);
  ui.renderSettings(save);
  ui.show(screen);
  audio.music('menu');
}

function startRun(zoneId) {
  audio.unlock();
  clearScene();
  save.zone = zoneId;
  writeSave(save);
  const zone = zoneById(zoneId);
  const character = characterById(save.character);
  const reduced = save.settings.reducedEffects;
  app.run = createRun({ zone, character, seed: FIXED_SEED ?? randomSeed(), mode: app.mode });
  app.world = createWorld(scene, zone.id, { reduced });
  app.entities = createEntityView(scene, zone.id);
  app.rig = createRig(character.id);
  scene.add(app.rig.root);
  app.effects = createEffects(scene, { reduced, trailColor: app.rig.trail });
  app.pilot = AUTOPILOT ? createAutopilot(app.run, { useBoost: false }) : null;
  app.zoneId = zone.id;
  app.state = 'playing';
  app.lowFpsTime = 0;
  ui.show('hud');
  ui.banner(zone.name, zone.act);
  if (save.runs === 0) ui.hint('Glisse ← → ↑ ↓ pour bouger · BOOST quand la jauge est pleine');
  audio.music(zone.music);
}

function finishRun() {
  const run = app.run;
  const values = runValues(run);
  const records = recordRun(save, run, values);
  const missions = evaluate(save, values);
  let unlocked = null, next = null;
  if (run.victory) {
    const before = [...save.unlockedZones];
    clearZone(save, run.zone.id, ZONES);
    const fresh = save.unlockedZones.find(z => !before.includes(z));
    if (fresh) unlocked = zoneById(fresh).name;
    const idx = ZONES.findIndex(z => z.id === run.zone.id);
    if (ZONES[idx + 1] && save.unlockedZones.includes(ZONES[idx + 1].id)) next = ZONES[idx + 1].id;
  }
  writeSave(save);
  app.state = 'results';
  ui.renderResults({ victory: run.victory, zone: run.zone, values, records, best: save.bestScore, missions, unlocked, next });
  ui.show('results');
  if (missions.length) audio.jingle('mission');
}

function onUiAction(act, data) {
  switch (act) {
    case 'menu': enterMenu(); break;
    case 'zones': ui.renderZones(save, app.mode); ui.show('zones'); break;
    case 'chars': ui.renderChars(save); ui.show('chars'); break;
    case 'missions': ui.renderMissions(save); ui.show('missions'); break;
    case 'settings': ui.renderSettings(save); ui.show('settings'); break;
    case 'mode': app.mode = data.mode; ui.renderZones(save, app.mode); break;
    case 'play': startRun(data.zone); break;
    case 'char':
      save.character = data.id; writeSave(save);
      scene.remove(app.rig.root);
      app.rig = createRig(save.character);
      app.rig.root.rotation.y = Math.PI + 0.5;
      scene.add(app.rig.root);
      ui.renderChars(save);
      break;
    case 'pause': pause(); break;
    case 'resume': resume(); break;
    case 'restart': startRun(app.zoneId); break;
    case 'quit': enterMenu(); break;
    case 'boost': app.run?.act('boost'); break;
    case 'reset': ui.renderSettings(save, true); break;
    case 'reset-yes':
      save = sanitize({ settings: save.settings });
      writeSave(save);
      enterMenu('settings');
      ui.toast('Progression effacée');
      break;
  }
}

function onSetting(key, value) {
  save.settings[key] = value;
  writeSave(save);
  if (key === 'music' || key === 'sfx') audio.setVolumes(save.settings.music, save.settings.sfx);
  if (key === 'quality') { pixelRatioCap = { low: 1, auto: 1.75, high: 2 }[value]; resize(); }
}

function pause() {
  if (app.state !== 'playing') return;
  app.state = 'paused';
  ui.show('pause');
  audio.suspend();
}

function resume() {
  if (app.state !== 'paused') return;
  app.state = 'playing';
  ui.show('hud');
  audio.resume();
}

// Commandes
createInput(document.body, action => {
  audio.unlock();
  if (action === 'pause') return app.state === 'paused' ? resume() : pause();
  if (app.state === 'playing') app.run.act(action);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

// Réactions aux événements de la simulation : sons, effets, bannières.
function handleEvents(events) {
  const run = app.run;
  for (const e of events) {
    app.effects.onEvent(e, run);
    switch (e.type) {
      case 'ring': audio.play('ring'); break;
      case 'jump': case 'fly': case 'slide': case 'stomp': case 'land': case 'lane': case 'boost': case 'pad':
      case 'spring': case 'power': case 'smash': case 'enemy': case 'shieldBreak': case 'ringLoss':
        audio.play(e.type); break;
      case 'hurt': audio.play('hurt'); app.shake = 0.35; break;
      case 'death': audio.play('death'); audio.stopMusic(); app.shake = 0.5; break;
      case 'bossStart': ui.banner('WARNING!', 'Le Dr. Eggman approche', true); audio.music('boss'); break;
      case 'bossIntro': ui.banner('DR. EGGMAN', 'Saute sur lui quand il plonge !'); break;
      case 'bossTelegraph': audio.play('bossTelegraph'); break;
      case 'bossFire': audio.play('bossFire'); break;
      case 'bossHit': audio.play('bossHit'); app.shake = 0.25; break;
      case 'bossDefeated': audio.play('explosion'); ui.banner('BOSS VAINCU !'); break;
      case 'victory': audio.stopMusic(); audio.jingle('victory'); break;
    }
  }
}

// Caméra derrière le personnage, légèrement au-dessus ; champ élargi en boost.
function updateCamera(dt) {
  const run = app.run;
  const k = 1 - Math.exp(-dt * 9);
  if (!run) {
    app.menuDistance += dt * 4;
    camera.position.lerp(new THREE.Vector3(1.5, 1.6, 4.4), k);
    camera.lookAt(0, 1.0, 0);
    camera.fov += ((camera.userData.baseFov ?? 60) - camera.fov) * k;
  } else {
    const p = run.player;
    const target = new THREE.Vector3(p.x * 0.72, 4.3 + p.y * 0.55, 7.0);
    camera.position.lerp(target, k);
    if (app.shake > 0 && !save.settings.reducedEffects) {
      camera.position.x += (Math.random() - 0.5) * app.shake;
      camera.position.y += (Math.random() - 0.5) * app.shake;
    }
    camera.lookAt(p.x * 0.85, 0.4 + p.y * 0.6, -9);
    const fov = (camera.userData.baseFov ?? 60) + (run.power.boost > 0 ? 12 : 0) + Math.min(6, (run.speed - 16) * 0.25);
    camera.fov += (fov - camera.fov) * k;
  }
  app.shake = Math.max(0, app.shake - dt);
  camera.updateProjectionMatrix();
}

function measureFps(dt) {
  app.frames++; app.fpsT += dt;
  if (app.fpsT >= 0.5) {
    app.fps = Math.round(app.frames / app.fpsT);
    app.frames = 0; app.fpsT = 0;
    // Qualité auto : on réduit la résolution si le jeu rame durablement.
    if (save.settings.quality === 'auto' && app.state === 'playing') {
      app.lowFpsTime = app.fps < 45 ? app.lowFpsTime + 0.5 : 0;
      if (app.lowFpsTime >= 3 && pixelRatioCap > 1) { pixelRatioCap = Math.max(1, pixelRatioCap - 0.5); resize(); app.lowFpsTime = 0; }
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  measureFps(dt);
  const run = app.run;

  if (app.state === 'playing' || app.state === 'ending') {
    if (app.state === 'playing') {
      for (let k = 0; k < TIME_SCALE && run.status === 'playing'; k++) {
        if (app.pilot) for (const a of app.pilot()) run.act(a);
        handleEvents(run.update(dt));
      }
      if (run.status !== 'playing') { app.state = 'ending'; app.endingT = run.victory ? 2.6 : 1.6; if (!run.victory) audio.jingle('gameover'); }
    } else if ((app.endingT -= dt) <= 0) finishRun();
    app.world.update(run.stats.distance, run.entities, dt);
    app.entities.update(run, dt);
    app.effects.update(run, dt);
    app.rig.update(dt, run);
    ui.updateHud(run, { fps: app.fps, showFps: save.settings.showFps });
  } else if (app.state === 'menu') {
    app.world?.update(app.menuDistance, [], dt);
    app.rig?.update(dt, null);
    if (app.rig) app.rig.root.rotation.y = Math.PI + 0.35 + Math.sin(now / 1500) * 0.35;
  }
  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

enterMenu();
requestAnimationFrame(frame);

// Service worker (hors-ligne)
if ('serviceWorker' in navigator && !TEST) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}

// Points d'accès pour les tests automatisés (?test=1).
if (TEST) {
  window.__rush = {
    get app() { return app; },
    get run() { return app.run; },
    get save() { return save; },
    get fps() { return app.fps; },
    get renderInfo() { return renderer.info.render; },
    act: a => app.run?.act(a),
    ui: onUiAction,
    defaultSave,
  };
}
