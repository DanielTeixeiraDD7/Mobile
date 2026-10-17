import { useMemo, useState } from 'react';
import { useStore } from '../data/store';
import { statusLabel } from '../domain/labels';
import { ENTRY_STATUSES, type EntryStatus, type MediaType } from '../domain/types';
import { navigate } from '../router';
import { EntryRow } from '../ui/EntryRow';
import { Icon } from '../ui/icons';

type Filter = EntryStatus | 'ALL';
const remembered: Partial<Record<MediaType, Filter>> = {};

const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function LibraryScreen({ type }: { type: MediaType }) {
  const all = useStore(s => s.entries);
  const lang = useStore(s => s.settings.titleLanguage);
  const entries = useMemo(() => all.filter(e => e.type === type), [all, type]);
  const counts = useMemo(() => {
    const c = Object.fromEntries(ENTRY_STATUSES.map(s => [s, 0])) as Record<EntryStatus, number>;
    for (const e of entries) c[e.status]++;
    return c;
  }, [entries]);
  const [filter, setFilterState] = useState<Filter>(() => remembered[type] ?? (counts.CURRENT ? 'CURRENT' : 'ALL'));
  const setFilter = (f: Filter) => { remembered[type] = f; setFilterState(f); };
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const nq = normalize(q.trim());
    return entries
      .filter(e => filter === 'ALL' || e.status === filter)
      .filter(e => !nq || [e.media.title.romaji, e.media.title.english, e.media.title.native].some(t => t && normalize(t).includes(nq)))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [entries, filter, q]);

  const label = type === 'ANIME' ? 'Anime' : 'Manga';
  return (
    <>
      <header className="topbar">
        <h1>{label}</h1>
        <button type="button" className="btn primary" onClick={() => navigate({ name: 'search', type })}>
          <Icon name="search" /> Rechercher
        </button>
      </header>

      {entries.length === 0 ? (
        <div className="empty">
          <div className="big">{type === 'ANIME' ? '📺' : '📚'}</div>
          <p>Aucun {type === 'ANIME' ? 'anime' : 'manga'} suivi.</p>
          <button type="button" className="btn primary" onClick={() => navigate({ name: 'search', type })}>Ajouter un titre</button>
        </div>
      ) : (
        <>
          <div className="chips" role="group" aria-label="Filtrer par statut">
            <button type="button" className="chip" aria-pressed={filter === 'ALL'} onClick={() => setFilter('ALL')}>Tous<span className="n">{entries.length}</span></button>
            {ENTRY_STATUSES.map(s => (
              <button key={s} type="button" className="chip" aria-pressed={filter === s} onClick={() => setFilter(s)}>
                {statusLabel(type, s)}<span className="n">{counts[s]}</span>
              </button>
            ))}
          </div>
          {entries.length > 6 && (
            <div className="search" style={{ margin: '4px 0 10px' }}>
              <Icon name="search" />
              <input className="input" type="search" placeholder="Filtrer ma liste" value={q} onChange={e => setQ(e.target.value)} aria-label="Filtrer ma liste" />
            </div>
          )}
          {list.length === 0
            ? <p className="empty">Aucun titre {filter === 'ALL' ? '' : `« ${statusLabel(type, filter)} »`}{q ? ' pour cette recherche' : ''}.</p>
            : <ul className="entries">{list.map(e => <EntryRow key={e.id} entry={e} lang={lang} showStatus={filter === 'ALL'} />)}</ul>}
        </>
      )}
    </>
  );
}
