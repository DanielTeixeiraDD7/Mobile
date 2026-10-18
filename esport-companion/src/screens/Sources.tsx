import { useEffect, useState } from 'react';
import { http } from '../core/http';
import { cacheInfo } from '../data/db';
import { clearCache, getDb } from '../data/store';
import { clearMemory } from '../hooks/useResource';
import { COVERAGE_LABEL, DEFS } from '../games/defs';
import { OPENDOTA } from '../providers/opendota';
import { LOL_FEED } from '../providers/lolLivestats';
import { LOL_GW, VAL_GW } from '../providers/riot';
import { LEAGUEPEDIA } from '../providers/leaguepedia';
import { goBack } from '../router';
import { TopBar } from '../ui/common';
import { relative } from '../ui/format';
import { toast } from '../ui/toast';

const ACTIVE = [
  { p: LOL_GW, games: 'League of Legends', kind: 'Officielle, non documentée', key: 'Aucune (clé publique du site lolesports.com)', doc: 'https://lolesports.com', terms: 'API du site officiel, non publiée : peut changer sans préavis. Usage personnel.' },
  { p: LOL_FEED, games: 'League of Legends', kind: 'Officielle, non documentée', key: 'Aucune', doc: 'https://lolesports.com', terms: 'Flux des statistiques en jeu (images ~10 s). Chargé uniquement à l\'ouverture d\'une partie.' },
  { p: LEAGUEPEDIA, games: 'League of Legends (complément)', kind: 'Communautaire (wiki, CC BY-SA 3.0)', key: 'Aucune', doc: 'https://lol.fandom.com/wiki/Help:Leaguepedia_API', terms: "Vainqueur officiel par partie et draft. Limite anonyme stricte : 1 requête par match ouvert, cache 30 jours. Rapprochement par noms d'équipes exacts + date." },
  { p: VAL_GW, games: 'VALORANT', kind: 'Officielle, non documentée', key: 'Aucune (clé publique du site valorantesports.com)', doc: 'https://valorantesports.com', terms: 'Résultats et calendrier seulement.' },
  { p: OPENDOTA, games: 'Dota 2', kind: 'Communautaire (open source)', key: 'Aucune — offre gratuite 60 req/min, 3 000/jour', doc: 'https://docs.opendota.com', terms: "La clé payante n'est jamais utilisée. Attribution : OpenDota." },
];

const OTHERS = [
  ['PandaScore', 'CS2, R6, RL, OW2, CoD…', 'Jeton gratuit (compte) : calendrier et équipes seulement ; stats dès 400 €/mois. Non configuré.'],
  ['Liquipedia API', 'Tous', 'Exige un User-Agent personnalisé impossible depuis un navigateur. Non utilisé.'],
  ['start.gg', 'Combat, Smash', 'Jeton gratuit (compte). Non configuré.'],
  ['Aligulac', 'StarCraft II', 'Clé gratuite. Non configuré.'],
  ['octane.gg', 'Rocket League', 'API hors service.'],
  ['vlr.gg / HLTV', 'VALORANT / CS2', "Pas d'API : extraction de pages non autorisée, exclue."],
];

export function SourcesScreen() {
  const [, force] = useState(0);
  const [info, setInfo] = useState<Awaited<ReturnType<typeof cacheInfo>> | null>(null);
  useEffect(() => { void cacheInfo(getDb()).then(setInfo).catch(() => setInfo(null)); }, []);
  useEffect(() => { const t = setInterval(() => force(x => x + 1), 5000); return () => clearInterval(t); }, []);
  return (
    <>
      <TopBar title="Sources" sub="Vérifiées le 18/10/2026" back={() => goBack({ name: 'tab', tab: 'more' })} />
      <div className="section"><h2>Actives</h2></div>
      {ACTIVE.map(({ p, ...a }) => {
        const s = http.stats.get(p.id);
        const blocked = http.limiter(p).blockedFor;
        return (
          <div key={p.id} className="card small">
            <div className="row"><strong className="grow">{p.name}</strong><span className={`cov ${s?.lastError && (!s.lastOk || (s.lastOk ?? 0) < Date.now() - 600_000) ? 'partial' : 'deep'}`}>{s ? (s.lastOk ? 'OK' : s.lastError ? 'Erreur' : '—') : 'pas encore appelée'}</span></div>
            <p className="muted" style={{ margin: '4px 0' }}>{a.games} · {a.kind}</p>
            <p style={{ margin: '4px 0' }}>Clé : {a.key}</p>
            <p style={{ margin: '4px 0' }}>Limite appliquée par l'app : {p.rpm} req/min{blocked > 0 ? ` · en pause ${Math.ceil(blocked / 1000)} s (limite atteinte)` : ''}</p>
            {s && <p className="dim" style={{ margin: '4px 0' }}>Cette session : {s.requests} requête(s), {s.errors} erreur(s){s.lastOk ? ` · dernier succès ${relative(s.lastOk)}` : ''}{s.lastError ? ` · dernière erreur : ${s.lastError}` : ''}</p>}
            <p className="dim" style={{ margin: '4px 0 0' }}>{a.terms} <a href={a.doc} target="_blank" rel="noopener noreferrer">Site</a></p>
          </div>
        );
      })}

      <div className="section"><h2>Couverture par jeu</h2></div>
      <div className="card">
        <ul className="list">
          {Object.values(DEFS).map(d => (
            <li key={d.id}><span className="row" style={{ padding: '9px 0', borderBottom: '1px solid var(--line)', alignItems: 'flex-start' }}>
              <span className="gbadge" style={{ ['--game' as string]: d.color }}>{d.short}</span>
              <span className="grow small"><span className={`cov ${d.coverage}`}>{COVERAGE_LABEL[d.coverage]}</span><br /><span className="muted">{d.note}</span></span>
            </span></li>
          ))}
        </ul>
      </div>

      <div className="section"><h2>Évaluées, non actives</h2></div>
      <div className="card small">
        {OTHERS.map(([n, g, why]) => <p key={n} style={{ margin: '6px 0' }}><strong>{n}</strong> <span className="dim">({g})</span> — {why}</p>)}
      </div>

      <div className="section"><h2>Cache local</h2></div>
      <div className="card small stack">
        <p style={{ margin: 0 }}>{info ? `${info.entries} réponses enregistrées · ${(info.bytes / 1_048_576).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo${info.oldest ? ` · plus ancienne ${relative(info.oldest)}` : ''}` : '—'}</p>
        <p className="muted" style={{ margin: 0 }}>Durées : direct 30–60 s · calendrier 3–5 min · matchs terminés et parties analysées : conservés · listes d'équipes/ligues : 1–7 jours. Hors-ligne, les dernières données valides sont affichées avec leur âge.</p>
        <button type="button" className="btn danger block" onClick={() => void clearCache().then(() => { clearMemory(); setInfo(null); toast('Cache vidé. Favoris et réglages conservés.'); })}>Vider le cache</button>
      </div>
    </>
  );
}
