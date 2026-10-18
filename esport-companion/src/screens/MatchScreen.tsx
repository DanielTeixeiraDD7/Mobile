import { useEffect, useMemo, useState } from 'react';
import type { MatchDetail } from '../core/adapter';
import { headToHead, summarizeSeries } from '../core/analysis';
import type { Fetched, Match } from '../core/model';
import { checkMatch } from '../core/quality';
import { knownMatch, knownMatches } from '../data/feed';
import { markViewed, useStore } from '../data/store';
import { DEFS } from '../games/defs';
import { adapterOf } from '../games/registry';
import { GAME_PANELS, gameWord } from '../games/views';
import { useResource } from '../hooks/useResource';
import { goBack, navigate } from '../router';
import { Analysis } from '../ui/Analysis';
import { Banner, Empty, Freshness, Logo, MatchCard, ProvTag, Skeletons, StatusChip, TopBar } from '../ui/common';
import { when } from '../ui/format';
import { Icon } from '../ui/icons';

export function MatchScreen({ id }: { id: string }) {
  const game = id.split(':')[0]!;
  const sourceId = id.slice(game.length + 1);
  const manual = useStore(s => s.manual.find(m => m.id === id));
  const adapter = adapterOf(game);
  const back = () => goBack({ name: 'tab', tab: 'matches' });

  const r = useResource<MatchDetail>(manual || !adapter ? null : `match:${id}`,
    o => adapter!.matchDetail(sourceId, o),
    d => (d?.match.status === 'live' ? 30_000 : undefined));

  // Horaire / phase / bilan connus du calendrier (la fiche détaillée ne les donne pas toujours).
  const detail: Fetched<MatchDetail> | null = manual
    ? { data: { match: manual.match, games: [], quality: checkMatch(manual.match, []) }, fetchedAt: manual.importedAt, stale: false }
    : r.data ? { data: r.data, fetchedAt: r.fetchedAt!, stale: r.stale } : null;
  const listed = knownMatch(id);
  const match: Match | null = detail ? {
    ...detail.data.match,
    startTime: detail.data.match.startTime ?? listed?.startTime ?? null,
    stage: detail.data.match.stage ?? listed?.stage ?? null,
    competition: detail.data.match.competition ?? listed?.competition ?? null,
    sides: detail.data.match.sides.map((s, i) => ({ ...s, record: s.record ?? listed?.sides[i]?.record ?? null })) as Match['sides'],
  } : listed;

  useEffect(() => { if (match && detail) void markViewed(match); }, [match?.id, !!detail]); // eslint-disable-line react-hooks/exhaustive-deps
  const [tab, setTab] = useState<'summary' | number>('summary');
  const games = detail?.data.games ?? [];
  const Panel = GAME_PANELS[game];
  const h2h = useMemo(() => (match?.sides[0].team && match.sides[1].team ? headToHead(match.sides[0].team.id, match.sides[1].team.id, knownMatches()).filter(m => m.id !== id) : []), [match, id]);

  if (!adapter && !manual) return <><TopBar title="Match" back={back} /><Empty icon="🧩" title="Jeu sans source de données">{DEFS[game]?.note}</Empty></>;
  if (!match) return <><TopBar title="Match" back={back} />{r.error ? <Banner kind="error">{r.error}</Banner> : <Skeletons n={3} />}</>;

  const d = DEFS[game];
  const [a, b] = match.sides;
  const word = gameWord[game] ?? 'Partie';

  return (
    <div style={{ ['--game' as string]: d?.color }}>
      <TopBar title={d?.name ?? game} back={back}>
        <button type="button" className="icon-btn" onClick={r.refresh} aria-label="Actualiser"><Icon name="refresh" /></button>
      </TopBar>
      {!manual && <Freshness fetchedAt={r.fetchedAt} stale={r.stale} loading={r.loading} source={d?.sources.join(', ')} />}
      {r.error && detail && <Banner kind="warn">{r.error} Dernières données affichées.</Banner>}

      <section className="mhead">
        <button type="button" className="link-btn comp" onClick={() => match.competition && navigate({ name: 'competition', id: match.competition.id, tournament: match.tournamentId })} disabled={!match.competition || match.source === 'import'}>
          {match.competition?.name ?? 'Compétition inconnue'}{match.stage ? ` · ${match.stage}` : ''}
        </button>
        <div className="vs">
          {[a, b].map((s, i) => (
            <button key={i} type="button" className="side" onClick={() => s.team && navigate({ name: 'team', id: s.team.id })} disabled={!s.team || match.source === 'import'}>
              <Logo src={s.team?.image} name={s.team?.name ?? '?'} size="l" />
              <span className="name">{s.team?.name ?? 'À déterminer'}</span>
              {s.record && <span className="tiny dim">{s.record.wins}V – {s.record.losses}D</span>}
            </button>
          )).flatMap((el, i) => i === 0 ? [el, (
            <div key="score" className="big num" aria-label={`Score ${a.score ?? '-'} à ${b.score ?? '-'}`}>
              {match.status === 'upcoming' ? <span className="sep">vs</span> : <>
                <span className={a.winner === false ? 'lost' : ''}>{a.score ?? '–'}</span><span className="sep">:</span><span className={b.winner === false ? 'lost' : ''}>{b.score ?? '–'}</span>
              </>}
            </div>
          )] : [el])}
        </div>
        <div className="row" style={{ justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <StatusChip m={match} />
          <span className="small muted">{when(match.startTime)}{match.format ? ` · BO${match.format.count}` : ''}</span>
          <ProvTag prov={match.prov} />
        </div>
      </section>

      {games.length > 0 && (
        <div className="tabs" role="tablist" aria-label={`${word}s`}>
          <button type="button" role="tab" aria-selected={tab === 'summary'} onClick={() => setTab('summary')}>Résumé</button>
          {games.map((g, i) => (
            <button key={g.id} type="button" role="tab" aria-selected={tab === i} onClick={() => setTab(i)} disabled={g.status === 'unneeded'}>
              {g.status === 'live' && <span className="w" style={{ background: 'var(--live)' }} />}
              {g.winner !== null && <span className="w" style={{ background: g.winner === 0 ? 'var(--blue)' : 'var(--red)' }} title={`Gagnée par ${match.sides[g.winner].team?.name}`} />}
              {word} {g.number}{g.status === 'unneeded' ? ' (non jouée)' : ''}
            </button>
          ))}
        </div>
      )}

      {tab !== 'summary' && games[tab] && Panel ? (
        <Panel match={match} game={games[tab]!} />
      ) : (
        <div className="stack" style={{ marginTop: 14 }}>
          <Analysis lines={summarizeSeries(match)} title="Résumé" />
          {games.length > 0 && (
            <div className="card">
              <p className="label" style={{ marginTop: 0 }}>{word}s</p>
              <ul className="list">
                {games.map((g, i) => (
                  <li key={g.id}>
                    <button type="button" onClick={() => setTab(i)} disabled={g.status === 'unneeded' || g.status === 'upcoming'}>
                      <strong className="grow">{word} {g.number}</strong>
                      <span className="small muted">
                        {g.status === 'finished' ? (g.winner !== null ? `Victoire ${match.sides[g.winner].team?.name}` : 'Terminée') : g.status === 'live' ? 'En cours' : g.status === 'unneeded' ? 'Non jouée' : 'À venir'}
                        {g.duration ? ` · ${Math.floor(g.duration / 60)} min` : ''}
                        {g.sideNames[0] ? ` · ${match.sides[0].team?.code ?? match.sides[0].team?.name ?? ''} ${g.sideNames[0]}` : ''}
                      </span>
                      {g.status !== 'unneeded' && g.status !== 'upcoming' && <Icon name="chart" />}
                    </button>
                    {g.vods.length > 0 && (
                      <div className="row wrap" style={{ gap: 6, padding: '0 0 10px' }}>
                        {g.vods.map(v => <a key={v.url} className="tag" href={v.url} target="_blank" rel="noopener noreferrer"><Icon name="play" /> {v.label}</a>)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {game === 'lol' && <p className="tiny dim" style={{ marginBottom: 0 }}>Vainqueur de chaque partie non publié par la source : ouvre une partie pour voir le vainqueur déduit de l'état final.</p>}
            </div>
          )}

          {h2h.length > 0 && (
            <>
              <div className="section"><h2>Confrontations récentes</h2><span className="count">{h2h.length}</span></div>
              <p className="tiny dim" style={{ marginTop: -6 }}>Parmi les matchs déjà chargés dans l'app (pas l'historique complet).</p>
              <div className="mlist">{h2h.slice(0, 6).map(m => <MatchCard key={m.id} m={m} />)}</div>
            </>
          )}

          <div className="card small">
            <p className="label" style={{ marginTop: 0 }}>Données et qualité</p>
            <p style={{ margin: '4px 0' }}>Source : <strong>{match.source}</strong> · type : <ProvTag prov={match.prov} /> · confiance : {match.prov.confidence === 'high' ? 'élevée' : match.prov.confidence === 'medium' ? 'moyenne' : 'faible'}</p>
            {match.prov.note && <p className="muted" style={{ margin: '4px 0' }}>{match.prov.note}</p>}
            {detail && <p className="muted" style={{ margin: '4px 0' }}>Récupéré le {new Date(detail.fetchedAt).toLocaleString('fr-FR')}</p>}
            {(detail?.data.quality ?? []).length === 0 ? <p className="dim" style={{ margin: '4px 0' }}>Aucune incohérence détectée.</p> : (
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {detail!.data.quality.map(q => <li key={q.code} style={{ color: q.level === 'error' ? 'var(--loss)' : q.level === 'warn' ? 'var(--warn)' : undefined }}>{q.message}</li>)}
              </ul>
            )}
          </div>
          {r.error && !detail && <Banner kind="error">{r.error}</Banner>}
          {!detail && r.loading && <Skeletons n={2} />}
          {detail === null && !r.loading && !r.error && <Banner kind="info">Détails non disponibles.</Banner>}
        </div>
      )}
    </div>
  );
}

