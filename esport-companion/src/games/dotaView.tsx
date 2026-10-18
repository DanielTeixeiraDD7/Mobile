import { useEffect, useState } from 'react';
import { summarizeGame } from '../core/analysis';
import type { Match, MatchGame } from '../core/model';
import { useResource } from '../hooks/useResource';
import type { RawMatch, RawPlayer } from '../providers/opendota';
import { Analysis } from '../ui/Analysis';
import { Chart, Compare } from '../ui/Chart';
import { Banner } from '../ui/common';
import { navigate } from '../router';
import { clock, kGold, num } from '../ui/format';
import { dotaGame, heroes, items, type HeroInfo, type ItemInfo } from './dota2';

/** Bâtiments restants encodés en bits par OpenDota → nombre détruits par l'adversaire. */
const bits = (n: number) => { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; };
export const towersDestroyedBy = (otherStatus: number) => 11 - bits(otherStatus);
export const barracksDestroyedBy = (otherStatus: number) => 6 - bits(otherStatus);

const LANE: Record<number, string> = { 1: 'Safe', 2: 'Mid', 3: 'Off', 4: 'Jungle' };

function useConstants() {
  const [c, setC] = useState<{ h: Map<number, HeroInfo>; i: Map<number, ItemInfo> } | null>(null);
  useEffect(() => { void Promise.all([heroes(), items()]).then(([h, i]) => setC({ h, i })).catch(() => setC({ h: new Map(), i: new Map() })); }, []);
  return c;
}

