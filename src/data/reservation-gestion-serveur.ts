import type { Sql } from "@/lib/sql";
import { CHAMPS_GESTION, type GestionSaisie } from "@/lib/reservation-gestion";

/**
 * Lecture et écriture des colonnes « Gestion » des réservations (migration 024).
 *
 * Tant que la migration 024 n'est pas appliquée, tout ce module est inerte : aucune
 * requête ne touche ces colonnes, la réservation s'enregistre comme avant. Le code peut
 * donc être déployé avant la migration.
 */

let schemaPret = false;

export async function schemaGestionPret(sql: Sql): Promise<boolean> {
  if (schemaPret) return true;
  const rows = (await sql.query(
    `select count(*)::int as n from information_schema.columns
      where table_schema = 'public' and table_name = 'reservations_dossier'
        and column_name in ('menage_gere', 'linge_gere', 'consommable_gere')`,
  )) as { n: number | string }[];
  // On ne retient que le « oui » : une migration appliquée plus tard est vue sans redéployer.
  schemaPret = Number(rows[0]?.n ?? 0) === 3;
  return schemaPret;
}

/** Pour les tests : oublie le résultat mis en cache. */
export function oublierSchemaGestion() {
  schemaPret = false;
}

/** Écrit les valeurs présentes (et seulement elles) sur une réservation de l'org. */
export async function ecrireGestionReservation(
  sql: Sql,
  orgId: string,
  id: string,
  gestion: GestionSaisie,
): Promise<void> {
  const champs = CHAMPS_GESTION.filter(({ cle }) => gestion[cle] !== undefined);
  if (champs.length === 0 || !id || !(await schemaGestionPret(sql))) return;
  const valeurs = champs.map(({ cle }) => gestion[cle] ?? null);
  const affectations = champs.map(({ colonne }, i) => `${colonne} = $${i + 1}::boolean`);
  await sql.query(
    `update public.reservations_dossier set ${affectations.join(", ")}
      where org_id = $${valeurs.length + 1}::uuid and id = $${valeurs.length + 2}`,
    [...valeurs, orgId, id],
  );
}

/** Valeurs de gestion des réservations de l'org, par id. `null` si la 024 est absente. */
export async function lireGestionReservations(
  sql: Sql,
  orgId: string,
): Promise<Map<string, Required<GestionSaisie>> | null> {
  if (!(await schemaGestionPret(sql))) return null;
  const lignes = (await sql.query(
    `select id, menage_gere, linge_gere, consommable_gere from public.reservations_dossier
      where org_id = $1::uuid`,
    [orgId],
  )) as Record<string, unknown>[];
  const bool = (v: unknown) => (typeof v === "boolean" ? v : null);
  const carte = new Map<string, Required<GestionSaisie>>();
  for (const l of lignes) {
    carte.set(String(l["id"]), {
      menageGere: bool(l["menage_gere"]),
      lingeGere: bool(l["linge_gere"]),
      consommableGere: bool(l["consommable_gere"]),
    });
  }
  return carte;
}

/** Ajoute les valeurs de gestion aux réservations lues (rien si la 024 est absente). */
export function avecGestion<T extends { id: string }>(
  reservations: readonly T[],
  carte: Map<string, Required<GestionSaisie>> | null,
): T[] {
  if (!carte) return [...reservations];
  return reservations.map((r) => {
    const g = carte.get(r.id);
    return g ? { ...r, ...g } : r;
  });
}
