import { useRef, useState } from 'react';
import { clearCache } from '../api/cache';
import { getDb, getState, importEntries, replaceLibrary, updateSettings, useStore } from '../data/store';
import { backupFileName, BackupError, createBackup, parseBackup, previewImport, resolveImport, type ImportPreview, type ParsedBackup, type Strategy } from '../domain/backup';
import { mediaTitle } from '../domain/labels';
import { goBack } from '../router';
import { Icon } from '../ui/icons';
import { Sheet } from '../ui/Sheet';
import { toast } from '../ui/toast';

async function exportBackup() {
  const { entries, history, settings } = getState();
  const file = new File([JSON.stringify(createBackup(entries, history, settings), null, 1)], backupFileName(), { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Sauvegarde AnimePilot' }); return; }
    catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  toast(`Sauvegarde exportée (${entries.length} titres).`);
}

export function DataScreen() {
  const entries = useStore(s => s.entries);
  const lang = useStore(s => s.settings.titleLanguage);
  const input = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedBackup | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [strategy, setStrategy] = useState<Strategy | 'replace'>('advanced');
  const [error, setError] = useState<string | null>(null);
  const [reset, setReset] = useState(false);

  const onFile = async (f: File | undefined) => {
    setError(null); setParsed(null); setPreview(null);
    if (!f) return;
    if (f.size > 20_000_000) return setError('Fichier trop volumineux (20 Mo max).');
    try {
      const p = parseBackup(await f.text());
      setParsed(p);
      setPreview(previewImport(getState().entries, p.entries));
    } catch (e) {
      setError(e instanceof BackupError ? e.message : 'Lecture du fichier impossible.');
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  const apply = async () => {
    if (!parsed || !preview) return;
    if (strategy === 'replace') {
      await replaceLibrary(parsed.entries, parsed.history);
      toast(`Bibliothèque remplacée : ${parsed.entries.length} titres.`);
    } else {
      const list = resolveImport(preview, strategy);
      await importEntries(list, parsed.history);
      toast(`${list.length} titre(s) importé(s) ou mis à jour.`);
    }
    if (Object.keys(parsed.settings).length) await updateSettings(parsed.settings);
    setParsed(null); setPreview(null);
  };

  return (
    <>
      <header className="topbar">
        <button type="button" className="icon-btn back" onClick={() => goBack({ name: 'tab', tab: 'profile' })} aria-label="Retour"><Icon name="back" /></button>
        <h1>Données</h1>
      </header>

      <div className="card stack">
        <p style={{ margin: 0 }}><strong>Exporter</strong></p>
        <p className="small muted" style={{ margin: 0 }}>Fichier JSON (format versionné v1) : bibliothèque, historique, préférences. À garder dans Fichiers / iCloud Drive : c'est ta seule copie en dehors du téléphone.</p>
        <button type="button" className="btn primary block" onClick={() => void exportBackup()} disabled={entries.length === 0}>Exporter ({entries.length} titres)</button>
      </div>

      <div className="card stack">
        <p style={{ margin: 0 }}><strong>Importer</strong></p>
        <p className="small muted" style={{ margin: 0 }}>Un aperçu s'affiche avant toute modification.</p>
        <input ref={input} type="file" accept="application/json,.json" className="sr-only" id="import-file" onChange={e => void onFile(e.target.files?.[0])} />
        <label htmlFor="import-file" className="btn block">Choisir un fichier…</label>
        {error && <div className="banner error" role="alert">{error}</div>}
      </div>

      {parsed && preview && (
        <div className="card stack" aria-live="polite">
          <p style={{ margin: 0 }}><strong>Aperçu</strong>{parsed.exportedAt && <span className="muted small"> · sauvegarde du {new Date(parsed.exportedAt).toLocaleString('fr-FR')}</span>}</p>
          <ul className="small preview">
            <li><strong>{preview.added.length}</strong> nouveau(x) titre(s)</li>
            <li><strong>{preview.identical.length}</strong> identique(s) (ignorés)</li>
            <li><strong>{preview.conflicts.length}</strong> différent(s) de ta version</li>
            {parsed.duplicatesInFile > 0 && <li>{parsed.duplicatesInFile} doublon(s) dans le fichier (version la plus récente gardée)</li>}
            {parsed.invalid > 0 && <li className="warn-text">{parsed.invalid} entrée(s) invalide(s) ignorée(s)</li>}
          </ul>
          {preview.similar.length > 0 && (
            <div className="banner warn">
              Doublons probables (même titre, autre fiche AniList) :
              <ul className="small">{preview.similar.slice(0, 5).map(s => <li key={s.theirs.id}>{mediaTitle(s.theirs.media, lang)} ↔ {mediaTitle(s.mine.media, lang)}</li>)}</ul>
              Ils seront ajoutés ; retire celui en trop ensuite si besoin.
            </div>
          )}
          {preview.conflicts.length > 0 && (
            <ul className="small conflicts">
              {preview.conflicts.slice(0, 8).map(c => (
                <li key={c.mine.id}>{mediaTitle(c.mine.media, lang)} : toi {c.mine.progress}, fichier {c.theirs.progress}</li>
              ))}
              {preview.conflicts.length > 8 && <li>… et {preview.conflicts.length - 8} autre(s)</li>}
            </ul>
          )}
          <fieldset className="radios">
            <legend className="label">En cas de différence</legend>
            {([
              ['advanced', 'Garder la progression la plus avancée'],
              ['theirs', 'Prendre la version du fichier'],
              ['mine', 'Garder ma version'],
              ['replace', 'Tout remplacer par le fichier (efface le reste)'],
            ] as const).map(([v, l]) => (
              <label key={v}><input type="radio" name="strategy" checked={strategy === v} onChange={() => setStrategy(v)} /> {l}</label>
            ))}
          </fieldset>
          <div className="row">
            <button type="button" className="btn grow" onClick={() => { setParsed(null); setPreview(null); }}>Annuler</button>
            <button type="button" className={`btn grow ${strategy === 'replace' ? 'danger' : 'primary'}`} onClick={() => void apply()}>Importer</button>
          </div>
        </div>
      )}

      <div className="card stack">
        <p style={{ margin: 0 }}><strong>Cache AniList</strong></p>
        <p className="small muted" style={{ margin: 0 }}>Recherches et fiches enregistrées pour le hors-ligne (300 max). Ta bibliothèque n'est pas touchée.</p>
        <button type="button" className="btn block" onClick={() => void clearCache(getDb()).then(() => toast('Cache vidé.'))}>Vider le cache</button>
      </div>

      <button type="button" className="btn ghost danger block" style={{ marginTop: 12 }} onClick={() => setReset(true)}>Tout effacer…</button>
      {reset && (
        <Sheet title="Tout effacer ?" onClose={() => setReset(false)}>
          <p className="muted">Bibliothèque et historique seront supprimés de ce téléphone. Exporte d'abord une sauvegarde si tu veux pouvoir revenir en arrière.</p>
          <div className="stack">
            <button type="button" className="btn block" onClick={() => void exportBackup()}>Exporter d'abord</button>
            <button type="button" className="btn danger block" onClick={() => { setReset(false); void replaceLibrary([], []).then(() => toast('Données effacées.')); }}>Effacer définitivement</button>
          </div>
        </Sheet>
      )}
    </>
  );
}
