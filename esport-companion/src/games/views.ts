import type { ComponentType } from 'react';
import type { Match, MatchGame } from '../core/model';
import type { LpGame } from '../providers/leaguepedia';
import { DotaGamePanel } from './dotaView';
import { LolGamePanel } from './lolView';
import { ValGamePanel } from './valView';

/** Vue de partie propre à chaque jeu (statistiques spécifiques). */
export interface PanelProps { match: Match; game: MatchGame; lp?: LpGame | null }
export const GAME_PANELS: Record<string, ComponentType<PanelProps>> = {
  lol: LolGamePanel,
  dota2: DotaGamePanel,
  valorant: ValGamePanel,
};

/** Nom d'une « partie » selon le jeu. */
export const gameWord: Record<string, string> = { lol: 'Partie', dota2: 'Partie', valorant: 'Carte' };
