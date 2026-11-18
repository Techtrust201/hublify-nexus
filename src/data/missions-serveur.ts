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
       ouverte = $7,
       tva_taux = case when $1::text = 'locataire' then coalesce(tva_taux, $8::numeric) else null end,
       assigne = $9
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
