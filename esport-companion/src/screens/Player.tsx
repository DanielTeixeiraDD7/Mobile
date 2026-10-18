import { useEffect, useState } from 'react';
import { isFavorite, toggleFavorite, useStore } from '../data/store';
import { dotaPlayer, heroes, type HeroInfo } from '../games/dota2';
import { useResource } from '../hooks/useResource';
import { goBack, navigate } from '../router';
import { Banner, Empty, FavButton, Freshness, Logo, Skeletons, TopBar } from '../ui/common';
import { clock, kGold, num, pct } from '../ui/format';

export function PlayerScreen({ id }: { id: string }) {
  const [game, , raw] = id.split(':');
  const accountId = Number(raw);
  const ok = game === 'dota2' && Number.isFinite(accountId);
  useStore(s => s.favorites);
  const r = useResource(ok ? `player:${id}` : null, o => dotaPlayer(accountId, o));
  const [h, setH] = useState<Map<number, HeroInfo>>(new Map());
  useEffect(() => { void heroes().then(setH).catch(() => {}); }, []);
  const back = () => goBack({ name: 'tab', tab: 'favorites' });
  if (!ok) return <><TopBar title="Joueur" back={back} /><Empty icon="👤" title="Pas de fiche joueur pour ce jeu">La source LoL ne publie pas de statistiques par joueur hors des parties : ouvre une partie pour voir ses stats.</Empty></>;
  const d = r.data;
  const rec = d?.recent ?? [];
  const won = (m: (typeof rec)[0]) => (m.player_slot < 128) === m.radiant_win;
  const wins = rec.filter(won).length;
  const avg = (f: (m: (typeof rec)[0]) => number) => (rec.length ? rec.reduce((n, m) => n + f(m), 0) / rec.length : null);

  return (
    <div style={{ ['--game' as string]: '#e5483d' }}>
      <TopBar title={d?.name ?? 'Joueur'} sub="Dota 2" back={back}>
        {d && <FavButton on={isFavorite(id)} label={d.name} onToggle={() => void toggleFavorite({ id, kind: 'player', game: 'dota2', name: d.name, image: d.avatar, link: `#/player/${encodeURIComponent(id)}` })} />}
      </TopBar>
      <Freshness fetchedAt={r.fetchedAt} stale={r.stale} loading={r.loading} onRefresh={r.refresh} source="OpenDota" />
      {r.error && <Banner kind="error">{r.error}</Banner>}
      {!d ? (r.loading ? <Skeletons n={3} /> : null) : (
        <>
          <div className="comp-head">
            <Logo src={d.avatar} name={d.name} size="xl" />
            <div className="grow">
              {d.persona && d.persona !== d.name && <p className="small muted" style={{ margin: 0 }}>Steam : {d.persona}</p>}
              {d.country && <p className="small muted" style={{ margin: 0 }}>Pays : {d.country}</p>}
              <span className="tag community">communautaire</span>
            </div>
          </div>
          <div className="card">
            <p className="label" style={{ marginTop: 0 }}>Parties de tournoi récentes <span className="tag computed">calculé</span></p>
            {rec.length === 0 ? <p className="small muted" style={{ margin: 0 }}>Aucune partie en lobby de tournoi parmi ses 20 dernières parties.</p> : (
              <div className="grid three small">
                <span><strong className="num">{wins}V – {rec.length - wins}D</strong><br /><span className="dim">{pct(wins / rec.length)} sur {rec.length} parties</span></span>
                <span><strong className="num">{num(avg(m => m.kills), 1)} / {num(avg(m => m.deaths), 1)} / {num(avg(m => m.assists), 1)}</strong><br /><span className="dim">K/D/A moyen</span></span>
                <span><strong className="num">{num(avg(m => m.gold_per_min))} GPM</strong><br /><span className="dim">{num(avg(m => m.xp_per_min))} XPM moyens</span></span>
              </div>
            )}
            <p className="tiny dim" style={{ marginBottom: 0 }}>Parmi ses 20 dernières parties publiques, seules celles en lobby privé/tournoi (lobby_type 1) sont gardées : elles peuvent inclure des entraînements. Les parties classées ne sont pas mélangées.</p>
          </div>
          {rec.length > 0 && (
            <div className="card">
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Héros</th><th>Rés.</th><th>K/D/A</th><th>GPM</th><th>Dégâts</th><th>Durée</th></tr></thead>
                  <tbody>
                    {rec.map(m => (
                      <tr key={m.match_id} onClick={() => navigate({ name: 'match', id: `dota2:m${m.match_id}` })} style={{ cursor: 'pointer' }}>
                        <td><span className="pl">{h.get(m.hero_id)?.img && <img src={h.get(m.hero_id)!.img!} alt="" />}<span>{h.get(m.hero_id)?.name ?? m.hero_id}<br /><span className="tiny dim">{new Date(m.start_time * 1000).toLocaleDateString('fr-FR')}</span></span></span></td>
                        <td style={{ color: won(m) ? 'var(--win)' : 'var(--loss)', fontWeight: 800 }}>{won(m) ? 'V' : 'D'}</td>
                        <td className="hi">{m.kills}/{m.deaths}/{m.assists}</td><td>{m.gold_per_min}</td><td>{kGold(m.hero_damage)}</td><td>{clock(m.duration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {d.heroes.length > 0 && (
            <div className="card">
              <p className="label" style={{ marginTop: 0 }}>Héros les plus joués (lobbies de tournoi, toute la carrière)</p>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Héros</th><th>Parties</th><th>Victoires</th><th>Taux</th><th>Dernière</th></tr></thead>
                  <tbody>{d.heroes.map(x => (
                    <tr key={x.hero_id}>
                      <td><span className="pl">{h.get(x.hero_id)?.img && <img src={h.get(x.hero_id)!.img!} alt="" />}{h.get(x.hero_id)?.name ?? x.hero_id}</span></td>
                      <td>{x.games}</td><td>{x.win}</td><td className="hi">{pct(x.win / x.games)}</td><td>{new Date(x.last_played * 1000).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
          <p className="tiny dim"><a href={`https://www.opendota.com/players/${d.accountId}`} target="_blank" rel="noopener noreferrer">Voir sur OpenDota</a></p>
        </>
      )}
    </div>
  );
}
