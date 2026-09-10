import { Pool as PoolNeon, neonConfig, types as typesNeon } from "@neondatabase/serverless";
import { Pool as PoolTcp, types as typesTcp, type QueryResultRow } from "pg";

// Sans ces parseurs, `date` revient en Date décalée par le fuseau du process
// (2026-03-06 devient 2026-03-05T23:00Z) et `numeric` revient en chaîne.
// Le domaine manipule des dates ISO « YYYY-MM-DD » et des nombres.
const OID_DATE = 1082;
const OID_NUMERIC = 1700;
const OID_INT8 = 20;

for (const types of [typesTcp, typesNeon]) {
  types.setTypeParser(OID_DATE, (valeur: string) => valeur);
  types.setTypeParser(OID_NUMERIC, (valeur: string) => Number(valeur));
  types.setTypeParser(OID_INT8, (valeur: string) => Number(valeur));
}

// Le pilote Neon passe par WebSocket. Le constructeur est fourni par la
// plateforme : global sur Cloudflare Workers, natif depuis Node 22.
if (!neonConfig.webSocketConstructor && typeof globalThis.WebSocket === "function") {
  neonConfig.webSocketConstructor = globalThis.WebSocket;
}

// Chaque requête part en HTTP plutôt que d'ouvrir une session WebSocket. Le
// tunnel WebSocket ne survit pas au modèle d'exécution des Workers, où la
// connexion est coupée dès que la requête qui l'a ouverte se termine. Nos accès
// sont des requêtes indépendantes : elles n'ont pas besoin de session.
neonConfig.poolQueryViaFetch = true;

export type Sql = {
  (chaines: TemplateStringsArray, ...valeurs: unknown[]): Promise<QueryResultRow[]>;
  query: (texte: string, valeurs?: unknown[]) => Promise<QueryResultRow[]>;
};

/**
 * Les deux pilotes exposent la même surface : `query`, `end`, et le contrat
 * attendu par Better Auth. Le reste du code n'a pas à savoir lequel est actif.
 */
export type PoolPg = PoolTcp | PoolNeon;

/**
 * Les deux `query` sont surchargés différemment ; l'union n'est donc pas
 * appelable telle quelle. On ne dépend que de la forme commune.
 */
type PoolInterrogeable = {
  query: (texte: string, valeurs?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
};

let pool: PoolPg | undefined;
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

/**
 * Le choix du pilote suit la destination, pas l'environnement d'exécution :
 * un Postgres local ne parle que TCP, et les runtimes sans socket TCP
 * (Cloudflare Workers) ne savent joindre Neon qu'en WebSocket. Brancher le
 * pilote TCP sur Neon compile sans broncher puis échoue à la première requête
 * une fois déployé.
 */
export function obtenirPool(): PoolPg {
  if (!pool) {
    const url = process.env["DATABASE_URL"] ?? "postgresql://127.0.0.1:5432/hublify";
    pool = estUrlLocale(url)
      ? new PoolTcp({ connectionString: url, max: 4, ssl: false })
      : new PoolNeon({ connectionString: url, max: process.env["VERCEL"] ? 1 : 4 });
  }
  return pool;
}

function creerSql(p: PoolInterrogeable): Sql {
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
  cache = creerSql(obtenirPool() as PoolInterrogeable);
  return cache;
}

export async function fermerPool() {
  if (!pool) return;
  await pool.end();
  pool = undefined;
  cache = undefined;
}
