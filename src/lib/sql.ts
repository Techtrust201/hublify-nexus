import { Pool, type QueryResultRow } from "pg";

export type Sql = {
  (chaines: TemplateStringsArray, ...valeurs: unknown[]): Promise<QueryResultRow[]>;
  query: (texte: string, valeurs?: unknown[]) => Promise<QueryResultRow[]>;
};

let pool: Pool | undefined;
let cache: Sql | null | undefined;

export function estUrlLocale(url: string) {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

/**
 * Compile un modèle tagué en requête paramétrée (`$1`, `$2`, …).
 * Les valeurs ne sont jamais concaténées au SQL : c'est le contrat anti-injection.
 */
export function compilerRequete(
  chaines: TemplateStringsArray,
  valeurs: readonly unknown[],
): { texte: string; valeurs: unknown[] } {
  if (chaines.length !== valeurs.length + 1) {
    throw new Error("Requête taguée malformée");
  }
  const texte = chaines.reduce((acc, morceau, i) => {
    if (i === 0) return morceau;
    return `${acc}$${i}${morceau}`;
  }, "");
  return { texte, valeurs: [...valeurs] };
}

export function obtenirPool(): Pool {
  if (!pool) {
    const url = process.env["DATABASE_URL"] ?? "postgresql://127.0.0.1:5432/hublify";
    pool = new Pool({
      connectionString: url,
      max: process.env["VERCEL"] ? 1 : 4,
      ssl: estUrlLocale(url) ? false : { rejectUnauthorized: true },
    });
  }
  return pool;
}

function creerSql(p: Pool): Sql {
  const sql = (async (chaines: TemplateStringsArray, ...valeurs: unknown[]) => {
    const req = compilerRequete(chaines, valeurs);
    const resultat = await p.query(req.texte, req.valeurs);
    return resultat.rows;
  }) as Sql;
  sql.query = async (texte, valeurs) => {
    const resultat = await p.query(texte, valeurs);
    return resultat.rows;
  };
  return sql;
}

/**
 * Null sans `DATABASE_URL` : l'UI peut alors se rabattre sur le stockage local.
 * Un seul Pool est partagé avec Better Auth (`obtenirPool`).
 */
export function getSql(): Sql | null {
  if (cache !== undefined) return cache;
  if (!process.env["DATABASE_URL"]) {
    cache = null;
    return cache;
  }
  cache = creerSql(obtenirPool());
  return cache;
}

export async function fermerPool() {
  if (!pool) return;
  await pool.end();
  pool = undefined;
  cache = undefined;
}
