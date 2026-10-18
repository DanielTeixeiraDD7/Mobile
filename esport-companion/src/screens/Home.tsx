import { useMemo, useState } from 'react';
import { dashboard } from '../core/filters';
import { liveRefresh, loadFeed } from '../data/feed';
import { useStore } from '../data/store';
import type { Section } from '../data/db';
import { DEFS } from '../games/defs';
import { useResource } from '../hooks/useResource';
import { navigate } from '../router';
import { Banner, Empty, Freshness, MatchCard, Skeletons, TopBar } from '../ui/common';
import { Icon } from '../ui/icons';
import type { Match } from '../core/model';

const TITLES: Record<Section, string> = { live: 'En direct', favorites: 'Mes favoris', upcoming: 'À venir', results: 'Résultats récents' };
const LIMIT = 9;

export function HomeScreen() {
  const games = useStore(s => s.settings.games);
  const sections = useStore(s => s.settings.sections);
  const favorites = useStore(s => s.favorites);
  const [only, setOnly] = useState<string | null>(null);
  const feed = useResource(`feed:${games.join(',')}`, o => loadFeed(games, o), liveRefresh);
  const [now] = useState(() => Date.now());

  const list = useMemo(() => (feed.data?.matches ?? []).filter(m => !only || m.game === only), [feed.data, only]);
  const dash = useMemo(() => dashboard(list, favorites, now), [list, favorites, now]);

  const body: Record<Section, Match[]> = { live: dash.live, favorites: dash.favorites, upcoming: dash.upcoming, results: dash.results };
  const empty: Record<Section, string> = {
    live: 'Aucun match en direct pour le moment.',
    favorites: favorites.length ? 'Aucun match de tes favoris cette semaine.' : 'Ajoute des équipes ou compétitions en favori (★) pour les retrouver ici.',
    upcoming: 'Aucun match prévu dans les 3 prochains jours pour les compétitions suivies.',
    results: 'Aucun résultat ces 4 derniers jours.',
  };

  return (
    <>
      <TopBar title="Esport Companion">
        <button type="button" className="icon-btn" onClick={() => navigate({ name: 'search' })} aria-label="Rechercher"><Icon name="search" /></button>
      </TopBar>
      <div className="chips" role="group" aria-label="Filtrer par jeu">
        <button type="button" className="chip" aria-pressed={!only} onClick={() => setOnly(null)}>Tous</button>
        {games.map(g => (
          <button key={g} type="button" className="chip" aria-pressed={only === g} onClick={() => setOnly(only === g ? null : g)}>
            <span className="sw" style={{ background: DEFS[g]?.color }} />{DEFS[g]?.short ?? g}
          </button>
        ))}
      </div>
      <Freshness fetchedAt={feed.fetchedAt} stale={feed.stale} loading={feed.loading} onRefresh={feed.refresh} />
      {feed.error && <Banner kind="error">{feed.error}</Banner>}
      {feed.data?.status.filter(s => s.error && (!only || s.game === only)).map(s => (
        <Banner key={s.game} kind="warn">{DEFS[s.game]?.name} : {s.error} Les autres jeux restent affichés.</Banner>
      ))}
      {games.length === 0 && <Empty icon="🎮" title="Aucun jeu sélectionné"><button type="button" className="btn primary" onClick={() => navigate({ name: 'tab', tab: 'more' })}>Choisir des jeux</button></Empty>}

      {!feed.data && feed.loading ? <Skeletons n={4} /> : sections.map(sec => {
        const items = body[sec];
        if (sec === 'live' && items.length === 0) return null;
        return (
          <section key={sec} aria-labelledby={`h-${sec}`}>
            <div className="section">
              <h2 id={`h-${sec}`}>{sec === 'live' && <span className="status live">●</span>}{TITLES[sec]} <span className="count">{items.length || ''}</span></h2>
              {items.length > LIMIT && <button type="button" className="link-btn" onClick={() => navigate({ name: 'tab', tab: 'matches' })}>Tout voir</button>}
            </div>
            {items.length === 0 ? <p className="muted small">{empty[sec]}</p> : <div className="mlist">{items.slice(0, LIMIT).map(m => <MatchCard key={m.id} m={m} now={now} />)}</div>}
          </section>
        );
      })}
      <p className="dim tiny" style={{ marginTop: 22 }}>Données : LoL Esports, VALORANT Esports (Riot, non officiel), OpenDota. Horaires dans ton fuseau ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
    </>
  );
}
