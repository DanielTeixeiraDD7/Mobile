import { useRef, useState } from 'react';
import { BackupError, createBackup, mergeBackup, parseBackup, type ParsedBackup } from '../core/backup';
import { csvToMatches, matchesToCsv, probableDuplicate, type ImportRow } from '../core/csv';
import { knownMatches } from '../data/feed';
import { deleteManual, getState, restore, saveManual, useStore } from '../data/store';
import { DEFS } from '../games/defs';
import { goBack } from '../router';
import { Banner, GameBadge, TopBar } from '../ui/common';
import { download } from '../ui/files';
import { when } from '../ui/format';
import { toast } from '../ui/toast';

const TEMPLATE = '﻿jeu;date_utc;competition;phase;equipe1;equipe2;score1;score2;format_bo;statut\r\ncs2;2026-10-12T18:00:00Z;Exemple Cup (FICTIF);Finale;Équipe A;Équipe B;2;1;3;\r\n';

export function DataScreen() {
  const manual = useStore(s => s.manual);
  const favorites = useStore(s => s.favorites);
  const jsonIn = useRef<HTMLInputElement>(null);
  const csvIn = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<ParsedBackup | null>(null);
  const [rows, setRows] = useState<{ origin: string; rows: ImportRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const exportJson = () => {
    const s = getState();
    void download(JSON.stringify(createBackup(s), null, 1), `esport-companion-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };
  const readJson = async (f?: File) => {
    setError(null); setBackup(null);
    if (!f) return;
    try { setBackup(parseBackup(await f.text())); } catch (e) { setError(e instanceof BackupError ? e.message : 'Lecture impossible.'); }
    if (jsonIn.current) jsonIn.current.value = '';
  };
  const readCsv = async (f?: File) => {
    setError(null); setRows(null);
    if (!f) return;
    if (f.size > 5_000_000) return setError('Fichier trop volumineux (5 Mo max).');
    setRows({ origin: f.name, rows: csvToMatches(await f.text(), f.name) });
    if (csvIn.current) csvIn.current.value = '';
  };
  const applyCsv = async () => {
    if (!rows) return;
    const ok = rows.rows.filter(r => r.match).map(r => ({ id: r.match!.id, match: r.match!, importedAt: Date.now(), origin: rows.origin }));
    await saveManual(ok);
    toast(`${ok.length} résultat(s) importé(s).`);
    setRows(null);
  };
  const applyBackup = async (mode: 'merge' | 'replace') => {
    if (!backup) return;
    if (mode === 'replace') await restore({ settings: { ...getState().settings, ...backup.settings }, favorites: backup.favorites, manual: backup.manual, views: backup.views });
    else {
      const s = getState();
      const m = mergeBackup(s, backup);
      await restore({ settings: s.settings, favorites: m.favorites, manual: m.manual, views: m.views });
      toast(`${m.added} élément(s) ajouté(s), ${m.duplicates} déjà présent(s).`);
    }
    setBackup(null);
  };

  const existing = knownMatches();
  const okRows = rows?.rows.filter(r => r.match) ?? [];
  const badRows = rows?.rows.filter(r => !r.match) ?? [];

  return (
    <>
      <TopBar title="Données" back={() => goBack({ name: 'tab', tab: 'more' })} />
      <div className="card stack small">
        <strong>Sauvegarde (JSON v1)</strong>
        <p className="muted" style={{ margin: 0 }}>Favoris ({favorites.length}), réglages, vues enregistrées et résultats importés ({manual.length}). Le cache des API n'est pas inclus.</p>
        <button type="button" className="btn primary block" onClick={exportJson}>Exporter la sauvegarde</button>
        <input ref={jsonIn} id="json-in" type="file" accept="application/json,.json" className="sr-only" onChange={e => void readJson(e.target.files?.[0])} />
        <label htmlFor="json-in" className="btn block">Restaurer une sauvegarde…</label>
      </div>
      {backup && (
        <div className="card stack small" aria-live="polite">
          <strong>Aperçu{backup.exportedAt ? ` · sauvegarde du ${new Date(backup.exportedAt).toLocaleString('fr-FR')}` : ''}</strong>
          <p style={{ margin: 0 }}>{backup.favorites.length} favori(s) · {backup.manual.length} résultat(s) importé(s) · {backup.views.length} vue(s){backup.invalid ? ` · ${backup.invalid} élément(s) invalide(s) ignoré(s)` : ''}</p>
          <div className="row"><button type="button" className="btn grow" onClick={() => void applyBackup('merge')}>Fusionner</button><button type="button" className="btn danger grow" onClick={() => void applyBackup('replace')}>Remplacer tout</button></div>
          <button type="button" className="btn ghost small" onClick={() => setBackup(null)}>Annuler</button>
        </div>
      )}

      <div className="card stack small">
        <strong>Importer des résultats (CSV)</strong>
        <p className="muted" style={{ margin: 0 }}>Pour les jeux sans source gratuite (CS2, Rocket League…) ou pour compléter tes archives. Colonnes : jeu, date_utc, competition, phase, equipe1, equipe2, score1, score2, format_bo, statut. Séparateur ; ou ,. Toujours marqués « importé ».</p>
        <input ref={csvIn} id="csv-in" type="file" accept=".csv,text/csv" className="sr-only" onChange={e => void readCsv(e.target.files?.[0])} />
        <div className="row"><label htmlFor="csv-in" className="btn grow">Choisir un CSV…</label><button type="button" className="btn ghost" onClick={() => void download(TEMPLATE, 'modele-resultats.csv', 'text/csv;charset=utf-8')}>Modèle</button></div>
        <button type="button" className="btn block" onClick={() => setAdding(a => !a)}>{adding ? 'Fermer la saisie' : 'Saisir un résultat à la main'}</button>
      </div>
      {error && <Banner kind="error">{error}</Banner>}
      {adding && <ManualForm onDone={() => setAdding(false)} />}
      {rows && (
        <div className="card stack small" aria-live="polite">
          <strong>Aperçu de « {rows.origin} »</strong>
          <p style={{ margin: 0 }}>{okRows.length} ligne(s) valide(s) · {badRows.length} en erreur</p>
          {badRows.length > 0 && <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--loss)' }}>{badRows.slice(0, 10).map(r => <li key={r.line}>Ligne {r.line} : {r.errors.join(' ')}</li>)}</ul>}
          {okRows.slice(0, 8).map(r => {
            const dup = probableDuplicate(r.match!, existing);
            const already = manual.some(m => m.id === r.match!.id);
            return <p key={r.line} style={{ margin: 0 }}><GameBadge game={r.match!.game} /> {r.match!.sides[0].team?.name} {r.match!.sides[0].score ?? ''}–{r.match!.sides[1].score ?? ''} {r.match!.sides[1].team?.name} · {when(r.match!.startTime)}
              {already && <span className="tag"> déjà importé (remplacé)</span>}{dup && <span className="tag inferred" title={`Source : ${dup.source}`}> doublon probable d'une donnée {dup.source}</span>}</p>;
          })}
          {okRows.length > 8 && <p className="dim" style={{ margin: 0 }}>… et {okRows.length - 8} autre(s)</p>}
          <p className="dim" style={{ margin: 0 }}>Les doublons probables sont importés à part (jamais fusionnés avec la donnée de la source).</p>
          <div className="row"><button type="button" className="btn grow" onClick={() => setRows(null)}>Annuler</button><button type="button" className="btn primary grow" disabled={!okRows.length} onClick={() => void applyCsv()}>Importer {okRows.length}</button></div>
        </div>
      )}

      {manual.length > 0 && (
        <>
          <div className="section"><h2>Résultats importés</h2><span className="count">{manual.length}</span></div>
          <ul className="list card" style={{ padding: '0 14px' }}>
            {[...manual].sort((a, b) => (b.match.startTime ?? 0) - (a.match.startTime ?? 0)).map(m => (
              <li key={m.id} className="row">
                <span className="grow small" style={{ padding: '9px 0' }}><GameBadge game={m.match.game} /> {m.match.sides[0].team?.name} {m.match.sides[0].score ?? ''}–{m.match.sides[1].score ?? ''} {m.match.sides[1].team?.name}<br /><span className="dim">{when(m.match.startTime)} · {m.origin}</span></span>
                <button type="button" className="btn small danger" onClick={() => void deleteManual(m.id)}>Supprimer</button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="section"><h2>Export</h2></div>
      <button type="button" className="btn block" onClick={() => { const l = knownMatches(); void download(matchesToCsv(l), `matchs-charges-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8'); toast(`${l.length} matchs exportés.`); }}>
        Exporter tous les matchs chargés (CSV)
      </button>
    </>
  );
}

function ManualForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ game: 'cs2', date: new Date().toISOString().slice(0, 16), comp: '', t1: '', t2: '', s1: '', s2: '', bo: '3' });
  const up = (p: Partial<typeof f>) => setF(x => ({ ...x, ...p }));
  const csv = `jeu;date_utc;competition;equipe1;equipe2;score1;score2;format_bo\n${f.game};${f.date ? new Date(f.date).toISOString() : ''};${f.comp};${f.t1};${f.t2};${f.s1};${f.s2};${f.bo}`;
  const parsed = csvToMatches(csv, 'saisie manuelle')[0]!;
  return (
    <form className="card stack small" onSubmit={e => { e.preventDefault(); if (!parsed.match) return; void saveManual([{ id: parsed.match.id, match: parsed.match, importedAt: Date.now(), origin: 'saisie manuelle' }]).then(() => { toast('Résultat ajouté (marqué « importé »).'); onDone(); }); }}>
      <strong>Nouveau résultat</strong>
      <div className="row wrap">
        <select className="input" style={{ flex: '1 1 140px' }} value={f.game} onChange={e => up({ game: e.target.value })} aria-label="Jeu">{Object.values(DEFS).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <input className="input" style={{ flex: '1 1 180px' }} type="datetime-local" value={f.date} onChange={e => up({ date: e.target.value })} aria-label="Date et heure (heure locale)" />
      </div>
      <input className="input" placeholder="Compétition" value={f.comp} onChange={e => up({ comp: e.target.value })} aria-label="Compétition" />
      <div className="row"><input className="input grow" placeholder="Équipe 1" value={f.t1} onChange={e => up({ t1: e.target.value })} aria-label="Équipe 1" /><input className="input" style={{ width: 64 }} inputMode="numeric" placeholder="0" value={f.s1} onChange={e => up({ s1: e.target.value })} aria-label="Score équipe 1" /></div>
      <div className="row"><input className="input grow" placeholder="Équipe 2" value={f.t2} onChange={e => up({ t2: e.target.value })} aria-label="Équipe 2" /><input className="input" style={{ width: 64 }} inputMode="numeric" placeholder="0" value={f.s2} onChange={e => up({ s2: e.target.value })} aria-label="Score équipe 2" /></div>
      <select className="input" value={f.bo} onChange={e => up({ bo: e.target.value })} aria-label="Format">{[1, 2, 3, 5, 7].map(n => <option key={n} value={n}>BO{n}</option>)}</select>
      {!parsed.match && (f.t1 || f.t2) && <p style={{ margin: 0, color: 'var(--loss)' }}>{parsed.errors.join(' ')}</p>}
      <button type="submit" className="btn primary block" disabled={!parsed.match}>Ajouter</button>
    </form>
  );
}
