import { Pool } from "pg";

/**
 * Les parcours d'inscription et d'invitation créent de vrais comptes en base.
 * Sans reprise, chaque exécution laisse une organisation et un membre « en
 * attente » de plus dans l'org de démonstration, jusqu'à rendre l'écran Équipe
 * impossible à montrer.
 *
 * Le filtre porte sur le domaine `@exemple.test`, réservé aux tests : aucune
 * donnée de démonstration ne peut correspondre.
 */
export async function purgerComptesDeTest() {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) return;

  const pool = new Pool({ connectionString });
  try {
    // `org_membres` et `profils` partent en cascade avec le compte.
    await pool.query(`delete from "user" where email like '%@exemple.test'`);
    await pool.query(`delete from mails_sortants where destinataire like '%@exemple.test'`);
    // Une organisation créée à l'inscription n'a que son fondateur : elle devient
    // orpheline dès qu'il est supprimé. Le motif du nom borne la casse aux orgs
    // fabriquées par les tests, jamais à une organisation saisie à la main.
    await pool.query(
      `delete from orgs o
        where o.nom ~ '^Org [a-z0-9]+$'
          and not exists (select 1 from org_membres m where m.org_id = o.id)`,
    );
  } finally {
    await pool.end();
  }
}
