import { afterEach, describe, expect, it } from 'vitest';
import { BACKUP_VERSION, BackupError, createBackup, parseBackup, previewImport, resolveImport, sanitizeEntry } from '../src/domain/backup';
import { DEFAULT_SETTINGS } from '../src/domain/types';
import * as store from '../src/data/store';
import { entry, media } from './fixtures';

const a = entry({ media: media({ id: 1, title: { romaji: 'Shingeki no Kyojin', english: 'Attack on Titan', native: null } }), status: 'CURRENT', progress: 5, updatedAt: 100 });
const b = entry({ media: media({ id: 2, type: 'MANGA', chapters: null, episodes: null }), type: 'MANGA', status: 'CURRENT', progress: 10.5 });

describe('sauvegarde JSON', () => {
  it('aller-retour sans perte', () => {
    const json = JSON.stringify(createBackup([a, b], [], { ...DEFAULT_SETTINGS, titleLanguage: 'english', onboarded: true }));
    const p = parseBackup(json);
    expect(p.entries).toEqual([a, b]);
    expect(p.settings).toEqual({ titleLanguage: 'english', reminderMinutes: 15 });
    expect(p.invalid).toBe(0);
    expect(JSON.parse(json).schemaVersion).toBe(BACKUP_VERSION);
  });
  it('refuse les fichiers étrangers, corrompus ou trop récents', () => {
    expect(() => parseBackup('pas du json')).toThrow(BackupError);
    expect(() => parseBackup('{"foo":1}')).toThrow("n'est pas une sauvegarde");
    expect(() => parseBackup(JSON.stringify({ format: 'animepilot-backup', schemaVersion: 99, entries: [] }))).toThrow('plus récente');
    expect(() => parseBackup(JSON.stringify({ format: 'animepilot-backup', schemaVersion: 1 }))).toThrow('incomplète');
  });
  it('ignore les entrées invalides et compte les doublons du fichier', () => {
    const newer = { ...a, progress: 7, updatedAt: 200 };
    const p = parseBackup(JSON.stringify({ format: 'animepilot-backup', schemaVersion: 1, entries: [a, newer, { ...b, status: 'WATCHING' }, { foo: 1 }, null] }));
    expect(p.entries).toHaveLength(1);
    expect(p.entries[0]!.progress).toBe(7);
    expect(p.invalid).toBe(3);
    expect(p.duplicatesInFile).toBe(1);
  });
  it('normalise les valeurs (bornes, décimales, id recalculé)', () => {
    const e = sanitizeEntry({ ...a, id: 'pirate', progress: 99.7, notes: 'x'.repeat(5000) })!;
    expect(e.id).toBe('anilist:ANIME:1');
    expect(e.progress).toBe(12);
    expect(e.notes).toHaveLength(2000);
    expect(sanitizeEntry({ ...a, type: 'MANGA' })).toBeNull();
    expect(sanitizeEntry({ ...a, score: 11 })).toBeNull();
  });
  it('BOM accepté', () => {
    expect(parseBackup('﻿' + JSON.stringify(createBackup([a], [], DEFAULT_SETTINGS))).entries).toHaveLength(1);
  });
});

describe('aperçu et fusion', () => {
  const theirsA = { ...a, progress: 9, updatedAt: 300 };
  const twin = entry({ media: media({ id: 77, title: { romaji: 'Shingeki no Kyojin!', english: null, native: null } }) });
  const p = previewImport([a, b], [theirsA, { ...b }, twin]);
  it('classe nouveaux, identiques, conflits, doublons probables', () => {
    expect(p.added.map(e => e.mediaId)).toEqual([77]);
    expect(p.identical.map(e => e.mediaId)).toEqual([2]);
    expect(p.conflicts.map(c => c.theirs.progress)).toEqual([9]);
    expect(p.similar.map(s => s.mine.mediaId)).toEqual([1]);
  });
  it('stratégies', () => {
    expect(resolveImport(p, 'mine').map(e => e.mediaId)).toEqual([77]);
    expect(resolveImport(p, 'theirs').map(e => e.progress)).toEqual([0, 9]);
    expect(resolveImport(p, 'advanced').map(e => e.progress)).toEqual([0, 9]);
    const back = previewImport([theirsA], [a]);
    expect(resolveImport(back, 'advanced')).toEqual([]); // le mien est plus avancé
  });
});

describe('import en base', () => {
  afterEach(() => store.reset());
  it('fusion sans dupliquer l\'historique, puis remplacement total', async () => {
    await store.init('import-' + Math.random());
    await store.addToLibrary(a.media);
    const ev = store.getState().history[0]!;
    await store.importEntries([b], [ev, { ...ev, id: 'x', entryId: b.id }]);
    expect(store.getState().entries).toHaveLength(2);
    expect(store.getState().history.filter(h => h.id === ev.id)).toHaveLength(1);
    expect(store.getState().history.some(h => h.id === 'x')).toBe(true);
    await store.replaceLibrary([a], []);
    expect(store.getState().entries.map(e => e.id)).toEqual([a.id]);
    expect(store.getState().history).toEqual([]);
  });
});
