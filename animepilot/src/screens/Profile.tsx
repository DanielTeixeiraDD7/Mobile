import { useMemo, useState } from 'react';
import { useStore } from '../data/store';
import { formatNumber, mediaTitle, statusLabel } from '../domain/labels';
import { activity, formatDuration, typeStats, type Stat } from '../domain/stats';
import { buildProfile } from '../domain/taste';
import { ENTRY_STATUSES, entryId, type MediaType } from '../domain/types';
import { useOnline } from '../hooks/useOnline';
import { useRecommendations } from '../hooks/useRecommendations';
import { navigate } from '../router';
import { add } from '../ui/actions';
import { Assistant } from '../ui/Assistant';
import { Icon } from '../ui/icons';
import { Poster } from '../ui/Poster';

export function ProfileScreen() {
  const [type, setType] = useState<MediaType>('ANIME');
  return (
    <>
      <header className="topbar">
        <h1>Profil & assistant</h1>
        <button type="button" className="icon-btn" onClick={() => navigate({ name: 'data' })} aria-label="Données (export, import)"><Icon name="data" /></button>
        <button type="button" className="icon-btn" onClick={() => navigate({ name: 'settings' })} aria-label="Réglages"><Icon name="settings" /></button>
      </header>
      <Assistant />
      <div className="seg" role="tablist" aria-label="Type">
        {(['ANIME', 'MANGA'] as const).map(t => (
          <button key={t} type="button" role="tab" aria-selected={type === t} onClick={() => setType(t)}>{t === 'ANIME' ? 'Anime' : 'Manga'}</button>
        ))}
      </div>
      <Stats type={type} />
      <Taste type={type} />
      <Recs type={type} />
    </>
  );
}

function StatCard({ label, stat, format }: { label: string; stat: Stat; format: (n: number) => string }) {
  return (
    <div className="stat" title={stat.note}>
      <span className="stat-v">{stat.estimate ? '≈ ' : ''}{format(stat.value)}</span>
      <span className="stat-l">{label}</span>
      <span className={`badge ${stat.estimate ? 'est' : 'exact'}`}>{stat.estimate ? 'estimé' : 'exact'}</span>
    </div>
  );
}

function Stats({ type }: { type: MediaType }) {
  const entries = useStore(s => s.entries);
  const history = useStore(s => s.history);
  const s = useMemo(() => typeStats(entries, type), [entries, type]);
  const act = useMemo(() => activity(history, entries, 14), [history, entries]);
  const key = type === 'ANIME' ? 'anime' : 'manga';
  const max = Math.max(1, ...act.map(d => d[key]));
  if (s.total === 0) return <p className="empty">Pas encore de statistiques {type === 'ANIME' ? 'anime' : 'manga'}.</p>;
  const year = new Date().getFullYear();
  return (
    <>
      <div className="section"><h2>Statistiques</h2></div>
      <div className="stats">
        <StatCard label="titres" stat={{ value: s.total, estimate: false }} format={String} />
        <StatCard label={type === 'ANIME' ? 'épisodes vus' : 'chapitres lus'} stat={s.units} format={formatNumber} />
        <StatCard label={type === 'ANIME' ? 'de visionnage' : 'de lecture'} stat={s.minutes} format={formatDuration} />
        {type === 'ANIME' && <StatCard label="reste à voir" stat={s.remainingMinutes} format={formatDuration} />}
        {s.meanScore && <StatCard label="note moyenne" stat={s.meanScore} format={n => formatNumber(n) + '/10'} />}
        <StatCard label={`terminés en ${year}`} stat={{ value: s.completedThisYear, estimate: false }} format={String} />
      </div>
      <div className="statusbar" aria-label="Répartition par statut">
        {ENTRY_STATUSES.filter(st => s.byStatus[st]).map(st => (
          <i key={st} className={`st-${st}`} style={{ flex: s.byStatus[st] }} title={`${statusLabel(type, st)} : ${s.byStatus[st]}`} />
        ))}
      </div>
      <p className="small muted legend">
        {ENTRY_STATUSES.filter(st => s.byStatus[st]).map(st => <span key={st}><i className={`dot st-${st}`} />{statusLabel(type, st)} {s.byStatus[st]}</span>)}
      </p>
      <p className="label">Activité (14 jours, {type === 'ANIME' ? 'épisodes' : 'chapitres'} enregistrés)</p>
      <div className="spark" role="img" aria-label={`Activité : ${act.reduce((n, d) => n + d[key], 0)} sur 14 jours`}>
        {act.map(d => <i key={d.day} style={{ height: `${(d[key] / max) * 100}%` }} title={`${new Date(d.day).toLocaleDateString('fr-FR')} : ${formatNumber(d[key])}`} />)}
      </div>
      <details className="small muted method">
        <summary>Comment sont calculés ces chiffres ?</summary>
        <p><strong>Exact</strong> : compté à partir de tes données. <strong>Estimé</strong> : dépend d'hypothèses.</p>
        <p>{s.units.note} {s.minutes.note} {type === 'ANIME' ? s.remainingMinutes.note : ''}</p>
      </details>
    </>
  );
}

