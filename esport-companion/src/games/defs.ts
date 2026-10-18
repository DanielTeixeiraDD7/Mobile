import type { GameDef } from '../core/adapter';

/**
 * Catalogue des jeux. Ajouter un jeu = une entrée ici + un adaptateur dans registry.ts.
 * Un jeu sans adaptateur reste visible avec sa couverture expliquée (et l'import manuel).
 */
export const DEFS: Record<string, GameDef> = {
  lol: { id: 'lol', name: 'League of Legends', short: 'LoL', color: '#c8aa6e', genre: 'moba', coverage: 'deep', sources: ['lolesports', 'lolfeed'],
    note: "Calendrier, résultats, classements et rosters officiels ; statistiques des parties (gold, objectifs, joueurs, objets) via le flux de lolesports.com." },
  dota2: { id: 'dota2', name: 'Dota 2', short: 'Dota 2', color: '#e5483d', genre: 'moba', coverage: 'deep', sources: ['opendota'],
    note: "Parties pros détaillées (OpenDota) : picks/bans, avantage gold/XP par minute, objectifs, stats et objets des joueurs. Pas de calendrier des matchs à venir." },
  valorant: { id: 'valorant', name: 'VALORANT', short: 'VAL', color: '#ff4655', genre: 'fps', coverage: 'partial', sources: ['valesports'],
    note: "Calendrier, résultats de séries et classements VCT officiels. La source gratuite ne publie ni cartes, ni rounds, ni stats joueurs." },
  cs2: { id: 'cs2', name: 'Counter-Strike 2', short: 'CS2', color: '#de9b35', genre: 'fps', coverage: 'key', sources: [],
    note: "Aucune source gratuite sans compte. PandaScore (jeton gratuit) donne calendrier et équipes ; les stats détaillées sont payantes. Import manuel possible." },
  rl: { id: 'rl', name: 'Rocket League', short: 'RL', color: '#1f8fff', genre: 'sport', coverage: 'key', sources: [],
    note: "L'API octane.gg est hors service. PandaScore (jeton gratuit) pour le calendrier. Import manuel possible." },
  r6: { id: 'r6', name: 'Rainbow Six Siege', short: 'R6', color: '#9aa4b1', genre: 'fps', coverage: 'key', sources: [], note: 'PandaScore (jeton gratuit) pour le calendrier. Import manuel possible.' },
  ow2: { id: 'ow2', name: 'Overwatch 2', short: 'OW2', color: '#f99e1a', genre: 'fps', coverage: 'key', sources: [], note: 'PandaScore (jeton gratuit) pour le calendrier. Import manuel possible.' },
  sf6: { id: 'sf6', name: 'Street Fighter 6', short: 'SF6', color: '#e7c35a', genre: 'fighting', coverage: 'key', sources: [], note: 'start.gg (jeton gratuit) pour les brackets. Import manuel possible.' },
  sc2: { id: 'sc2', name: 'StarCraft II', short: 'SC2', color: '#2dc6f6', genre: 'rts', coverage: 'key', sources: [], note: 'Aligulac (clé gratuite). Import manuel possible.' },
  apex: { id: 'apex', name: 'Apex Legends', short: 'Apex', color: '#cd3333', genre: 'battle-royale', coverage: 'none', sources: [], note: 'Aucune source gratuite exploitable vérifiée. Import manuel possible.' },
};

export const COVERAGE_LABEL: Record<GameDef['coverage'], string> = {
  deep: 'Couverture détaillée',
  partial: 'Couverture partielle',
  key: 'Clé gratuite requise',
  none: 'Pas de source gratuite',
};
