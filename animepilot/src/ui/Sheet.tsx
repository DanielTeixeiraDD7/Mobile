import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './icons';

/** Feuille modale (dialog natif : focus piégé, Échap pour fermer). */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal?.();
    return () => d?.close?.();
  }, []);
  return (
    <dialog ref={ref} className="sheet" aria-label={title} onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => { if (e.target === ref.current) onClose(); }}>
      <div className="sheet-body">
        <header className="row">
          <h2 className="grow">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer"><Icon name="close" /></button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
