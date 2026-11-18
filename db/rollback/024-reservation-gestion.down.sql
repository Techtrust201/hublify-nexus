-- Rollback de 024-reservation-gestion.sql. À jouer à la main, dans une transaction,
-- APRÈS une sauvegarde Neon et après retour à un code qui n'écrit pas ces colonnes.
begin;
alter table public.reservations_dossier
  drop column if exists consommable_gere,
  drop column if exists linge_gere,
  drop column if exists menage_gere;
delete from public.schema_migrations where version = '024';
commit;
