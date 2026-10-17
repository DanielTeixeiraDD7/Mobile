import { TABS, navigate, tabOf, useRoute, type Route, type Tab } from './router';
import { useStore } from './data/store';
import { Icon } from './ui/icons';
import { Toaster } from './ui/toast';
import { HomeScreen } from './screens/Home';
import { LibraryScreen } from './screens/Library';
import { CalendarScreen } from './screens/Calendar';
import { ProfileScreen } from './screens/Profile';
import { SearchScreen } from './screens/Search';
import { MediaDetailScreen } from './screens/MediaDetail';

const TAB_LABELS: Record<Tab, string> = { home: 'Accueil', anime: 'Anime', manga: 'Manga', calendar: 'Calendrier', profile: 'Profil' };

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'media': return <MediaDetailScreen key={`${route.type}${route.id}`} type={route.type} id={route.id} />;
    case 'search': return <SearchScreen key={route.type} type={route.type} />;
    case 'tab':
      switch (route.tab) {
        case 'home': return <HomeScreen />;
        case 'anime': return <LibraryScreen key="a" type="ANIME" />;
        case 'manga': return <LibraryScreen key="m" type="MANGA" />;
        case 'calendar': return <CalendarScreen />;
        case 'profile': return <ProfileScreen />;
      }
  }
  return <ProfileScreen />;
}

export function App() {
  const route = useRoute();
  const ready = useStore(s => s.ready);
  const error = useStore(s => s.error);
  const active = tabOf(route);
  return (
    <>
      <main className="app" data-route={route.name}>
        {error && <div className="banner error" role="alert">{error}</div>}
        {ready ? <Screen route={route} /> : <p className="muted" aria-live="polite">Chargement…</p>}
      </main>
      <Toaster />
      <nav className="tabbar" aria-label="Navigation principale">
        {TABS.map(tab => (
          <button key={tab} type="button" aria-current={tab === active ? 'page' : undefined}
            onClick={() => navigate({ name: 'tab', tab }, true)}>
            <Icon name={tab} />
            <span>{TAB_LABELS[tab]}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
