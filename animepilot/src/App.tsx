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
import { DataScreen } from './screens/Data';
import { SettingsScreen } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';
import { useEffect } from 'react';
import { useAiring } from './hooks/useAiring';
import { scheduleInApp } from './reminders';

/** Programme les notifications locales quand elles sont activées. */
function ReminderScheduler() {
  const airing = useAiring();
  const settings = useStore(s => s.settings);
  useEffect(() => { scheduleInApp(airing.rows, settings); }, [airing.rows, settings]);
  return null;
}

const TAB_LABELS: Record<Tab, string> = { home: 'Accueil', anime: 'Anime', manga: 'Manga', calendar: 'Calendrier', profile: 'Profil' };

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'media': return <MediaDetailScreen key={`${route.type}${route.id}`} type={route.type} id={route.id} />;
    case 'search': return <SearchScreen key={route.type} type={route.type} />;
    case 'data': return <DataScreen />;
    case 'settings': return <SettingsScreen />;
    case 'tab':
      switch (route.tab) {
        case 'home': return <HomeScreen />;
        case 'anime': return <LibraryScreen key="a" type="ANIME" />;
        case 'manga': return <LibraryScreen key="m" type="MANGA" />;
        case 'calendar': return <CalendarScreen />;
        case 'profile': return <ProfileScreen />;
      }
  }
}

export function App() {
  const route = useRoute();
  const ready = useStore(s => s.ready);
  const error = useStore(s => s.error);
  const notify = useStore(s => s.settings.notify);
  const onboarded = useStore(s => s.settings.onboarded);
  const active = tabOf(route);
  if (ready && !error && !onboarded) return <><Onboarding /><Toaster /></>;
  return (
    <>
      <main className="app" data-route={route.name}>
        {error && <div className="banner error" role="alert">{error}</div>}
        {ready ? <Screen route={route} /> : <p className="muted" aria-live="polite">Chargement…</p>}
      </main>
      <Toaster />
      {ready && notify && <ReminderScheduler />}
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
