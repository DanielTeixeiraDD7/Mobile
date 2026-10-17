import { useEffect, useState } from 'react';
import { updateSettings, useStore } from '../data/store';
import { behind, dayLabel, groupByDay } from '../domain/calendar';
import { mediaTitle, statusLabel } from '../domain/labels';
import type { TitleLanguage } from '../domain/types';
import { useAiring, type AiringRow } from '../hooks/useAiring';
import { useOnline } from '../hooks/useOnline';
import { askPermission, exportIcs, notificationsSupported } from '../reminders';
import { navigate } from '../router';
import { Icon } from '../ui/icons';
import { Poster } from '../ui/Poster';
import { Sheet } from '../ui/Sheet';
import { toast } from '../ui/toast';

const time = (sec: number) => new Date(sec * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export function CalendarScreen() {
  const [reload, setReload] = useState(0);
  const airing = useAiring(reload);
  const settings = useStore(s => s.settings);
  const entries = useStore(s => s.entries);
  const online = useOnline();
  const [sheet, setSheet] = useState(false);
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => { const t = setInterval(() => setNow(Date.now() / 1000), 60_000); return () => clearInterval(t); }, []);

  const hasAnime = entries.some(e => e.type === 'ANIME');
  const late = entries.filter(e => behind(e, now) > 0);
  const days = groupByDay(airing.rows);

  return (
    <>
      <header className="topbar">
        <h1>Calendrier</h1>
        <button type="button" className="icon-btn" onClick={() => setSheet(true)} aria-label="Rappels"><Icon name="bell" /></button>
      </header>

      {airing.source === 'cache' && <div className="banner warn">Horaires enregistrés (AniList injoignable).</div>}
      {airing.source === 'local' && airing.error && <div className="banner warn">{airing.error} Affichage du prochain épisode connu de chaque titre.</div>}
      {!online && airing.source === 'api' && <div className="banner warn">Hors-ligne.</div>}

      {late.length > 0 && (
        <div className="card">
          <p className="label" style={{ marginTop: 0 }}>En retard</p>
          {late.map(e => (
            <button key={e.id} type="button" className="late" onClick={() => navigate({ name: 'media', type: e.type, id: e.mediaId })}>
              <span className="grow ellipsis">{mediaTitle(e.media, settings.titleLanguage)}</span>
              <span className="tag">{behind(e, now)} ép.</span>
            </button>
          ))}
        </div>
      )}

      {airing.status === 'loading' && airing.rows.length === 0 && <p className="muted" aria-live="polite">Chargement des diffusions…</p>}
      {airing.status !== 'loading' && airing.rows.length === 0 && (
        <div className="empty">
          <div className="big">📅</div>
          <p>{hasAnime ? 'Aucun épisode de tes anime suivis cette semaine.' : 'Ajoute des anime en cours de diffusion pour voir leurs épisodes ici.'}</p>
          {!hasAnime && <button type="button" className="btn primary" onClick={() => navigate({ name: 'search', type: 'ANIME' })}>Chercher un anime</button>}
        </div>
      )}

      {days.map(d => (
        <section key={d.day}>
          <div className="section"><h2>{dayLabel(d.day)}</h2></div>
          <ul className="entries">{d.items.map(r => <AiringLine key={`${r.mediaId}-${r.episode}`} row={r} now={now} lang={settings.titleLanguage} />)}</ul>
        </section>
      ))}

      {airing.rows.length > 0 && (
        <p className="dim small" style={{ marginTop: 16 }}>Heures de diffusion au Japon converties à ton fuseau (AniList). La sortie en streaming peut être décalée.</p>
      )}
      {airing.status === 'done' && online && <button type="button" className="btn ghost block" onClick={() => setReload(r => r + 1)}>Actualiser</button>}

      {sheet && <RemindersSheet rows={airing.rows} onClose={() => setSheet(false)} />}
    </>
  );
}

function AiringLine({ row, now, lang }: { row: AiringRow; now: number; lang: TitleLanguage }) {
  const title = mediaTitle(row.entry.media, lang);
  const aired = row.airingAt <= now;
  return (
    <li className="entry">
      <button type="button" className="entry-main" onClick={() => navigate({ name: 'media', type: 'ANIME', id: row.mediaId })}>
        <Poster src={row.entry.media.cover} color={row.entry.media.coverColor} title={title} size="sm" />
        <span className="grow">
          <span className="entry-title clamp2">{title}</span>
          <span className="small muted">Ép. {row.episode} · {time(row.airingAt)} · {aired ? 'sorti' : 'à venir'}</span>
          <span className="small dim">{statusLabel('ANIME', row.entry.status)} · vu jusqu'à l'ép. {row.entry.progress}</span>
        </span>
      </button>
    </li>
  );
}

function RemindersSheet({ rows, onClose }: { rows: AiringRow[]; onClose: () => void }) {
  const settings = useStore(s => s.settings);
  const supported = notificationsSupported();
  const toggle = async () => {
    if (settings.notify) return updateSettings({ notify: false });
    const p = await askPermission();
    if (p === 'granted') { await updateSettings({ notify: true }); toast('Rappels activés (app ouverte).'); }
    else if (p === 'unsupported') toast("Notifications non disponibles ici. Sur iPhone : installe l'app sur l'écran d'accueil (iOS 16.4+).", { kind: 'error', duration: 6000 });
    else toast('Notifications refusées dans les réglages du téléphone.', { kind: 'error' });
  };
  return (
    <Sheet title="Rappels" onClose={onClose}>
      <div className="stack">
        <div className="field">
          <label htmlFor="rem">Prévenir avant la diffusion</label>
          <select id="rem" className="input" value={settings.reminderMinutes} onChange={e => void updateSettings({ reminderMinutes: Number(e.target.value) })}>
            {[0, 5, 15, 30, 60, 120].map(m => <option key={m} value={m}>{m === 0 ? "À l'heure exacte" : `${m} min avant`}</option>)}
          </select>
        </div>
        <div className="card">
          <p style={{ marginTop: 0 }}><strong>Calendrier du téléphone</strong> (recommandé)</p>
          <p className="small muted">Exporte les épisodes à venir (7 jours) vers l'app Calendrier : les alertes fonctionnent même app fermée. À refaire chaque semaine.</p>
          <button type="button" className="btn primary block" onClick={() => void exportIcs(rows, settings)} disabled={rows.length === 0}>Exporter (.ics)</button>
        </div>
        <div className="card">
          <p style={{ marginTop: 0 }}><strong>Notifications de l'app</strong></p>
          <p className="small muted">Uniquement quand AnimePilot est ouvert ou en arrière-plan récent : iOS arrête les apps web fermées et il n'y a pas de serveur de notifications (gratuit = local).</p>
          <button type="button" className="btn block" onClick={() => void toggle()} disabled={!supported && !settings.notify}>
            {settings.notify ? 'Désactiver' : supported ? 'Activer' : 'Non disponible sur ce navigateur'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
