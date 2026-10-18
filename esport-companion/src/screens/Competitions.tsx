import { useMemo, useState } from 'react';
import { bracketRounds, sortMatches } from '../core/filters';
import type { Competition, CompetitionDetail, Match } from '../core/model';
import { getState, isFavorite, toggleFavorite, updateSettings, useStore } from '../data/store';
import { DEFS } from '../games/defs';
import { adapterOf, lol, valorant } from '../games/registry';
import { useResource } from '../hooks/useResource';
import { goBack, navigate } from '../router';
import { Banner, Empty, FavButton, Freshness, Logo, MatchCard, ProvTag, Skeletons, TopBar } from '../ui/common';
import { Icon } from '../ui/icons';
import { toast } from '../ui/toast';

const RIOT: Record<string, typeof lol> = { lol, valorant };

/** Liste suivie (accueil) pour les jeux Riot : choix explicite, sinon défaut de la source. */
async function toggleFollow(game: string, slug: string, all: Competition[]) {
  const cur = getState().settings.followed[game] ?? all.filter(c => c.priority <= 1).map(c => c.id.slice(game.length + 1));
  const next = cur.includes(slug) ? cur.filter(x => x !== slug) : [...cur, slug];
  await updateSettings({ followed: { ...getState().settings.followed, [game]: next } });
  return next.includes(slug);
}

