import { describe, expect, it } from 'vitest';
import { airedEpisodes, behind, buildIcs, followedForCalendar, foldLine, groupByDay } from '../src/domain/calendar';
import { icsEvents } from '../src/reminders';
import { DEFAULT_SETTINGS } from '../src/domain/types';
import { entry, media } from './fixtures';

const NOW = 1_800_000_000;

describe('calendrier', () => {
  it('épisodes sortis : déduits du prochain épisode', () => {
    const e = entry({ media: media({ id: 1, status: 'RELEASING', episodes: null, nextAiring: { episode: 8, airingAt: NOW + 100 } }) });
    expect(airedEpisodes(e, NOW)).toBe(7);
    expect(airedEpisodes(e, NOW + 200)).toBe(8);
    expect(airedEpisodes(entry({ media: media({ id: 2, status: 'RELEASING', nextAiring: null }) }), NOW)).toBeNull();
  });
  it('retard : seulement pour les anime en cours', () => {
    const m = media({ id: 1, status: 'RELEASING', nextAiring: { episode: 8, airingAt: NOW + 100 } });
    expect(behind(entry({ media: m, status: 'CURRENT', progress: 4 }), NOW)).toBe(3);
    expect(behind(entry({ media: m, status: 'PLANNING', progress: 0 }), NOW)).toBe(0);
    expect(behind(entry({ media: m, status: 'CURRENT', progress: 9 }), NOW)).toBe(0);
  });
  it('suivi : anime en diffusion non terminés/abandonnés', () => {
    const list = [
      entry({ media: media({ id: 1, status: 'RELEASING' }), status: 'CURRENT' }),
      entry({ media: media({ id: 2, status: 'FINISHED' }), status: 'CURRENT' }),
      entry({ media: media({ id: 3, status: 'RELEASING' }), status: 'DROPPED' }),
      entry({ media: media({ id: 4, status: 'NOT_YET_RELEASED' }), status: 'PLANNING' }),
    ];
    expect(followedForCalendar(list).map(e => e.mediaId)).toEqual([1, 4]);
  });
  it('regroupe par jour local, trié', () => {
    const d = new Date(2026, 9, 17, 23, 0).getTime() / 1000;
    const g = groupByDay([{ airingAt: d + 7200 }, { airingAt: d }, { airingAt: d + 600 }]);
    expect(g).toHaveLength(2);
    expect(g[0]!.items.map(i => i.airingAt)).toEqual([d, d + 600]);
  });
  it('ics valide : CRLF, échappement, alarme, pliage', () => {
    const ics = buildIcs([{ uid: 'u1', title: 'Titre, avec; virgule', start: NOW, durationMin: 24, alarmMinutes: 15, description: 'a\nb' }], NOW);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('SUMMARY:Titre\\, avec\; virgule');
    expect(ics).toContain('TRIGGER:-PT15M');
    expect(ics).toContain('DTSTART:20270115T080000Z');
    expect(ics).toContain('DESCRIPTION:a\\nb');
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
  it('pliage sans couper un caractère multi-octet', () => {
    const folded = foldLine('SUMMARY:' + 'é'.repeat(80));
    expect(folded.replace(/\r\n /g, '')).toBe('SUMMARY:' + 'é'.repeat(80));
  });
  it('export : seulement les épisodes à venir', () => {
    const e = entry({ media: media({ id: 9, duration: 30 }) });
    const ev = icsEvents([{ id: 1, mediaId: 9, episode: 3, airingAt: NOW - 10, entry: e }, { id: 2, mediaId: 9, episode: 4, airingAt: NOW + 10, entry: e }], DEFAULT_SETTINGS, NOW);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ title: 'Titre 9 — ép. 4', durationMin: 30, alarmMinutes: 15 });
  });
});
