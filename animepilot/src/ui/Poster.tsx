import { useState } from 'react';

/** Affiche AniList ; sans image (ou si elle échoue), un bloc neutre avec l'initiale — jamais d'image inventée. */
export function Poster({ src, color, title, size = 'md' }: { src: string | null; color: string | null; title: string; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false);
  const style = { background: color ?? 'var(--card-2)' };
  if (!src || failed) {
    return <div className={`poster ${size} placeholder`} style={style} role="img" aria-label={`Pas d'affiche : ${title}`}><span>{title.trim().charAt(0).toUpperCase()}</span></div>;
  }
  return (
    <div className={`poster ${size}`} style={style}>
      <img src={src} alt="" loading="lazy" decoding="async" crossOrigin="anonymous" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    </div>
  );
}
