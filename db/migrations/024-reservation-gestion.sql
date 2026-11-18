-- Chantier « Créer une Mission » (PR 2/6) : « Gestion : Ménage / Linge / Consommable » Oui/Non
-- sur la réservation (règle R4 validée par Hugo le 18/11).
--
-- Strictement additive et idempotente : trois colonnes nullable, aucune donnée écrite.
-- NULL = « non renseigné » : l'application garde le calcul actuel (le linge suit chaque
-- ménage). Aucun défaut « Non » qui ferait baisser les factures propriétaire.
-- Rollback : db/rollback/024-reservation-gestion.down.sql.

alter table public.reservations_dossier
  add column if not exists menage_gere boolean null,
  add column if not exists linge_gere boolean null,
  add column if not exists consommable_gere boolean null;
