import { useId } from 'react';

export interface Pt { x: number; y: number | null }
export interface Series { name: string; color: string; points: Pt[] }

const W = 640, H = 220, L = 46, R = 10, T = 12, B = 26;

function niceStep(range: number, target = 4) {
  const raw = range / target;
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / p;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p;
}

/**
 * Graphique SVG accessible. `diff` : aire au-dessus/au-dessous de zéro avec deux couleurs.
 * Les points manquants (y = null) coupent la ligne : rien n'est interpolé.
 */
export function Chart({ series, diff, xFormat, yFormat, title, caption, posLabel, negLabel }: {
  series: Series[];
  diff?: { pos: string; neg: string };
  xFormat: (x: number) => string;
  yFormat: (y: number) => string;
  title: string;
  caption: string;
  posLabel?: string;
  negLabel?: string;
}) {
  const id = useId().replace(/:/g, '');
  const all = series.flatMap(s => s.points).filter((p): p is { x: number; y: number } => p.y !== null);
  if (all.length < 2) return <p className="small muted">Pas assez de points pour tracer « {title} ».</p>;
  const xMin = Math.min(...all.map(p => p.x)), xMax = Math.max(...all.map(p => p.x));
  let yMin = Math.min(...all.map(p => p.y)), yMax = Math.max(...all.map(p => p.y));
  if (diff) { const m = Math.max(Math.abs(yMin), Math.abs(yMax), 1); yMin = -m; yMax = m; }
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const step = niceStep(yMax - yMin);
  yMin = Math.floor(yMin / step) * step; yMax = Math.ceil(yMax / step) * step;
  const sx = (x: number) => L + ((x - xMin) / (xMax - xMin || 1)) * (W - L - R);
  const sy = (y: number) => T + (1 - (y - yMin) / (yMax - yMin)) * (H - T - B);
  const yTicks: number[] = []; for (let y = yMin; y <= yMax + 1e-9; y += step) yTicks.push(y);
  const xStep = niceStep(xMax - xMin, 6);
  const xTicks: number[] = []; for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) xTicks.push(x);

  // Segments continus (une valeur manquante coupe la ligne).
  const segments = (pts: Pt[]) => {
    const out: { x: number; y: number }[][] = [];
    let cur: { x: number; y: number }[] = [];
    for (const p of pts) { if (p.y === null) { if (cur.length) out.push(cur); cur = []; } else cur.push({ x: p.x, y: p.y }); }
    if (cur.length) out.push(cur);
    return out;
  };
  const missing = series.reduce((n, s) => n + s.points.filter(p => p.y === null).length, 0);
  const last = series[0]?.points.filter(p => p.y !== null).pop();

  return (
    <figure style={{ margin: 0 }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. ${caption}${last ? `. Dernière valeur : ${yFormat(last.y!)}` : ''}`}>
        <defs>
          {diff && <>
            <clipPath id={`p${id}`}><rect x={L} y={T} width={W - L - R} height={sy(0) - T} /></clipPath>
            <clipPath id={`n${id}`}><rect x={L} y={sy(0)} width={W - L - R} height={H - B - sy(0)} /></clipPath>
          </>}
        </defs>
        <g className="grid">
          {yTicks.map(y => <g key={y}><line x1={L} x2={W - R} y1={sy(y)} y2={sy(y)} className={y === 0 ? 'zero' : ''} strokeDasharray={y === 0 ? undefined : '2 4'} /><text x={L - 6} y={sy(y) + 3.5} textAnchor="end">{yFormat(y)}</text></g>)}
          {xTicks.map(x => <text key={x} x={sx(x)} y={H - 8} textAnchor="middle">{xFormat(x)}</text>)}
        </g>
        {series.map(s => segments(s.points).map((seg, i) => {
          const d = seg.map((p, j) => `${j ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('');
          if (diff) {
            const area = `${d}L${sx(seg[seg.length - 1]!.x).toFixed(1)},${sy(0)}L${sx(seg[0]!.x).toFixed(1)},${sy(0)}Z`;
            return <g key={s.name + i}>
              <path d={area} fill={diff.pos} opacity=".28" clipPath={`url(#p${id})`} />
              <path d={area} fill={diff.neg} opacity=".28" clipPath={`url(#n${id})`} />
              <path d={d} fill="none" stroke={diff.pos} strokeWidth="2" clipPath={`url(#p${id})`} />
              <path d={d} fill="none" stroke={diff.neg} strokeWidth="2" clipPath={`url(#n${id})`} />
            </g>;
          }
          return <path key={s.name + i} d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />;
        }))}
        {diff && posLabel && <text x={L + 6} y={T + 12} style={{ fill: diff.pos, fontWeight: 700 }}>▲ {posLabel}</text>}
        {diff && negLabel && <text x={L + 6} y={H - B - 6} style={{ fill: diff.neg, fontWeight: 700 }}>▼ {negLabel}</text>}
      </svg>
      <figcaption className="chart-cap">
        {!diff && series.map(s => <span key={s.name} className="legend"><i style={{ background: s.color }} />{s.name}</span>)}
        <span>{caption}</span>
        {missing > 0 && <span>· {missing} point(s) manquant(s), non interpolé(s)</span>}
      </figcaption>
    </figure>
  );
}

/** Barre de comparaison entre deux équipes. */
export function Compare({ label, a, b, format = (n: number) => String(n) }: { label: string; a: number | null; b: number | null; format?: (n: number) => string }) {
  if (a === null || b === null) return <div className="r"><span className="l">{a === null ? '—' : format(a)}</span><div className="bar"><span>{label} · non disponible</span></div><span className="rr">{b === null ? '—' : format(b)}</span></div>;
  const t = a + b || 1;
  return (
    <div className="r">
      <span className="l">{format(a)}</span>
      <div className="bar"><i className="a" style={{ width: `${(a / t) * 100}%` }} /><i className="b" style={{ width: `${(b / t) * 100}%` }} /><span>{label}</span></div>
      <span className="rr">{format(b)}</span>
    </div>
  );
}
