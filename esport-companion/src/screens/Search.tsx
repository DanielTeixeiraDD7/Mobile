import { useEffect, useMemo, useState } from 'react';
import { isAbort } from '../core/errors';
import type { Competition, Team } from '../core/model';
import { knownMatches } from '../data/feed';
import { useStore } from '../data/store';
import { DEFS } from '../games/defs';
import { adapterOf } from '../games/registry';
import { goBack, navigate } from '../router';
import { Empty, GameBadge, Logo, MatchCard, TopBar } from '../ui/common';
import { Icon } from '../ui/icons';

const norm = (s: string | null | undefined) => (s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function SearchScreen() {
  const games = useStore(s => s.settings.games);
  const [q, setQ] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [comps, setComps] = useState<Competition[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) { setTeams([]); setComps([]); return; }
    const ac = new AbortController();
    setBusy(true);
    const t = setTimeout(async () => {
      const o = { signal: ac.signal };
      const res = await Promise.allSettled(games.map(async g => {
        const a = adapterOf(g);
        const [tm, cs] = await Promise.all([a?.searchTeams?.(text, o) ?? [], a?.competitions?.(o).then(r => r.data.filter(c => norm(c.name).includes(norm(text)))) ?? []]);
        return { tm, cs };
      }));
      if (ac.signal.aborted) return;
      setTeams(res.flatMap(r => (r.status === 'fulfilled' ? r.value.tm : [])).slice(0, 30));
      setComps(res.flatMap(r => (r.status === 'fulfilled' ? r.value.cs : [])).slice(0, 20));
      setBusy(false);
      if (res.some(r => r.status === 'rejected' && isAbort(r.reason))) return;
    }, 300);
    return () => { clearTimeout(t); ac.abort(); };
  }, [q, games]);

  const matches = useMemo(() => {
    const n = norm(q.trim());
    if (n.length < 2) return [];
    return knownMatches().filter(m => [m.sides[0].team?.name, m.sides[1].team?.name, m.sides[0].team?.code, m.sides[1].team?.code].some(x => norm(x) === n || norm(x).includes(n)))
      .sort((a, b) => (b.startTime ?? 0) - (a.startTime ?? 0)).slice(0, 12);
  }, [q]);

  const nothing = q.trim().length >= 2 && !busy && !teams.length && !comps.length && !matches.length;
  return (
    <>
      <TopBar title="Recherche" back={() => goBack({ name: 'tab', tab: 'home' })} />
      <div className="search"><Icon name="search" /><input className="input" type="search" autoFocus placeholder="G2, T1, Worlds, Team Spirit…" value={q} onChange={e => setQ(e.target.value)} aria-label="Rechercher" /></div>
      <p className="tiny dim">Jeux : {games.map(g => DEFS[g]?.short).join(', ')}. Joueurs LoL : tape le pseudo exact pour trouver son équipe.</p>
      {busy && <p className="small muted" aria-live="polite">Recherche…</p>}
      {nothing && <Empty icon="🔍" title="Aucun résultat" />}
      {teams.length > 0 && <>
        <div className="section"><h2>Équipes</h2></div>
        <ul className="list card" style={{ padding: '0 14px' }}>
          {teams.map(t => <li key={t.id}><button type="button" onClick={() => navigate({ name: 'team', id: t.id })}><Logo src={t.image} name={t.name} size="m" /><span className="grow"><strong>{t.name}</strong>{t.region && <><br /><span className="small dim">{t.region}</span></>}</span><GameBadge game={t.game} /></button></li>)}
        </ul>
      </>}
      {comps.length > 0 && <>
        <div className="section"><h2>Compétitions</h2></div>
        <ul className="list card" style={{ padding: '0 14px' }}>
          {comps.map(c => <li key={c.id}><button type="button" onClick={() => navigate({ name: 'competition', id: c.id, tournament: null })}><Logo src={c.image} name={c.name} size="m" /><span className="grow"><strong>{c.name}</strong></span><GameBadge game={c.game} /></button></li>)}
        </ul>
      </>}
      {matches.length > 0 && <><div className="section"><h2>Matchs chargés</h2></div><div className="mlist">{matches.map(m => <MatchCard key={m.id} m={m} />)}</div></>}
    </>
  );
}
