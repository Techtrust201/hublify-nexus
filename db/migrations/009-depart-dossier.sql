-- Déclaration de départ locataire : date demandée, validation gestionnaire.

alter table public.dossiers_location
  add column if not exists depart_declare text,
  add column if not exists depart_valide boolean not null default false;
