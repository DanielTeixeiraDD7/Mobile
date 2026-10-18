import { useMemo } from 'react';
import { teamForm } from '../core/analysis';
import { sortMatches } from '../core/filters';
import { dedupeMatches } from '../core/quality';
import { knownMatches } from '../data/feed';
import { isFavorite, toggleFavorite, useStore } from '../data/store';
import { DEFS } from '../games/defs';
import { adapterOf } from '../games/registry';
import { useResource } from '../hooks/useResource';
import { goBack, navigate } from '../router';
import { Banner, Empty, FavButton, Freshness, Logo, MatchCard, ProvTag, Skeletons, TopBar } from '../ui/common';
import { pct, relative } from '../ui/format';

const ROLE: Record<string, string> = { top: 'Top', jungle: 'Jungle', mid: 'Mid', bottom: 'ADC', support: 'Support', none: 'Remplaçant' };

export function TeamScreen({ id }: { id: string }) {
  const game = id.split(':')[0]!;
  const adapter = adapterOf(game);
  useStore(s => s.favorites);
  const r = useResource(adapter?.team ? `team:${id}` : null, o => adapter!.team!(id, o));
  const back = () => goBack({ name: 'tab', tab: 'favorites' });

  // Matchs de l'équipe : ceux de la source + ceux déjà chargés ailleurs dans l'app.
  const matches = useMemo(() => {
    const own = r.data?.matches ?? [];
    const other = knownMatches().filter(m => m.sides.some(s => s.team?.id === id));
    return sortMatches(dedupeMatches([...own, ...other]).matches);
  }, [r.data, id]);
  const form = useMemo(() => teamForm(id, matches), [id, matches]);
  const fallbackName = matches[0]?.sides.find(s => s.team?.id === id)?.team;

  if (!adapter?.team) {
    return (
      <>
        <TopBar title={fallbackName?.name ?? 'Équipe'} sub={DEFS[game]?.name} back={back} />
        <Banner kind="info">La source de ce jeu ne publie pas de fiche équipe : seuls les matchs déjà chargés sont affichés.</Banner>
        <Matches list={matches} />
      </>
    );
  }
  const t = r.data?.team;
  const name = t?.name ?? fallbackName?.name ?? 'Équipe';
  const upcoming = matches.filter(m => m.status === 'upcoming' || m.status === 'live');
  const done = matches.filter(m => m.status === 'finished');

  return (
    <div style={{ ['--game' as string]: DEFS[game]?.color }}>
      <TopBar title={name} sub={DEFS[game]?.name} back={back}>
        <FavButton on={isFavorite(id)} label={name} onToggle={() => void toggleFavorite({ id, kind: 'team', game, name, image: t?.image ?? fallbackName?.image ?? null })} />
      </TopBar>
      <Freshness fetchedAt={r.fetchedAt} stale={r.stale} loading={r.loading} onRefresh={r.refresh} />
      {r.error && <Banner kind={t ? 'warn' : 'error'}>{r.error}</Banner>}
      {!t && r.loading ? <Skeletons n={3} /> : (
        <>
          <div className="comp-head">
            <Logo src={t?.image ?? fallbackName?.image} name={name} size="xl" />
            <div className="grow">
              {t?.code && <p style={{ margin: 0 }}><strong>{t.code}</strong></p>}
              {t?.region && <p className="small muted" style={{ margin: '2px 0' }}>{t.region}</p>}
              {t && <ProvTag prov={t.prov} />}
            </div>
          </div>

          <div className="card">
            <p className="label" style={{ marginTop: 0 }}>Forme <span className="tag computed">calculé</span></p>
            {form.played === 0 ? <p className="muted small" style={{ margin: 0 }}>Aucun match terminé dans les données chargées.</p> : (
              <>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="form">{form.last.map((x, i) => <span key={i} className={x}>{x === 'W' ? 'V' : 'D'}</span>)}</span>
                  <strong className="num">{form.wins}V – {form.losses}D</strong>
                </div>
                <p className="small muted" style={{ marginBottom: 0 }}>
                  Taux de victoire {pct(form.wins / form.played)} sur {form.played} {game === 'dota2' ? 'parties' : 'matchs'}
                  {form.from && form.to ? ` du ${new Date(form.from).toLocaleDateString('fr-FR')} au ${new Date(form.to).toLocaleDateString('fr-FR')}` : ''}
                  {form.streak && form.streak.n > 1 ? ` · série en cours : ${form.streak.n} ${form.streak.kind === 'W' ? 'victoires' : 'défaites'}` : ''}.
                  {' '}Basé uniquement sur les matchs disponibles dans l'app, pas sur tout l'historique.
                </p>
              </>
            )}
          </div>

          {t && t.roster.length > 0 && (
            <>
              <div className="section"><h2>Roster</h2><span className="count small">publié par la source, vu {relative(t.prov.fetchedAt)}</span></div>
              <div className="roster">
                {t.roster.map(p => (
                  <div key={p.id} className="p">
                    {p.image ? <img src={p.image} alt="" loading="lazy" onError={e => (e.currentTarget.style.visibility = 'hidden')} /> : <Logo src={null} name={p.handle} size="l" />}
                    {game === 'dota2' ? <button type="button" className="link-btn" style={{ color: 'var(--text)' }} onClick={() => navigate({ name: 'player', id: p.id })}><strong>{p.handle}</strong></button> : <strong>{p.handle}</strong>}
                    {p.realName && <span className="tiny dim">{p.realName}</span>}
                    {p.role && <span className="tag">{ROLE[p.role] ?? p.role}</span>}
                    <FavButton on={isFavorite(p.id)} label={p.handle} onToggle={() => void toggleFavorite({ id: p.id, kind: 'player', game, name: `${p.handle} (${name})`, image: p.image, link: game === 'dota2' ? `#/player/${encodeURIComponent(p.id)}` : `#/team/${encodeURIComponent(id)}` })} />
                  </div>
                ))}
              </div>
              <p className="tiny dim">{t.prov.note}. Un roster affiché ici est l'actuel ; il peut différer de celui d'un match passé.</p>
            </>
          )}
          {t && t.roster.length === 0 && <p className="small muted">Roster non publié par la source.</p>}

          {upcoming.length > 0 && <><div className="section"><h2>Prochains matchs</h2></div><div className="mlist">{upcoming.map(m => <MatchCard key={m.id} m={m} />)}</div></>}
          <div className="section"><h2>Résultats</h2><span className="count">{done.length}</span></div>
          {done.length ? <div className="mlist">{done.slice(0, 30).map(m => <MatchCard key={m.id} m={m} />)}</div> : <p className="muted small">Aucun résultat dans les données chargées.</p>}
        </>
      )}
    </div>
  );
}

function Matches({ list }: { list: ReturnType<typeof sortMatches> }) {
  return list.length ? <div className="mlist">{list.map(m => <MatchCard key={m.id} m={m} />)}</div> : <Empty icon="📭" title="Aucun match chargé pour cette équipe" />;
}
