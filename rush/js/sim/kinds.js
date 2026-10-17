// Types d'entités de la piste et règles de collision.
// need : action nécessaire pour passer ('run' = rien à faire, 'jump', 'slide', 'any' = saut ou glissade,
// 'block' = il faut changer de couloir). Utilisé par le validateur pour garantir qu'un passage existe.

export const KINDS = {
  ring:     { y0: 0.6, y1: 1.6, len: 0.6, need: 'run', pickup: true },
  wall:     { y0: 0, y1: 3.4, len: 1.2, need: 'block', breakable: true },
  hurdle:   { y0: 0, y1: 1.0, len: 0.9, need: 'jump', breakable: true },
  spikes:   { y0: 0, y1: 0.6, len: 1.2, need: 'jump' },
  bar:      { y0: 1.2, y1: 3.4, len: 0.8, need: 'slide', breakable: true },
  crab:     { y0: 0, y1: 1.1, len: 1.0, need: 'any', enemy: true },
  bee:      { y0: 1.25, y1: 2.3, len: 1.0, need: 'any', enemy: true },
  piston:   { y0: 0, y1: 3.4, len: 1.6, need: 'block' },       // Chemical Plant : écrase quand il est en bas
  laser:    { y0: 0.15, y1: 0.55, len: 0.4, need: 'jump' },
  boulder:  { y0: 0, y1: 2.2, len: 2.0, need: 'block', moving: 9 }, // Sky Sanctuary : roule vers le joueur
  gap:      { y0: -50, y1: 0, need: 'jump', ground: 'hole' },
  platform: { need: 'block', ground: 'raised', top: 3.6 },
  spring:   { y0: 0, y1: 0.5, len: 1.0, need: 'run', trigger: 'spring' },
  pad:      { y0: 0, y1: 0.2, len: 1.6, need: 'run', trigger: 'pad' },
  magnet:   { y0: 0.6, y1: 1.8, len: 0.8, need: 'run', power: 'magnet' },
  shield:   { y0: 0.6, y1: 1.8, len: 0.8, need: 'run', power: 'shield' },
  boostItem:{ y0: 0.6, y1: 1.8, len: 0.8, need: 'run', power: 'boost' },
  missile:  { y0: 0.2, y1: 2.0, len: 1.4, need: 'block', moving: 22 },
  bomb:     { y0: 0, y1: 1.4, len: 1.6, need: 'block' },
};

export const isSolid = kind => !KINDS[kind].pickup && !KINDS[kind].trigger && !KINDS[kind].power && !KINDS[kind].ground;
