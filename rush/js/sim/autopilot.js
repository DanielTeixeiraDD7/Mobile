// Pilote automatique : suit le chemin sûr calculé par le validateur et esquive les attaques du boss.
// Sert aux tests automatiques (preuve que chaque segment généré est franchissable avec la vraie physique)
// et au mode démo.
export function createAutopilot(run, { useBoost = false } = {}) {
  return function decide() {
    const p = run.player;
    const actions = [];
    if (p.dead || run.status !== 'playing') return actions;
    const v = run.speed;
    const steer = lane => {
      if (lane > p.targetLane) actions.push('right');
      else if (lane < p.targetLane) actions.push('left');
    };

    if (useBoost && run.power.meter >= 1) actions.push('boost');

    const boss = run.boss;
    if (boss && boss.phase !== 'approach') {
      if (boss.phase === 'swoop' || boss.phase === 'swoopWarn') {
        steer(boss.targetLane);
        if (boss.phase === 'swoop' && p.grounded && boss.z <= v * 0.12 + 2 && boss.z > 0) actions.push('up');
        return actions;
      }
      const danger = new Set(boss.telegraph?.lanes ?? []);
      for (const e of run.entities) if (e.alive && (e.kind === 'missile' || e.kind === 'bomb') && e.z > -1.5 && e.z < 45) danger.add(e.lane);
      if (danger.has(p.targetLane)) {
        const safe = [0, 1, 2].filter(l => !danger.has(l)).sort((a, b) => Math.abs(a - p.lane) - Math.abs(b - p.lane));
        if (safe.length) steer(safe[0]);
      }
      return actions;
    }

    // Une ligne n'est dépassée qu'une fois l'obstacle le plus long (1,6 m) derrière le joueur.
    const next = run.plan.filter(r => r.z > -2.1).sort((a, b) => a.z - b.z)[0];
    if (!next) { steer(1); return actions; }
    steer(next.lane);
    if (p.lane !== next.lane) return actions;
    if (next.action === 'jump' && p.grounded) {
      const isGap = next.gapEnd[next.lane] != null;
      const trigger = isGap ? 0.9 : v * 0.16 + 0.6;
      if (next.z <= trigger) actions.push('up');
    } else if (next.action === 'slide' && p.grounded && p.slideT <= 0.05) {
      if (next.z <= v * 0.18 + 0.6) actions.push('down');
    }
    return actions;
  };
}
