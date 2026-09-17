-- Champs demandés par les notes Figma du 11 et 15 septembre.

alter table public.reservations_dossier
  add column if not exists frais_menage numeric(12, 2) not null default 0,
  add column if not exists reduction_pourcent numeric(6, 2) not null default 0,
  add column if not exists reduction_montant numeric(12, 2) not null default 0,
  add column if not exists frais_plateforme numeric(12, 2) not null default 0,
  add column if not exists montant_voyageur numeric(12, 2) not null default 0,
  add column if not exists attribution_commission text not null default '';

alter table public.dossiers_location
  add column if not exists revenus numeric(12, 2),
  add column if not exists rfr numeric(12, 2),
  add column if not exists situation_professionnelle text not null default '',
  add column if not exists situation_familiale text not null default '',
  add column if not exists a_propos text not null default '';

alter table public.partages_dossier
  add column if not exists expire_le text,
  add column if not exists lien_externe text not null default '',
  add column if not exists note_personnelle text not null default '',
  add column if not exists telephone text not null default '';

alter table public.candidatures_location
  add column if not exists commission_incluse numeric(12, 2) not null default 0;

alter table public.candidatures_location drop constraint if exists candidatures_statut;
alter table public.candidatures_location
  add constraint candidatures_statut
    check (statut in ('brouillon', 'proposee', 'acceptee', 'refusee'));
