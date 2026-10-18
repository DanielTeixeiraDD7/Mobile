import type { Line } from '../core/analysis';

const LABEL = { fact: 'Fait', calc: 'Calcul', interp: 'Interprétation' } as const;

export function Analysis({ lines, title = 'Analyse automatique' }: { lines: Line[]; title?: string }) {
  if (!lines.length) return null;
  return (
    <div className="card analysis">
      <p className="label" style={{ marginTop: 0 }}>{title}</p>
      {lines.map((l, i) => <p key={i}><span className={`k ${l.kind}`}>{LABEL[l.kind]}</span>{l.text}</p>)}
      <p className="tiny dim" style={{ marginBottom: 0 }}>Générée localement à partir des seules données affichées. Pas de prédiction.</p>
    </div>
  );
}
