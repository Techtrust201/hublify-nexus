/**
 * Reprise de la méta JSON des missions vers les colonnes de la migration 022.
 * NE PAS EXÉCUTER EN PROD sans l'accord explicite de Hugo et une sauvegarde Neon.
 *
 *   npx tsx scripts/reprendre-meta-missions.ts              # simulation (aucune écriture)
 *   npx tsx scripts/reprendre-meta-missions.ts --appliquer  # écrit, dans une transaction
 *
 * Idempotent : n'écrit qu'une colonne encore vide ; un second passage ne change rien.
 * La méta JSON de `description` n'est jamais modifiée. Prérequis : migration 022 appliquée.
 * N'affiche que des comptes, jamais de contenu de mission.
 */
import "./charger-env.mjs";
import {
  decisionReprise,
  requeteReprise,
  type MissionAReprendre,
} from "../src/lib/reprise-meta-missions.ts";
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

async function compte() {
  const { rows } = await client.query(`
    select count(*)::int as total,
           count(attribution)::int as attribution,
           count(porteur)::int as porteur,
           count(reservation_id)::int as reservation,
           count(tarif_manuel_centimes)::int as tarif_manuel,
           count(*) filter (where ouverte)::int as ouvertes
      from public.missions`);
  return rows[0];
}

try {
  const avant = await compte();
  const { rows } = await client.query(`
    select org_id::text as "orgId", id, description, attribution, porteur,
           reservation_id as "reservationId", tarif_manuel_centimes as "tarifManuelCentimes",
           ouverte
      from public.missions
     where position(chr(8291) in description) > 0`);
  const decisions = (rows as MissionAReprendre[]).map((m) => ({ m, d: decisionReprise(m) }));
  const aEcrire = decisions.filter((x) => x.d.action === "maj");
  const ignorees = decisions.filter((x) => x.d.action === "ignoree").length;

  if (appliquer && aEcrire.length > 0) {
    await client.query("begin");
    try {
      for (const { m, d } of aEcrire) {
        if (d.action !== "maj") continue;
        const q = requeteReprise(m.orgId, m.id, d.maj);
        await client.query(q.texte, q.params);
      }
      await client.query("commit");
    } catch (e) {
      await client.query("rollback");
      throw e;
    }
  }
  const apres = appliquer ? await compte() : avant;
  console.log(
    JSON.stringify(
      {
        mode: appliquer ? "application" : "simulation",
        missionsAvecMeta: rows.length,
        aMettreAJour: aEcrire.length,
        ignoreesLocataireSansReservation: ignorees,
        avant,
        apres,
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
