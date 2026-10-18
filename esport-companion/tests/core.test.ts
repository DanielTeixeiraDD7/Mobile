import { describe, expect, it } from 'vitest';
import { checkMatch, dedupeMatches, validateInferredWinners } from '../src/core/quality';
import { bracketRounds, byDay, dashboard, filterMatches, involvesFavorite, sortMatches, DEFAULT_FILTERS } from '../src/core/filters';
import { headToHead, leadChanges, leads, summarizeGame, summarizeSeries, teamForm } from '../src/core/analysis';
import { csvToMatches, matchesToCsv, parseCsv, probableDuplicate } from '../src/core/csv';
import { createBackup, mergeBackup, parseBackup, BackupError } from '../src/core/backup';
import { buildIcs } from '../src/reminders';
import { clock, countdown, when } from '../src/ui/format';
import { DEFAULT_SETTINGS, type Favorite } from '../src/data/db';
import { fakeMatch } from './fixtures/fake';

const NOW = Date.UTC(2026, 9, 18, 12);
const H = 3_600_000;

describe('qualité des données', () => {
  it('match cohérent : aucune alerte', () => expect(checkMatch(fakeMatch(), [])).toEqual([]));
  it('détecte score incompatible, vainqueur incohérent, même équipe, durée impossible', () => {
    const bad = fakeMatch({ sides: [
      { team: { id: 'lol:ALP', name: 'A', code: null, image: null }, score: 1, winner: true, record: null },
      { team: { id: 'lol:ALP', name: 'A', code: null, image: null }, score: 2, winner: false, record: null },
    ] });
    const codes = checkMatch(bad, [{ id: 'g', number: 1, status: 'finished', winner: 0, sideNames: [null, null], map: null, duration: 99999, vods: [] }]).map(q => q.code);
    expect(codes).toEqual(expect.arrayContaining(['winner-score', 'same-team', 'games-count', 'duration']));
  });
  it('doublons : uniquement par identifiant, la version la plus récente gagne', () => {
    const a = fakeMatch({ prov: { source: 't', kind: 'official', fetchedAt: 1, confidence: 'high' } });
    const b = fakeMatch({ prov: { source: 't', kind: 'official', fetchedAt: 2, confidence: 'high' }, stage: 'récent' });
    const c = fakeMatch({ id: 'lol:2' }); // mêmes équipes, autre id : PAS fusionné
    const r = dedupeMatches([a, b, c]);
    expect(r.duplicates).toBe(1);
    expect(r.matches.map(m => m.stage)).toEqual(['récent', null]);
  });
  it('vainqueurs déduits gardés seulement s\'ils reproduisent le score', () => {
    expect(validateInferredWinners([3, 1], [0, 1, 0, 0])).toEqual([0, 1, 0, 0]);
    expect(validateInferredWinners([3, 1], [0, 1, 1, 0])).toEqual([null, null, null, null]);
    expect(validateInferredWinners([3, 1], [0, null, 0, 0])).toEqual([null, null, null, null]);
  });
});

