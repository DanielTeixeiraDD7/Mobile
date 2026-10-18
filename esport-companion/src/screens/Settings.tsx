import { useMemo } from 'react';
import { involvesFavorite } from '../core/filters';
import { SECTIONS, type Section } from '../data/db';
import { knownMatches } from '../data/feed';
import { getState, updateSettings, useStore } from '../data/store';
import { askPermission, buildIcs, notificationsSupported } from '../reminders';
import { goBack } from '../router';
import { TopBar } from '../ui/common';
import { download } from '../ui/files';
import { Icon } from '../ui/icons';
import { toast } from '../ui/toast';

const NAMES: Record<Section, string> = { live: 'En direct', favorites: 'Mes favoris', upcoming: 'À venir', results: 'Résultats récents' };

export function SettingsScreen() {
  const s = useStore(x => x.settings);
  const favorites = useStore(x => x.favorites);
  const upcomingFav = useMemo(() => knownMatches().filter(m => m.status === 'upcoming' && involvesFavorite(m, favorites)), [favorites]);
  const move = (i: number, d: -1 | 1) => {
    const a = [...s.sections]; const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j]!, a[i]!];
    void updateSettings({ sections: a });
  };
  const toggleNotify = async () => {
    if (s.notify) return updateSettings({ notify: false });
    const p = await askPermission();
    if (p === 'granted') { await updateSettings({ notify: true }); toast('Rappels activés (app ouverte uniquement).'); }
    else toast(p === 'unsupported' ? "Notifications indisponibles ici. Sur iPhone : app installée sur l'écran d'accueil, iOS 16.4+." : 'Notifications refusées dans les réglages du téléphone.');
  };

  return (
    <>
      <TopBar title="Réglages" back={() => goBack({ name: 'tab', tab: 'more' })} />
      <div className="card stack">
        <div className="row"><span className="grow">Thème</span>
          <select className="input" style={{ width: 'auto' }} value={s.theme} onChange={e => void updateSettings({ theme: e.target.value as 'dark' | 'light' })} aria-label="Thème"><option value="dark">Sombre</option><option value="light">Clair</option></select>
        </div>
        <label className="row"><span className="grow">Masquer les scores (anti-spoiler)<br /><span className="small muted">Un appui les révèle match par match.</span></span><input type="checkbox" checked={s.hideSpoilers} onChange={e => void updateSettings({ hideSpoilers: e.target.checked })} style={{ width: 22, height: 22, accentColor: 'var(--accent)' }} /></label>
      </div>

      <div className="section"><h2>Ordre de l'accueil</h2></div>
      <ul className="list card" style={{ padding: '0 14px' }}>
        {s.sections.map((sec, i) => (
          <li key={sec} className="row" style={{ borderBottom: i < s.sections.length - 1 ? '1px solid var(--line)' : 0 }}>
            <span className="grow" style={{ padding: '10px 0' }}>{NAMES[sec]}</span>
            <button type="button" className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Monter ${NAMES[sec]}`}><Icon name="up" /></button>
            <button type="button" className="icon-btn" disabled={i === s.sections.length - 1} onClick={() => move(i, 1)} aria-label={`Descendre ${NAMES[sec]}`}><Icon name="down" /></button>
          </li>
        ))}
      </ul>
      {s.sections.length < SECTIONS.length && <button type="button" className="btn small" onClick={() => void updateSettings({ sections: [...SECTIONS] })}>Réinitialiser</button>}

      <div className="section"><h2>Rappels des matchs favoris</h2></div>
      <div className="card stack small">
        <div className="row"><span className="grow">Prévenir</span>
          <select className="input" style={{ width: 'auto' }} value={s.reminderMinutes} onChange={e => void updateSettings({ reminderMinutes: Number(e.target.value) })} aria-label="Délai de rappel">
            {[0, 5, 10, 15, 30, 60].map(m => <option key={m} value={m}>{m ? `${m} min avant` : "à l'heure"}</option>)}
          </select>
        </div>
        <p style={{ margin: 0 }}><strong>Calendrier du téléphone</strong> (fiable, app fermée) : exporte les {upcomingFav.length} prochains matchs de tes favoris avec alerte.</p>
        <button type="button" className="btn primary block" disabled={!upcomingFav.length} onClick={() => void download(buildIcs(upcomingFav, getState().settings.reminderMinutes), 'esport-favoris.ics', 'text/calendar')}>Exporter (.ics)</button>
        <p style={{ margin: 0 }}><strong>Notifications de l'app</strong> : seulement quand l'app est ouverte (pas de serveur push, budget 0 €). Les horaires peuvent changer : l'export .ics n'est pas mis à jour tout seul.</p>
        <button type="button" className="btn block" onClick={() => void toggleNotify()} disabled={!notificationsSupported() && !s.notify}>{s.notify ? 'Désactiver' : notificationsSupported() ? 'Activer' : 'Non disponible ici'}</button>
      </div>
    </>
  );
}
