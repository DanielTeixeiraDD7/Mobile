import { useMemo, useState } from 'react';
import { useStore } from '../data/store';
import { insights } from '../domain/assistant';
import { formatAiring } from '../domain/calendar';
import { mediaTitle } from '../domain/labels';
import { useOnline } from '../hooks/useOnline';
import { navigate } from '../router';
import { setStatus } from '../ui/actions';
import { EntryRow } from '../ui/EntryRow';
import { Icon } from '../ui/icons';
import { Poster } from '../ui/Poster';

const greeting = (h: number) => (h < 6 ? 'Bonne nuit' : h < 18 ? 'Bonjour' : 'Bonsoir');

export function HomeScreen() {
  const entries = useStore(s => s.entries);
  const history = useStore(s => s.history);
  const lang = useStore(s => s.settings.titleLanguage);
  const online = useOnline();
  const [now] = useState(() => Date.now());
  const [hidden, setHidden] = useState<string[]>([]);

  const tips = useMemo(() => insights({ entries, history, lang, now }).filter(t => !hidden.includes(t.id)).slice(0, 4), [entries, history, lang, now, hidden]);
  const current = (type: 'ANIME' | 'MANGA') => entries
    .filter(e => e.type === type && (e.status === 'CURRENT' || e.status === 'REWATCH'))
    .sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const soon = entries
    .filter(e => e.type === 'ANIME' && e.status !== 'DROPPED' && e.status !== 'COMPLETED' && e.media.nextAiring && e.media.nextAiring.airingAt * 1000 > now && e.media.nextAiring.airingAt * 1000 - now < 36 * 3600_000)
    .sort((a, b) => a.media.nextAiring!.airingAt - b.media.nextAiring!.airingAt);
  const anime = current('ANIME');
  const manga = current('MANGA');

  return (
    <>
      <header className="topbar">
        <h1>{greeting(new Date(now).getHours())}</h1>
        {!online && <span className="offline-pill">Hors-ligne</span>}
      </header>

      {entries.length === 0 ? (
        <div className="empty">
          <div className="big">✨</div>
          <p>Ta bibliothèque est vide. Ajoute tes anime et manga pour suivre ta progression.</p>
          <div className="stack">
            <button type="button" className="btn primary block" onClick={() => navigate({ name: 'search', type: 'ANIME' })}>Ajouter un anime</button>
            <button type="button" className="btn block" onClick={() => navigate({ name: 'search', type: 'MANGA' })}>Ajouter un manga</button>
            <button type="button" className="btn ghost block" onClick={() => navigate({ name: 'data' })}>Importer une sauvegarde</button>
          </div>
        </div>
      ) : (
        <>
          {tips.length > 0 && (
            <ul className="tips">
              {tips.map(t => {
                const e = t.entryId ? entries.find(x => x.id === t.entryId) : undefined;
                return (
                  <li key={t.id} className="card tip">
                    <Icon name="spark" />
                    <div className="grow">
                      <p>{t.text}</p>
                      <div className="row">
                        {e && <button type="button" className="link-btn" onClick={() => navigate({ name: 'media', type: e.type, id: e.mediaId })}>Ouvrir</button>}
                        {e && t.action && <button type="button" className="link-btn" onClick={() => void setStatus(e, t.action!.status)}>{t.action.label}</button>}
                      </div>
                    </div>
                    <button type="button" className="icon-btn" aria-label="Masquer ce conseil" onClick={() => setHidden(h => [...h, t.id])}><Icon name="close" /></button>
                  </li>
                );
              })}
            </ul>
          )}

          {soon.length > 0 && (
            <>
              <div className="section"><h2>Bientôt</h2><button type="button" className="link" onClick={() => navigate({ name: 'tab', tab: 'calendar' })}>Calendrier</button></div>
              <ul className="hscroll">
                {soon.map(e => {
                  const title = mediaTitle(e.media, lang);
                  return (
                    <li key={e.id}>
                      <button type="button" className="mini" onClick={() => navigate({ name: 'media', type: e.type, id: e.mediaId })}>
                        <Poster src={e.media.cover} color={e.media.coverColor} title={title} />
                        <span className="clamp2 small">{title}</span>
                        <span className="small accent">Ép. {e.media.nextAiring!.episode} · {formatAiring(e.media.nextAiring!.airingAt, now)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <div className="section"><h2>Anime en cours</h2><button type="button" className="link" onClick={() => navigate({ name: 'tab', tab: 'anime' })}>Tout voir</button></div>
          {anime.length ? <ul className="entries">{anime.map(e => <EntryRow key={e.id} entry={e} lang={lang} />)}</ul> : <p className="muted small">Aucun anime en cours.</p>}

          <div className="section"><h2>Manga en cours</h2><button type="button" className="link" onClick={() => navigate({ name: 'tab', tab: 'manga' })}>Tout voir</button></div>
          {manga.length ? <ul className="entries">{manga.map(e => <EntryRow key={e.id} entry={e} lang={lang} />)}</ul> : <p className="muted small">Aucun manga en cours.</p>}
        </>
      )}
    </>
  );
}
