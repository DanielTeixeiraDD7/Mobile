// Personnages jouables : statistiques et capacités. Les modèles 3D sont dans js/view/models.js.
export const CHARACTERS = [
  {
    id: 'sonic', name: 'Sonic', title: 'The Hedgehog', color: '#1f5fff',
    ability: 'Spin Dash : boost plus long', speedMul: 1.04, boostDuration: 4, boostFill: 1, magnetMul: 1,
  },
  {
    id: 'tails', name: 'Tails', title: 'Miles Prower', color: '#ff9a1f',
    ability: 'Vol : 2ᵉ saut en l’air', speedMul: 0.98, boostDuration: 3.5, boostFill: 1, magnetMul: 1.4, canFly: true,
  },
  {
    id: 'knuckles', name: 'Knuckles', title: 'The Echidna', color: '#e3262f',
    ability: 'Force : brise haies et murs', speedMul: 0.97, boostDuration: 3.5, boostFill: 1, magnetMul: 1, smash: ['hurdle', 'wall'],
  },
  {
    id: 'shadow', name: 'Shadow', title: 'The Ultimate Life Form', color: '#2b2b33',
    ability: 'Chaos Boost : jauge 1,5× plus rapide', speedMul: 1.06, boostDuration: 4, boostFill: 1.5, magnetMul: 1,
  },
];

export const characterById = id => CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
