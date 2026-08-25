# HUBLIFY

Application de gestion locative et opérationnelle (biens, réservations, missions, prestataires).

Développée par **TECHTRUST AGENCY**.

## Stack

- React 19 + TypeScript
- TanStack Start / TanStack Router
- Tailwind CSS v4
- Vite 7
- Postgres (Neon en hébergé, Postgres 16 en CI) — état de démo persisté côté serveur, repli `localStorage`

## Base de données

Copier `.env.example` vers `.env.local` (gitignoré) avec `DATABASE_URL`, **sans** préfixe `VITE_`.

Pour reproduire la CI en local :

```bash
docker compose up -d
# dans .env.local : DATABASE_URL=postgresql://hublify:hublify@127.0.0.1:5432/hublify
# Si le port 5432 est occupé : POSTGRES_PUBLISH=55432 docker compose up -d
npm run db:prepare
```

Sur Neon (démo hébergée), la même URL Postgres standard convient — le client HTTP Neon n'est plus utilisé.

```bash
npm run db:apply   # schéma
npm run db:seed    # comptes de démo
```

## Démarrage

```bash
bun install
bun run dev
```

L'application démarre sur `http://localhost:8080`.

## Scripts

| Commande | Description |
| --- | --- |
| `bun run dev` | Serveur de développement |
| `bun run build` | Build de production |
| `bun run preview` | Prévisualisation du build |
| `bun run lint` | Analyse statique ESLint |
| `bun run format` | Formatage Prettier |
| `npm test` | Tests unitaires Vitest |
| `npm run e2e` | Tests Playwright (exige `DATABASE_URL` + seed) |
| `npm run db:prepare` | Applique le schéma et sème les comptes de démo |

## Structure

```
src/
  components/   Composants UI et layout
  data/         Types, statuts, jeu de données fictif centralisé
  routes/       Routes applicatives (TanStack Router)
  styles.css    Design system (tokens, typographie)
docs/           Documentation projet et décisions
```
