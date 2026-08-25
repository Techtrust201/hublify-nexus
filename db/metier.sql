-- Métier par organisation. Une table par domaine, ligne = une entité.
-- payload jsonb conserve la forme UI MO1 le temps que les écrans basculent colonne par colonne.

drop table if exists public.biens cascade;

create table public.biens (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  nom text not null,
  base_nuit integer not null default 0,
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.reservations_dossier (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.reservations_cal (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.dates_bloquees (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.dates_bloquees_annuelles (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.missions (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  org_prestataire_id uuid references public.orgs (id) on delete set null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create index if not exists missions_prestataire_idx on public.missions (org_prestataire_id);

create table if not exists public.loyers (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.evenements (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.messages_dash (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.conversations (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.messages_fil (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.ensembles (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.regles (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.notifications (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.actions (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.prestataires (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.documents (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  nom text not null,
  mime text not null default 'application/pdf',
  chemin text not null,
  contenu bytea,
  created_at timestamptz not null default now(),
  primary key (org_id, id)
);
