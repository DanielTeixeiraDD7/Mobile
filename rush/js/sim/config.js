// Réglages de gameplay. Unités : mètres, secondes. Le joueur reste en z = 0, le monde défile vers lui
// (les entités ont une position z = distance devant le joueur, qui diminue).

export const LANES = [-2.6, 0, 2.6];

export const PHYS = {
  gravity: 46,
  jumpVelocity: 15.5,      // temps de vol ≈ 0,67 s, hauteur ≈ 2,6 m
  springVelocity: 24,      // temps de vol ≈ 1,04 s, hauteur ≈ 6,3 m
  stompVelocity: -30,      // glissé vers le bas en l'air : descente rapide
  bounceVelocity: 13,      // rebond après avoir écrasé un ennemi
  laneSwitchTime: 0.14,
  slideTime: 0.62,
  standHeight: 1.7,
  slideHeight: 0.8,
  width: 0.9,
  depth: 0.8,
  fallDeathY: -4,
  hurtInvulnerability: 1.3,
  jumpBuffer: 0.14,        // un saut demandé juste avant d'atterrir est pris en compte
  coyoteTime: 0.08,
};

export const SPEED = {
  start: 16,
  max: 36,
  rampDistance: 2600,      // vitesse = start + (max - start) * (1 - e^(-d / ramp))
  boostFactor: 1.55,
  hurtFactor: 0.85,        // ralentissement temporaire après un choc (doux : les trous restent franchissables)
  hurtRecovery: 1.2,
};

// Un « temps » de motif : les motifs sont décrits en temps, convertis en mètres selon la vitesse,
// pour que l'écart entre deux actions reste constant en secondes quelle que soit la vitesse.
export const BEAT = 0.42;
export const AIRTIME = (2 * PHYS.jumpVelocity) / PHYS.gravity;
export const SPRING_AIRTIME = (2 * PHYS.springVelocity) / PHYS.gravity;

export const RINGS = {
  pickupRadius: 1.1,
  magnetRadius: 9,
  magnetDuration: 10,
  boostFill: 0.012,        // part de la jauge de boost par anneau
  enemyFill: 0.06,
  scatterMax: 20,          // nombre d'anneaux visuellement éjectés lors d'un choc
};

export const POWER = {
  boostDuration: 3.5,
  itemBoostDuration: 4,
  padBoostDuration: 1.6,
};

export const SCORE = {
  perMeter: 1,
  perRing: 10,
  perEnemy: 150,
  perBossHit: 1000,
  bossVictory: 5000,
  comboStep: 25,           // anneaux consécutifs pour +1 au multiplicateur
  comboMax: 5,
};

export const VIEW_DISTANCE = 130;  // distance de génération devant le joueur
export const BEHIND = 12;          // distance de recyclage derrière le joueur

export const speedAt = distance => SPEED.start + (SPEED.max - SPEED.start) * (1 - Math.exp(-distance / SPEED.rampDistance));
