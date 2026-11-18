-- Chantier « Créer une Mission » (PR 2/6) : vraies colonnes de facturation sur les missions.
--
-- Strictement additive et idempotente :
-- - aucune suppression, aucun renommage, aucun UPDATE, aucune donnée modifiée ;
-- - toutes les colonnes sont nullable, sauf `ouverte` (NOT NULL DEFAULT false : défaut
--   constant, ajout sans réécriture de table sur Postgres ≥ 11, et « fermée » est l'état
--   de toutes les missions aujourd'hui pour l'application) ;
-- - le code actuel ne lit ni n'écrit ces colonnes (CHAMPS explicites dans src/data/metier.ts) :
--   la méta JSON cachée dans `description` reste la source tant que la PR 3 n'est pas fusionnée.
-- La reprise des missions existantes est un script séparé (scripts/reprendre-meta-missions.ts),
-- non exécuté par cette migration.
-- Rollback : db/rollback/022-missions-facturation.down.sql.

alter table public.missions
  -- À qui la prestation est facturée. 'mandataire' = l'organisation gestionnaire
  -- (choix recommandé, non tranché : voir la PR).
  add column if not exists attribution text null,
  -- Qui réalise la prestation (« Assigné à » de la maquette).
  add column if not exists porteur text null,
  -- Réservation liée (reservations_dossier.id, même org). Pas de FK, comme loyers.reservation_id
  -- (020) : les collections sont réécrites ligne à ligne et un lien orphelin est ignoré.
  add column if not exists reservation_id text null,
  -- Tarif calculé automatiquement (grille de l'org ou fiche prestataire), en centimes.
  add column if not exists tarif_calcule_centimes integer null,
  -- D'où vient le tarif calculé.
  add column if not exists tarif_source text null,
  -- Tarif saisi à la main : prioritaire sur le tarif calculé quand il est renseigné.
  add column if not exists tarif_manuel_centimes integer null,
  -- « Ouvert » : mission proposée sur la marketplace.
  add column if not exists ouverte boolean not null default false,
  -- Taux de TVA figé sur la ligne au moment de la facturation (0.2 = 20 %).
  add column if not exists tva_taux numeric(5, 4) null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'missions_attribution_check') then
    alter table public.missions add constraint missions_attribution_check
      check (attribution is null or attribution in ('mandataire', 'proprietaire', 'locataire'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'missions_porteur_check') then
    alter table public.missions add constraint missions_porteur_check
      check (porteur is null or porteur in ('prestataire', 'teammate', 'proprietaire'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'missions_tarif_source_check') then
    alter table public.missions add constraint missions_tarif_source_check
      check (tarif_source is null or tarif_source in ('grille_org', 'prestataire'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'missions_tarifs_positifs') then
    alter table public.missions add constraint missions_tarifs_positifs
      check (
        (tarif_calcule_centimes is null or tarif_calcule_centimes >= 0)
        and (tarif_manuel_centimes is null or tarif_manuel_centimes >= 0)
      );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'missions_tva_taux_check') then
    alter table public.missions add constraint missions_tva_taux_check
      check (tva_taux is null or (tva_taux >= 0 and tva_taux < 1));
  end if;
  -- Règle validée par Hugo (18/11) : une prestation facturée au locataire est liée à une
  -- réservation. Toutes les lignes existantes ont attribution NULL : la contrainte est
  -- satisfaite sans toucher aux données.
  if not exists (select 1 from pg_constraint where conname = 'missions_locataire_reservation') then
    alter table public.missions add constraint missions_locataire_reservation
      check (attribution is distinct from 'locataire' or reservation_id is not null);
  end if;
end $$;

create index if not exists missions_reservation_idx
  on public.missions (org_id, reservation_id)
  where reservation_id is not null;

create index if not exists missions_ouvertes_idx
  on public.missions (org_id, jour)
  where ouverte;
