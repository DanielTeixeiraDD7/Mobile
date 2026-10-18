import { useMemo, useState } from 'react';
import { byDay, DEFAULT_FILTERS, filterMatches, sortMatches } from '../core/filters';
import { matchesToCsv } from '../core/csv';
import type { MatchFilters } from '../data/db';
import { liveRefresh, loadFeed } from '../data/feed';
import { deleteView, saveView, useStore } from '../data/store';
import { DEFS } from '../games/defs';
import { useResource } from '../hooks/useResource';
import { Banner, Empty, Freshness, MatchCard, Skeletons, TopBar } from '../ui/common';
import { download } from '../ui/files';
import { dayLabel } from '../ui/format';
import { Icon } from '../ui/icons';
import { Sheet } from '../ui/Sheet';
import { toast } from '../ui/toast';

let remembered: MatchFilters = DEFAULT_FILTERS;

export function MatchesScreen() {
  const games = useStore(s => s.settings.games);
  const favorites = useStore(s => s.favorites);
  const views = useStore(s => s.views);
  const feed = useResource(`feed:${games.join(',')}`, o => loadFeed(games, o), liveRefresh);
  const [f, setF] = useState<MatchFilters>(remembered);
  const [naming, setNaming] = useState(false);
  const upd = (p: Partial<MatchFilters>) => setF(x => (remembered = { ...x, ...p }));
  const [now] = useState(() => Date.now());

  const all = feed.data?.matches ?? [];
  const comps = useMemo(() => [...new Map(all.filter(m => m.competition && (!f.games.length || f.games.includes(m.game))).map(m => [m.competition!.id, m.competition!])).values()].sort((a, b) => a.name.localeCompare(b.name)), [all, f.games]);
  const list = useMemo(() => sortMatches(filterMatches(all, f, favorites, now)), [all, f, favorites, now]);
  const live = list.filter(m => m.status === 'live');
  const rest = list.filter(m => m.status !== 'live');
  const upcoming = byDay(rest.filter(m => m.status === 'upcoming'));
  const past = byDay(rest.filter(m => m.status !== 'upcoming'));

  return (
    <>
      <TopBar title="Matchs" sub={`${list.length} match${list.length > 1 ? 's' : ''}`}>
        <button type="button" className="icon-btn" aria-label="Exporter cette liste en CSV" disabled={!list.length}
          onClick={() => { download(matchesToCsv(list), `matchs-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8'); toast(`${list.length} matchs exportés.`); }}>
          <Icon name="data" />
        </button>
      </TopBar>

      {views.length > 0 && (
        <div className="chips" aria-label="Vues enregistrées">
          {views.map(v => (
            <button key={v.id} type="button" className="chip" onClick={() => setF(remembered = v.filters)} onContextMenu={e => { e.preventDefault(); void deleteView(v.id); toast(`Vue « ${v.name} » supprimée.`); }}>★ {v.name}</button>
          ))}
        </div>
      )}
      <div className="search" style={{ marginBottom: 8 }}>
        <Icon name="search" />
        <input className="input" type="search" placeholder="Équipe, compétition…" value={f.text} onChange={e => upd({ text: e.target.value })} aria-label="Rechercher un match" />
      </div>
      <div className="chips" role="group" aria-label="Jeux">
        {games.map(g => (
          <button key={g} type="button" className="chip" aria-pressed={f.games.includes(g)} onClick={() => upd({ games: f.games.includes(g) ? f.games.filter(x => x !== g) : [...f.games, g], competition: null })}>
            <span className="sw" style={{ background: DEFS[g]?.color }} />{DEFS[g]?.short}
          </button>
        ))}
        <button type="button" className="chip" aria-pressed={f.favoritesOnly} onClick={() => upd({ favoritesOnly: !f.favoritesOnly })}>★ Favoris</button>
      </div>
      <div className="row wrap" style={{ gap: 8, marginBottom: 6 }}>
        <select className="input" style={{ flex: '1 1 140px' }} value={f.status} onChange={e => upd({ status: e.target.value as MatchFilters['status'] })} aria-label="Statut">
          <option value="all">Tous les statuts</option><option value="live">En direct</option><option value="upcoming">À venir</option><option value="finished">Terminés</option>
        </select>
        <select className="input" style={{ flex: '2 1 180px' }} value={f.competition ?? ''} onChange={e => upd({ competition: e.target.value || null })} aria-label="Compétition">
          <option value="">Toutes les compétitions</option>
          {comps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" style={{ flex: '1 1 120px' }} value={f.days} onChange={e => upd({ days: Number(e.target.value) })} aria-label="Période">
          {[1, 3, 7, 14, 30].map(d => <option key={d} value={d}>± {d} jour{d > 1 ? 's' : ''}</option>)}
        </select>
        <button type="button" className="btn small" onClick={() => setNaming(true)}>Enregistrer la vue</button>
      </div>
      <Freshness fetchedAt={feed.fetchedAt} stale={feed.stale} loading={feed.loading} onRefresh={feed.refresh} />
      {feed.error && <Banner kind="error">{feed.error}</Banner>}
      {feed.data?.status.filter(s => s.error).map(s => <Banner key={s.game} kind="warn">{DEFS[s.game]?.name} : {s.error}</Banner>)}

      {!feed.data && feed.loading ? <Skeletons n={5} /> : list.length === 0 ? (
        <Empty icon="🔎" title="Aucun match pour ces filtres"><button type="button" className="btn" onClick={() => setF(remembered = DEFAULT_FILTERS)}>Réinitialiser les filtres</button></Empty>
      ) : (
        <>
          {live.length > 0 && <><div className="section"><h2><span className="status live">●</span> En direct</h2></div><div className="mlist">{live.map(m => <MatchCard key={m.id} m={m} now={now} />)}</div></>}
          {upcoming.map(d => <section key={'u' + d.day}><div className="section"><h2>{d.day ? dayLabel(d.day) : 'Date inconnue'}</h2><span className="count">{d.matches.length}</span></div><div className="mlist">{d.matches.map(m => <MatchCard key={m.id} m={m} now={now} />)}</div></section>)}
          {past.length > 0 && <div className="section"><h2>Résultats</h2></div>}
          {past.map(d => <section key={'p' + d.day}><p className="label" style={{ margin: '14px 0 8px' }}>{d.day ? dayLabel(d.day) : 'Date inconnue'}</p><div className="mlist">{d.matches.map(m => <MatchCard key={m.id} m={m} now={now} />)}</div></section>)}
        </>
      )}
      {naming && <NameView onClose={() => setNaming(false)} onSave={name => { void saveView({ id: crypto.randomUUID?.() ?? String(Date.now()), name, filters: f }); setNaming(false); toast(`Vue « ${name} » enregistrée (appui long pour supprimer).`); }} />}
    </>
  );
}

function NameView({ onClose, onSave }: { onClose: () => void; onSave: (n: string) => void }) {
  const [n, setN] = useState('');
  return (
    <Sheet title="Enregistrer ces filtres" onClose={onClose}>
      <form className="stack" onSubmit={e => { e.preventDefault(); if (n.trim()) onSave(n.trim()); }}>
        <input className="input" autoFocus maxLength={30} placeholder="Ex. LEC + favoris" value={n} onChange={e => setN(e.target.value)} aria-label="Nom de la vue" />
        <button type="submit" className="btn primary block" disabled={!n.trim()}>Enregistrer</button>
      </form>
    </Sheet>
  );
}
