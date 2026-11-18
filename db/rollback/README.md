# Rollbacks manuels

`scripts/migrer.mjs` joue tous les `.sql` de `db/migrations/` et ne connaît pas les retours
en arrière. Les fichiers de ce dossier ne sont **jamais** joués automatiquement.

Règles :

- toujours faire une **branche de sauvegarde Neon** avant d'appliquer une migration ou un rollback en prod ;
- revenir d'abord à un code qui n'utilise plus ce que le rollback retire ;
- jouer les rollbacks **dans l'ordre inverse** des migrations, par exemple 024 → 023 → 022 ;
- chaque fichier est une transaction (`begin … commit`), rejouable, et retire sa version
  de `public.schema_migrations` pour que `npm run db:migrate` puisse la rejouer ensuite.

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/rollback/024-reservation-gestion.down.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/rollback/023-tarifs-et-facturation-org.down.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/rollback/022-missions-facturation.down.sql
```
