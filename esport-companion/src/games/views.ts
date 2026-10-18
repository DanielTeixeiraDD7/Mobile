import type { ComponentType } from 'react';
import type { Match, MatchGame } from '../core/model';
import { DotaGamePanel } from './dotaView';
import { LolGamePanel } from './lolView';
import { ValGamePanel } from './valView';

/** Vue de partie propre à chaque jeu (statistiques spécifiques). */
export const GAME_PANELS: Record<string, ComponentType<{ match: Match; game: MatchGame }>> = {
  lol: LolGamePanel,
  dota2: DotaGamePanel,
  valorant: ValGamePanel,
};

/** Nom d'une « partie » selon le jeu. */
export const gameWord: Record<string, string> = { lol: 'Partie', dota2: 'Partie', valorant: 'Carte' };