function Taste({ type }: { type: MediaType }) {
  const entries = useStore(s => s.entries);
  const p = useMemo(() => buildProfile(entries, type), [entries, type]);
  if (!p.topGenres.length) return null;
  const max = p.topGenres[0]!.weight;
  return (
    <>
      <div className="section"><h2>Profil de goûts</h2></div>
      {p.weak && <div className="banner info">Basé sur {p.basedOn} titre(s) : note ou termine-en d'autres pour l'affiner.</div>}
      <ul className="genres">
        {p.topGenres.map(g => (
          <li key={g.name}><span>{g.name}</span><span className="bar"><i style={{ width: `${(g.weight / max) * 100}%` }} /></span></li>
        ))}
      </ul>
      {p.topTags.length > 0 && <div className="tags">{p.topTags.map(t => <span key={t.name} className="tag">{t.name}</span>)}</div>}
      {p.disliked.length > 0 && <p className="small muted">Moins apprécié : {p.disliked.map(d => d.name).join(', ')}</p>}
    </>
  );
}

function Recs({ type }: { type: MediaType }) {
  const online = useOnline();
  const [run, setRun] = useState(false);
  const [key, setKey] = useState(0);
  const r = useRecommendations(type, run, key);
  const lang = useStore(s => s.settings.titleLanguage);
  const entries = useStore(s => s.entries);
  return (
    <>
      <div className="section">
        <h2>Recommandations</h2>
        {r.status === 'done' && <button type="button" className="link" onClick={() => setKey(k => k + 1)}>Recalculer</button>}
      </div>
      {!run ? (
        <div className="card">
          <p className="small muted" style={{ marginTop: 0 }}>Calcul local à partir de tes goûts. Candidats : recommandations de la communauté AniList pour tes titres préférés et tendances du moment (quelques requêtes, mises en cache).</p>
          <button type="button" className="btn primary block" onClick={() => setRun(true)}>{online ? 'Me recommander des titres' : 'Me recommander (hors-ligne : cache seulement)'}</button>
        </div>
      ) : (
        <>
          {r.status === 'loading' && <p className="muted" aria-live="polite">Calcul…</p>}
          {r.status === 'error' && <div className="banner error" role="alert">{r.error}</div>}
          {r.partial && <div className="banner warn">Certaines données AniList n'ont pas pu être chargées : liste partielle.</div>}
          {r.status === 'done' && r.items.length === 0 && <p className="empty">Aucune recommandation pour l'instant.</p>}
          <ul className="recs">
            {r.items.map(rec => {
              const title = mediaTitle(rec.media, lang);
              const owned = entries.some(e => e.id === entryId(rec.media.type, rec.media.id));
              return (
                <li key={rec.media.id} className="card rec">
                  <button type="button" className="entry-main" onClick={() => navigate({ name: 'media', type: rec.media.type, id: rec.media.id })}>
                    <Poster src={rec.media.cover} color={rec.media.coverColor} title={title} size="sm" />
                    <span className="grow">
                      <span className="entry-title clamp2">{title}</span>
                      {rec.reasons.map(x => <span key={x} className="small muted reason">{x}</span>)}
                    </span>
                  </button>
                  {!owned && <button type="button" className="plus" aria-label={`Ajouter ${title}`} onClick={() => void add(rec.media, 'PLANNING')}><Icon name="plus" /></button>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
