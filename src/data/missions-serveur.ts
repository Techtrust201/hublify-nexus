import type { FacturationOrg, GestionReservation } from "@/lib/facturation-missions";
import {
  projeterMissionOuverte,
  type LigneMissionOuverte,
  type MissionOuverte,
} from "@/lib/marketplace";
import type { Sql } from "@/lib/sql";
import {
  changeLaFacturation,
  nomAffichePourAssigne,
  preparerMission,
  tarifAutomatique,
  trouverPrestataire,
  type ContexteFacturation,
  type FichePrestataire,
  type MissionEntree,
  type PreparationMission,
} from "@/lib/mission-facturation-serveur";

/**
 * Écriture serveur des colonnes de facturation des missions (migration 022).
 *
 * Tant que les migrations 022 et 023 ne sont pas appliquées sur la base, tout ce
 * module est inerte : on écrit la mission comme avant, sans ses colonnes. Le code
 * peut donc être déployé avant la migration.
 */

let schemaPret = false;

export async function schemaFacturationPret(sql: Sql): Promise<boolean> {
  if (schemaPret) return true;
  const rows = (await sql.query(
    `select
       exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'missions'
                  and column_name = 'tarif_source') as missions,
       to_regclass('public.tarifs_org') is not null
         and to_regclass('public.tarifs_prestataire') is not null
         and to_regclass('public.org_facturation') is not null as tables`,
  )) as { missions: boolean; tables: boolean }[];
  // On ne retient que le « oui » : une migration appliquée plus tard est vue sans redéployer.
  schemaPret = Boolean(rows[0]?.missions && rows[0]?.tables);
  return schemaPret;
}

/** Pour les tests : oublie le résultat mis en cache. */
export function oublierSchemaFacturation() {
  schemaPret = false;
}

export async function chargerContexteFacturation(
  sql: Sql,
  orgId: string,
): Promise<ContexteFacturation> {
  const prestataires = (await sql.query(
    `select id, nom, email from public.prestataires where org_id = $1::uuid order by id`,
    [orgId],
  )) as FichePrestataire[];
  const grille = (await sql.query(
    `select type_mission, montant_centimes from public.tarifs_org where org_id = $1::uuid`,
    [orgId],
  )) as { type_mission: string; montant_centimes: number }[];
  const tarifsPresta = (await sql.query(
    `select prestataire_id, type_mission, montant_centimes from public.tarifs_prestataire
      where org_id = $1::uuid`,
    [orgId],
  )) as { prestataire_id: string; type_mission: string; montant_centimes: number }[];
  const reservations = (await sql.query(
    `select id, bien_id from public.reservations_dossier where org_id = $1::uuid`,
    [orgId],
  )) as { id: string; bien_id: string }[];
  const reglages = (await sql.query(
    `select tva_prestations_locataire, date_effet_facturation from public.org_facturation
      where org_id = $1::uuid`,
    [orgId],
  )) as { tva_prestations_locataire: number | null; date_effet_facturation: string | null }[];

  return {
    prestataires: prestataires.map((p) => ({
      id: String(p.id),
      nom: String(p.nom ?? ""),
      email: p.email ? String(p.email) : null,
    })),
    grilleOrg: new Map(grille.map((g) => [g.type_mission, Number(g.montant_centimes)])),
    tarifsPrestataire: new Map(
      tarifsPresta.map((t) => [
        `${t.prestataire_id}|${t.type_mission}`,
        Number(t.montant_centimes),
      ]),
    ),
    reservations: new Map(reservations.map((r) => [String(r.id), String(r.bien_id)])),
    tvaLocataire:
      reglages[0]?.tva_prestations_locataire == null
        ? null
        : Number(reglages[0].tva_prestations_locataire),
    dateEffet: reglages[0]?.date_effet_facturation ?? null,
  };
}

/** Écrit les colonnes de facturation (et l'e-mail dans `assigne`) d'une mission de l'org. */
/**
 * Mission prise sur la marketplace (PR 5) : une écriture qui voudrait la rouvrir sans
 * personne d'assigné (écran chargé avant la prise) garde le preneur et la ferme.
 */
const PRISE_GARDEE = `(org_prestataire_id is not null
  and position('@' in coalesce(assigne, '')) > 0
  and $7::boolean and coalesce(btrim($9::text), '') = '')`;

