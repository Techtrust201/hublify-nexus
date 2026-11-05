-- Relance automatique des loyers en attente (Vue générale, bouton « relance · auto »).
-- Idempotente : une colonne déjà présente n'est pas recréée.
-- Ne pas appliquer à la main en production : le script `npm run db:migrate` la joue une fois.

alter table public.loyers
  add column if not exists relance_auto boolean not null default false;
