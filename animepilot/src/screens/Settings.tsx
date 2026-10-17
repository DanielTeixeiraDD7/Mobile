import { updateSettings, useStore } from '../data/store';
import type { TitleLanguage } from '../domain/types';
import { goBack } from '../router';
import { Icon } from '../ui/icons';

export const APP_VERSION = '1.0.0';

export function SettingsScreen() {
  const settings = useStore(s => s.settings);
  return (
    <>
      <header className="topbar">
        <button type="button" className="icon-btn back" onClick={() => goBack({ name: 'tab', tab: 'profile' })} aria-label="Retour"><Icon name="back" /></button>
        <h1>Réglages</h1>
      </header>
      <div className="card stack">
        <div className="field">
          <label htmlFor="lang">Langue des titres</label>
          <select id="lang" className="input" value={settings.titleLanguage} onChange={e => void updateSettings({ titleLanguage: e.target.value as TitleLanguage })}>
            <option value="romaji">Romaji (Shingeki no Kyojin)</option>
            <option value="english">Anglais (Attack on Titan)</option>
            <option value="native">Japonais (進撃の巨人)</option>
          </select>
          <span className="small muted">Si le titre n'existe pas dans cette langue, le romaji est utilisé.</span>
        </div>
        <div className="field">
          <label htmlFor="rem2">Rappel avant diffusion</label>
          <select id="rem2" className="input" value={settings.reminderMinutes} onChange={e => void updateSettings({ reminderMinutes: Number(e.target.value) })}>
            {[0, 5, 15, 30, 60, 120].map(m => <option key={m} value={m}>{m === 0 ? "À l'heure exacte" : `${m} min avant`}</option>)}
          </select>
        </div>
      </div>

      <div className="section"><h2>À propos</h2></div>
      <div className="card small stack about">
        <p>AnimePilot {APP_VERSION} · application personnelle, gratuite, sans compte ni publicité.</p>
        <p><strong>Tes données</strong> restent sur ce téléphone (IndexedDB). Seules les recherches de titres sont envoyées à AniList. Aucun suivi, aucune statistique d'usage.</p>
        <p><strong>Catalogue</strong> : <a href="https://anilist.co" target="_blank" rel="noopener noreferrer">AniList</a> (API publique, usage non commercial). AnimePilot n'est pas affilié à AniList. Contenu adulte exclu des recherches.</p>
        <p><strong>Assistant et recommandations</strong> : calculés localement par des règles, sans IA en ligne.</p>
        <button type="button" className="btn block" onClick={() => void updateSettings({ onboarded: false })}>Revoir la présentation</button>
      </div>
    </>
  );
}
