import { useMemo, useState } from 'react';
import { involvesFavorite, sortMatches } from '../core/filters';
import { liveRefresh, loadFeed } from '../data/feed';
import { toggleFavorite, useStore } from '../data/store';
import type { Favorite } from '../data/db';
import { useResource } from '../hooks/useResource';
import { navigate, parseRoute } from '../router';
import { Empty, GameBadge, Logo, MatchCard, TopBar } from '../ui/common';
import { relative } from '../ui/format';
import { Icon } from '../ui/icons';
import { toast } from '../ui/toast';

const KIND: Record<Favorite['kind'], string> = { team: 'Équipes', player: 'Joueurs', competition: 'Compétitions', game: 'Jeux' };

function open(f: Favorite) {
  if (f.link) return navigate(parseRoute(f.link));
  if (f.kind === 'team') navigate({ name: 'team', id: f.id });
  else if (f.kind === 'competition') navigate({ name: 'competition', id: f.id, tournament: null });
  else if (f.kind === 'game') navigate({ name: 'game', id: f.id });
}

export function FavoritesScreen() {
  const favorites = useStore(s => s.favorites);
  const viewed = useStore(s => s.viewed);
  const games = useStore(s => s.settings.games);
  const feed = useResource(`feed:${games.join(',')}`, o => loadFeed(games, o), liveRefresh);
  const [now] = useState(() => Date.now());
  const fmatches = useMemo(() => sortMatches((feed.data?.matches ?? []).filter(m => involvesFavorite(m, favorites) && (m.status === 'live' || m.status === 'upcoming'))).slice(0, 12), [feed.data, favorites]);

  return (
    <>
      <TopBar title="Favoris" />
      {favorites.length === 0 ? (
        <Empty icon="⭐" title="Aucun favori">
          <p className="small">Touche ★ sur une équipe, un joueur ou une compétition. Leurs matchs apparaîtront sur l'accueil et ici.</p>
          <button type="button" className="btn primary" onClick={() => navigate({ name: 'search' })}>Chercher une équipe</button>
        </Empty>
      ) : (
        <>
          {fmatches.length > 0 && <><div className="section"><h2>Prochains matchs</h2></div><div className="mlist">{fmatches.map(m => <MatchCard key={m.id} m={m} now={now} />)}</div></>}
          {(Object.keys(KIND) as Favorite['kind'][]).map(k => {
            const list = favorites.filter(f => f.kind === k).sort((a, b) => a.name.localeCompare(b.name));
            if (!list.length) return null;
            return (
              <section key={k}>
                <div className="section"><h2>{KIND[k]}</h2><span className="count">{list.length}</span></div>
                <ul className="list card" style={{ padding: '0 14px' }}>
                  {list.map(f => (
                    <li key={f.id} className="row">
                      <button type="button" className="grow" onClick={() => open(f)} disabled={k === 'player' && !f.link}>
                        <Logo src={f.image} name={f.name} size="m" />
                        <span className="grow ellipsis"><strong>{f.name}</strong></span>
                        <GameBadge game={f.game} />
                      </button>
                      <button type="button" className="icon-btn on" aria-label={`Retirer ${f.name}`} onClick={() => void toggleFavorite(f).then(() => toast(`${f.name} retiré des favoris.`))}><Icon name="starFill" /></button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
      {viewed.length > 0 && (
        <>
          <div className="section"><h2>Consultés récemment</h2></div>
          <ul className="list card" style={{ padding: '0 14px' }}>
            {viewed.slice(0, 15).map(v => (
              <li key={v.id}>
                <button type="button" onClick={() => navigate({ name: 'match', id: v.id })}>
                  <GameBadge game={v.match.game} />
                  <span className="grow ellipsis">{v.match.sides[0].team?.name ?? '?'} vs {v.match.sides[1].team?.name ?? '?'}</span>
                  <span className="tiny dim">{relative(v.at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="tiny dim" style={{ marginTop: 16 }}>Favoris enregistrés uniquement sur cet appareil.</p>
    </>
  );
}
