import { useState } from 'react';
import { useStore } from '../data/store';
import { answer, HELP, type Answer } from '../domain/assistant';
import { mediaTitle } from '../domain/labels';
import { navigate } from '../router';

interface Turn { q: string; a: Answer }

export function Assistant() {
  const entries = useStore(s => s.entries);
  const history = useStore(s => s.history);
  const lang = useStore(s => s.settings.titleLanguage);
  const [q, setQ] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);

  const ask = (text: string) => {
    if (!text.trim()) return;
    const a = answer(text, { entries, history, lang, now: Date.now() });
    setTurns(t => [{ q: text, a }, ...t].slice(0, 5));
    setQ('');
  };

  return (
    <div className="card assistant">
      <p className="small dim" style={{ marginTop: 0 }}>Assistant local à règles · fonctionne hors-ligne · pas d'IA en ligne</p>
      <form className="row" onSubmit={e => { e.preventDefault(); ask(q); }}>
        <input className="input grow" value={q} onChange={e => setQ(e.target.value)} placeholder="Que regarder ce soir ?" aria-label="Question à l'assistant" enterKeyHint="send" />
        <button type="submit" className="btn primary" disabled={!q.trim()}>Demander</button>
      </form>
      {turns.length === 0 && (
        <div className="chips" style={{ marginTop: 10 }}>
          {HELP.slice(0, 5).map(h => <button key={h} type="button" className="chip" onClick={() => ask(h)}>{h}</button>)}
        </div>
      )}
      {turns.map((t, i) => (
        <div key={turns.length - i} className="turn">
          <p className="q">{t.q}</p>
          <p className="a" aria-live={i === 0 ? 'polite' : undefined}>{t.a.text}</p>
          {t.a.entries && t.a.entries.length > 0 && (
            <div className="chips">
              {t.a.entries.map(e => <button key={e.id} type="button" className="chip" onClick={() => navigate({ name: 'media', type: e.type, id: e.mediaId })}>{mediaTitle(e.media, lang)}</button>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
