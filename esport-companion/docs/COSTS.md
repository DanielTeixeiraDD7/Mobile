# Coûts

**Total : 0 €.** Aucun abonnement, aucune carte, aucun service payant.

| Poste | Solution | Coût |
|---|---|---|
| Hébergement | GitHub Pages (dépôt existant) | 0 € |
| Données LoL / VALORANT | API publiques des sites officiels Riot | 0 € |
| Données Dota 2 | OpenDota, offre gratuite sans clé | 0 € (quota géré par l'app) |
| Stockage | IndexedDB sur l'appareil | 0 € |
| Analyses | moteur local en TypeScript (pas d'IA en ligne) | 0 € |
| Rappels | notifications locales + export `.ics` | 0 € |
| Build / tests | Vite, Vitest, Playwright (open source) | 0 € |

## Ce qui pourrait coûter, et n'est pas utilisé

- **OpenDota premium** (clé avec carte, facturation à l'appel) : jamais activé. L'app se met en pause d'elle-même avant la fin du quota gratuit journalier.
- **PandaScore** : stats détaillées dès 400 €/mois/jeu → non utilisé.
- **Serveur de notifications push** : il faudrait un service tiers → remplacé par `.ics` et les notifications app ouverte.
- **Apple Developer Program** (99 €/an) : seulement pour une app native, non nécessaire pour la PWA.
