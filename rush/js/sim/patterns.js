// Bibliothèque de motifs. Chaque ligne : [temps, 'gauche centre droite', options].
// Les positions sont en temps (BEAT) pour rester équitables à toute vitesse.
//   .  vide            B  bloquant (mur, piston, rocher)   J  à sauter (haie, piques, laser)
//   S  à glisser (barre)   E  ennemi au sol   F  ennemi volant   G  trou (len = longueur en temps)
//   P  ressort   D  accélérateur   H  plateforme haute (len)   U  bonus aléatoire   W  mur
// tier : difficulté minimale. tags : 'common' ou id de zone.

export const PATTERNS = [
  { id: 'single-block', tier: 0, tags: ['common'], rows: [[0, '.B.']] },
  { id: 'side-blocks', tier: 0, tags: ['common'], rows: [[0, 'B.B']] },
  { id: 'jump-row', tier: 0, tags: ['common'], rows: [[0, 'JJJ']] },
  { id: 'slide-row', tier: 0, tags: ['common'], rows: [[0, 'SSS']] },
  { id: 'slalom', tier: 0, tags: ['common'], rows: [[0, 'B..'], [2.5, '.B.'], [5, '..B']] },
  { id: 'enemy-line', tier: 0, tags: ['common'], rows: [[0, '.E.'], [2.5, 'E.E']] },
  { id: 'center-jump', tier: 0, tags: ['common'], rows: [[0, 'BJB']] },
  { id: 'power', tier: 0, tags: ['common'], rows: [[0, 'BUB'], [2.5, '.J.']] },
  { id: 'dash', tier: 0, tags: ['common'], rows: [[0, '.D.'], [1.2, 'B.B'], [2.4, 'JBJ']] },

  { id: 'corridor', tier: 1, tags: ['common'], rows: [[0, 'B.B'], [2, 'B.B'], [4, 'BJB'], [6, 'BSB']] },
  { id: 'zigzag', tier: 1, tags: ['common'], rows: [[0, 'BB.'], [2.2, '.BB'], [4.4, 'BB.']] },
  { id: 'mix', tier: 1, tags: ['common'], rows: [[0, 'JSB'], [2.5, 'BSJ']] },
  { id: 'bees', tier: 1, tags: ['common'], rows: [[0, 'FFF'], [2.5, '.B.']] },
  { id: 'gap-small', tier: 1, tags: ['common'], rows: [[0, 'GGG', { len: 1 }]] },
  { id: 'gap-side', tier: 1, tags: ['common'], rows: [[0, 'G.G', { len: 1.1 }], [2.5, '.B.']] },
  {
    id: 'high-route', tier: 1, tags: ['common'],
    rows: [[0, 'P..'], [1, 'H..', { len: 8 }], [2.5, '.JB'], [5, '.BS'], [7.5, '.E.']],
  },

  { id: 'double-switch', tier: 2, tags: ['common'], rows: [[0, 'B.B'], [2, '.BB'], [4, 'BB.'], [6, 'B.B']] },
  { id: 'action-tunnel', tier: 2, tags: ['common'], rows: [[0, 'BJB'], [2, 'BSB'], [4, 'BJB'], [6, 'BEB']] },
  { id: 'gap-chain', tier: 2, tags: ['common'], rows: [[0, 'GGG', { len: 1 }], [2.6, 'GGG', { len: 1 }]] },
  { id: 'enemy-wave', tier: 2, tags: ['common'], rows: [[0, 'EFE'], [2, 'FEF'], [4, 'EFE']] },
  {
    id: 'high-route-right', tier: 2, tags: ['common'],
    rows: [[0, '..P'], [1, '..H', { len: 8 }], [2.5, 'JB.'], [5, 'SJ.'], [7.5, '.B.']],
  },

  { id: 'big-jump', tier: 0, tags: ['greenhill', 'sky'], setPiece: true, rows: [[0, 'PPP'], [0.6, 'GGG', { len: 1.5 }]] },
  { id: 'loop-run', tier: 1, tags: ['greenhill'], setPiece: true, rows: [[0, 'DDD'], [1.5, 'B.B'], [3, '.B.'], [4.5, 'B.B']] },
  { id: 'crusher-line', tier: 1, tags: ['chemical'], rows: [[0, 'B.B'], [2, '.B.'], [4, 'B.B']] },
  { id: 'laser-grid', tier: 1, tags: ['chemical'], rows: [[0, 'JJJ'], [2.2, 'SSS'], [4.4, 'JJJ']] },
  { id: 'toxic-pools', tier: 2, tags: ['chemical'], rows: [[0, 'G.G', { len: 1.1 }], [2.5, '.G.', { len: 1.1 }], [5, 'G.G', { len: 1.1 }]] },
  { id: 'boulder-run', tier: 1, tags: ['sky'], rows: [[0, 'B..'], [2.2, '..B'], [4.4, '.B.']] },
  { id: 'ruins-gaps', tier: 1, tags: ['sky'], rows: [[0, 'GGG', { len: 1.1 }], [2.5, 'B.B'], [4.5, 'GGG', { len: 1.1 }]] },
];

export const CHAR_KIND = { B: 'block', J: 'jump', S: 'slide', E: 'crab', F: 'bee', G: 'gap', P: 'spring', D: 'pad', H: 'platform', U: 'power', W: 'wall' };

export const tierFor = distance => (distance < 300 ? 0 : distance < 900 ? 1 : 2);