export async function ecrireColonnesFacturation(
  sql: Sql,
  orgId: string,
  id: string,
  prep: PreparationMission,
) {
  const c = prep.colonnes;
  await sql.query(
    `update public.missions set
       attribution = $1,
       porteur = $2,
       reservation_id = $3,
       tarif_manuel_centimes = $4,
       tarif_calcule_centimes = $5,
       tarif_source = $6,
       ouverte = case when ${PRISE_GARDEE} then false else $7 end,
       tva_taux = case when $1::text = 'locataire' then coalesce(tva_taux, $8::numeric) else null end,
       assigne = case when ${PRISE_GARDEE} then assigne else $9 end
     where org_id = $10::uuid and id = $11`,
    [
      c.attribution,
      c.porteur,
      c.reservationId,
      c.tarifManuelCentimes,
      c.tarifCalculeCentimes,
      c.tarifSource,
      c.ouverte,
      c.tvaTaux,
      prep.assigne,
      orgId,
      id,
    ],
  );
}

export type ControleMission =
  { ok: true; prep: PreparationMission | null } | { ok: false; raison: "interdit" | "invalide" };

/**
 * Contrôle d'une mission écrite ligne par ligne (création ou modification depuis
 * l'écran). Refuse une valeur invalide plutôt que de l'écrire.
 *
 * `avant` : description en base avant l'écriture (`null` pour une création).
 */
export function controlerMission(
  mission: MissionEntree,
  avant: string | null,
  ctx: ContexteFacturation,
  peutFinances: boolean,
): ControleMission {
  if (!peutFinances && changeLaFacturation(avant, mission.description)) {
    return { ok: false, raison: "interdit" };
  }
  const prep = preparerMission(mission, ctx);
  if (prep.erreurs.length > 0) return { ok: false, raison: "invalide" };
  return { ok: true, prep };
}

/** Champs d'une mission qui font changer ses colonnes de facturation. */
export const CHAMPS_DECLENCHEURS = ["description", "assigne", "type", "bienId"] as const;

export function entreeMission(ligne: Record<string, unknown>): MissionEntree {
  return {
    bienId: String(ligne["bienId"] ?? ""),
    type: String(ligne["type"] ?? ""),
    assigne: String(ligne["assigne"] ?? ""),
    description: String(ligne["description"] ?? ""),
  };
}

/**
 * Après un remplacement en bloc de la collection : recalcule les colonnes de chaque
 * mission sans rien refuser (une valeur invalide laisse sa colonne vide). Refuser ici
 * bloquerait toute la sauvegarde de l'écran.
 */
export async function synchroniserMissionsEnBloc(
  sql: Sql,
  orgId: string,
  missions: readonly Record<string, unknown>[],
) {
  if (missions.length === 0 || !(await schemaFacturationPret(sql))) return;
  const ctx = await chargerContexteFacturation(sql, orgId);
  for (const m of missions) {
    const id = String(m["id"] ?? "");
    if (!id) continue;
    await ecrireColonnesFacturation(sql, orgId, id, preparerMission(entreeMission(m), ctx));
  }
}

/** Lecture gestionnaire : remet le nom de la fiche là où la base porte son e-mail. */
export function missionsPourGestionnaire<T extends { assigne?: unknown }>(
  missions: readonly T[],
  prestataires: readonly { nom?: unknown; email?: unknown; id?: unknown }[],
): T[] {
  const fiches: FichePrestataire[] = prestataires.map((p) => ({
    id: String(p.id ?? ""),
    nom: String(p.nom ?? ""),
    email: typeof p.email === "string" ? p.email : null,
  }));
  return missions.map((m) =>
    typeof m.assigne === "string" && m.assigne.includes("@")
      ? { ...m, assigne: nomAffichePourAssigne(m.assigne, fiches) }
      : m,
  );
}

/** Tarif automatique d'une mission en cours de saisie (lecture seule, rien n'est écrit). */
export async function apercuTarifMission(
  sql: Sql,
  orgId: string,
  entree: { type: string; assigne: string; porteur: string | null; attribution?: string | null },
): Promise<{ centimes: number; source: "prestataire" | "grille_org" } | null> {
  if (!(await schemaFacturationPret(sql))) return null;
  const ctx = await chargerContexteFacturation(sql, orgId);
  const porteur =
    entree.porteur === "prestataire" ||
    entree.porteur === "teammate" ||
    entree.porteur === "proprietaire"
      ? entree.porteur
      : null;
  const fiche =
    porteur === "prestataire" ? trouverPrestataire(entree.assigne, ctx.prestataires) : null;
  // Même ordre que l'enregistrement : à la charge du mandataire ou sans payeur précisé,
  // la grille de l'org d'abord.
  const attribution =
    entree.attribution === "mandataire" ||
    entree.attribution === "proprietaire" ||
    entree.attribution === "locataire"
      ? entree.attribution
      : null;
  return tarifAutomatique(entree.type, fiche?.id ?? null, porteur, ctx, attribution);
}

