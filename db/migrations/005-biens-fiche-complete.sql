-- La page Patrimoine fusionnait un jeu de logements de maquette avec les biens
-- de session, par correspondance de nom. La fiche complète vit désormais sur le
-- bien lui-même : une seule ligne, un seul identifiant.

alter table public.biens
  add column if not exists surface text not null default '—',
  add column if not exists meuble boolean not null default true,
  add column if not exists proprietaire text not null default '',
  add column if not exists initiales text not null default '',
  add column if not exists note numeric(3, 2) not null default 5,
  add column if not exists statut text not null default 'libre';

alter table public.biens
  add constraint biens_statut check (statut in ('loué', 'libre', 'en travaux')),
  add constraint biens_note_bornee check (note >= 0 and note <= 5);

create index if not exists biens_statut_idx on public.biens (org_id, statut);
