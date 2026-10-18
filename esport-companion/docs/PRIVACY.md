# Vie privée et flux réseau

- **Aucun compte, aucune publicité, aucun traceur, aucune statistique d'usage.**
- Restent sur l'appareil (IndexedDB) : favoris, réglages, vues enregistrées, résultats importés, historique des matchs consultés, cache des réponses.

## Requêtes sortantes (et rien d'autre)

| Destination | Contenu envoyé |
|---|---|
| `esports-api.lolesports.com`, `feed.lolesports.com` | identifiants de ligues, matchs, parties |
| `esports-api.service.valorantesports.com` | idem pour VALORANT |
| `api.opendota.com` | identifiants de matchs, équipes, ligues, joueurs |
| `static.lolesports.com`, `ddragon.leagueoflegends.com`, CDN Steam | images (logos, champions, héros, objets), sans référent |

Ces serveurs voient ton adresse IP, comme pour tout site. **Tes favoris ne sont jamais envoyés** : le filtrage se fait sur le téléphone.

## Le reste

- **Fichiers exportés** (JSON, CSV, `.ics`) : ils restent où tu les enregistres.
- **Effacer** :
  - Plus → Sources → Vider le cache ;
  - supprimer l'app de l'écran d'accueil efface tout.
- **iPhone** : installe l'app sur l'écran d'accueil (sinon Safari peut effacer les données après 7 jours sans visite), et exporte une sauvegarde de temps en temps.
