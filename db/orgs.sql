-- Organisations, membres et liens B2B. Le rôle vit ici, plus dans profils.

drop table if exists public.etats_session;

create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type text not null check (type in ('gestionnaire', 'prestataire')),
  created_at timestamptz not null default now()
);

create table if not exists public.org_membres (
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid not null references "user" (id) on delete cascade,
  role_id text not null references public.roles (id),
  droits text[] not null default '{}',
  statut text not null default 'actif',
  primary key (org_id, user_id)
);

create unique index if not exists org_membres_user_id_uidx on public.org_membres (user_id);

create index if not exists org_membres_org_id_idx on public.org_membres (org_id);

create table if not exists public.liens_org (
  org_gestionnaire_id uuid not null references public.orgs (id) on delete cascade,
  org_prestataire_id uuid not null references public.orgs (id) on delete cascade,
  statut text not null default 'actif',
  primary key (org_gestionnaire_id, org_prestataire_id),
  check (org_gestionnaire_id <> org_prestataire_id)
);

drop index if exists profils_role_id_idx;

alter table public.profils drop constraint if exists profils_role_id_fkey;

alter table public.profils drop column if exists role_id;

alter table public.profils drop column if exists droits;
