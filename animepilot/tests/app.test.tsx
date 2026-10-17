import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../src/App';
import * as store from '../src/data/store';
import { media } from './fixtures';

afterEach(() => { cleanup(); store.reset(); location.hash = ''; });

describe('interface', () => {
  it('présentation au premier lancement puis accueil', async () => {
    await store.init('ui-' + Math.random());
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Bienvenue sur AnimePilot' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Passer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
    expect(await screen.findByText(/Ta bibliothèque est vide/)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Accueil|Anime|Manga|Calendrier|Profil/ }).length).toBeGreaterThanOrEqual(5);
  });

  it('bibliothèque : +1 sur un titre, double appui compté une fois', async () => {
    await store.init('ui-' + Math.random());
    await store.updateSettings({ onboarded: true });
    await store.addToLibrary(media({ id: 21, title: { romaji: 'One Piece', english: null, native: null }, episodes: null, status: 'RELEASING' }), 'CURRENT');
    location.hash = '#/anime';
    render(<App />);
    const plus = screen.getByRole('button', { name: '+1 épisode : One Piece' });
    fireEvent.click(plus);
    fireEvent.click(plus);
    expect(await screen.findByText('ép. 1 / ?')).toBeTruthy();
    await new Promise(r => setTimeout(r, 50));
    expect(store.getState().entries[0]!.progress).toBe(1);
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Annuler'));
  });
});
