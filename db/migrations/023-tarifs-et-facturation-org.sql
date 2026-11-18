-- Chantier « Créer une Mission » (PR 2/6) : grilles de tarifs et réglages de facturation.
--
-- Strictement additive et idempotente : trois nouvelles tables, vides. Aucune table
-- existante modifiée, aucune donnée écrite. Le code actuel ne les lit pas.
-- Rollback : db/rollback/023-tarifs-et-facturation-org.down.sql.

-- Grille de l'organisation : un tarif par type de mission (choix recommandé, non tranché :
-- voir la PR). Sert de « tarif contractuel » pour le mandataire et de repli sans tarif
-- prestataire. Sans ligne pour un type : pas de tarif calculé, le barème fixe s'applique (R5).
create table if not exists public.tarifs_org (
  org_id uuid not null references public.orgs (id) on delete cascade,
  type_mission text not null,
  montant_centimes integer not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, type_mission),
  constraint tarifs_org_type check (
    type_mission in ('Menage', 'Check-in', 'Check-out', 'Inventaire', 'Maintenance')
  ),
  constraint tarifs_org_montant check (montant_centimes >= 0)
);

-- Tarif d'un prestataire (fiche prestataire), par type de mission.
create table if not exists public.tarifs_prestataire (
  org_id uuid not null,
  prestataire_id text not null,
  type_mission text not null,
  montant_centimes integer not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, prestataire_id, type_mission),
  foreign key (org_id, prestataire_id)
    references public.prestataires (org_id, id) on delete cascade,
  constraint tarifs_prestataire_type check (
    type_mission in ('Menage', 'Check-in', 'Check-out', 'Inventaire', 'Maintenance')
  ),
  constraint tarifs_prestataire_montant check (montant_centimes >= 0)
);

-- Réglages de facturation de l'organisation. Table à part plutôt que des colonnes dans
-- org_compte : aucune ligne n'existe, donc rien à initialiser, et l'absence de ligne vaut
-- « réglages vides » : comportement actuel.
create table if not exists public.org_facturation (
  org_id uuid primary key references public.orgs (id) on delete cascade,
  -- Taux de TVA des prestations refacturées au locataire (0.2 = 20 %). NULL : défaut
  -- applicatif (choix recommandé : 20 %, à valider par le comptable ; non tranché).
  tva_prestations_locataire numeric(5, 4) null,
  -- Date d'effet des nouvelles règles de facturation. NULL (défaut) : règles actuelles
  -- partout. Les missions datées avant cette date gardent le calcul actuel.
  date_effet_facturation date null,
  updated_at timestamptz not null default now(),
  constraint org_facturation_tva check (
    tva_prestations_locataire is null
    or (tva_prestations_locataire >= 0 and tva_prestations_locataire < 1)
  )
);
