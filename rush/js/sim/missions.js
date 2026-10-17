// Missions : 3 actives à la fois, remplacées dès qu'elles sont accomplies. Progression mesurée en fin de course
// (ou en cumul pour les missions « total »).
export const MISSIONS = [
  { id: 'rings100', text: 'Ramasse 100 anneaux en une course', stat: 'ringsTotal', goal: 100, reward: 200 },
  { id: 'dist1000', text: 'Parcours 1 000 m en une course', stat: 'distance', goal: 1000, reward: 250 },
  { id: 'enemies10', text: 'Détruis 10 ennemis en une course', stat: 'enemies', goal: 10, reward: 250 },
  { id: 'jumps30', text: 'Saute 30 fois en une course', stat: 'jumps', goal: 30, reward: 150 },
  { id: 'boosts3', text: 'Utilise 3 boosts en une course', stat: 'boosts', goal: 3, reward: 300 },
  { id: 'rings300', text: 'Ramasse 300 anneaux en une course', stat: 'ringsTotal', goal: 300, reward: 400 },
  { id: 'score50k', text: 'Fais 50 000 points', stat: 'score', goal: 50000, reward: 400 },
  { id: 'nohit800', text: 'Parcours 800 m sans être touché', stat: 'cleanDistance', goal: 800, reward: 350 },
  { id: 'powerups3', text: 'Ramasse 3 bonus en une course', stat: 'powerups', goal: 3, reward: 200 },
  { id: 'boss1', text: 'Bats le Dr. Eggman', stat: 'bossWins', goal: 1, reward: 600 },
  { id: 'slides25', text: 'Glisse 25 fois en une course', stat: 'slides', goal: 25, reward: 150 },
  { id: 'dist3000', text: 'Parcours 3 000 m en mode infini', stat: 'endlessDistance', goal: 3000, reward: 800 },
];

export const missionById = id => MISSIONS.find(m => m.id === id);

// Valeurs d'une course pour l'évaluation des missions.
export function runValues(run) {
  const s = run.stats;
  return {
    ...s,
    score: Math.round(s.score),
    distance: Math.round(s.distance),
    cleanDistance: s.hits === 0 ? Math.round(s.distance) : 0,
    bossWins: run.victory ? 1 : 0,
    endlessDistance: run.mode === 'endless' ? Math.round(s.distance) : 0,
  };
}

// Met à jour la liste active ; renvoie les missions accomplies pendant cette course.
export function evaluate(save, values) {
  const done = [];
  for (const id of save.missions.active) {
    const m = missionById(id);
    if (m && values[m.stat] >= m.goal) done.push(m);
  }
  for (const m of done) {
    save.missions.completed.push(m.id);
    save.totalRings += m.reward;
  }
  refill(save);
  return done;
}

export function refill(save) {
  save.missions.active = save.missions.active.filter(id => missionById(id) && !save.missions.completed.includes(id));
  for (const m of MISSIONS) {
    if (save.missions.active.length >= 3) break;
    if (!save.missions.completed.includes(m.id) && !save.missions.active.includes(m.id)) save.missions.active.push(m.id);
  }
}
