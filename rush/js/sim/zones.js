// Définition des zones : identité, obstacles disponibles, objectif de distance avant le boss.
// Les visuels correspondants sont dans js/view/zones.js.

export const ZONES = [
  {
    id: 'greenhill',
    name: 'Green Hill',
    act: 'Zone 1',
    goal: 1500,
    music: 'greenhill',
    obstacles: { wall: 3, hurdle: 4, spikes: 3, bar: 3, crab: 4, bee: 3, gap: 2 },
    patterns: ['common', 'greenhill'],
    unlock: null,
  },
  {
    id: 'chemical',
    name: 'Chemical Plant',
    act: 'Zone 2',
    goal: 1800,
    music: 'chemical',
    obstacles: { wall: 3, hurdle: 3, bar: 4, piston: 4, laser: 4, bee: 3, crab: 2, gap: 3 },
    patterns: ['common', 'chemical'],
    unlock: 'greenhill',
  },
  {
    id: 'sky',
    name: 'Sky Sanctuary',
    act: 'Zone 3',
    goal: 2000,
    music: 'sky',
    obstacles: { wall: 3, hurdle: 3, bar: 3, boulder: 4, spikes: 2, bee: 4, gap: 5 },
    patterns: ['common', 'sky'],
    unlock: 'chemical',
  },
];

export const zoneById = id => ZONES.find(z => z.id === id) || ZONES[0];