export function DotaGamePanel({ match, game }: { match: Match; game: MatchGame }) {
  const r = useResource(`dota:${game.id}`, o => dotaGame(Number(game.id), o));
  const c = useConstants();
  const d = r.data;
  if (!d) return r.error ? <Banner kind="warn">Partie indisponible : {r.error}</Banner> : <p className="muted" aria-live="polite">Chargement de la partie…</p>;

  const radiantIdx = game.sideNames[0] === 'Radiant' ? 0 : 1;
  const nameOf = (radiant: boolean) => match.sides[radiant ? radiantIdx : 1 - radiantIdx]?.team?.name ?? (radiant ? 'Radiant' : 'Dire');
  const R = nameOf(true), D = nameOf(false);
  const hero = (id: number) => c?.h.get(id);
  const rp = d.players.filter(p => p.isRadiant), dp = d.players.filter(p => !p.isRadiant);
  const sum = (ps: RawPlayer[], f: (p: RawPlayer) => number | null | undefined) => ps.reduce((n, p) => n + (f(p) ?? 0), 0);
  const roshans = (radiant: boolean) => (d.objectives ?? []).filter(o => o.type === 'CHAT_MESSAGE_ROSHAN_KILL' && o.team === (radiant ? 2 : 3)).length;
  const fb = (d.objectives ?? []).find(o => o.type === 'CHAT_MESSAGE_FIRSTBLOOD');
  const fbPlayer = fb ? d.players.find(p => p.player_slot === fb.player_slot) : undefined;
  const parsed = !!d.radiant_gold_adv?.length;
  const gold = (d.radiant_gold_adv ?? []).map((y, i) => ({ x: i * 60, y }));
  const xp = (d.radiant_xp_adv ?? []).map((y, i) => ({ x: i * 60, y }));
  const pb = [...(d.picks_bans ?? [])].sort((a, b) => a.order - b.order);
  const top = (f: (p: RawPlayer) => number | null | undefined) => [...d.players].sort((a, b) => (f(b) ?? 0) - (f(a) ?? 0))[0];
  const bestHd = top(p => p.hero_damage), bestGpm = top(p => p.gold_per_min);
  const pname = (p?: RawPlayer) => (p ? p.name ?? p.personaname ?? `#${p.account_id}` : '?');

  const lines = summarizeGame({
    names: [R, D],
    winner: { side: d.radiant_win ? 0 : 1, inferred: false },
    duration: d.duration,
    gold: gold.map(p => ({ t: p.x, diff: p.y })),
    goldUnit: 'net worth', comebackThreshold: 5000,
    finals: [{ label: 'Kills', a: d.radiant_score, b: d.dire_score }, { label: 'Tours détruites', a: towersDestroyedBy(d.tower_status_dire), b: towersDestroyedBy(d.tower_status_radiant) }, { label: 'Roshan', a: roshans(true), b: roshans(false) }],
    highlights: [
      ...(fb && d.first_blood_time !== null ? [{ label: 'Premier sang', text: `${clock(d.first_blood_time)} par ${pname(fbPlayer)}${fbPlayer ? ` (${hero(fbPlayer.hero_id)?.name ?? ''})` : ''}` }] : []),
      ...(bestHd ? [{ label: 'Plus de dégâts aux héros', text: `${pname(bestHd)} (${num(bestHd.hero_damage)})` }] : []),
      ...(bestGpm ? [{ label: 'Meilleur GPM', text: `${pname(bestGpm)} (${bestGpm.gold_per_min})` }] : []),
    ],
  });

  return (
    <div className="stack">
      <div className="card">
        <div className="row small" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <strong style={{ color: 'var(--win)' }}>{R} · Radiant{d.radiant_win ? ' 🏆' : ''}</strong>
          <span className="muted num">{clock(d.duration)}</span>
          <strong style={{ color: 'var(--loss)' }}>{!d.radiant_win ? '🏆 ' : ''}Dire · {D}</strong>
        </div>
        <div className="cmp">
          <Compare label="Kills" a={d.radiant_score} b={d.dire_score} />
          <Compare label="Net worth" a={sum(rp, p => p.net_worth)} b={sum(dp, p => p.net_worth)} format={kGold} />
          <Compare label="Tours détruites" a={towersDestroyedBy(d.tower_status_dire)} b={towersDestroyedBy(d.tower_status_radiant)} />
          <Compare label="Casernes détruites" a={barracksDestroyedBy(d.barracks_status_dire)} b={barracksDestroyedBy(d.barracks_status_radiant)} />
          <Compare label="Roshan" a={roshans(true)} b={roshans(false)} />
          <Compare label="Dégâts aux héros" a={sum(rp, p => p.hero_damage)} b={sum(dp, p => p.hero_damage)} format={kGold} />
        </div>
        <p className="tiny dim" style={{ marginBottom: 0 }}>Vainqueur publié par la source. Tours/casernes détruites : calculées depuis l'état des bâtiments restants. Net worth = somme des joueurs en fin de partie.</p>
      </div>

      {pb.length > 0 && (
        <div className="card">
          <p className="label" style={{ marginTop: 0 }}>Draft (ordre réel)</p>
          <div className="draft">
            {[0, 1].map(team => (
              <div key={team} className="col">
                <strong className="small">{team === 0 ? R : D}</strong>
                {pb.filter(x => x.team === team && x.is_pick).map(x => <span key={x.order} className="pick"><HeroImg h={hero(x.hero_id)} /><span>{hero(x.hero_id)?.name ?? `Héros ${x.hero_id}`}<br /><span className="tiny dim">pick n°{x.order + 1}</span></span></span>)}
                <span className="bans">{pb.filter(x => x.team === team && !x.is_pick).map(x => <span key={x.order} className="pick ban" title={`Ban n°${x.order + 1} : ${hero(x.hero_id)?.name}`}><HeroImg h={hero(x.hero_id)} /></span>)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {parsed ? (
        <>
          <div className="card">
            <p className="label" style={{ marginTop: 0 }}>Avantage de net worth (Radiant − Dire)</p>
            <Chart series={[{ name: 'Gold', color: 'var(--win)', points: gold }]} diff={{ pos: 'var(--win)', neg: 'var(--loss)' }} posLabel={R} negLabel={D}
              xFormat={x => `${Math.round(x / 60)}′`} yFormat={y => kGold(y)} title="Avantage de net worth" caption="Gold · 1 point par minute de jeu · source : OpenDota (replay analysé)" />
          </div>
          <div className="card">
            <p className="label" style={{ marginTop: 0 }}>Avantage d'expérience (Radiant − Dire)</p>
            <Chart series={[{ name: 'XP', color: 'var(--accent-2)', points: xp }]} diff={{ pos: 'var(--win)', neg: 'var(--loss)' }} posLabel={R} negLabel={D}
              xFormat={x => `${Math.round(x / 60)}′`} yFormat={y => kGold(y)} title="Avantage d'expérience" caption="XP · 1 point par minute · source : OpenDota" />
          </div>
        </>
      ) : <Banner kind="info">Replay pas (encore) analysé par OpenDota : pas de courbes ni d'objectifs détaillés pour cette partie.</Banner>}

      {(d.objectives ?? []).some(o => ['CHAT_MESSAGE_ROSHAN_KILL', 'CHAT_MESSAGE_FIRSTBLOOD', 'CHAT_MESSAGE_AEGIS', 'building_kill'].includes(o.type)) && (
        <div className="card">
          <p className="label" style={{ marginTop: 0 }}>Événements</p>
          <ul className="timeline">
            {(d.objectives ?? []).filter(o => ['CHAT_MESSAGE_ROSHAN_KILL', 'CHAT_MESSAGE_FIRSTBLOOD', 'building_kill'].includes(o.type)).map((o, i) => {
              const radiant = o.type === 'building_kill' ? String(o.key ?? '').includes('badguys') : o.type === 'CHAT_MESSAGE_ROSHAN_KILL' ? o.team === 2 : (o.player_slot ?? 0) < 128;
              const what = o.type === 'CHAT_MESSAGE_ROSHAN_KILL' ? 'Roshan' : o.type === 'CHAT_MESSAGE_FIRSTBLOOD' ? 'Premier sang' : buildingName(String(o.key ?? ''));
              return <li key={i}><span className="t">{clock(o.time)}</span><span className="d" style={{ background: radiant ? 'var(--win)' : 'var(--loss)' }} /><span>{radiant ? R : D} : {what}</span></li>;
            })}
          </ul>
        </div>
      )}

      {[true, false].map(radiant => (
        <div key={String(radiant)} className="card">
          <p className="label" style={{ marginTop: 0, color: radiant ? 'var(--win)' : 'var(--loss)' }}>{radiant ? R : D}</p>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Joueur</th><th>K/D/A</th><th>LH/DN</th><th>GPM</th><th>XPM</th><th>NW</th><th>Dégâts</th><th>Tours</th><th>Soins</th><th>Niv.</th><th style={{ textAlign: 'left' }}>Objets</th></tr></thead>
              <tbody>
                {d.players.filter(p => p.isRadiant === radiant).map(p => (
                  <tr key={p.player_slot}>
                    <td><span className="pl"><HeroImg h={hero(p.hero_id)} /><span>{p.account_id ? <button type="button" className="link-btn" style={{ color: 'var(--text)', padding: 0 }} onClick={() => navigate({ name: 'player', id: `dota2:p:${p.account_id}` })}><strong>{pname(p)}</strong></button> : <strong>{pname(p)}</strong>}<br /><span className="tiny dim">{hero(p.hero_id)?.name ?? ''}{p.lane_role ? ` · ${LANE[p.lane_role] ?? ''}` : ''}</span></span></span></td>
                    <td className="hi">{p.kills}/{p.deaths}/{p.assists}</td>
                    <td>{p.last_hits}/{p.denies}</td>
                    <td>{p.gold_per_min}</td><td>{p.xp_per_min}</td>
                    <td>{kGold(p.net_worth)}</td><td>{kGold(p.hero_damage)}</td><td>{kGold(p.tower_damage)}</td><td>{kGold(p.hero_healing)}</td><td>{p.level}</td>
                    <td><span className="items">{[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((it, i) => {
                      const info = c?.i.get(it);
                      return it && info?.img ? <img key={i} src={info.img} alt="" title={info.name} loading="lazy" /> : <i key={i} />;
                    })}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className="tiny dim">Partie {d.match_id} · données OpenDota (API Steam + analyse des replays) · <a href={`https://www.opendota.com/matches/${d.match_id}`} target="_blank" rel="noopener noreferrer">voir sur OpenDota</a></p>
      <Analysis lines={lines} />
    </div>
  );
}

function HeroImg({ h }: { h?: HeroInfo }) {
  return h?.img ? <img src={h.img} alt="" loading="lazy" /> : <img alt="" />;
}

function buildingName(key: string): string {
  const lane = key.includes('top') ? 'haut' : key.includes('mid') ? 'milieu' : key.includes('bot') ? 'bas' : '';
  if (key.includes('tower')) { const t = key.match(/tower(\d)/)?.[1]; return `tour T${t ?? '?'}${lane ? ' ' + lane : ''}`; }
  if (key.includes('rax') || key.includes('barracks')) return `caserne${lane ? ' ' + lane : ''}`;
  if (key.includes('fort')) return 'Ancient';
  return key.replace(/^npc_dota_/, '');
}

export type { RawMatch };