describe('filtres, tri, tableau de bord', () => {
  const live = fakeMatch({ id: 'lol:l', status: 'live', startTime: NOW - H });
  const soon = fakeMatch({ id: 'dota2:u', status: 'upcoming', startTime: NOW + 2 * H, sides: [{ team: { id: 'dota2:9', name: 'Gamma', code: null, image: null }, score: null, winner: null, record: null }, { team: null, score: null, winner: null, record: null }] });
  const later = fakeMatch({ id: 'lol:u2', status: 'upcoming', startTime: NOW + 10 * 86_400_000 });
  const old = fakeMatch({ id: 'lol:f', status: 'finished', startTime: NOW - 20 * H });
  const all = [old, later, soon, live];
  const fav: Favorite[] = [{ id: 'dota2:9', kind: 'team', game: 'dota2', name: 'Gamma', image: null, addedAt: 0 }];
  it('tri : direct, à venir (proche d\'abord), terminés (récent d\'abord)', () => expect(sortMatches(all).map(m => m.id)).toEqual(['lol:l', 'dota2:u', 'lol:u2', 'lol:f']));
  it('filtres jeu / statut / texte / période / favoris', () => {
    expect(filterMatches(all, { ...DEFAULT_FILTERS, games: ['dota2'] }, [], NOW).map(m => m.id)).toEqual(['dota2:u']);
    expect(filterMatches(all, { ...DEFAULT_FILTERS, status: 'finished' }, [], NOW).map(m => m.id)).toEqual(['lol:f']);
    expect(filterMatches(all, { ...DEFAULT_FILTERS, text: 'gamma' }, [], NOW).map(m => m.id)).toEqual(['dota2:u']);
    expect(filterMatches(all, { ...DEFAULT_FILTERS, days: 7 }, [], NOW).map(m => m.id)).not.toContain('lol:u2');
    expect(filterMatches(all, { ...DEFAULT_FILTERS, favoritesOnly: true }, fav, NOW).map(m => m.id)).toEqual(['dota2:u']);
  });
  it('tableau de bord', () => {
    const d = dashboard(all, fav, NOW);
    expect(d.live.map(m => m.id)).toEqual(['lol:l']);
    expect(d.upcoming.map(m => m.id)).toEqual(['dota2:u']);
    expect(d.results.map(m => m.id)).toEqual(['lol:f']);
    expect(d.favorites.map(m => m.id)).toEqual(['dota2:u']);
    expect(involvesFavorite(old, [{ ...fav[0]!, id: 'lol:ligue-test', kind: 'competition' }])).toBe(true);
  });
  it('regroupement par jour local', () => expect(byDay([soon, live]).length).toBeGreaterThanOrEqual(1));
  it('bracket : tours à partir des matchs précédents', () => {
    const q1 = fakeMatch({ id: 'lol:q1' }), q2 = fakeMatch({ id: 'lol:q2' }), f = fakeMatch({ id: 'lol:f', previous: ['lol:q1', 'lol:q2'] });
    expect(bracketRounds([f, q1, q2])!.map(c => c.map(m => m.id))).toEqual([['lol:q1', 'lol:q2'], ['lol:f']]);
    expect(bracketRounds([q1, q2])).toBeNull();
  });
});

describe('analyse déterministe', () => {
  const pts = [0, 500, -2000, -4000, 1500, 8000].map((d, i) => ({ t: i * 60, diff: d }));
  it('avances max et changements de leader', () => {
    expect(leads(pts)).toEqual({ maxA: { v: 8000, t: 300 }, maxB: { v: 4000, t: 180 } });
    expect(leadChanges(pts, 1000)).toBe(1);
    expect(leadChanges([3000, -3000, 3000].map((diff, t) => ({ t, diff })), 1000)).toBe(2);
  });
  it('remontée : étiquetée interprétation avec sa règle', () => {
    const l = summarizeGame({ names: ['A', 'B'], winner: { side: 0, inferred: false }, duration: 300, gold: pts, goldUnit: 'gold', comebackThreshold: 3000, finals: [{ label: 'Kills', a: 10, b: 5 }], highlights: [] });
    expect(l.find(x => x.text.startsWith('Remontée'))).toMatchObject({ kind: 'interp' });
    expect(l[0]).toEqual({ kind: 'fact', text: 'A remporte la partie.' });
    expect(l.some(x => /%|chance|prédi/i.test(x.text))).toBe(false);
  });
  it('vainqueur déduit : interprétation, jamais présenté comme fait', () => {
    const l = summarizeGame({ names: ['A', 'B'], winner: { side: 1, inferred: true }, duration: null, gold: [], goldUnit: 'gold', comebackThreshold: 3000, finals: [], highlights: [] });
    expect(l[0]!.kind).toBe('interp');
  });
  it('résumé de série', () => {
    expect(summarizeSeries(fakeMatch())[0]).toEqual({ kind: 'fact', text: 'Test Alpha bat Test Beta 2-1 (BO3).' });
    expect(summarizeSeries(fakeMatch()).some(x => x.text.includes('allée au bout'))).toBe(true);
  });
  it('forme et confrontations', () => {
    const ms = [fakeMatch({ id: 'lol:1', startTime: 3 }), fakeMatch({ id: 'lol:2', startTime: 2 }), fakeMatch({ id: 'lol:3', startTime: 1, sides: [{ ...fakeMatch().sides[0], winner: false }, { ...fakeMatch().sides[1], winner: true }] })];
    expect(teamForm('lol:ALP', ms)).toMatchObject({ played: 3, wins: 2, losses: 1, streak: { kind: 'W', n: 2 }, last: ['W', 'W', 'L'] });
    expect(headToHead('lol:ALP', 'lol:BET', ms)).toHaveLength(3);
  });
});

