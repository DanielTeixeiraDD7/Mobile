import type { GameAdapter } from '../core/adapter';
import { LOL_GW, VAL_GW } from '../providers/riot';
import { DEFS } from './defs';
import { dota2 } from './dota2';
import { createRiotAdapter } from './riotAdapter';

export const lol = createRiotAdapter({ def: DEFS.lol!, gw: LOL_GW, extra: '', teams: true, live: true });
export const valorant = createRiotAdapter({ def: DEFS.valorant!, gw: VAL_GW, extra: '&sport=val', teams: false, live: false });

/** Jeux avec une source de données active. */
export const ADAPTERS: Record<string, GameAdapter> = { lol, dota2, valorant };

export const adapterOf = (game: string): GameAdapter | null => ADAPTERS[game] ?? null;
export const gameOfId = (id: string) => id.split(':')[0]!;
