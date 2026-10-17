import { useState } from 'react';
import { updateSettings } from '../data/store';
import type { TitleLanguage } from '../domain/types';
import { navigate } from '../router';

const STEPS = [
  { emoji: '🧭', title: 'Bienvenue sur AnimePilot', text: 'Suis tes anime et manga : épisodes vus, chapitres lus (10,5 accepté), statuts, notes. Un appui sur + suffit, et tout s\'annule.' },
  { emoji: '📅', title: 'Calendrier et conseils', text: 'Les prochains épisodes de tes séries, ce que tu as en retard, un assistant qui répond à « que regarder ce soir ? » et des recommandations selon tes goûts.' },
  { emoji: '🔒', title: 'Privé, gratuit, hors-ligne', text: 'Tes données restent sur ton téléphone. Pas de compte, pas d\'abonnement. Internet ne sert qu\'à chercher des titres sur AniList. Pense à exporter une sauvegarde de temps en temps.' },
];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<TitleLanguage>('romaji');
  const last = step === STEPS.length;
  const finish = async (then?: () => void) => {
    await updateSettings({ onboarded: true, titleLanguage: lang });
    then?.();
  };

  return (
    <main className="app onboarding">
      <div className="dots" aria-hidden="true">{[...STEPS, null].map((_, i) => <i key={i} className={i === step ? 'on' : ''} />)}</div>
      {!last ? (
        <section className="ob-step" aria-live="polite">
          <div className="ob-emoji">{STEPS[step]!.emoji}</div>
          <h1>{STEPS[step]!.title}</h1>
          <p className="muted">{STEPS[step]!.text}</p>
        </section>
      ) : (
        <section className="ob-step">
          <div className="ob-emoji">🈁</div>
          <h1>Comment afficher les titres ?</h1>
          <div className="stack" role="radiogroup" aria-label="Langue des titres">
            {([['romaji', 'Romaji', 'Shingeki no Kyojin'], ['english', 'Anglais', 'Attack on Titan'], ['native', 'Japonais', '進撃の巨人']] as const).map(([v, l, ex]) => (
              <button key={v} type="button" role="radio" aria-checked={lang === v} className={`btn block choice ${lang === v ? 'selected' : ''}`} onClick={() => setLang(v)}>
                <span>{l}</span><span className="muted small">{ex}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="ob-actions stack">
        {!last ? (
          <>
            <button type="button" className="btn primary block" onClick={() => setStep(step + 1)}>Continuer</button>
            <button type="button" className="btn ghost block" onClick={() => setStep(STEPS.length)}>Passer</button>
          </>
        ) : (
          <>
            <button type="button" className="btn primary block" onClick={() => void finish(() => navigate({ name: 'search', type: 'ANIME' }, true))}>Ajouter mon premier anime</button>
            <button type="button" className="btn block" onClick={() => void finish(() => navigate({ name: 'data' }, true))}>Importer une sauvegarde</button>
            <button type="button" className="btn ghost block" onClick={() => void finish(() => navigate({ name: 'tab', tab: 'home' }, true))}>Plus tard</button>
          </>
        )}
      </div>
    </main>
  );
}
