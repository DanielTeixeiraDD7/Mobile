import { useEffect, useState } from 'react';
import { summarizeGame } from '../core/analysis';
import { errorText, isAbort } from '../core/errors';
import { http } from '../core/http';
import type { Match, MatchGame } from '../core/model';
import { loadGame, objectives, type LolGameStats, type LolPlayerLine } from '../providers/lolLivestats';
import { Chart, Compare } from '../ui/Chart';
import { Banner } from '../ui/common';
import { clock, kGold, num, pct } from '../ui/format';
import { Analysis } from '../ui/Analysis';

const DD = { id: 'ddragon', name: 'Data Dragon (Riot)', baseUrl: 'https://ddragon.leagueoflegends.com/', rpm: 20 };
let ddVersion: string | null = null;
async function ddragonVersion(): Promise<string | null> {
  if (ddVersion) return ddVersion;
  try { ddVersion = (await http.get<string[]>(DD, 'api/versions.json', { ttl: 86_400_000 })).data[0] ?? null; } catch { ddVersion = null; }
  return ddVersion;
}
function useDDragon() {
  const [v, setV] = useState<string | null>(ddVersion);
  useEffect(() => { if (!v) void ddragonVersion().then(setV); }, [v]);
  return v;
}
const champImg = (v: string | null, id: string) => (v ? `https://ddragon.leagueoflegends.com/cdn/${v}/img/champion/${id}.png` : null);
const itemImg = (v: string | null, id: number) => (v ? `https://ddragon.leagueoflegends.com/cdn/${v}/img/item/${id}.png` : null);

const ROLE: Record<string, string> = { top: 'Top', jungle: 'Jungle', mid: 'Mid', bottom: 'ADC', support: 'Support' };
const DRAGON: Record<string, string> = { mountain: 'Montagne', ocean: 'Océan', infernal: 'Infernal', cloud: 'Nuage', hextech: 'Hextech', chemtech: 'Chemtech', elder: 'Ancestral' };

const cache = new Map<string, LolGameStats>();

function useLolGame(game: MatchGame) {
  const [s, setS] = useState<{ data: LolGameStats | null; loading: boolean; error: string | null }>({ data: cache.get(game.id) ?? null, loading: !cache.has(game.id), error: null });
  const finished = game.status === 'finished';
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (game.status === 'upcoming' || game.status === 'unneeded') { setS({ data: null, loading: false, error: null }); return; }
    if (finished && cache.get(game.id)?.complete) return;
    const ac = new AbortController();
    setS(x => ({ ...x, loading: true, error: null }));
    loadGame(game.id, { signal: ac.signal, finished, onProgress: d => !ac.signal.aborted && setS({ data: d, loading: true, error: null }) })
      .then(d => { if (ac.signal.aborted) return; cache.set(game.id, d); setS({ data: d, loading: false, error: null }); })
      .catch(e => { if (!ac.signal.aborted && !isAbort(e)) setS(x => ({ ...x, loading: false, error: errorText(e) })); });
    return () => ac.abort();
  }, [game.id, finished, tick, game.status]);
  // Partie en direct : nouvelles images toutes les 20 s quand l'app est visible.
  useEffect(() => {
    if (game.status !== 'live') return;
    const t = setInterval(() => document.visibilityState === 'visible' && setTick(x => x + 1), 20_000);
    return () => clearInterval(t);
  }, [game.status]);
  return s;
}

