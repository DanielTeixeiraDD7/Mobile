# Configuration des API

**Aucune inscription, aucune clé, aucune carte n'est nécessaire** pour la v1.

| Source | Configuration | Remarque |
|---|---|---|
| LoL Esports / VALORANT Esports | aucune | Clé publique déjà présente dans le code (`src/providers/riot.ts`). C'est la clé que Riot publie dans le JavaScript de ses propres sites : ce n'est pas un secret. |
| Flux livestats LoL | aucune | — |
| OpenDota | aucune | Offre gratuite sans clé : 60 req/min, 3 000/jour. La « clé » OpenDota exige une carte bancaire : **ne pas la créer**. |
| Data Dragon (images LoL) | aucune | Fichiers statiques de Riot. |

## Sources optionnelles (non branchées en v1)

À n'activer que si tu le souhaites. Elles demandent de créer un compte toi-même ; l'app ne crée jamais de compte à ta place.

### PandaScore (CS2, Rocket League, R6, Overwatch, CoD…)

1. Créer un compte gratuit sur https://pandascore.co (aucune carte demandée selon la page Tarifs consultée le 18/10/2026).
2. Copier le jeton dans le tableau de bord.
3. Limites de l'offre gratuite : 1 000 requêtes/heure, **calendrier et infos avant-match seulement**. Les résultats détaillés et les stats sont payants (dès 400 €/mois/jeu) : non concernés.
4. Le jeton serait stocké dans l'appareil (IndexedDB), jamais dans le dépôt.

### start.gg (jeux de combat, Smash)

Jeton personnel gratuit : https://start.gg → Paramètres développeur. CORS vérifié (`*`). Non branché en v1.

## Sécurité des clés

- Aucun secret n'est dans le dépôt. `.env` est ignoré par git ; voir `.env.example`.
- Toute variable `VITE_*` est incluse dans le code publié : un jeton mis là serait public. Un jeton personnel doit être saisi dans l'app, pas mis dans le build.
