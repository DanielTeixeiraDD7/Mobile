/**
 * Modèle commun à tous les jeux. Tout champ inconnu est `null` — jamais une valeur inventée.
 * Les identifiants sont globaux : `${source}:${idDansLaSource}`.
 */
export type GameId = string;
export type SourceId = string;

/** official = éditeur/organisateur ; community = projet communautaire ; imported = fichier de l'utilisateur ; computed = calculé par l'app. */
export type DataKind = 'official' | 'community' | 'imported' | 'computed';
export type Confidence = 'high' | 'medium' | 'low';

export interface Provenance {
  source: SourceId;
  kind: DataKind;
  fetchedAt: number;
  confidence: Confidence;
  url?: string;
  note?: string;
}

export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'canceled' | 'postponed' | 'unknown';

export interface TeamRef {
  id: string;
  name: string;
  code: string | null;
  image: string | null;
}

export interface MatchSide {
  team: TeamRef | null; // null = adversaire pas encore connu (TBD)
  score: number | null;
  winner: boolean | null;
  record: { wins: number; losses: number } | null;
}

export interface CompetitionRef {
  id: string;
  name: string;
  image: string | null;
}

export interface Match {
  id: string;
  game: GameId;
  source: SourceId;
  sourceId: string;
  status: MatchStatus;
  startTime: number | null; // ms UTC
  competition: CompetitionRef | null;
  tournamentId: string | null;
  stage: string | null;
  format: { type: 'bestOf'; count: number } | null;
  sides: [MatchSide, MatchSide];
  /** Durée totale en secondes quand le match est une partie unique (Dota). */
  duration: number | null;
  prov: Provenance;
  /** Matchs dont les vainqueurs/perdants alimentent celui-ci (bracket), si publiés. */
  previous?: string[];
}

export type GameStatus = 'finished' | 'live' | 'upcoming' | 'unneeded' | 'unknown';

export interface Vod {
  url: string;
  label: string;
}

/** Une partie / carte d'un match. */
export interface MatchGame {
  id: string;
  number: number;
  status: GameStatus;
  /** Index (0/1) du côté de `Match.sides` qui a gagné, null si inconnu. */
  winner: 0 | 1 | null;
  /** Côté en jeu de chaque équipe du match (blue/red, radiant/dire…). */
  sideNames: [string | null, string | null];
  map: string | null;
  duration: number | null; // secondes
  vods: Vod[];
}

export interface Competition {
  id: string;
  game: GameId;
  name: string;
  region: string | null;
  image: string | null;
  priority: number;
  prov: Provenance;
}

export interface Tournament {
  id: string;
  competitionId: string;
  name: string;
  startDate: string | null; // AAAA-MM-JJ
  endDate: string | null;
}

export interface Standing {
  rank: number | null;
  team: TeamRef;
  wins: number | null;
  losses: number | null;
}

export interface Stage {
  id: string;
  name: string;
  sections: { name: string; matches: Match[]; standings: Standing[] }[];
}

export interface CompetitionDetail {
  competition: Competition;
  tournaments: Tournament[];
  tournament: Tournament | null;
  stages: Stage[];
}

export interface Player {
  id: string;
  handle: string;
  realName: string | null;
  role: string | null;
  image: string | null;
}

export interface Team {
  id: string;
  game: GameId;
  name: string;
  code: string | null;
  image: string | null;
  region: string | null;
  /** Roster tel que publié par la source à `prov.fetchedAt` (actuel, pas historique). */
  roster: Player[];
  prov: Provenance;
}

/** Résultat d'un appel adaptateur, avec fraîcheur. */
export interface Fetched<T> {
  data: T;
  fetchedAt: number;
  /** true = la source a échoué, ce sont les dernières données valides en cache. */
  stale: boolean;
}

export const isTbd = (s: MatchSide) => !s.team;
export const matchWinner = (m: Pick<Match, 'sides'>): 0 | 1 | null => (m.sides[0].winner ? 0 : m.sides[1].winner ? 1 : null);
