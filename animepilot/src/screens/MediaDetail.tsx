import { useState } from 'react';
import { updateFields, useStore } from '../data/store';
import { canIncrement } from '../domain/progress';
import { formatLabel, formatNumber, mediaStatusLabel, mediaTitle, seasonLabel, statusLabel, totalUnits, unitLabel } from '../domain/labels';
import { ENTRY_STATUSES, entryId, type HistoryEvent, type LibraryEntry, type MediaSnapshot, type MediaType } from '../domain/types';
import { useDetails } from '../hooks/useDetails';
import { goBack, navigate } from '../router';
import * as act from '../ui/actions';
import { Icon } from '../ui/icons';
import { Poster } from '../ui/Poster';
import { Sheet } from '../ui/Sheet';
import { formatAiring } from '../domain/calendar';

export function MediaDetailScreen({ type, id }: { type: MediaType; id: number }) {
  const entry = useStore(s => s.entries.find(e => e.id === entryId(type, id)));
  const lang = useStore(s => s.settings.titleLanguage);
  const details = useDetails(type, id);
  const media: MediaSnapshot | null = details.data?.media ?? entry?.media ?? null;
  const tab = type === 'ANIME' ? 'anime' : 'manga';
  const back = () => goBack({ name: 'tab', tab });

  if (!media) {
    return (
      <>
        <header className="topbar">
          <button type="button" className="icon-btn back" onClick={back} aria-label="Retour"><Icon name="back" /></button>
          <h1>Fiche</h1>
        </header>
        {details.status === 'loading' ? <p className="muted">Chargement…</p> : <div className="banner error" role="alert">{details.error}</div>}
      </>
    );
  }

  const title = mediaTitle(media, lang);
  const others = [media.title.romaji, media.title.english, media.title.native].filter((t): t is string => !!t && t !== title);
  const total = totalUnits(media);
  const facts = [
    formatLabel(media.format),
    seasonLabel(media.season, media.seasonYear) || media.startYear,
    mediaStatusLabel(media.status),
    total ? `${total} ${unitLabel(type, total)}` : null,
    type === 'ANIME' && media.duration ? `${media.duration} min/ép.` : null,
    type === 'MANGA' && media.volumes ? `${media.volumes} vol.` : null,
  ].filter(Boolean);

  return (
    <>
      <header className="topbar">
        <button type="button" className="icon-btn back" onClick={back} aria-label="Retour"><Icon name="back" /></button>
        <span className="grow" />
        {media.siteUrl && <a className="icon-btn" href={media.siteUrl} target="_blank" rel="noopener noreferrer" aria-label="Voir sur AniList"><Icon name="external" /></a>}
      </header>

      <section className="hero">
        <Poster src={media.cover} color={media.coverColor} title={title} size="lg" />
        <div className="grow">
          <h1 className="hero-title">{title}</h1>
          {others[0] && <p className="small muted">{others[0]}</p>}
          <p className="small muted">{facts.join(' · ')}</p>
          {media.averageScore !== null && <p className="small"><span className="muted">Moyenne AniList :</span> {media.averageScore}/100</p>}
          {type === 'ANIME' && media.nextAiring && <p className="small accent">Ép. {media.nextAiring.episode} · {formatAiring(media.nextAiring.airingAt)}</p>}
        </div>
      </section>

      {details.stale && <div className="banner warn">Infos enregistrées (AniList injoignable).</div>}
      {details.status === 'error' && <div className="banner warn">{details.error} Infos affichées : copie locale.</div>}

      {entry ? <Tracking entry={entry} /> : (
        <div className="card">
          <p className="label" style={{ marginTop: 0 }}>Ajouter à ma bibliothèque</p>
          <div className="status-grid">
            {ENTRY_STATUSES.filter(s => s !== 'REWATCH').map(s => (
              <button key={s} type="button" className={`btn ${s === 'PLANNING' ? 'primary' : ''}`} onClick={() => void act.add(media, s)}>{statusLabel(type, s)}</button>
            ))}
          </div>
        </div>
      )}

      {media.genres.length > 0 && <div className="tags">{media.genres.map(g => <span key={g} className="tag">{g}</span>)}</div>}

      {details.data?.description && <Description text={details.data.description} />}

      {details.data && details.data.recommendations.length > 0 && (
        <>
          <div className="section"><h2>Recommandés par la communauté AniList</h2></div>
          <ul className="hscroll">
            {details.data.recommendations.slice(0, 10).map(r => {
              const t = mediaTitle(r.media, lang);
              return (
                <li key={r.media.id}>
                  <button type="button" className="mini" onClick={() => navigate({ name: 'media', type: r.media.type, id: r.media.id })}>
                    <Poster src={r.media.cover} color={r.media.coverColor} title={t} size="md" />
                    <span className="clamp2 small">{t}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="dim small" style={{ marginTop: 24 }}>Données : AniList (anilist.co).</p>
    </>
  );
}

function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="section"><h2>Synopsis</h2></div>
      <p className={`desc ${open ? '' : 'clamp4'}`}>{text}</p>
      {text.length > 240 && <button type="button" className="link-btn" onClick={() => setOpen(!open)}>{open ? 'Réduire' : 'Lire la suite'}</button>}
    </>
  );
}

function Tracking({ entry }: { entry: LibraryEntry }) {
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const history = useStore(s => s.history);
  const events = history.filter(h => h.entryId === entry.id).slice(0, 15);
  const total = totalUnits(entry.media);
  const unit = unitLabel(entry.type);

  return (
    <>
      <div className="card tracking">
        <div className="chips" role="radiogroup" aria-label="Statut">
          {ENTRY_STATUSES.map(s => (
            <button key={s} type="button" role="radio" className="chip" aria-checked={entry.status === s} aria-pressed={entry.status === s}
              onClick={() => entry.status !== s && void act.setStatus(entry, s)}>{statusLabel(entry.type, s)}</button>
          ))}
        </div>

        <div className="progress-ctl">
          <button type="button" className="round" disabled={entry.progress <= 0} aria-label={`Retirer 1 ${entry.type === 'ANIME' ? 'épisode' : 'chapitre'}`}
            onClick={() => void act.setProgress(entry, Math.max(0, Math.ceil(entry.progress - 1)))}><Icon name="minus" /></button>
          <button type="button" className="value" onClick={() => setEditing(true)} aria-label="Saisir la progression exacte">
            <strong>{formatNumber(entry.progress)}</strong><span className="muted"> / {total ?? '?'} {unit}</span>
          </button>
          <button type="button" className="round primary" disabled={!canIncrement(entry)} aria-label={`+1 ${entry.type === 'ANIME' ? 'épisode' : 'chapitre'}`}
            onClick={() => void act.plusOne(entry)}><Icon name="plus" /></button>
        </div>
        {total && <div className="bar big" aria-hidden="true"><i style={{ width: `${Math.min(100, (entry.progress / total) * 100)}%` }} /></div>}

        <div className="row" style={{ marginTop: 12 }}>
          <label className="label" htmlFor="score">Ma note</label>
          <select id="score" className="input grow" value={entry.score ?? ''} onChange={e => void act.setScore(entry, e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">Pas de note</option>
            {Array.from({ length: 21 }, (_, i) => 10 - i / 2).map(v => <option key={v} value={v}>{formatNumber(v)} / 10</option>)}
          </select>
        </div>
        <p className="small muted" style={{ margin: '10px 0 0' }}>
          {entry.startedAt && <>Commencé le {frDate(entry.startedAt)}. </>}
          {entry.completedAt && <>Terminé le {frDate(entry.completedAt)}. </>}
          {entry.repeatCount > 0 && <>Revu {entry.repeatCount} fois.</>}
        </p>
        <Notes entry={entry} />
      </div>

      {events.length > 0 && (
        <>
          <div className="section"><h2>Historique</h2></div>
          <ul className="history card">
            {events.map(ev => (
              <li key={ev.id} className={ev.undone ? 'undone' : ''}>
                <span className="grow small">{describe(ev, entry)}<br /><span className="dim">{new Date(ev.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}{ev.undone ? ' · annulé' : ''}</span></span>
                {!ev.undone && ev.kind !== 'remove' && <button type="button" className="icon-btn" aria-label="Annuler cette action" onClick={() => void act.undo(ev.id)}><Icon name="undo" /></button>}
              </li>
            ))}
          </ul>
        </>
      )}

      <button type="button" className="btn ghost danger block" style={{ marginTop: 16 }} onClick={() => setConfirmRemove(true)}>Retirer de ma bibliothèque</button>

      {editing && <ProgressSheet entry={entry} onClose={() => setEditing(false)} />}
      {confirmRemove && (
        <Sheet title="Retirer ce titre ?" onClose={() => setConfirmRemove(false)}>
          <p className="muted">La progression et la note seront retirées. Tu pourras annuler juste après.</p>
          <button type="button" className="btn danger block" onClick={() => { setConfirmRemove(false); void act.remove(entry); }}>Retirer</button>
        </Sheet>
      )}
    </>
  );
}

function ProgressSheet({ entry, onClose }: { entry: LibraryEntry; onClose: () => void }) {
  const [v, setV] = useState(String(entry.progress).replace('.', ','));
  const total = totalUnits(entry.media);
  const value = Number(v.replace(',', '.'));
  const valid = v.trim() !== '' && Number.isFinite(value) && value >= 0 && (!total || value <= total);
  return (
    <Sheet title="Progression" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); if (valid) { void act.setProgress(entry, value); onClose(); } }} className="stack">
        <div className="field">
          <label htmlFor="prog">{entry.type === 'ANIME' ? 'Épisodes vus' : 'Dernier chapitre lu (décimal possible : 10,5)'}</label>
          <input id="prog" className="input" inputMode={entry.type === 'ANIME' ? 'numeric' : 'decimal'} autoFocus value={v} onChange={e => setV(e.target.value)} />
          {total ? <span className="small muted">Total : {total}</span> : <span className="small muted">Total inconnu (série en cours).</span>}
          {!valid && v.trim() !== '' && <span className="small" style={{ color: 'var(--danger)' }}>Valeur entre 0 et {total ?? '…'}.</span>}
        </div>
        <button type="submit" className="btn primary block" disabled={!valid}>Enregistrer</button>
      </form>
    </Sheet>
  );
}

function Notes({ entry }: { entry: LibraryEntry }) {
  const [v, setV] = useState(entry.notes);
  return (
    <div className="field" style={{ marginTop: 12 }}>
      <label htmlFor="notes">Notes personnelles</label>
      <textarea id="notes" className="input" maxLength={2000} value={v} onChange={e => setV(e.target.value)}
        onBlur={() => v !== entry.notes && void updateFields(entry.id, { notes: v })} />
    </div>
  );
}

const frDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function describe(ev: HistoryEvent, entry: Pick<LibraryEntry, 'type'>): string {
  const parts: string[] = [];
  if (ev.kind === 'add') return `Ajouté (${statusLabel(entry.type, ev.after.status ?? 'PLANNING')})`;
  if (ev.kind === 'remove') return 'Retiré de la bibliothèque';
  if (ev.after.progress !== undefined) parts.push(`${entry.type === 'ANIME' ? 'Ép.' : 'Ch.'} ${formatNumber(ev.before.progress ?? 0)} → ${formatNumber(ev.after.progress)}`);
  if (ev.after.status) parts.push(statusLabel(entry.type, ev.after.status));
  if (ev.after.score !== undefined) parts.push(ev.after.score === null ? 'Note retirée' : `Note ${formatNumber(ev.after.score)}/10`);
  return parts.join(' · ') || 'Modification';
}
