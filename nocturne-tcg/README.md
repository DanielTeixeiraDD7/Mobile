# Nocturne — cartes à collectionner gothiques

Jeu web de cartes virtuelles (gacha / TCG) : monstres et légendes du domaine public, style anime sombre, cible 16-25 ans.
Démo jouable (données locales, paiements désactivés) : https://danielteixeiradd7.github.io/Mobile/nocturne/

## Architecture

```
nocturne-tcg/            workspaces npm
├─ shared/               TypeScript pur, utilisé par le serveur ET le client
│  ├─ cards.ts           Set 1 « Nuit Éternelle » : 64 cartes (stats, capacités, lore, silhouette)
│  ├─ gacha.ts           tirage pondéré par slot, pitié Épique/Légendaire, taux exacts, cartes mises en avant
│  ├─ economy.ts         boosters gratuits (recharge), poussière, missions, cosmétiques, âge, semaines ISO
│  ├─ battle.ts          moteur de combat déterministe (graine) + IA
│  └─ api.ts             contrats (DTO) partagés
├─ server/               Express 5 + TypeScript + Prisma/PostgreSQL
│  ├─ prisma/            schema.prisma, migration (+ trigger SQL ledger immuable), seed
│  └─ src/modules/       auth · catalog · gacha · economy (ledger, wallet) · collection · missions
│                        trades · shop · account (RGPD, conformité) · battle · admin
└─ client/               Vue 3 + Vite + Pinia + Vue Router, PWA mobile-first
   ├─ src/api/http.ts    client de l'API réelle (cookie httpOnly)
   ├─ src/api/demo/      backend de démo dans le navigateur (même moteur partagé, localStorage)
   ├─ src/components/    CardView (cadre, holo), CardArt (illustrations SVG), PackOpening (animation)…
   └─ src/pages/         accueil, boosters, taux, collection, carte, échanges, missions, boutique, combat, profil, légal, admin
```

### Principes clés
- **Tirage 100 % serveur** : `crypto.randomInt`, taux lus en BDD (`PackSlot`/`SlotRate`), le client ne reçoit que le résultat.
- **Pitié par joueur et par bannière** (`PityCounter`) : Épique ou mieux garanti tous les X boosters, Légendaire garanti au 100e.
- **Ledger** (`LedgerEntry`) : toute variation de solde (Éclats, Braises, Poussière) est une écriture ; le solde = `SUM(amount)`.
  Un trigger PostgreSQL interdit `UPDATE`/`DELETE`. Les débits verrouillent la ligne joueur (`SELECT … FOR UPDATE`) : aucun solde négatif, même en concurrence.
- **Transactions SQL** pour tirage, échange, crédit, craft, recyclage, récompenses.
- **Sécurité** : bcrypt, JWT en cookie httpOnly SameSite=Lax, contrôle d'origine (anti-CSRF), helmet, zod partout, rate limiting (auth, tirages, paiements).
- **Conformité** : taux exacts publics avant achat, compteur de pitié affiché, âge à l'inscription (13 ans min.), achats mineurs bloqués sans accord parental + plafond 30 €/mois,
  plafond personnel, boosters payants désactivables par pays (BE par défaut), échanges carte contre carte uniquement, CGU/CGV/RGPD, export JSON et suppression du compte.

### Schéma (résumé)
`User` · `EmailToken` · `CardSet` · `Card` · `UserCard` · `PackType` · `PackSlot` · `SlotRate` · `Banner` · `BannerFeature` · `PityCounter` ·
`Pull` · `PullCard` · `LedgerEntry` · `DailyLogin` · `Mission` · `MissionProgress` · `Trade` · `TradeItem` · `Cosmetic` · `UserCosmetic` ·
`ShopProduct` · `Purchase` · `Subscription` · `StripeEvent` · `CountryConfig` · `Setting` · `Deck` · `DeckCard` · `Battle` · `AuditLog`
(détail : `server/prisma/schema.prisma`).

## Lancer en local

```bash
cd nocturne-tcg
npm install
cp server/.env.example server/.env        # adapter DATABASE_URL / JWT_SECRET
cd server && npx prisma migrate deploy && npm run db:seed && cd ..
npm run dev:server                         # API sur http://localhost:3000/api
npm run dev:client                         # http://localhost:5173 (proxy /api)
```
Compte admin créé par le seed : `ADMIN_EMAIL` / `ADMIN_PASSWORD` du `.env`. Joueurs de test pour les échanges : Morgane, Corvus, Lilas_Noir.
Sans SMTP, les emails de vérification s'affichent dans la console du serveur.

Démo statique : `npm run build:demo` (écrit `../nocturne/` pour GitHub Pages).

## Tests
```bash
npm test -w shared   # 23 tests : set, tirage, distribution, pitié, recharge, combat
npm test -w server   # 21 tests d'intégration sur une base PostgreSQL *_test (TEST_DATABASE_URL)
npm test -w client   # 4 tests de l'API de démo
```

## Avancement

| Phase | Contenu | État |
|---|---|---|
| 1 MVP | auth + vérification email, 64 cartes, collection, boosters gratuits, gacha + pitié, historique, animation d'ouverture | ✅ |
| 2 Paiement | Stripe Checkout (Éclats), Billing + Customer Portal (Pass), webhooks signés + idempotents, Stripe Tax, remboursements/litiges, case de renonciation 14 j | ⏳ à faire après validation du visuel ; schéma prêt (`Purchase`, `Subscription`, `StripeEvent`, `ShopProduct`) |
| 2 Conformité | ledger immuable, taux publics, âge/mineurs/plafonds, pays, CGU/CGV/RGPD, export/suppression | ✅ |
| 3 | échanges à double confirmation, missions quotidiennes/hebdo, connexion quotidienne, cosmétiques, panel admin (stats, joueurs, cartes, taux, bannières, pays, transactions, audit) | ✅ |
| 4 | combat au tour par tour, deck de 10 cartes, 10 capacités, IA, récompenses | ✅ |

À faire ensuite : intégration Stripe (mode test), vraies illustrations via `imageUrl` (champ éditable dans l'admin), relecture juridique des textes légaux.