export function CompetitionsScreen() {
  const games = useStore(s => s.settings.games).filter(g => adapterOf(g)?.competitions);
  const [game, setGame] = useState(games[0] ?? 'lol');
  const [q, setQ] = useState('');
  const followed = useStore(s => s.settings.followed[game]);
  useStore(s => s.favorites);
  const r = useResource(`comps:${game}`, o => adapterOf(game)!.competitions!(o));
  const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const list = useMemo(() => (r.data ?? []).filter(c => !q || norm(c.name).includes(norm(q))).sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name)), [r.data, q]);
  const isFollowed = (c: Competition) => (followed ? followed.includes(c.id.slice(game.length + 1)) : c.priority <= 1);

  return (
    <>
      <TopBar title="Compétitions" />
      <div className="chips" role="tablist">
        {games.map(g => <button key={g} type="button" className="chip" aria-pressed={g === game} onClick={() => setGame(g)}><span className="sw" style={{ background: DEFS[g]?.color }} />{DEFS[g]?.short}</button>)}
      </div>
      <div className="search" style={{ marginBottom: 6 }}><Icon name="search" /><input className="input" type="search" placeholder="Filtrer" value={q} onChange={e => setQ(e.target.value)} aria-label="Filtrer les compétitions" /></div>
      <Freshness fetchedAt={r.fetchedAt} stale={r.stale} loading={r.loading} onRefresh={r.refresh} />
      {r.error && <Banner kind="error">{r.error}</Banner>}
      {RIOT[game] && <p className="small muted">✓ = affichée sur l'accueil et dans Matchs. ★ = favori.</p>}
      {game === 'dota2' && <p className="small muted">Ligues pro et premium connues d'OpenDota (150 plus récentes). L'accueil Dota montre toutes les parties pros récentes.</p>}
      {!r.data && r.loading ? <Skeletons /> : list.length === 0 ? <Empty icon="🏆" title="Aucune compétition" /> : (
        <ul className="list card" style={{ padding: '0 14px' }}>
          {list.map(c => (
            <li key={c.id} className="row">
              <button type="button" className="grow" onClick={() => navigate({ name: 'competition', id: c.id, tournament: null })}>
                <Logo src={c.image} name={c.name} size="m" />
                <span className="grow"><strong>{c.name}</strong>{c.region && <><br /><span className="small dim">{c.region}</span></>}</span>
              </button>
              {RIOT[game] && (
                <button type="button" className={`icon-btn ${isFollowed(c) ? '' : 'dim'}`} aria-pressed={isFollowed(c)} aria-label={`${isFollowed(c) ? 'Ne plus suivre' : 'Suivre'} ${c.name} sur l'accueil`}
                  onClick={() => void toggleFollow(game, c.id.slice(game.length + 1), r.data ?? []).then(on => toast(on ? `${c.name} affichée sur l'accueil.` : `${c.name} retirée de l'accueil.`))}>
                  <span style={{ fontWeight: 800, color: isFollowed(c) ? 'var(--accent-2)' : 'var(--dim)' }}>{isFollowed(c) ? '✓' : '+'}</span>
                </button>
              )}
              <FavButton on={isFavorite(c.id)} label={c.name} onToggle={() => void toggleFavorite({ id: c.id, kind: 'competition', game, name: c.name, image: c.image })} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function CompetitionScreen({ id, tournament }: { id: string; tournament: string | null }) {
  const game = id.split(':')[0]!;
  const adapter = adapterOf(game);
  useStore(s => s.favorites);
  const r = useResource<CompetitionDetail>(adapter?.competition ? `comp:${id}:${tournament ?? ''}` : null, o => adapter!.competition!(id, tournament, o));
  const [stageIdx, setStageIdx] = useState<number | null>(null);
  const back = () => goBack({ name: 'tab', tab: 'competitions' });
  if (!adapter?.competition) return <><TopBar title="Compétition" back={back} /><Empty icon="🏆" title="Pas de données pour ce jeu" /></>;
  const d = r.data;
  const stages = d?.stages ?? [];
  const live = stages.findIndex(s => s.sections.some(x => x.matches.some(m => m.status === 'live' || m.status === 'upcoming')));
  const si = stageIdx ?? (live >= 0 ? live : Math.max(0, stages.length - 1));
  const stage = stages[si];

  return (
    <div style={{ ['--game' as string]: DEFS[game]?.color }}>
      <TopBar title={d?.competition.name ?? 'Compétition'} sub={DEFS[game]?.name} back={back}>
        {d && <FavButton on={isFavorite(id)} label={d.competition.name} onToggle={() => void toggleFavorite({ id, kind: 'competition', game, name: d.competition.name, image: d.competition.image })} />}
      </TopBar>
      <Freshness fetchedAt={r.fetchedAt} stale={r.stale} loading={r.loading} onRefresh={r.refresh} />
      {r.error && <Banner kind="error">{r.error}</Banner>}
      {!d ? <Skeletons n={4} /> : (
        <>
          <div className="comp-head">
            <Logo src={d.competition.image} name={d.competition.name} size="l" />
            <div className="grow">
              {d.competition.region && <p className="small muted" style={{ margin: 0 }}>{d.competition.region}</p>}
              {d.tournament && <p style={{ margin: '2px 0' }}><strong>{d.tournament.name}</strong>{d.tournament.startDate && <span className="small muted"> · {fmtDate(d.tournament.startDate)} → {fmtDate(d.tournament.endDate)}</span>}</p>}
              <ProvTag prov={d.competition.prov} />
            </div>
          </div>
          {d.tournaments.length > 1 && (
            <select className="input" value={d.tournament?.id ?? ''} aria-label="Édition" onChange={e => navigate({ name: 'competition', id, tournament: e.target.value }, true)}>
              {d.tournaments.map(t => <option key={t.id} value={t.id}>{t.name}{t.startDate ? ` (${t.startDate.slice(0, 4)})` : ''}</option>)}
            </select>
          )}
          {stages.length === 0 && <Empty icon="📭" title="Pas de phases publiées pour cette édition" />}
          {stages.length > 1 && (
            <div className="tabs" role="tablist">
              {stages.map((s, i) => <button key={s.id} type="button" role="tab" aria-selected={i === si} onClick={() => setStageIdx(i)}>{s.name}</button>)}
            </div>
          )}
          {stage?.sections.map(sec => <Section key={sec.name} name={stage.sections.length > 1 || stages.length === 1 ? sec.name : null} matches={sec.matches} standings={sec.standings} />)}
        </>
      )}
    </div>
  );
}

function Section({ name, matches, standings }: { name: string | null; matches: Match[]; standings: CompetitionDetail['stages'][0]['sections'][0]['standings'] }) {
  const rounds = bracketRounds(matches);
  const [showAll, setShowAll] = useState(false);
  const sorted = sortMatches(matches);
  const visible = showAll ? sorted : sorted.slice(0, 12);
  return (
    <section>
      {name && <div className="section"><h2>{name}</h2></div>}
      {standings.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <table className="tbl standings">
            <thead><tr><th>#</th><th style={{ textAlign: 'left' }}>Équipe</th><th>V</th><th>D</th></tr></thead>
            <tbody>
              {standings.map(s => (
                <tr key={s.team.id + s.rank}>
                  <td>{s.rank ?? '—'}</td>
                  <td><button type="button" className="tm link-btn" style={{ color: 'var(--text)' }} onClick={() => navigate({ name: 'team', id: s.team.id })}><Logo src={s.team.image} name={s.team.name} size="s" />{s.team.name}</button></td>
                  <td className="hi">{s.wins ?? '—'}</td><td>{s.losses ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rounds && rounds.length > 1 ? (
        <div className="bracket" aria-label="Tableau à élimination">
          {rounds.map((col, i) => (
            <div key={i} className="col">
              <h3>{i === rounds.length - 1 ? 'Dernier tour' : `Tour ${i + 1}`}</h3>
              {col.map(m => <MatchCard key={m.id} m={m} />)}
            </div>
          ))}
        </div>
      ) : matches.length > 0 ? (
        <>
          <div className="mlist">{visible.map(m => <MatchCard key={m.id} m={m} />)}</div>
          {sorted.length > visible.length && <button type="button" className="btn ghost block" style={{ marginTop: 10 }} onClick={() => setShowAll(true)}>Voir les {sorted.length} matchs</button>}
        </>
      ) : null}
    </section>
  );
}

const fmtDate = (s: string | null) => (s ? new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '?');
