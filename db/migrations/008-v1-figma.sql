-- Hublify V1 : finances / pré-checkin des réservations, syndic, rapports,
-- dossiers de location, rôles portail.

-- ----------------------------------------------------- réservations dossier

alter table public.reservations_dossier
  add column if not exists taxe_sejour numeric(12, 2) not null default 0,
  add column if not exists commission_pourcent numeric(6, 2) not null default 0,
  add column if not exists commission_montant numeric(12, 2) not null default 0,
  add column if not exists caution numeric(12, 2) not null default 0,
  add column if not exists precheckin_statut text not null default 'non_fait',
  add column if not exists precheckin_identite text not null default '',
  add column if not exists precheckin_nb_personnes integer not null default 0,
  add column if not exists precheckin_heure_arrivee text not null default '',
  add column if not exists precheckin_note text not null default '',
  add column if not exists remboursements jsonb not null default '[]'::jsonb;

alter table public.reservations_dossier drop constraint if exists reservations_precheckin_statut;
alter table public.reservations_dossier
  add constraint reservations_precheckin_statut
    check (precheckin_statut in ('non_fait', 'fait'));

-- -------------------------------------------------------------- documents syndic

alter table public.documents drop constraint if exists documents_vue;
alter table public.documents
  add constraint documents_vue
    check (vue in ('logements', 'residents', 'proprio', 'inventaire-presta', 'factures', 'syndic'));

-- -------------------------------------------------------------- rôles portail

insert into public.roles (id, label, description) values
  ('locataire', 'Locataire', 'Espace résident : logement, bail, quittances, messages'),
  ('voyageur', 'Voyageur', 'Espace voyageur : séjours, pré-checkin, documents d''accès'),
  ('proprietaire', 'Propriétaire', 'Espace propriétaire : biens, loyers, documents, messages')
on conflict (id) do update
  set label = excluded.label, description = excluded.description;

insert into public.role_permissions (role_id, permission_id) values
  ('locataire', 'voir-reservations'),
  ('locataire', 'voir-documents'),
  ('locataire', 'messagerie'),
  ('voyageur', 'voir-reservations'),
  ('voyageur', 'voir-documents'),
  ('voyageur', 'messagerie'),
  ('proprietaire', 'voir-biens'),
  ('proprietaire', 'voir-finances'),
  ('proprietaire', 'voir-documents'),
  ('proprietaire', 'messagerie')
on conflict do nothing;

-- -------------------------------------------------------------- nouvelles tables

create table if not exists public.rapports_intervention (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  mission_id text not null,
  texte text not null default '',
  photos text[] not null default '{}',
  auteur text not null default '',
  date_rapport text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create index if not exists rapports_mission_idx on public.rapports_intervention (org_id, mission_id);

create table if not exists public.contacts_copro (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  nom text not null default '',
  copropriete text not null default '',
  email text not null default '',
  telephone text not null default '',
  relance text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.dossiers_location (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  occupant_id text not null default '',
  occupant_nom text not null default '',
  email text not null default '',
  statut text not null default 'brouillon',
  pieces jsonb not null default '[]'::jsonb,
  garants jsonb not null default '[]'::jsonb,
  duree_acces_mois integer not null default 24,
  archive_le text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, id),
  constraint dossiers_statut check (statut in ('brouillon', 'complet', 'partage', 'archive'))
);

create table if not exists public.partages_dossier (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  dossier_id text not null,
  destinataire text not null default '',
  autorise boolean,
  demande_le text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, id)
);

create table if not exists public.candidatures_location (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  dossier_id text not null,
  bien_id text not null,
  arrivee date not null,
  depart date not null,
  montant numeric(12, 2) not null default 0,
  statut text not null default 'proposee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, id),
  constraint candidatures_sejour check (depart >= arrivee),
  constraint candidatures_statut check (statut in ('proposee', 'acceptee', 'refusee'))
);
