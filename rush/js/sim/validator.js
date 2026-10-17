import { AIRTIME, SPRING_AIRTIME, PHYS } from './config.js';

// Cherche un chemin praticable à travers une suite de lignes d'obstacles.
// rows : [{ z, req: ['run'|'jump'|'slide'|'any'|'block'|'spring', ×3], gapEnd?: [z|null ×3] }]
// Renvoie [{ lane, action }] par ligne, ou null si aucun passage n'existe à cette vitesse.
// Hypothèses prudentes : 75 % du temps de vol pour franchir un trou, délai de récupération entre deux actions.

const CLEARANCE = 2.4;

const ACTIONS = { run: ['run'], jump: ['jump'], slide: ['slide'], any: ['jump', 'slide'], block: [], spring: ['spring'] };

export function solve(rows, speed, startLanes = [0, 1, 2]) {
  const jumpSpan = AIRTIME * speed;
  const springSpan = SPRING_AIRTIME * speed;
  const switchDist = PHYS.laneSwitchTime * speed;
  const recover = { jump: jumpSpan * 1.05, slide: PHYS.slideTime * speed * 0.6, spring: springSpan * 1.05, run: 0 };

  // état : { lane, lastKind, lastZ, airUntil, path }
  let states = startLanes.map(lane => ({ lane, lastKind: 'run', lastZ: -Infinity, airUntil: -Infinity, path: [] }));
  let prevZ = rows.length ? rows[0].z - 1e6 : 0;

  for (const row of rows) {
    const dz = row.z - prevZ;
    // Avant d'entrer dans un couloir, l'obstacle précédent (jusqu'à 1,6 m de long) doit être entièrement dépassé.
    const maxShift = Math.max(0, Math.floor((dz - CLEARANCE) / switchDist));
    const next = new Map();
    for (const s of states) {
      for (let lane = 0; lane < 3; lane++) {
        if (Math.abs(lane - s.lane) > maxShift) continue;
        const req = row.req[lane];
        const inAir = row.z < s.airUntil;
        const options = inAir ? airborneOptions(req, row.gapEnd?.[lane], s.airUntil) : ACTIONS[req];
        for (const action of options) {
          if (action !== 'run' && action !== 'air' && row.z - s.lastZ < recover[s.lastKind]) continue;
          if (action === 'jump' && row.gapEnd?.[lane] != null && row.gapEnd[lane] - row.z > jumpSpan * 0.75) continue;
          const st = {
            lane,
            lastKind: action === 'run' || action === 'air' ? s.lastKind : action,
            lastZ: action === 'run' || action === 'air' ? s.lastZ : row.z,
            airUntil: action === 'jump' ? row.z + jumpSpan * 0.92 : action === 'spring' ? row.z + springSpan * 0.92 : s.airUntil,
            path: [...s.path, { lane, action }],
          };
          const key = `${lane}|${st.lastKind}`;
          const best = next.get(key);
          if (!best || st.lastZ < best.lastZ) next.set(key, st);
        }
      }
    }
    states = [...next.values()];
    if (!states.length) return null;
    prevZ = row.z;
  }
  return states[0]?.path ?? [];
}

// En l'air, on survole les lignes « course » et les trous dont la fin est atteinte avant d'atterrir.
// Un obstacle à glisser ou bloquant reste infranchissable en vol (prudence).
function airborneOptions(req, gapEnd, airUntil) {
  if (req === 'run' || req === 'spring') return ['air'];
  if (req === 'jump' && gapEnd != null) return gapEnd <= airUntil ? ['air'] : [];
  return [];
}
