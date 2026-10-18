import type { Match, MatchGame } from '../core/model';
import { Banner } from '../ui/common';

export function ValGamePanel({ game }: { match: Match; game: MatchGame }) {
  return (
    <div className="stack">
      <Banner kind="info">La source gratuite (VALORANT Esports, Riot) ne publie pas le détail des cartes : nom de la carte, score des rounds, agents, ACS, ADR, économie et stats joueurs ne sont pas disponibles. Rien n'est inventé ici.</Banner>
      <div className="card small">
        <p style={{ marginTop: 0 }}><strong>Carte {game.number}</strong> · {game.status === 'finished' ? 'jouée' : game.status === 'unneeded' ? 'non jouée (série décidée)' : game.status === 'live' ? 'en cours' : 'à venir'}</p>
        <p className="muted" style={{ marginBottom: 0 }}>Les rediffusions (si publiées) sont listées dans l'onglet Résumé.</p>
      </div>
    </div>
  );
}
