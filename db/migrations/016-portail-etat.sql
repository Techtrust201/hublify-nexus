-- État du portail locataire / prestataire, auparavant limité au navigateur
-- (notes, simulations de paiement, état des lieux, rendez-vous, favoris,
-- candidature). Une ligne par compte. Idempotente.

create table if not exists public.portail_etat (
  user_id uuid primary key references public."user" (id) on delete cascade,
  mode text,
  demarre boolean not null default false,
  notes jsonb not null default '[]'::jsonb,
  paiements jsonb not null default '[]'::jsonb,
  edl jsonb not null default '{}'::jsonb,
  rdv jsonb,
  demandes jsonb not null default '[]'::jsonb,
  favoris jsonb not null default '[]'::jsonb,
  doc_courant text,
  candidature jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint portail_etat_mode check (mode is null or mode in ('resident', 'prestataire'))
);
