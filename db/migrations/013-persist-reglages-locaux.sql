-- Persistance serveur des réglages qui vivaient dans localStorage :
-- compte entreprise (RIB), fiche lieu étendue, relances / abonnement,
-- messages automatiques de messagerie.
-- Idempotente : create table if not exists, add column if not exists.

-- ------------------------------------------------------------ Compte entreprise / RIB

create table if not exists public.org_compte (
  org_id uuid primary key references public.orgs (id) on delete cascade,
  offre_commerciale text not null default 'Gestion locative',
  raison_sociale text not null default '',
  siret text not null default '',
  adresse text not null default '',
  detenteur_carte_t boolean not null default false,
  numero_agrement text not null default '',
  iban text not null default '',
  titulaire_rib text not null default '',
  equipe_hote text not null default 'THIERRY',
  equipe_quittee boolean not null default false,
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------- Fiche lieu étendue

alter table public.biens
  add column if not exists fiche jsonb not null default '{}'::jsonb;

create table if not exists public.org_types_lieu (
  org_id uuid primary key references public.orgs (id) on delete cascade,
  types text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ------------------------------------------- Relances & réglages étendus

create table if not exists public.org_reglages_etendus (
  org_id uuid primary key references public.orgs (id) on delete cascade,
  relance_loyer boolean not null default true,
  message_relance_loyer text not null default '',
  relance_facture boolean not null default true,
  message_relance_facture text not null default '',
  auto_menage boolean not null default true,
  auto_edl_bail boolean not null default true,
  messages_auto boolean not null default true,
  abonnement_ref text not null default 'HUB-000000',
  abonnement_actif boolean not null default true,
  offre text not null default 'confort',
  updated_at timestamptz not null default now(),
  constraint org_reglages_etendus_offre check (offre in ('essentiel', 'confort', 'agence'))
);

-- ------------------------------------------- Messagerie auto (JSON)

create table if not exists public.org_reglages_messagerie (
  org_id uuid primary key references public.orgs (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
