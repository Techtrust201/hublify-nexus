/**
 * Rattache les loyers existants à leur séjour (`loyers.reservation_id`), NON AMBIGU uniquement :
 * même organisation, même locataire, même logement, échéance dans le séjour, un seul candidat
 * (séjours annulés exclus). Idempotent : n'écrit que `reservation_id`, et seulement s'il est NULL.
 *
 *   npx tsx scripts/rattacher-loyers-reservations.ts              # simulation (aucune écriture)
 *   npx tsx scripts/rattacher-loyers-reservations.ts --appliquer  # écrit, dans une transaction
 *
 * Prérequis : migration 020 appliquée. Affiche le compte de loyers liés avant / après.
 */
import "./charger-env.mjs";
import {
  rattachementsNonAmbigus,
  type LoyerARattacher,
  type SejourCandidat,
} from "../src/lib/rattachement-loyers.ts";
import pg from "pg";

const appliquer = process.argv.includes("--appliquer");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL manquant (.env.local)");
const locale = url.includes("localhost") || url.includes("127.0.0.1");
const client = new pg.Client({
  connectionString: url,
  ssl: locale ? false : { rejectUnauthorized: true },
});
await client.connect();
const sql = { query: async (t: string, v?: unknown[]) => (await client.query(t, v)).rows };

async function compte() {
  const [r] = await sql.query(
    "select count(*)::int as total, count(reservation_id)::int as lies from public.loyers",
  );
  return { total: Number(r?.["total"] ?? 0), lies: Number(r?.["lies"] ?? 0) };
}

try {
  const avant = await compte();
  const loyers = (await sql.query(
    `select org_id::text as "orgId", id, locataire, bien_nom as "bienNom", echeance,
            reservation_id as "reservationId"
       from public.loyers where reservation_id is null`,
  )) as unknown as LoyerARattacher[];
  const sejours = (await sql.query(
    `select r.org_id::text as "orgId", r.id, r.occupant, b.nom as "bienNom",
            r.arrivee::text as arrivee, r.depart::text as depart, r.statut
       from public.reservations_dossier r
       join public.biens b on b.org_id = r.org_id and b.id = r.bien_id`,
  )) as unknown as SejourCandidat[];

  const plan = rattachementsNonAmbigus(loyers, sejours);
  console.log(
    `Loyers : ${avant.total} (dont ${avant.lies} déjà liés) · sans lien : ${loyers.length} · rattachements non ambigus : ${plan.length}`,
  );
  for (const p of plan) console.log(`  ${p.loyerId} → ${p.reservationId}`);

  if (!appliquer) {
    console.log("Simulation : rien n'a été écrit (--appliquer pour écrire).");
  } else {
    let ecrits = 0;
    await sql.query("begin");
    try {
      for (const p of plan) {
        const res = await sql.query(
          `update public.loyers set reservation_id = $1
            where org_id = $2::uuid and id = $3 and reservation_id is null returning id`,
          [p.reservationId, p.orgId, p.loyerId],
        );
        ecrits += res.length;
      }
      await sql.query("commit");
    } catch (e) {
      await sql.query("rollback");
      throw e;
    }
    const apres = await compte();
    console.log(`Écrits : ${ecrits} · liés avant : ${avant.lies} → après : ${apres.lies}`);
  }
} finally {
  await client.end();
}
