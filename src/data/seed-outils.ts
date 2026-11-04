import { FICHES_DEFAUT } from "@/data/upsells-catalogue";
import { LIVRETS_INITIAUX } from "@/data/livrets";
import type { Sql } from "@/lib/sql";

/**
 * Semence démo des nouvelles tables. Chaque insert est `on conflict do nothing` :
 * une organisation qui a déjà personnalisé ses livrets, ses fiches ou son
 * pré-check-in n'est pas réécrite.
 */
export async function semerOutilsDemo(sql: Sql, orgId: string) {
  for (let i = 0; i < LIVRETS_INITIAUX.length; i += 1) {
    const livret = LIVRETS_INITIAUX[i]!;
    await sql.query(
      `insert into public.org_livrets (org_id, id, payload, position)
       values ($1::uuid, $2, $3::jsonb, $4)
       on conflict (org_id, id) do nothing`,
      [orgId, livret.id, JSON.stringify(livret), i],
    );
  }

  for (const [upsellId, fiche] of Object.entries(FICHES_DEFAUT)) {
    await sql.query(
      `insert into public.org_upsell_fiches
         (org_id, upsell_id, code, type, prestataire, ville, piece_jointe)
       values ($1::uuid, $2, $3, $4, $5, $6, $7)
       on conflict (org_id, upsell_id) do nothing`,
      [orgId, upsellId, fiche.code, fiche.type, fiche.prestataire, fiche.ville, fiche.pieceJointe],
    );
  }

  await sql.query(
    `insert into public.org_precheckin_extra (org_id)
     values ($1::uuid)
     on conflict (org_id) do nothing`,
    [orgId],
  );
}
