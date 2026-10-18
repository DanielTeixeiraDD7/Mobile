import { useEffect } from 'react';
import { involvesFavorite } from './core/filters';
import { liveRefresh, loadFeed } from './data/feed';
import { useStore } from './data/store';
import { useResource } from './hooks/useResource';
import { schedule } from './reminders';
import { navigate, TABS, tabOf, useRoute, type Route, type Tab } from './router';
import { CompetitionScreen, CompetitionsScreen } from './screens/Competitions';
import { DataScreen } from './screens/Data';
import { FavoritesScreen } from './screens/Favorites';
import { GameScreen } from './screens/Game';
import { HomeScreen } from './screens/Home';
import { MatchesScreen } from './screens/Matches';
import { MatchScreen } from './screens/MatchScreen';
import { MoreScreen } from './screens/More';
import { Onboarding } from './screens/Onboarding';
import { SearchScreen } from './screens/Search';
import { SettingsScreen } from './screens/Settings';
import { SourcesScreen } from './screens/Sources';
import { TeamScreen } from './screens/Team';
import { PlayerScreen } from './screens/Player';
import { Banner } from './ui/common';
import { Icon, type IconName } from './ui/icons';
import { Toaster } from './ui/toast';

const TAB: Record<Tab, { label: string; icon: IconName }> = {
  home: { label: 'Accueil', icon: 'home' }, matches: { label: 'Matchs', icon: 'matches' }, competitions: { label: 'Compétitions', icon: 'trophy' },
  favorites: { label: 'Favoris', icon: 'star' }, more: { label: 'Plus', icon: 'more' },
};

function Screen({ r }: { r: Route }) {
  switch (r.name) {
    case 'match': return <MatchScreen key={r.id} id={r.id} />;
    case 'competition': return <CompetitionScreen key={r.id + r.tournament} id={r.id} tournament={r.tournament} />;
    case 'team': return <TeamScreen key={r.id} id={r.id} />;
    case 'player': return <PlayerScreen key={r.id} id={r.id} />;
    case 'game': return <GameScreen key={r.id} id={r.id} />;
    case 'search': return <SearchScreen />;
    case 'sources': return <SourcesScreen />;
    case 'settings': return <SettingsScreen />;
    case 'data': return <DataScreen />;
    case 'tab':
      switch (r.tab) {
        case 'home': return <HomeScreen />;
        case 'matches': return <MatchesScreen />;
        case 'competitions': return <CompetitionsScreen />;
        case 'favorites': return <FavoritesScreen />;
        case 'more': return <MoreScreen />;
      }
  }
}

/** Rappels locaux des matchs favoris (si activés) + pastille « direct » dans la barre. */
function useBackground() {
  const games = useStore(s => s.settings.games);
  const notify = useStore(s => s.settings.notify);
  const minutes = useStore(s => s.settings.reminderMinutes);
  const favorites = useStore(s => s.favorites);
  const onboarded = useStore(s => s.settings.onboarded);
  const feed = useResource(onboarded ? `feed:${games.join(',')}` : null, o => loadFeed(games, o), liveRefresh);
  useEffect(() => {
    if (!notify || !feed.data) { schedule([], minutes); return; }
    schedule(feed.data.matches.filter(m => involvesFavorite(m, favorites)), minutes);
  }, [notify, feed.data, favorites, minutes]);
  return feed.data?.matches.some(m => m.status === 'live') ?? false;
}

export function App() {
  const route = useRoute();
  const ready = useStore(s => s.ready);
  const error = useStore(s => s.error);
  const onboarded = useStore(s => s.settings.onboarded);
  const theme = useStore(s => s.settings.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f4f5f9' : '#07080d');
  }, [theme]);
  const live = useBackground();
  const active = tabOf(route);

  if (!ready) return <main className="app"><p className="muted" aria-live="polite">Chargement…</p></main>;
  if (!onboarded && !error) return <><Onboarding /><Toaster /></>;
  return (
    <>
      <main className="app" data-route={route.name}>
        {error && <Banner kind="error">{error}</Banner>}
        <Screen r={route} />
      </main>
      <Toaster />
      <nav className="tabbar" aria-label="Navigation principale">
        {TABS.map(t => (
          <button key={t} type="button" aria-current={t === active ? 'page' : undefined} onClick={() => navigate({ name: 'tab', tab: t }, true)}>
            {t === 'home' && live && <span className="dot-live" aria-label="Match en direct" />}
            <Icon name={TAB[t].icon} />
            <span>{TAB[t].label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
