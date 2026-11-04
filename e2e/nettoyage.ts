import { Pool } from "pg";
import { MOTIF_EVENEMENT_TEST } from "../src/lib/evenements-test";

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
    await purgerParcoursDemo(pool);
  } finally {
    await pool.end();
  }
}

/**
 * `e2e/securite.spec.ts` crée des événements `Marqueur-*` et `Hors-ligne-*`
 * pour prouver l'isolation. Sans reprise, ils restent dans la vue générale.
 * Le motif ne peut pas atteindre un événement réel : voir `estEvenementDeTest`.
 */
export async function purgerEvenementsDeTest() {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) return;

  const pool = new Pool({ connectionString });
  try {
    await pool.query(`delete from public.evenements where titre ~ $1`, [MOTIF_EVENEMENT_TEST]);
    await pool.query(`delete from public.notifications where detail ~ $1`, [MOTIF_EVENEMENT_TEST]);
  } finally {
    await pool.end();
  }
}

/** Données créées par e2e/parcours-demo.spec.ts, repérées par un libellé réservé. */
export async function purgerParcoursDemo(poolExistant?: Pool) {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) return;
  const pool = poolExistant ?? new Pool({ connectionString });
  const marque = "%parcours démo%";
  try {
    await pool.query(`delete from public.messages_fil where texte ilike $1`, [marque]);
    await pool.query(
      `delete from public.conversations where nom ilike $1 or extrait ilike $1 or nom ilike '%@exemple.test'`,
      [marque],
    );
    await pool.query(
      `delete from public.reservations_dossier where occupant ilike $1 or email like '%@exemple.test'`,
      [marque],
    );
    await pool.query(`delete from public.reservations_cal where voyageur ilike $1`, [marque]);
    await pool.query(
      `delete from public.prestataires
        where nom ilike $1 or email like '%@exemple.test' or (id like 'p-%' and nom = '')`,
      [marque],
    );
    await pool.query(`delete from public.notifications where titre ilike $1 or detail ilike $1`, [
      marque,
    ]);
    await pool.query(
      `delete from public.occupants where nom ilike $1 or email ilike '%@exemple.test'`,
      [marque],
    );
    await pool.query(`delete from public.inventaire_items where designation ilike $1`, [marque]);
    await pool.query(`delete from public.rapports_intervention where texte ilike $1`, [marque]);
    await pool.query(
      `update public.portail_etat p
          set notes = coalesce((
                select jsonb_agg(n) from jsonb_array_elements(p.notes) n
                where coalesce(n->>'texte', '') not ilike $1
              ), '[]'::jsonb),
              rdv = case when p.rdv->>'jour' = '2028-04-12' then null else p.rdv end,
              paiements = '[]'::jsonb,
              demarre = false,
              mode = case when u.email = 'lucas.menage@hublify.app' then 'prestataire' else 'resident' end,
              updated_at = now()
        from public."user" u
        where p.user_id = u.id
          and u.email in (
            'jean.martin@hublify.app',
            'sophie.martin@hublify.app',
            'lucas.menage@hublify.app'
          )`,
      [marque],
    );
  } finally {
    if (!poolExistant) await pool.end();
  }
}
