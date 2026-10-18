import { navigate } from '../router';
import { TopBar } from '../ui/common';
import { Icon, type IconName } from '../ui/icons';
import { useStore } from '../data/store';
import { DEFS, COVERAGE_LABEL } from '../games/defs';

export const APP_VERSION = '1.0.0';

export function MoreScreen() {
  const games = useStore(s => s.settings.games);
  const items: { icon: IconName; label: string; sub: string; go: () => void }[] = [
    { icon: 'search', label: 'Recherche', sub: 'Équipes, compétitions, matchs', go: () => navigate({ name: 'search' }) },
    { icon: 'source', label: 'Sources et couverture', sub: 'État des API, limites, ce qui est disponible par jeu', go: () => navigate({ name: 'sources' }) },
    { icon: 'data', label: 'Données', sub: 'Sauvegarde, import CSV/JSON, saisie manuelle, export', go: () => navigate({ name: 'data' }) },
    { icon: 'settings', label: 'Réglages', sub: 'Thème, accueil, rappels, spoilers', go: () => navigate({ name: 'settings' }) },
  ];
  return (
    <>
      <TopBar title="Plus" />
      <div className="section"><h2>Jeux</h2><span className="count">{games.length} affiché{games.length > 1 ? 's' : ''}</span></div>
      <div className="grid two">
        {Object.values(DEFS).map(d => (
          <button key={d.id} type="button" className="gamecard" onClick={() => navigate({ name: 'game', id: d.id })}>
            <span className="sw" style={{ background: d.color }} />
            <span className="grow"><strong>{d.name}</strong><br /><span className={`cov ${d.coverage}`}>{COVERAGE_LABEL[d.coverage]}</span>{games.includes(d.id) && <span className="tiny dim"> · affiché</span>}</span>
            <Icon name="back" />
          </button>
        ))}
      </div>
      <div className="section"><h2>Outils</h2></div>
      <ul className="list card" style={{ padding: '0 14px' }}>
        {items.map(i => (
          <li key={i.label}><button type="button" onClick={i.go}><span className="icon-btn" style={{ background: 'var(--card-2)' }}><Icon name={i.icon} /></span><span className="grow"><strong>{i.label}</strong><br /><span className="small muted">{i.sub}</span></span></button></li>
        ))}
      </ul>
      <p className="tiny dim" style={{ marginTop: 18 }}>Esport Companion {APP_VERSION} · application personnelle, gratuite, sans compte, sans pub ni traceur. Non affiliée à Riot Games, Valve ou OpenDota.</p>
    </>
  );
}
