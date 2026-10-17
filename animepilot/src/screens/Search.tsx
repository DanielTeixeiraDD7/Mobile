import { useState } from 'react';
import { useStore } from '../data/store';
import { formatLabel, mediaTitle, statusLabel } from '../domain/labels';
import { entryId, type MediaType } from '../domain/types';
import { useOnline } from '../hooks/useOnline';
import { SEARCH_MIN_CHARS, useSearch } from '../hooks/useSearch';
import { goBack, navigate } from '../router';
import { add } from '../ui/actions';
import { Icon } from '../ui/icons';
import { Poster } from '../ui/Poster';

export function SearchScreen({ type }: { type: MediaType }) {
  const [text, setText] = useState('');
  const s = useSearch(type, text);
  const online = useOnline();
  const lang = useStore(st => st.settings.titleLanguage);
  const entries = useStore(st => st.entries);
  const tab = type === 'ANIME' ? 'anime' : 'manga';

  return (
    <>
      <header className="topbar">
        <button type="button" className="icon-btn back" onClick={() => goBack({ name: 'tab', tab })} aria-label="Retour"><Icon name="back" /></button>
        <h1>Rechercher {type === 'ANIME' ? 'un anime' : 'un manga'}</h1>
      </header>
      <div className="search">
        <Icon name="search" />
        <input className="input" type="search" autoFocus enterKeyHint="search" placeholder="Titre (romaji, anglais, japonais)"
          value={text} onChange={e => setText(e.target.value)} aria-label="Titre à rechercher" />
      </div>
      {!online && <div className="banner warn">Hors-ligne : seules les recherches déjà faites sont disponibles.</div>}
      {s.stale && <div className="banner warn">Résultats enregistrés (AniList injoignable).</div>}
      {s.status === 'error' && <div className="banner error" role="alert">{s.error}</div>}
      {s.status === 'idle' && <p className="muted small" style={{ marginTop: 16 }}>Tape au moins {SEARCH_MIN_CHARS} caractères. Catalogue : AniList.</p>}
      {s.status === 'loading' && <p className="muted small" style={{ marginTop: 16 }} aria-live="polite">Recherche…</p>}
      {s.status === 'done' && s.items.length === 0 && <p className="empty">Aucun résultat.</p>}

      <ul className="results">
        {s.items.map(m => {
          const title = mediaTitle(m, lang);
          const inLib = entries.find(e => e.id === entryId(m.type, m.id));
          const units = m.type === 'ANIME' ? (m.episodes ? `${m.episodes} ép.` : '') : m.chapters ? `${m.chapters} ch.` : '';
          return (
            <li key={m.id} className="result">
              <button type="button" className="entry-main" onClick={() => navigate({ name: 'media', type: m.type, id: m.id })}>
                <Poster src={m.cover} color={m.coverColor} title={title} size="sm" />
                <span className="grow">
                  <span className="entry-title clamp2">{title}</span>
                  <span className="small muted">{[formatLabel(m.format), m.startYear, units].filter(Boolean).join(' · ')}</span>
                  {inLib && <span className="small tag">{statusLabel(m.type, inLib.status)}</span>}
                </span>
              </button>
              {!inLib && (
                <button type="button" className="plus" onClick={() => void add(m, 'PLANNING')} aria-label={`Ajouter ${title} (${statusLabel(m.type, 'PLANNING')})`}>
                  <Icon name="plus" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {s.items.length > 0 && <p className="dim small">Données : AniList (anilist.co).</p>}
    </>
  );
}
