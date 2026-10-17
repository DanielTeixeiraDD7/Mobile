import { BEAT, AIRTIME, SPRING_AIRTIME, PHYS } from './config.js';
import { KINDS } from './kinds.js';
import { PATTERNS, CHAR_KIND, tierFor } from './patterns.js';
import { solve } from './validator.js';

const POWERS = ['magnet', 'shield', 'boostItem'];
const RING_SPACING = 2.4;
const BREATHER = 2.2; // temps libres entre deux motifs : laisse le temps de changer de couloir et de récupérer

// Choisit le type concret d'un emplacement générique selon la zone (ex. B → mur, piston ou rocher).
function resolveKind(code, zone, rng) {
  const pool = Object.entries(zone.obstacles);
  const of = need => pool.filter(([k]) => KINDS[k].need === need && k !== 'gap');
  switch (code) {
    case 'block': return rng.weighted(of('block'), ([, w]) => w)[0];
    case 'jump': return rng.weighted(of('jump'), ([, w]) => w)[0];
    case 'slide': return 'bar';
    case 'crab': return zone.obstacles.crab ? 'crab' : 'hurdle';
    case 'bee': return 'bee';
    case 'power': return rng.pick(POWERS);
    default: return code;
  }
}

const needOf = kind => (KINDS[kind].trigger === 'spring' ? 'spring' : KINDS[kind].power || KINDS[kind].trigger ? 'run' : KINDS[kind].need);

// Construit un segment : entités positionnées (z relatif au début du segment, en mètres) + chemin sûr.
export function buildSegment(pattern, { zone, rng, speed, mirror }) {
  const meters = beats => beats * BEAT * speed;
  const rows = [];
  const entities = [];
  const platformSpans = [];

  for (const [beat, cells, opts = {}] of pattern.rows) {
    const z = meters(beat);
    const lanes = mirror ? [...cells].reverse() : [...cells];
    const row = { z, req: ['run', 'run', 'run'], gapEnd: [null, null, null] };
    lanes.forEach((c, lane) => {
      if (c === '.') return;
      const kind = resolveKind(CHAR_KIND[c], zone, rng);
      const len = opts.len ? meters(opts.len) : KINDS[kind].len;
      entities.push({ kind, lane, z, len });
      if (kind === 'platform') {
        platformSpans.push({ lane, from: z, to: z + len });
        row.req[lane] = 'block';
      } else {
        row.req[lane] = needOf(kind);
        if (kind === 'gap') row.gapEnd[lane] = z + len;
      }
    });
    rows.push(row);
  }
  rows.sort((a, b) => a.z - b.z);
  // Sous une plateforme, le couloir est plein : aucun passage au sol.
  for (const row of rows) for (const p of platformSpans) if (row.z > p.from && row.z < p.to) row.req[p.lane] = 'block';

  const path = solve(rows, speed);
  const length = Math.max(...entities.map(e => e.z + e.len), 0);
  return { entities, rows, path, length };
}

// Place des anneaux le long du chemin sûr : arcs au-dessus des sauts, lignes basses sous les barres,
// traînées dans le couloir d'arrivée après un changement de couloir.
function ringsAlongPath(segment, speed) {
  const rings = [];
  const { rows, path } = segment;
  const jumpSpan = AIRTIME * speed;
  path.forEach((step, i) => {
    const z = rows[i].z;
    if (step.action === 'jump') {
      const span = rows[i].gapEnd[step.lane] != null ? jumpSpan * 0.8 : jumpSpan * 0.7;
      const n = 5;
      for (let k = 0; k < n; k++) {
        const t = k / (n - 1);
        rings.push({ kind: 'ring', lane: step.lane, z: z - span * 0.3 + span * t, y: 1.1 + 2.0 * 4 * t * (1 - t) });
      }
    } else if (step.action === 'slide') {
      for (let k = -1; k <= 1; k++) rings.push({ kind: 'ring', lane: step.lane, z: z + k * 1.6, y: 0.5 });
    } else if (step.action === 'spring') {
      const span = SPRING_AIRTIME * speed * 0.85;
      for (let k = 1; k <= 7; k++) {
        const t = k / 8;
        rings.push({ kind: 'ring', lane: step.lane, z: z + span * t, y: 1 + 6 * 4 * t * (1 - t) });
      }
    }
    const prev = path[i - 1];
    if (prev && prev.lane !== step.lane && step.action === 'run') {
      const from = rows[i - 1].z + PHYS.laneSwitchTime * speed + 2;
      for (let zz = from; zz < z - 1.5; zz += RING_SPACING) rings.push({ kind: 'ring', lane: step.lane, z: zz, y: 1 });
    }
  });
  return rings;
}

// Générateur de piste infinie, déterministe pour une graine donnée.
export function createGenerator({ zone, rng }) {
  let lastId = null;
  let sinceSetPiece = 0;

  function choosePattern(distance) {
    const tier = tierFor(distance);
    const candidates = PATTERNS.filter(p => p.tier <= tier && p.tags.some(t => t === 'common' || t === zone.id) && p.id !== lastId);
    return rng.weighted(candidates, p => (p.setPiece ? (sinceSetPiece > 8 ? 3 : 0.05) : 1 + (p.tier === tier ? 1 : 0)));
  }

  return {
    // Génère le prochain segment à placer à partir de z0 (mètres devant le joueur).
    next(distance, speed, z0) {
      for (let attempt = 0; attempt < 6; attempt++) {
        const pattern = choosePattern(distance);
        const seg = buildSegment(pattern, { zone, rng, speed, mirror: rng.chance(0.5) });
        if (!seg.path) continue;
        lastId = pattern.id;
        sinceSetPiece = pattern.setPiece ? 0 : sinceSetPiece + 1;
        const lead = BREATHER * BEAT * speed + rng.next() * BEAT * speed * Math.max(0, 1.5 - distance / 1500);
        const rings = rng.chance(0.85) ? ringsAlongPath(seg, speed) : [];
        // Un objet mobile (rocher) part de plus loin pour croiser le joueur exactement à la position validée.
        const place = e => {
          const z = e.z + z0 + lead;
          const m = KINDS[e.kind].moving;
          return { ...e, z: m ? (z * (speed + m)) / speed : z };
        };
        const entities = [...seg.entities.map(place), ...rings.map(place)];
        if (pattern.setPiece && entities[0]) entities[0].piece = pattern.id; // pour le décor spécial (arche, grand saut)
        return {
          id: pattern.id,
          entities,
          end: z0 + lead + seg.length,
          plan: seg.rows.map((row, i) => ({ z: row.z + z0 + lead, gapEnd: row.gapEnd.map(g => (g == null ? null : g + z0 + lead)), ...seg.path[i] })),
        };
      }
      // Repli : une simple ligne d'anneaux, toujours praticable.
      const lead = BREATHER * BEAT * speed;
      const lane = rng.int(0, 2);
      const entities = Array.from({ length: 6 }, (_, k) => ({ kind: 'ring', lane, z: z0 + lead + k * RING_SPACING, y: 1 }));
      return { id: 'fallback', entities, end: z0 + lead + 6 * RING_SPACING, plan: [] };
    },
  };
}
