import "./charger-env.mjs";
import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant. Copier .env.example vers .env.local");
  process.exit(1);
}

const locale = url.includes("localhost") || url.includes("127.0.0.1");
const client = new pg.Client({
  connectionString: url,
  ssl: locale ? false : { rejectUnauthorized: true },
});

const dir = new URL("../db/", import.meta.url);
const fichiers = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort((a, b) => {
    const ordre = [
      "better-auth.sql",
      "rbac.sql",
      "orgs.sql",
      "init.sql",
      "metier.sql",
      "mail.sql",
    ];
    return ordre.indexOf(a) - ordre.indexOf(b);
  });

await client.connect();
try {
  for (const fichier of fichiers) {
    const brut = readFileSync(new URL(fichier, dir), "utf8");
    const statements = brut
      .split(";")
      .map((s) =>
        s
          .split("\n")
          .filter((l) => !l.trim().startsWith("--"))
          .join("\n")
          .trim(),
      )
      .filter(Boolean);
    for (const statement of statements) {
      await client.query(statement);
    }
    console.log("appliqué", fichier);
  }

  const biens = await client.query("select id, nom from public.biens order by nom");
  const orgs = await client.query("select id, nom, type from public.orgs order by nom");
  const roles = await client.query("select id, label from public.roles order by id");
  console.log(
    "Orgs",
    orgs.rows.length,
    "· Biens",
    biens.rows.length,
    "· Rôles",
    roles.rows.map((r) => r.id).join(", "),
  );
} finally {
  await client.end();
}
