import { refill } from './missions.js';

// Sauvegarde locale (localStorage). Format versionné, valeurs validées une par une :
// un fichier absent, corrompu ou d'une ancienne version donne une sauvegarde valide.
export const SAVE_KEY = 'sonicrush3d.save';
const VERSION = 1;

export function defaultSave() {
  return {
    version: VERSION,
    bestScore: 0,
    bestDistance: 0,
    totalRings: 0,
    runs: 0,
    character: 'sonic',
    zone: 'greenhill',
    unlockedZones: ['greenhill'],
    clearedZones: [],
    bestByZone: {},
    missions: { active: [], completed: [] },
    settings: { music: 0.6, sfx: 0.8, reducedEffects: false, quality: 'auto', showFps: false },
  };
}

const num = (v, d, min = 0, max = Number.MAX_SAFE_INTEGER) => (Number.isFinite(v) && v >= min && v <= max ? v : d);
const strList = (v, d) => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : d);

export function sanitize(raw) {
  const d = defaultSave();
  if (!raw || typeof raw !== 'object') { refill(d); return d; }
  const s = {
    version: VERSION,
    bestScore: num(raw.bestScore, 0),
    bestDistance: num(raw.bestDistance, 0),
    totalRings: num(raw.totalRings, 0),
    runs: num(raw.runs, 0),
    character: typeof raw.character === 'string' ? raw.character : d.character,
    zone: typeof raw.zone === 'string' ? raw.zone : d.zone,
    unlockedZones: [...new Set(['greenhill', ...strList(raw.unlockedZones, [])])],
    clearedZones: strList(raw.clearedZones, []),
    bestByZone: raw.bestByZone && typeof raw.bestByZone === 'object' ? Object.fromEntries(
      Object.entries(raw.bestByZone).filter(([, v]) => Number.isFinite(v)).map(([k, v]) => [k, v])) : {},
    missions: {
      active: strList(raw.missions?.active, []),
      completed: strList(raw.missions?.completed, []),
    },
    settings: {
      music: num(raw.settings?.music, d.settings.music, 0, 1),
      sfx: num(raw.settings?.sfx, d.settings.sfx, 0, 1),
      reducedEffects: typeof raw.settings?.reducedEffects === 'boolean' ? raw.settings.reducedEffects : false,
      quality: ['auto', 'low', 'high'].includes(raw.settings?.quality) ? raw.settings.quality : 'auto',
      showFps: raw.settings?.showFps === true,
    },
  };
  refill(s);
  return s;
}

export function loadSave(storage = globalThis.localStorage) {
  try {
    const text = storage?.getItem(SAVE_KEY);
    return sanitize(text ? JSON.parse(text) : null);
  } catch {
    return sanitize(null);
  }
}

export function writeSave(save, storage = globalThis.localStorage) {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

// Intègre le résultat d'une course ; renvoie les records battus.
export function recordRun(save, run, values) {
  const records = { score: false, distance: false };
  save.runs += 1;
  save.totalRings += values.ringsTotal;
  if (values.score > save.bestScore) { save.bestScore = values.score; records.score = true; }
  if (values.distance > save.bestDistance) { save.bestDistance = values.distance; records.distance = true; }
  const zid = run.zone.id;
  save.bestByZone[zid] = Math.max(save.bestByZone[zid] || 0, values.score);
  return records;
}

export function clearZone(save, zoneId, zones) {
  if (!save.clearedZones.includes(zoneId)) save.clearedZones.push(zoneId);
  for (const z of zones) if (z.unlock === zoneId && !save.unlockedZones.includes(z.id)) save.unlockedZones.push(z.id);
}
