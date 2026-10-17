# Limites connues

## Plateforme

- **Pas d'app native** : aucun Mac / Xcode dans l'environnement, donc une PWA. Pas d'App Store, pas de widget, pas de Live Activity.
- **Rappels** : une PWA ne peut pas programmer de notification locale app fermée, et un serveur push serait un service tiers à configurer. Donc :
  - **export `.ics`** vers le Calendrier : fiable app fermée, mais à refaire chaque semaine, et les décalages de diffusion ne sont pas suivis ;
  - **notifications de l'app** : seulement tant qu'elle est ouverte ou récemment en arrière-plan. Sur iPhone, exige iOS 16.4+ et l'app installée.
  - **Non vérifié sur un vrai iPhone** (testé en émulation Chromium).
- **Stockage** : IndexedDB peut être effacé par iOS (voir PRIVACY.md). Seule protection : l'export JSON.
- **Partage de fichiers** (export `.ics` / JSON) : feuille de partage si disponible, sinon téléchargement. Le comportement exact sur iPhone n'a pas été vérifié.

## Données AniList

- **Horaires** : diffusion **japonaise** convertie à ton fuseau. La sortie sur Crunchyroll, ADN ou Netflix peut être décalée de quelques heures à plusieurs mois.
- **Totaux inconnus** pour les séries en cours, surtout les manga (« ? ») : pas de borne, pas de fin automatique, pas de « reste à lire ».
- **Retard** : calculé depuis le prochain épisode annoncé. Une copie non rafraîchie (hors-ligne) peut être en retard d'un épisode.
- **Disponibilité** : l'API est en mode dégradé (30 req/min) et peut être coupée par AniList. La bibliothèque, le calendrier (prochain épisode connu), l'assistant et les stats restent utilisables.
- **Conditions d'utilisation** : voir l'avertissement dans [API.md](API.md). Outil personnel uniquement.

## Fonctionnelles

- **Assistant** : règles par mots-clés, pas une IA. Il comprend une liste limitée de questions et le dit quand il ne comprend pas.
- **Recommandations** : dépendent des recommandations communautaires AniList et des tendances ; elles peuvent proposer une suite d'une série déjà suivie. Le profil est peu fiable sous 5 titres (bandeau affiché).
- **Estimations** de temps : durée AniList × épisodes (génériques inclus), 24 min si la durée est inconnue, 5 min par chapitre de manga.
- **Historique** : limité aux 2 000 dernières actions. Les revisionnages ne sont comptés que via le compteur.
- **Pas d'import** depuis MyAnimeList ou un compte AniList (prévu en option, voir ROADMAP).
- **Pas de synchronisation** entre appareils (volontaire : local, sans compte). Passer d'un appareil à l'autre se fait par export / import.
