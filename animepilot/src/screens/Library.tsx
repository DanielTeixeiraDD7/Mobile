import type { MediaType } from '../domain/types';

export function LibraryScreen({ type }: { type: MediaType }) {
  return (
    <>
      <header className="topbar"><h1>{type === 'ANIME' ? 'Anime' : 'Manga'}</h1></header>
      <div className="empty"><p>Aucun titre suivi.</p></div>
    </>
  );
}
