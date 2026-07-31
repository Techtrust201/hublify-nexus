# HUBLIFY

Application de gestion locative et opérationnelle (biens, réservations, missions, prestataires).

Développée par **TECHTRUST AGENCY**.

## Stack

- React 19 + TypeScript
- TanStack Start / TanStack Router
- Tailwind CSS v4
- Vite 7

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

## Structure

```
src/
  components/   Composants UI et layout
  data/         Types, statuts, jeu de données fictif centralisé
  routes/       Routes applicatives (TanStack Router)
  styles.css    Design system (tokens, typographie)
docs/           Documentation projet et décisions
```
