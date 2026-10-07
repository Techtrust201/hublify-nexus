-- Notes Figma « profil locataire » et « Détails » du paiement : chaque encaissement
-- garde sa date, sa méthode et sa référence, au lieu d'un simple cumul.

alter table public.loyers
  add column if not exists methode text not null default '',
  add column if not exists reference text not null default '',
  add column if not exists paye_le text not null default '';

alter table public.reservations_dossier
  add column if not exists paiements jsonb not null default '[]'::jsonb;
