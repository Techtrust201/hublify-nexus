-- Rollback de 022-missions-facturation.sql. À jouer à la main, dans une transaction,
-- APRÈS une sauvegarde Neon et après retour à un code qui n'écrit pas ces colonnes.
-- Les données saisies dans ces colonnes sont perdues ; la méta JSON de `description`
-- (double écriture prévue en PR 3) reste intacte.
begin;
drop index if exists public.missions_ouvertes_idx;
drop index if exists public.missions_reservation_idx;
alter table public.missions
  drop constraint if exists missions_locataire_reservation,
  drop constraint if exists missions_tva_taux_check,
  drop constraint if exists missions_tarifs_positifs,
  drop constraint if exists missions_tarif_source_check,
  drop constraint if exists missions_porteur_check,
  drop constraint if exists missions_attribution_check,
  drop column if exists tva_taux,
  drop column if exists ouverte,
  drop column if exists tarif_manuel_centimes,
  drop column if exists tarif_source,
  drop column if exists tarif_calcule_centimes,
  drop column if exists reservation_id,
  drop column if exists porteur,
  drop column if exists attribution;
delete from public.schema_migrations where version = '022';
commit;
