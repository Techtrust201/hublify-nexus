-- Toutes les tables métier portent updated_at : la couche d'accès l'écrit de
-- façon uniforme sur chaque upsert.

alter table public.droits_personnalises
  add column if not exists updated_at timestamptz not null default now();
