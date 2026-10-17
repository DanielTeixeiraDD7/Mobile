# Environnement (audit phase 0 — 17/10/2026)

| Élément | Constat | Conséquence |
|---|---|---|
| Système | Linux x86_64 (conteneur cloud) | — |
| Mac / Xcode / Swift | **absents** (`xcodebuild`, `swift` introuvables) | Pas d'app native SwiftUI : on fait une **PWA** |
| Node / npm | v22.22.0 / 10.9.4 | Build Vite possible |
| Registre npm | accessible | dépendances installées |
| AniList GraphQL | `https://graphql.anilist.co` répond (HTTP 200) | catalogue utilisable sans clé |
| Limite AniList observée | `X-RateLimit-Limit: 30` (mode dégradé annoncé dans la doc, normal = 90/min) | client limité à 25 req/min |
| CORS AniList | `access-control-allow-origin: *` (API), origine renvoyée pour les images | appels directs depuis le navigateur, affiches mises en cache par le SW |
| Navigateur de test | Chromium + Playwright préinstallés | tests de bout en bout en émulation iPhone |
| Hébergement | GitHub Pages du dépôt (déjà utilisé pour FitMaison et Budget) | gratuit, HTTPS |

## Voie technique retenue

PWA **TypeScript + React 19 + Vite 8 + IndexedDB (`idb`) + Service Worker + Manifest**, tests **Vitest** (+ `fake-indexeddb`, jsdom) et Playwright.

- Code source : `animepilot/`
- Build : `npm run build` → `../anime/` (servi par GitHub Pages)
- URL : https://danielteixeiradd7.github.io/Mobile/anime/

## Versions installées

react 19.3.1 · react-dom 19.3.1 · idb 8.0.4 · vite 8.3.4 · typescript 7.0.2 · vitest 5.0.5 · fake-indexeddb 6.2.6 · jsdom 29 · @testing-library/react 16

## Commandes

```bash
cd animepilot
npm install
npm run dev        # serveur local
npm test           # tests unitaires
npm run typecheck
npm run build      # écrit ../anime
```
