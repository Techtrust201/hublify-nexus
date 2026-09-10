-- Socle : authentification, RBAC, organisations, journal de mails et tables
-- métier historiques (payload jsonb). Idempotente : rejouable sur une base déjà
-- provisionnée par l'ancien scripts/apply-schema.mjs sans rien détruire.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- Better Auth

create table if not exists "user" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null,
  "image" text,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null default current_timestamp
);

create table if not exists "session" (
  "id" uuid primary key default gen_random_uuid(),
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" uuid not null references "user" ("id") on delete cascade
);

create table if not exists "account" (
  "id" uuid primary key default gen_random_uuid(),
  "accountId" text not null,
  "providerId" text not null,
  "userId" uuid not null references "user" ("id") on delete cascade,
  "issuer" text,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null
);

alter table "account" add column if not exists "issuer" text;

update "account" set "issuer" = 'local:credential'
  where "issuer" is null and "providerId" = 'credential';

update "account" set "issuer" = coalesce("issuer", "providerId") where "issuer" is null;

create table if not exists "verification" (
  "id" uuid primary key default gen_random_uuid(),
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default current_timestamp,
  "updatedAt" timestamptz not null default current_timestamp
);

create index if not exists "session_userId_idx" on "session" ("userId");
create index if not exists "account_userId_idx" on "account" ("userId");
create unique index if not exists "account_issuer_accountId_uidx" on "account" ("issuer", "accountId");
create index if not exists "verification_identifier_idx" on "verification" ("identifier");

-- ----------------------------------------------------------------------- RBAC

create table if not exists public.roles (
  id text primary key,
  label text not null,
  description text not null
);

create table if not exists public.permissions (
  id text primary key,
  groupe text not null,
  titre text not null,
  description text not null
);

create table if not exists public.role_permissions (
  role_id text not null references public.roles (id) on delete cascade,
  permission_id text not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Le rôle vit dans org_membres depuis la bascule multi-organisation.
create table if not exists public.profils (
  user_id uuid primary key references "user" ("id") on delete cascade,
  prenom text not null,
  nom text not null,
  initiales text not null,
  affectation text not null default '',
  statut text not null default 'actif'
);

drop index if exists profils_role_id_idx;
alter table public.profils drop constraint if exists profils_role_id_fkey;
alter table public.profils drop column if exists role_id;
alter table public.profils drop column if exists droits;
drop table if exists public.etats_session;

insert into public.roles (id, label, description) values
  ('super-admin', 'Super-administrateur', 'Accès intégral, comptes fondateurs protégés'),
  ('administrateur', 'Administrateur', 'Pilotage complet, équipe et finances'),
  ('gestionnaire', 'Gestionnaire', 'Opérations quotidiennes sans administration d''équipe'),
  ('prestataire', 'Prestataire', 'Missions, documents d''intervention et messagerie'),
  ('lecteur', 'Lecture', 'Consultation seule, sans modification')
on conflict (id) do update
  set label = excluded.label, description = excluded.description;

insert into public.permissions (id, groupe, titre, description) values
  ('voir-reservations', 'Lecture', 'Voir les réservations', 'Accès en lecture aux réservations'),
  ('voir-finances', 'Lecture', 'Voir les finances', 'Accès en lecture aux données financières'),
  ('voir-biens', 'Lecture', 'Voir les biens', 'Accès en lecture aux fiches biens'),
  ('voir-documents', 'Lecture', 'Voir les documents', 'Accès aux documents et contrats'),
  ('messagerie', 'Lecture', 'Messagerie', 'Envoyer et recevoir des messages'),
  ('voir-calendrier', 'Lecture', 'Voir le calendrier', 'Accès au calendrier et aux vues annuelles'),
  ('mod-reservations', 'Modification', 'Modifier les réservations', 'Créer et modifier des réservations'),
  ('mod-finances', 'Modification', 'Modifier les finances', 'Saisir et modifier les montants'),
  ('mod-biens', 'Modification', 'Modifier les biens', 'Créer et modifier les fiches biens'),
  ('mod-missions', 'Modification', 'Mettre à jour les missions', 'Changer le statut des missions et interventions'),
  ('gerer-equipe', 'Administration', 'Gérer l''équipe', 'Inviter, modifier les droits et supprimer des membres')
on conflict (id) do update
  set groupe = excluded.groupe, titre = excluded.titre, description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
  select 'super-admin', id from public.permissions on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
  select 'administrateur', id from public.permissions on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
  select 'gestionnaire', id from public.permissions where id <> 'gerer-equipe'
  on conflict do nothing;

insert into public.role_permissions (role_id, permission_id) values
  ('prestataire', 'voir-calendrier'),
  ('prestataire', 'voir-documents'),
  ('prestataire', 'messagerie'),
  ('prestataire', 'mod-missions'),
  ('lecteur', 'voir-reservations'),
  ('lecteur', 'voir-biens'),
  ('lecteur', 'voir-documents'),
  ('lecteur', 'voir-calendrier')
on conflict do nothing;

-- -------------------------------------------------------------- Organisations

create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type text not null check (type in ('gestionnaire', 'prestataire')),
  created_at timestamptz not null default now()
);

create table if not exists public.org_membres (
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid not null references "user" ("id") on delete cascade,
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

-- ------------------------------------------------------------ Journal de mail

create table if not exists public.mails_sortants (
  id uuid primary key default gen_random_uuid(),
  destinataire text not null,
  sujet text not null,
  html text not null,
  created_at timestamptz not null default now()
);

create index if not exists mails_sortants_destinataire_idx
  on public.mails_sortants (destinataire, created_at desc);

-- ------------------------------------- Métier historique (typé en 002 et 003)

create table if not exists public.biens (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  nom text not null,
  base_nuit integer not null default 0,
  payload jsonb not null default '{}',
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
