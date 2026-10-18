import { useState } from 'react';
import { updateSettings } from '../data/store';
import { COVERAGE_LABEL, DEFS } from '../games/defs';
import { ADAPTERS } from '../games/registry';

export function Onboarding() {
  const [games, setGames] = useState<string[]>(Object.keys(ADAPTERS));
  const toggle = (g: string) => setGames(x => (x.includes(g) ? x.filter(y => y !== g) : [...x, g]));
  return (
    <main className="app" style={{ paddingBottom: 32 }}>
      <div style={{ textAlign: 'center', padding: '28px 0 10px' }}>
        <div style={{ fontSize: 54 }}>🎮</div>
        <h1 style={{ fontSize: 28, margin: '6px 0', letterSpacing: '-.02em' }}>Esport Companion</h1>
        <p className="muted" style={{ maxWidth: 460, margin: '0 auto' }}>Matchs en direct, résultats, compétitions et statistiques détaillées, depuis des sources gratuites et vérifiables. Rien d'inventé : ce qui n'est pas publié est indiqué comme tel.</p>
      </div>
      <p className="label">Jeux à suivre</p>
      <div className="stack">
        {Object.values(DEFS).filter(d => ADAPTERS[d.id]).map(d => (
          <button key={d.id} type="button" className="gamecard" aria-pressed={games.includes(d.id)} onClick={() => toggle(d.id)} style={games.includes(d.id) ? { borderColor: d.color } : undefined}>
            <span className="sw" style={{ background: d.color }} />
            <span className="grow"><strong>{d.name}</strong> <span className={`cov ${d.coverage}`}>{COVERAGE_LABEL[d.coverage]}</span><br /><span className="small muted">{d.note}</span></span>
            <span style={{ fontSize: 22 }}>{games.includes(d.id) ? '✓' : '+'}</span>
          </button>
        ))}
      </div>
      <p className="small muted">Autres jeux (CS2, Rocket League, R6…) : pas de source gratuite sans compte. Tu peux importer leurs résultats (Plus → Données). Détails dans Plus → Sources.</p>
      <div className="card small" style={{ margin: '12px 0' }}>
        🔒 Pas de compte, pas de pub, pas de traceur. Favoris et réglages restent sur ce téléphone. Les seules requêtes réseau vont aux sources de données (Riot, OpenDota).
      </div>
      <button type="button" className="btn primary block" disabled={!games.length} onClick={() => void updateSettings({ games, onboarded: true })}>Commencer</button>
    </main>
  );
}
