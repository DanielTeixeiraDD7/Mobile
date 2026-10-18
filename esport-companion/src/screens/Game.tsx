import { isFavorite, toggleFavorite, updateSettings, useStore } from '../data/store';
import { COVERAGE_LABEL, DEFS } from '../games/defs';
import { adapterOf } from '../games/registry';
import { goBack, navigate } from '../router';
import { Banner, Empty, FavButton, TopBar } from '../ui/common';
import { toast } from '../ui/toast';

const FEATURES: { key: keyof NonNullable<ReturnType<typeof adapterOf>>; label: string }[] = [
  { key: 'matches', label: 'Matchs récents et à venir' },
  { key: 'live', label: 'Matchs en direct' },
  { key: 'competitions', label: 'Liste des compétitions' },
  { key: 'competition', label: 'Classements / phases' },
  { key: 'team', label: 'Fiches équipes (roster)' },
  { key: 'searchTeams', label: "Recherche d'équipes" },
];

export function GameScreen({ id }: { id: string }) {
  const d = DEFS[id];
  const games = useStore(s => s.settings.games);
  useStore(s => s.favorites);
  const a = adapterOf(id);
  if (!d) return <><TopBar title="Jeu" back={() => goBack({ name: 'tab', tab: 'more' })} /><Empty icon="❓" title="Jeu inconnu" /></>;
  const shown = games.includes(id);
  return (
    <div style={{ ['--game' as string]: d.color }}>
      <TopBar title={d.name} back={() => goBack({ name: 'tab', tab: 'more' })}>
        <FavButton on={isFavorite(`game:${id}`)} label={d.name} onToggle={() => void toggleFavorite({ id: `game:${id}`, kind: 'game', game: id, name: d.name, image: null, link: `#/game/${id}` })} />
      </TopBar>
      <div className="card stack">
        <span className={`cov ${d.coverage}`} style={{ width: 'fit-content' }}>{COVERAGE_LABEL[d.coverage]}</span>
        <p style={{ margin: 0 }}>{d.note}</p>
        {a ? (
          <button type="button" className={`btn ${shown ? '' : 'primary'} block`} onClick={() => void updateSettings({ games: shown ? games.filter(g => g !== id) : [...games, id] }).then(() => toast(shown ? `${d.name} masqué de l'accueil.` : `${d.name} ajouté à l'accueil.`))}>
            {shown ? "Masquer de l'accueil" : "Afficher sur l'accueil"}
          </button>
        ) : <Banner kind="info">Aucune source gratuite active : tu peux importer des résultats (Plus → Données). Détails dans Sources.</Banner>}
      </div>
      {a && (
        <>
          <div className="section"><h2>Disponible</h2></div>
          <ul className="card list" style={{ padding: '0 14px' }}>
            {FEATURES.map(f => <li key={f.key}><span className="row" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}><span style={{ color: a[f.key] ? 'var(--win)' : 'var(--dim)' }}>{a[f.key] ? '✓' : '✕'}</span><span className="grow">{f.label}</span></span></li>)}
          </ul>
          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            {a.competitions && <button type="button" className="btn grow" onClick={() => navigate({ name: 'tab', tab: 'competitions' })}>Compétitions</button>}
            <button type="button" className="btn grow" onClick={() => navigate({ name: 'sources' })}>Sources</button>
          </div>
        </>
      )}
    </div>
  );
}
