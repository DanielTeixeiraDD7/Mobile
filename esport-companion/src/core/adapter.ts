import type { Competition, CompetitionDetail, Fetched, Match, MatchGame, Team } from './model';
import type { QualityIssue } from './quality';

export type CoverageLevel = 'deep' | 'partial' | 'key' | 'none';

export interface GameDef {
  id: string;
  name: string;
  short: string;
  /** Couleur d'accent du jeu (UI). */
  color: string;
  genre: 'moba' | 'fps' | 'sport' | 'battle-royale' | 'fighting' | 'rts' | 'autre';
  coverage: CoverageLevel;
  sources: string[];
  /** Explication affichée quand la couverture est partielle ou absente. */
  note: string;
}

export interface Opts {
  signal?: AbortSignal;
  force?: boolean;
}

export interface MatchDetail {
  match: Match;
  games: MatchGame[];
  quality: QualityIssue[];
}

/** Interface que chaque jeu implémente. Une méthode absente = donnée non disponible pour ce jeu. */
export interface GameAdapter {
  def: GameDef;
  /** Matchs récents et à venir des compétitions suivies. */
  matches(o: Opts): Promise<Fetched<Match[]>>;
  live?(o: Opts): Promise<Fetched<Match[]>>;
  matchDetail(sourceId: string, o: Opts): Promise<Fetched<MatchDetail>>;
  competitions?(o: Opts): Promise<Fetched<Competition[]>>;
  competition?(competitionId: string, tournamentId: string | null, o: Opts): Promise<Fetched<CompetitionDetail>>;
  team?(teamId: string, o: Opts): Promise<Fetched<{ team: Team; matches: Match[] }>>;
  searchTeams?(q: string, o: Opts): Promise<Team[]>;
}
