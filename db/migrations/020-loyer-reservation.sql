-- Lien loyer → réservation : un loyer peut désigner le séjour (reservations_dossier) qu'il règle.
-- Strictement additive et idempotente : la colonne est nullable, aucune ligne existante n'est
-- modifiée (aucun UPDATE ici ; le rattachement des loyers existants passe par
-- `scripts/rattacher-loyers-reservations.ts`, séparé, non ambigu uniquement).
--
-- Pas de clé étrangère volontairement : `remplacerCollection` / `upsertLigne` écrivent les
-- collections ligne à ligne et une réservation peut être supprimée alors que son loyer reste
-- (historique comptable) ; une FK ferait échouer ces écritures sur des données existantes ou
-- à venir. Un lien orphelin est simplement ignoré à la lecture (la relance retombe sur la
-- règle locataire + logement + échéance). Le type est celui de `reservations_dossier.id` (text).

alter table public.loyers
  add column if not exists reservation_id text null;

create index if not exists loyers_reservation_idx
  on public.loyers (org_id, reservation_id)
  where reservation_id is not null;
