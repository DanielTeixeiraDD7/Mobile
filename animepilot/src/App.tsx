import { TABS, navigate, tabOf, useRoute, type Route, type Tab } from './router';
import { Icon } from './ui/icons';
import { HomeScreen } from './screens/Home';
import { LibraryScreen } from './screens/Library';
import { CalendarScreen } from './screens/Calendar';
import { ProfileScreen } from './screens/Profile';

const TAB_LABELS: Record<Tab, string> = { home: 'Accueil', anime: 'Anime', manga: 'Manga', calendar: 'Calendrier', profile: 'Profil' };

function Screen({ route }: { route: Route }) {
  if (route.name === 'tab') {
    switch (route.tab) {
      case 'home': return <HomeScreen />;
      case 'anime': return <LibraryScreen type="ANIME" />;
      case 'manga': return <LibraryScreen type="MANGA" />;
      case 'calendar': return <CalendarScreen />;
      case 'profile': return <ProfileScreen />;
    }
  }
  return <HomeScreen />;
}

export function App() {
  const route = useRoute();
  const active = tabOf(route);
  return (
    <>
      <main className="app" data-route={route.name}>
        <Screen route={route} />
      </main>
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
