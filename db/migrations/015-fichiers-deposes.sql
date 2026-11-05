-- Binaires déposés (photo ou fichier, recto/verso).
-- La fiche, le dossier et le rapport ne gardent que l'identifiant :
-- les octets ne restent pas dans le navigateur ni dans un jsonb.
-- Idempotente.

create table if not exists public.fichiers_deposes (
  org_id uuid not null references public.orgs (id) on delete cascade,
  id text not null,
  contexte text not null,
  ref_id text not null,
  cote text not null default '',
  nom text not null,
  mime text not null,
  taille integer not null,
  contenu bytea not null,
  user_id uuid not null references "user" (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (org_id, id),
  constraint fichiers_contexte check (contexte in ('profil', 'patrimoine', 'dossier', 'mission')),
  constraint fichiers_cote check (cote in ('', 'recto', 'verso')),
  constraint fichiers_taille check (taille > 0 and taille <= 1500000)
);

create index if not exists fichiers_deposes_ref_idx
  on public.fichiers_deposes (org_id, contexte, ref_id);

create unique index if not exists fichiers_deposes_cote_uniq
  on public.fichiers_deposes (org_id, contexte, ref_id, cote)
  where cote <> '';
