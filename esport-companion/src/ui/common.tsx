import { useState, type ReactNode } from 'react';
import type { Match, Provenance, TeamRef } from '../core/model';
import { DEFS } from '../games/defs';
import { navigate } from '../router';
import { useStore } from '../data/store';
import { countdown, relative, when } from './format';
import { Icon, type IconName } from './icons';

export function Logo({ src, name, size = 'm' }: { src: string | null | undefined; name: string; size?: 's' | 'm' | 'l' | 'xl' }) {
  const [bad, setBad] = useState(false);
  const initials = name.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  return (
    <span className={`logo ${size}`} aria-hidden="true">
      {src && !bad ? <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} /> : <span>{initials}</span>}
    </span>
  );
}

export function GameBadge({ game }: { game: string }) {
  const d = DEFS[game];
  return <span className="gbadge" style={{ ['--game' as string]: d?.color }}>{d?.short ?? game}</span>;
}

export function StatusChip({ m, now }: { m: Match; now?: number }) {
  switch (m.status) {
    case 'live': return <span className="status live">EN DIRECT</span>;
    case 'finished': return <span className="status finished">Terminé</span>;
    case 'upcoming': return <span className="status upcoming">{m.startTime ? countdown(m.startTime, now) : 'À venir'}</span>;
    case 'canceled': return <span className="status">Annulé</span>;
    case 'postponed': return <span className="status">Reporté</span>;
    default: return <span className="status">Statut inconnu</span>;
  }
}

const teamName = (t: TeamRef | null) => t?.name ?? 'À déterminer';

export function MatchCard({ m, now }: { m: Match; now?: number }) {
  const hide = useStore(s => s.settings.hideSpoilers) && m.status === 'finished';
  const [reveal, setReveal] = useState(false);
  const blur = hide && !reveal;
  const d = DEFS[m.game];
  return (
    <button type="button" className={`mcard ${m.status}`} style={{ ['--game' as string]: d?.color }} onClick={() => navigate({ name: 'match', id: m.id })}
      aria-label={`${teamName(m.sides[0].team)} contre ${teamName(m.sides[1].team)}, ${m.competition?.name ?? ''}, ${when(m.startTime, now)}`}>
      <div className="meta">
        <GameBadge game={m.game} />
        <span className="comp">{m.competition?.name ?? 'Compétition inconnue'}{m.stage ? ` · ${m.stage}` : ''}</span>
        <StatusChip m={m} now={now} />
      </div>
      {m.sides.map((s, i) => (
        <div key={i} className={`team ${s.winner === true ? 'won' : s.winner === false ? 'lost' : ''}`}>
          <Logo src={s.team?.image} name={teamName(s.team)} size="s" />
          <span className="name">{teamName(s.team)}</span>
          <span className={`score num ${blur ? 'spoiler' : ''}`}>{s.score ?? (m.status === 'upcoming' ? '' : '–')}</span>
        </div>
      ))}
      <div className="foot">
        <span>{when(m.startTime, now)}</span>
        {m.format && <span>· BO{m.format.count}</span>}
        {m.prov.kind === 'imported' && <span className="tag imported">importé</span>}
        {m.prov.kind === 'computed' && <span className="tag computed" title={m.prov.note}>calculé</span>}
        {blur && <span className="grow" />}
        {blur && <span role="button" tabIndex={0} className="link-btn tiny" onClick={e => { e.stopPropagation(); setReveal(true); }}>Afficher le score</span>}
      </div>
    </button>
  );
}

export function Banner({ kind, icon, children }: { kind: 'warn' | 'error' | 'info'; icon?: IconName; children: ReactNode }) {
  return <div className={`banner ${kind}`} role={kind === 'error' ? 'alert' : undefined}><Icon name={icon ?? (kind === 'info' ? 'info' : 'warn')} /><div className="grow">{children}</div></div>;
}

/** Fraîcheur des données + actualisation manuelle. */
export function Freshness({ fetchedAt, stale, loading, onRefresh, source }: { fetchedAt: number | null; stale: boolean; loading: boolean; onRefresh?: () => void; source?: string }) {
  const online = typeof navigator === 'undefined' || navigator.onLine;
  return (
    <div className="fresh" aria-live="polite">
      {!online && <span className="stale"><Icon name="offline" /> Hors-ligne</span>}
      {loading ? <span>Actualisation…</span> : fetchedAt ? <span className={stale ? 'stale' : ''}>{stale ? 'Données enregistrées ' : 'Mis à jour '}{relative(fetchedAt)}</span> : null}
      {source && <span>· {source}</span>}
      {onRefresh && !loading && <button type="button" className="link-btn tiny" onClick={onRefresh}>Actualiser</button>}
    </div>
  );
}

export function Skeletons({ n = 3 }: { n?: number }) {
  return <div aria-busy="true" aria-label="Chargement">{Array.from({ length: n }, (_, i) => <div key={i} className="skeleton" />)}</div>;
}

export function Empty({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return <div className="empty"><div className="big">{icon}</div><p><strong>{title}</strong></p>{children}</div>;
}

const KIND_LABEL: Record<Provenance['kind'], string> = { official: 'officielle', community: 'communautaire', imported: 'importée', computed: 'calculée' };
export function ProvTag({ prov }: { prov: Provenance }) {
  return <span className={`tag ${prov.kind}`} title={prov.note}>{KIND_LABEL[prov.kind]}</span>;
}

export function TopBar({ title, sub, back, children }: { title: string; sub?: string; back?: () => void; children?: ReactNode }) {
  return (
    <header className="topbar">
      {back && <button type="button" className="icon-btn back" onClick={back} aria-label="Retour"><Icon name="back" /></button>}
      <h1>{title}{sub && <small>{sub}</small>}</h1>
      {children}
    </header>
  );
}

export function FavButton({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" className={`icon-btn ${on ? 'on' : ''}`} aria-pressed={on} aria-label={on ? `Retirer ${label} des favoris` : `Ajouter ${label} aux favoris`} onClick={onToggle}>
      <Icon name={on ? 'starFill' : 'star'} />
    </button>
  );
}