function attributionLue(v: unknown) {
  return v === "mandataire" || v === "proprietaire" || v === "locataire" ? v : null;
}
function porteurLu(v: unknown) {
  return v === "prestataire" || v === "teammate" || v === "proprietaire" ? v : null;
}
function nombreOuNull(v: unknown) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function booleenOuNull(v: unknown) {
  return typeof v === "boolean" ? v : null;
}

/**
 * Réglages et colonnes de facturation de l'org, pour l'écran Analyse (PR 6). Lecture seule.
 *
 * - Schéma absent (022/023 non appliquées) : `null`, calcul actuel.
 * - Date d'effet vide : réglages seuls, sans aucune mission ni réservation : rien n'est
 *   envoyé tant que les nouvelles règles ne sont pas activées.
 * - « Gestion » des réservations (024) : lue seulement si la migration est en base.
 */
export async function lireFacturationOrg(sql: Sql, orgId: string): Promise<FacturationOrg | null> {
  if (!(await schemaFacturationPret(sql))) return null;
  const reglages = (await sql.query(
    `select tva_prestations_locataire, date_effet_facturation from public.org_facturation
      where org_id = $1::uuid`,
    [orgId],
  )) as { tva_prestations_locataire: unknown; date_effet_facturation: unknown }[];
  const dateEffet =
    typeof reglages[0]?.date_effet_facturation === "string"
      ? reglages[0].date_effet_facturation
      : null;
  const facturation: FacturationOrg = {
    dateEffet,
    tvaLocataire: nombreOuNull(reglages[0]?.tva_prestations_locataire),
    missions: {},
    reservations: {},
  };
  if (!dateEffet) return facturation;

  const missions = (await sql.query(
    `select id, attribution, porteur, reservation_id,
            coalesce(tarif_manuel_centimes, tarif_calcule_centimes) as tarif_centimes,
            tva_taux
       from public.missions
      where org_id = $1::uuid and jour >= $2::date`,
    [orgId, dateEffet],
  )) as Record<string, unknown>[];
  for (const m of missions) {
    facturation.missions[String(m["id"])] = {
      attribution: attributionLue(m["attribution"]),
      porteur: porteurLu(m["porteur"]),
      reservationId: m["reservation_id"] == null ? null : String(m["reservation_id"]),
      tarifCentimes: nombreOuNull(m["tarif_centimes"]),
      tvaTaux: nombreOuNull(m["tva_taux"]),
    };
  }

  const ids = [
    ...new Set(
      Object.values(facturation.missions)
        .map((m) => m.reservationId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (ids.length === 0) return facturation;
  const gestion = (await sql.query(
    `select count(*)::int as n from information_schema.columns
      where table_schema = 'public' and table_name = 'reservations_dossier'
        and column_name in ('menage_gere', 'linge_gere', 'consommable_gere')`,
  )) as { n: number }[];
  if (Number(gestion[0]?.n ?? 0) < 3) return facturation;
  const reservations = (await sql.query(
    `select id, menage_gere, linge_gere, consommable_gere from public.reservations_dossier
      where org_id = $1::uuid and id = any($2::text[])`,
    [orgId, ids],
  )) as Record<string, unknown>[];
  for (const r of reservations) {
    const g: GestionReservation = {
      menage: booleenOuNull(r["menage_gere"]),
      linge: booleenOuNull(r["linge_gere"]),
      consommable: booleenOuNull(r["consommable_gere"]),
    };
    facturation.reservations[String(r["id"])] = g;
  }
  return facturation;
}

/** Séparateur de la méta JSON dans `missions.description` (U+2063). */
const SEP_META = "\u2063";

/**
 * Lien actif entre l'org gestionnaire de la mission (`m`) et l'org prestataire (`$1`).
 * Seule source d'autorisation de la marketplace : pas de RLS, filtre explicite ici.
 */
const LIEN_ACTIF = `exists (
  select 1 from public.liens_org l
   where l.org_gestionnaire_id = m.org_id
     and l.org_prestataire_id = $1::uuid
     and l.statut = 'actif')`;

/** Mission ouverte, pas encore prise, à venir. */
const OUVERTE_LIBRE = `m.ouverte and coalesce(btrim(m.assigne), '') = '' and m.jour >= current_date`;

/**
 * Missions ouvertes proposées à une org prestataire (marketplace, PR 5).
 * Sélection explicite : seuls les champs nécessaires à la projection sont lus, et la
 * réponse ne contient que les sept champs de `MissionOuverte`. La consigne
 * (`description`) n'est lue que pour en tirer la plage horaire.
 */
export async function listerMissionsOuvertes(
  sql: Sql,
  orgPrestataireId: string,
): Promise<MissionOuverte[]> {
  if (!(await schemaFacturationPret(sql))) return [];
  const lignes = (await sql.query(
    `select m.id, m.jour, m.type_mission, m.titre, m.heure, m.description,
            b.nom as bien_nom, b.adresse as bien_adresse
       from public.missions m
       left join public.biens b on b.org_id = m.org_id and b.id = m.bien_id
      where ${OUVERTE_LIBRE} and ${LIEN_ACTIF}
      order by m.jour, m.id
      limit 200`,
    [orgPrestataireId],
  )) as LigneMissionOuverte[];
  return lignes.map(projeterMissionOuverte);
}

export type ResultatPrise = { ok: true; id: string } | { ok: false; raison: "indisponible" };

/**
 * Prise d'une mission ouverte, en UNE seule mise à jour conditionnelle : la mission doit
 * être encore ouverte, sans personne d'assigné, à venir, d'une org gestionnaire liée par
 * un lien actif, et désigner une seule ligne. Deux prises simultanées : Postgres réévalue
 * la condition sur la ligne déjà modifiée, la seconde ne trouve plus rien.
 *
 * La mise à jour ferme l'offre, inscrit l'e-mail du preneur dans `assigne` (filtre du
 * portail, #63), rattache l'org prestataire, passe le porteur à « prestataire » et met la
 * méta JSON en accord (double écriture). Le tarif est ensuite fixé à la prise.
 */
export async function prendreMissionOuverte(
  sql: Sql,
  orgPrestataireId: string,
  email: string,
  id: string,
): Promise<ResultatPrise> {
  if (!(await schemaFacturationPret(sql))) return { ok: false, raison: "indisponible" };
  const prises = (await sql.query(
    `update public.missions m
        set ouverte = false,
            assigne = $3,
            org_prestataire_id = $1::uuid,
            porteur = 'prestataire',
            description = case
              when position($4 in coalesce(m.description, '')) > 0 then
                split_part(m.description, $4, 1) || $4 ||
                (split_part(m.description, $4, 2)::jsonb
                  || '{"marketplace": false, "porteur": "prestataire"}'::jsonb)::text
              else m.description end,
            updated_at = now()
      where m.id = $2
        and ${OUVERTE_LIBRE}
        and ${LIEN_ACTIF}
        and 1 = (select count(*) from public.missions x
                  where x.id = $2 and exists (
                    select 1 from public.liens_org l2
                     where l2.org_gestionnaire_id = x.org_id
                       and l2.org_prestataire_id = $1::uuid
                       and l2.statut = 'actif'))
      returning m.org_id, m.type_mission, m.attribution`,
    [orgPrestataireId, id, email, SEP_META],
  )) as { org_id: string; type_mission: string; attribution: string | null }[];
  const prise = prises[0];
  if (!prise) return { ok: false, raison: "indisponible" };

  // Tarif fixé à la prise : même ordre que l'enregistrement (#65), avec la fiche du
  // preneur dans l'annuaire de l'org gestionnaire si elle existe.
  const ctx = await chargerContexteFacturation(sql, prise.org_id);
  const mail = email.trim().toLowerCase();
  const fiches = ctx.prestataires.filter((p) => (p.email ?? "").trim().toLowerCase() === mail);
  const attribution =
    prise.attribution === "mandataire" ||
    prise.attribution === "proprietaire" ||
    prise.attribution === "locataire"
      ? prise.attribution
      : null;
  const auto = tarifAutomatique(
    prise.type_mission,
    fiches.length === 1 ? (fiches[0]?.id ?? null) : null,
    "prestataire",
    ctx,
    attribution,
  );
  await sql.query(
    `update public.missions set tarif_calcule_centimes = $1, tarif_source = $2
      where org_id = $3::uuid and id = $4`,
    [auto?.centimes ?? null, auto?.source ?? null, prise.org_id, id],
  );
  return { ok: true, id };
}
