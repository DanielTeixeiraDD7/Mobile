// Le build sort à la racine du dépôt (même adresse que FitMaison v1, pour garder les données
// et l'icône d'écran d'accueil). On ne vide donc PAS le dossier de sortie : seulement nos assets.
import { rmSync } from 'node:fs';
rmSync(new URL('../../assets', import.meta.url), { recursive: true, force: true });
