import { describe, expect, it } from 'vitest';
import { affinite, classement, semaineDe, type Ligne, type TitreAmi } from '../src/domain/classement';
import { agreger } from '../src/lib/social';
import { entry, media } from './fixtures';

const P = (id: string, pseudo: string, partage_temps = true) => ({ id, pseudo, couleur: '#ff4d6d', partage_temps });
const L = (utilisateur: string, jour: string, categorie: Ligne['categorie'], minutes: number, unites = 1): Ligne => ({ utilisateur, jour, categorie, minutes, unites });

describe('classement de la semaine', () => {
  const lignes = [L('a', '2026-10-19', 'TV', 120), L('a', '2026-10-20', 'MOVIE', 150), L('b', '2026-10-19', 'ANIME', 300), L('b', '2026-10-12', 'TV', 999), L('a', '2026-10-21', 'MANGA', 0, 30)];
  const gens = [P('a', 'Dani'), P('b', 'Flavien'), P('c', 'Discret', false)];
  it('total des minutes de la semaine, semaine précédente ignorée, non-partageurs en bas', () => {
    const r = classement(lignes, gens, 'a', '2026-10-19', '2026-10-26');
    expect(r.map(x => [x.personne.pseudo, x.valeur])).toEqual([['Flavien', 300], ['Dani', 270], ['Discret', 0]]);
    expect(r[1]!.moi).toBe(true);
    expect(r[2]!.partage).toBe(false);
  });
  it('par catégorie ; manga en chapitres', () => {
    expect(classement(lignes, gens, 'a', '2026-10-19', '2026-10-26', 'TV')[0]!.valeur).toBe(120);
    expect(classement(lignes, gens, 'a', '2026-10-19', '2026-10-26', 'MANGA')[0]).toMatchObject({ valeur: 30, moi: true });
  });
  it('détail d’une semaine', () => {
    const s = semaineDe(lignes, 'a', new Date('2026-10-19T00:00:00'));
    expect(s.jours.map(j => j.total)).toEqual([120, 150, 0, 0, 0, 0, 0]);
    expect(s.parType).toMatchObject({ TV: 120, MOVIE: 150 });
    expect(s.chapitres).toBe(30);
  });
});

describe('agrégat envoyé au serveur', () => {
  it('somme par jour local et catégorie, arrondi', () => {
    const at = (d: string) => new Date(d).getTime();
    const r = agreger([
      { at: at('2026-10-19T21:00:00'), entryId: 'x', type: 'TV', unites: 1, minutes: 42.4 },
      { at: at('2026-10-19T22:00:00'), entryId: 'y', type: 'TV', unites: 1, minutes: 42.4 },
      { at: at('2026-10-10T22:00:00'), entryId: 'y', type: 'TV', unites: 1, minutes: 40 },
    ], '2026-10-15');
    expect(r).toEqual([{ jour: '2026-10-19', categorie: 'TV', minutes: 85, unites: 2 }]);
  });
});

describe('affinité', () => {
  const mien = (id: number, score: number | null, status: 'COMPLETED' | 'DROPPED' = 'COMPLETED') =>
    entry({ id: `tmdb:MOVIE:${id}`, mediaId: id, type: 'MOVIE', status, score, media: media({ id, type: 'MOVIE' }) });
  const sien = (id: number, note: number | null, statut = 'COMPLETED'): TitreAmi => ({ id: `tmdb:MOVIE:${id}`, categorie: 'MOVIE', titre: 'T' + id, affiche: null, statut, progression: 1, total: 1, note });
  it('compatibilité par les notes (≥ 3 notes communes)', () => {
    const r = affinite([mien(1, 8), mien(2, 6), mien(3, 9), mien(4, null)], [sien(1, 9), sien(2, 6), sien(3, 7), sien(4, 5), sien(5, 8)]);
    expect(r.communs).toHaveLength(4);
    expect(r).toMatchObject({ methode: 'notes', notesCommunes: 3, compatibilite: 90 });
  });
  it('sinon par les titres en commun ; abandons exclus ; trop peu = rien', () => {
    const r = affinite([mien(1, null), mien(2, null), mien(9, null, 'DROPPED')], [1, 2, 3, 4, 9].map(i => sien(i, null)));
    expect(r.communs.map(c => c.titre.id)).toEqual(['tmdb:MOVIE:1', 'tmdb:MOVIE:2']);
    expect(r).toMatchObject({ methode: 'titres', compatibilite: 40 });
    expect(affinite([mien(1, null)], [sien(1, null)]).compatibilite).toBeNull();
  });
});
