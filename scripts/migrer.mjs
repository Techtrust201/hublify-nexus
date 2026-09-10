import "./charger-env.mjs";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant. Copier .env.example vers .env.local");
  process.exit(1);
}

const dossier = new URL("../db/migrations/", import.meta.url);
const migrations = readdirSync(dossier)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((fichier) => {
    const sql = readFileSync(new URL(fichier, dossier), "utf8");
    return {
      fichier,
      version: fichier.slice(0, fichier.indexOf("-")),
      sql,
      checksum: createHash("sha256").update(sql).digest("hex").slice(0, 16),
    };
  });

const doublon = migrations.find(
  (m, i) => migrations.findIndex((x) => x.version === m.version) !== i,
);
if (doublon) {
  console.error(`Deux migrations portent le numéro ${doublon.version}`);
  process.exit(1);
}

const locale = url.includes("localhost") || url.includes("127.0.0.1");
const client = new pg.Client({
  connectionString: url,
  ssl: locale ? false : { rejectUnauthorized: true },
});

const statutSeul = process.argv.includes("--statut");

await client.connect();
try {
  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      fichier text not null,
      checksum text not null,
      applique_le timestamptz not null default now()
    )
  `);

  const { rows } = await client.query(
    "select version, fichier, checksum from public.schema_migrations",
  );
  const appliquees = new Map(rows.map((r) => [r.version, r]));

  // Une migration déjà jouée est immuable : la modifier après coup ferait diverger
  // les environnements sans que personne ne le voie.
  for (const m of migrations) {
    const deja = appliquees.get(m.version);
    if (deja && deja.checksum !== m.checksum) {
      console.error(
        `${m.fichier} a été modifiée après application (attendu ${deja.checksum}, lu ${m.checksum}).`,
      );
      console.error("Créer une nouvelle migration plutôt que de réécrire l'historique.");
      process.exit(1);
    }
  }

  const enAttente = migrations.filter((m) => !appliquees.has(m.version));

  if (statutSeul) {
    for (const m of migrations) {
      console.log(appliquees.has(m.version) ? `  appliquée  ${m.fichier}` : `  en attente ${m.fichier}`);
    }
    console.log(`${appliquees.size} appliquée(s), ${enAttente.length} en attente.`);
  } else if (enAttente.length === 0) {
    console.log("Base à jour, aucune migration en attente.");
  } else {
    for (const m of enAttente) {
      const debut = Date.now();
      await client.query("begin");
      try {
        await client.query(m.sql);
        await client.query(
          "insert into public.schema_migrations (version, fichier, checksum) values ($1, $2, $3)",
          [m.version, m.fichier, m.checksum],
        );
        await client.query("commit");
      } catch (e) {
        await client.query("rollback");
        console.error(`Échec sur ${m.fichier} : ${e.message}`);
        process.exit(1);
      }
      console.log(`appliquée ${m.fichier} (${Date.now() - debut} ms)`);
    }
  }
} finally {
  await client.end();
}