export function LolGamePanel({ match, game }: { match: Match; game: MatchGame }) {
  const v = useDDragon();
  const { data, loading, error } = useLolGame(game);
  if (game.status === 'upcoming') return <p className="muted">Partie pas encore commencée.</p>;
  if (game.status === 'unneeded') return <p className="muted">Partie non jouée (série déjà décidée).</p>;
  if (!data) return <>{error ? <Banner kind="warn">Statistiques indisponibles pour cette partie : {error}</Banner> : <p className="muted" aria-live="polite">Chargement des statistiques en jeu…</p>}</>;

  // Côté bleu/rouge → équipe du match.
  const idxOf = (side: 'blue' | 'red') => (game.sideNames[0] === side ? 0 : 1);
  const nameOf = (side: 'blue' | 'red') => match.sides[idxOf(side)]?.team?.name ?? (side === 'blue' ? 'Bleu' : 'Rouge');
  const [blue, red] = data.teams;
  const goldDiff = data.timeline.map(p => ({ x: p.t, y: p.blueGold - p.redGold }));
  const objs = objectives(data.timeline, null).filter(o => o.type !== 'kill');
  const lastDragons = { blue: blue.dragons, red: red.dragons };
  const finished = data.state === 'finished';
  const top = (f: (p: LolPlayerLine) => number | null) => [...data.players].filter(p => f(p) !== null).sort((a, b) => f(b)! - f(a)!)[0];
  const kda = (p: LolPlayerLine) => (p.kills + p.assists) / Math.max(1, p.deaths);
  const bestKda = top(kda), bestDmg = top(p => p.damageShare);
  const lines = summarizeGame({
    names: [nameOf('blue'), nameOf('red')],
    winner: data.winner ? { side: data.winner === 'blue' ? 0 : 1, inferred: true } : null,
    duration: data.duration,
    gold: data.timeline.map(p => ({ t: p.t, diff: p.blueGold - p.redGold })),
    goldUnit: 'gold', comebackThreshold: 3000,
    finals: [{ label: 'Kills', a: blue.kills, b: red.kills }, { label: 'Tours', a: blue.towers, b: red.towers }, { label: 'Dragons', a: blue.dragons.length, b: red.dragons.length }, { label: 'Barons', a: blue.barons, b: red.barons }],
    highlights: [
      ...(bestKda ? [{ label: 'Meilleur KDA', text: `${bestKda.name} (${bestKda.champion}) ${bestKda.kills}/${bestKda.deaths}/${bestKda.assists}` }] : []),
      ...(bestDmg && bestDmg.damageShare ? [{ label: 'Plus grosse part des dégâts', text: `${bestDmg.name} (${pct(bestDmg.damageShare)})` }] : []),
    ],
  });

  return (
    <div className="stack">
      {loading && <p className="small muted" aria-live="polite">Reconstitution de la partie… {data.timeline.length} minute(s) chargée(s)</p>}
      {error && <Banner kind="warn">{error}</Banner>}
      <div className="card">
        <div className="row small" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <strong style={{ color: 'var(--blue)' }}>{nameOf('blue')} · bleu</strong>
          <span className="muted num">{finished ? clock(data.duration) : game.status === 'live' ? `En direct · ${clock(data.timeline[data.timeline.length - 1]?.t ?? null)}` : ''}</span>
          <strong style={{ color: 'var(--red)' }}>rouge · {nameOf('red')}</strong>
        </div>
        <div className="cmp">
          <Compare label="Gold" a={blue.gold} b={red.gold} format={kGold} />
          <Compare label="Kills" a={blue.kills} b={red.kills} />
          <Compare label="Tours" a={blue.towers} b={red.towers} />
          <Compare label="Inhibiteurs" a={blue.inhibitors} b={red.inhibitors} />
          <Compare label="Barons" a={blue.barons} b={red.barons} />
          <Compare label="Dragons" a={blue.dragons.length} b={red.dragons.length} />
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Dragons : {(['blue', 'red'] as const).map(s => `${nameOf(s)} ${lastDragons[s].map(d => DRAGON[d] ?? d).join(', ') || 'aucun'}`).join(' · ')}
          {data.winner && <> · <span className="tag inferred">vainqueur déduit : {nameOf(data.winner)}</span></>}
        </p>
      </div>

      <div className="card">
        <p className="label" style={{ marginTop: 0 }}>Différence de gold (bleu − rouge)</p>
        <Chart series={[{ name: 'Gold diff', color: 'var(--blue)', points: goldDiff }]} diff={{ pos: 'var(--blue)', neg: 'var(--red)' }}
          posLabel={nameOf('blue')} negLabel={nameOf('red')} xFormat={x => `${Math.round(x / 60)}′`} yFormat={y => kGold(y)}
          title="Différence de gold" caption={`Gold total d'équipe · 1 point par minute (${data.stepSeconds} s) · temps réel depuis la 1re image, pauses incluses · source : flux lolesports.com`} />
      </div>

      <div className="card">
        <p className="label" style={{ marginTop: 0 }}>Kills cumulés</p>
        <Chart series={[{ name: nameOf('blue'), color: 'var(--blue)', points: data.timeline.map(p => ({ x: p.t, y: p.blueKills })) }, { name: nameOf('red'), color: 'var(--red)', points: data.timeline.map(p => ({ x: p.t, y: p.redKills })) }]}
          xFormat={x => `${Math.round(x / 60)}′`} yFormat={y => String(y)} title="Kills cumulés" caption="Kills · 1 point par minute" />
      </div>

      {objs.length > 0 && (
        <div className="card">
          <p className="label" style={{ marginTop: 0 }}>Objectifs <span className="tag computed">calculé</span></p>
          <ul className="timeline">
            {objs.map((o, i) => (
              <li key={i}>
                <span className="t">{clock(o.from)}–{clock(o.to)}</span>
                <span className="d" style={{ background: o.side === 'blue' ? 'var(--blue)' : 'var(--red)' }} />
                <span>{nameOf(o.side)} : {o.count > 1 ? `${o.count} ` : ''}{o.type === 'dragon' ? `dragon${o.count > 1 ? 's' : ''}${o.detail ? ` (${o.detail.split(', ').map(d => DRAGON[d] ?? d).join(', ')})` : ''}` : o.type === 'baron' ? 'Baron Nashor' : o.type === 'tower' ? `tour${o.count > 1 ? 's' : ''}` : o.type}</span>
              </li>
            ))}
          </ul>
          <p className="tiny dim" style={{ marginBottom: 0 }}>Déduits des écarts entre deux images (1 par minute) : l'horaire exact n'est pas publié, d'où l'intervalle. Héraut et larves non publiés par ce flux.</p>
        </div>
      )}

      {(['blue', 'red'] as const).map(side => (
        <div key={side} className="card">
          <p className="label" style={{ marginTop: 0, color: side === 'blue' ? 'var(--blue)' : 'var(--red)' }}>{nameOf(side)}</p>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Joueur</th><th>K/D/A</th><th>KDA</th><th>CS</th><th>CS/min</th><th>Gold</th><th>Dégâts</th><th>KP</th><th>Wards</th><th style={{ textAlign: 'left' }}>Objets</th></tr></thead>
              <tbody>
                {data.players.filter(p => p.side === side).map(p => (
                  <tr key={p.participantId}>
                    <td><span className="pl">{champImg(v, p.champion) ? <img src={champImg(v, p.champion)!} alt="" loading="lazy" onError={e => (e.currentTarget.style.visibility = 'hidden')} /> : null}<span><strong>{p.name.replace(/^\S+\s/, '')}</strong><br /><span className="tiny dim">{p.champion} · {ROLE[p.role] ?? p.role}</span></span></span></td>
                    <td className="hi">{p.kills}/{p.deaths}/{p.assists}</td>
                    <td>{num(kda(p), 1)}</td>
                    <td>{p.cs}</td>
                    <td>{data.duration ? num(p.cs / (data.duration / 60), 1) : '—'}</td>
                    <td>{kGold(p.gold)}</td>
                    <td>{pct(p.damageShare)}</td>
                    <td>{pct(p.killParticipation)}</td>
                    <td>{p.wardsPlaced ?? '—'}</td>
                    <td><span className="items">{p.items === null ? <span className="dim">—</span> : p.items.map((it, i) => itemImg(v, it) ? <img key={i} src={itemImg(v, it)!} alt="" loading="lazy" title={String(it)} onError={e => (e.currentTarget.style.visibility = 'hidden')} /> : <i key={i} />)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className="tiny dim">KDA, CS/min : calculés. Dégâts = part des dégâts aux champions de l'équipe. Gold = gold actuel du joueur. Bans et ordre de draft non publiés par ce flux. Patch {data.patch}.</p>
      <Analysis lines={lines} />
    </div>
  );
}