describe('CSV', () => {
  it('export ; avec BOM et échappement', () => {
    const csv = matchesToCsv([fakeMatch({ stage: 'Phase "A"; poule' })]);
    expect(csv.startsWith('﻿jeu;date_utc;')).toBe(true);
    expect(csv).toContain('"Phase ""A""; poule"');
    expect(parseCsv(csv)[1]![3]).toBe('Phase "A"; poule');
  });
  it('import : lignes valides marquées « importé », erreurs par ligne', () => {
    const rows = csvToMatches('game,date,team1,team2,score1,score2,bo\ncs2,2026-10-12T18:00:00Z,Alpha,Beta,2,1,3\nxyz,pas une date,A,A,deux,,\n', 'test.csv', 5);
    expect(rows[0]!.match).toMatchObject({ game: 'cs2', status: 'finished', format: { count: 3 }, prov: { kind: 'imported', note: 'Importé depuis test.csv' } });
    expect(rows[0]!.match!.sides.map(s => s.winner)).toEqual([true, false]);
    expect(rows[1]!.errors.join(' ')).toMatch(/Jeu inconnu.*Date invalide.*identiques.*Score invalide/);
  });
  it('import : colonnes manquantes et identifiant stable (ré-import = remplacement)', () => {
    expect(csvToMatches('a;b\n1;2', 'x')[0]!.errors[0]).toContain('Colonnes manquantes');
    const a = csvToMatches('jeu;date_utc;equipe1;equipe2\nrl;2026-01-01;A;B', 'x')[0]!.match!;
    const b = csvToMatches('jeu;date_utc;equipe1;equipe2\nrl;2026-01-01;A;B', 'y')[0]!.match!;
    expect(a.id).toBe(b.id);
    expect(a.status).toBe('unknown');
  });
  it('doublon probable signalé (jamais fusionné)', () => {
    const imp = csvToMatches('jeu;date_utc;equipe1;equipe2;score1;score2\nlol;2026-10-17T19:00:00Z;test alpha;Test Beta;2;1', 'x')[0]!.match!;
    expect(probableDuplicate(imp, [fakeMatch()])?.id).toBe('lol:1');
    expect(probableDuplicate({ ...imp, startTime: imp.startTime! + 48 * H }, [fakeMatch()])).toBeNull();
  });
});

describe('sauvegarde JSON', () => {
  const fav: Favorite = { id: 'lol:ALP', kind: 'team', game: 'lol', name: 'Test Alpha', image: null, addedAt: 1 };
  it('aller-retour', () => {
    const p = parseBackup(JSON.stringify(createBackup({ settings: { ...DEFAULT_SETTINGS, theme: 'light', onboarded: true }, favorites: [fav], manual: [], views: [] })));
    expect(p.favorites).toEqual([fav]);
    expect(p.settings.theme).toBe('light');
    expect('onboarded' in p.settings).toBe(false);
  });
  it('rejets et éléments invalides', () => {
    expect(() => parseBackup('{')).toThrow(BackupError);
    expect(() => parseBackup('{"format":"autre"}')).toThrow('pas une sauvegarde');
    expect(() => parseBackup(JSON.stringify({ format: 'esport-companion-backup', schemaVersion: 9 }))).toThrow('plus récente');
    const p = parseBackup(JSON.stringify({ format: 'esport-companion-backup', schemaVersion: 1, favorites: [fav, { id: 1 }], manual: [{ id: 'x', match: { id: 'x', prov: { kind: 'official' }, sides: [] } }], settings: { games: ['lol', 'pirate'] } }));
    expect(p.invalid).toBe(2);
    expect(p.settings.games).toEqual(['lol']);
  });
  it('fusion sans doublon', () => {
    const m = mergeBackup({ favorites: [fav], manual: [], views: [] }, { exportedAt: null, settings: {}, favorites: [fav, { ...fav, id: 'lol:BET' }], manual: [], views: [], invalid: 0 });
    expect(m).toMatchObject({ added: 1, duplicates: 1 });
  });
});

describe('rappels et format', () => {
  it('.ics : seulement les matchs à venir, alarme, CRLF, lignes ≤ 75 octets', () => {
    const ics = buildIcs([fakeMatch({ status: 'upcoming', startTime: NOW }), fakeMatch({ id: 'lol:9' })], 10, NOW);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain('TRIGGER:-PT10M');
    expect(ics).toContain('DTSTART:20261018T120000Z');
    for (const l of ics.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
  });
  it('horloge (temps négatif avant le début), compte à rebours', () => {
    expect(clock(-15)).toBe('−0:15');
    expect(clock(1868)).toBe('31:08');
    expect(countdown(NOW + 90 * 60_000, NOW)).toBe('dans 2 h');
    expect(when(null)).toBe('Horaire inconnu');
  });
});
