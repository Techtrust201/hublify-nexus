-- Rollback de 023-tarifs-et-facturation-org.sql. À jouer à la main, dans une transaction,
-- APRÈS une sauvegarde Neon et après retour à un code qui n'utilise pas ces tables.
-- Les grilles, tarifs prestataires et réglages saisis sont perdus.
begin;
drop table if exists public.org_facturation;
drop table if exists public.tarifs_prestataire;
drop table if exists public.tarifs_org;
delete from public.schema_migrations where version = '023';
commit;
