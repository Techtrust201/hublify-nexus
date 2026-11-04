-- Livrets d'accueil, fiches catalogue des upsells et options « extra »
-- du pré-check-in. Une ligne appartient à une organisation : aucune lecture
-- ni écriture ne traverse ce cloisonnement.
-- Additive et idempotente : aucune table existante n'est modifiée ni supprimée.

-- ------------------------------------------------------------ Livrets et fiches d'accès

create table if not exists public.org_livrets (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  payload jsonb not null,
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (org_id, id),
  constraint org_livrets_payload_objet check (jsonb_typeof(payload) = 'object')
);

-- ---------------------------------------------------- Fiches catalogue upsells
-- Le prix, le nom et l'activation restent dans parametrage_upsells.
-- Ici : code, type, prestataire, ville, pièce jointe.

create table if not exists public.org_upsell_fiches (
  org_id uuid not null references public.orgs (id) on delete cascade,
  upsell_id text not null,
  code text not null default '',
  type text not null default 'Service',
  prestataire text not null default '',
  ville text not null default '',
  piece_jointe text not null default '',
  updated_at timestamptz not null default now(),
  primary key (org_id, upsell_id)
);

-- ----------------------------------------------- Options extra du pré-check-in

create table if not exists public.org_precheckin_extra (
  org_id uuid primary key references public.orgs (id) on delete cascade,
  recto_verso boolean not null default true,
  photo boolean not null default true,
  fichier boolean not null default true,
  telephone boolean not null default true,
  code_porte_jour_arrivee boolean not null default false,
  caution_active boolean not null default false,
  caution_montant numeric(10, 2) not null default 0,
  caution_baux boolean not null default true,
  caution_voyageurs boolean not null default true,
  upsells_proposes text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint org_precheckin_extra_montant check (caution_montant >= 0)
);
