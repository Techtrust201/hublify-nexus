-- Demande de paiement posée depuis le panneau « En détails » ou une relance d'analyse.
-- Additive et idempotente : la colonne vide ne change aucune ligne existante.

alter table public.reservations_dossier
  add column if not exists demande_paiement_le text not null default '';
