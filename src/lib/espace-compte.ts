import { droitsEffectifs, initialesDe } from "@/auth/permissions";
import { obtenirPool } from "@/lib/sql";

/** Découpe le nom renvoyé par Google. Sans nom, la partie locale de l'e-mail sert de prénom. */
export function identiteDepuisNom(nomComplet: string, email: string) {
  const repli = email.split("@")[0]?.trim() || "Compte";
  const morceaux = (nomComplet.trim() || repli).split(/\s+/).filter(Boolean);
  const prenom = morceaux[0] ?? "Compte";
  const nom = morceaux.slice(1).join(" ");
  return { prenom, nom, nomOrg: `${prenom} ${nom}`.trim() };
}

type ClientPg = {
  query: (texte: string, valeurs?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
  release: () => void;
};

/**
 * Ouvre un espace gestionnaire pour un compte qui n'en a pas.
 * Idempotent : un verrou par utilisateur empêche deux ouvertures simultanées.
 * Relu à chaque connexion et à chaque session sans organisation, pour rattraper
 * un échec survenu après la création du compte Google.
 */
export async function assurerEspaceSiOrphelin(userId: string) {
  if (!process.env["DATABASE_URL"]) return;
  const client = await (obtenirPool() as unknown as { connect: () => Promise<ClientPg> }).connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(hashtext($1)::bigint)", [userId]);
    const membres = await client.query(
      "select 1 from public.org_membres where user_id = $1::uuid limit 1",
      [userId],
    );
    if (membres.rows.length > 0) {
      await client.query("commit");
      return;
    }
    const utilisateurs = await client.query(
      `select name, email from "user" where id = $1::uuid limit 1`,
      [userId],
    );
    const ligne = utilisateurs.rows[0] as { name?: string | null; email?: string } | undefined;
    if (!ligne?.email) {
      await client.query("commit");
      return;
    }
    const { prenom, nom, nomOrg } = identiteDepuisNom(ligne.name ?? "", ligne.email);
    const orgs = await client.query(
      `insert into public.orgs (nom, type) values ($1, 'gestionnaire') returning id`,
      [nomOrg],
    );
    const orgId = orgs.rows[0]?.["id"];
    if (typeof orgId !== "string") {
      await client.query("rollback");
      return;
    }
    const nomProfil = nom || prenom;
    const droits = droitsEffectifs("administrateur");
    await client.query(
      `insert into public.profils (user_id, prenom, nom, initiales, affectation, statut)
       values ($1::uuid, $2, $3, $4, 'Titulaire', 'actif')
       on conflict (user_id) do update
         set prenom = excluded.prenom,
             nom = excluded.nom,
             initiales = excluded.initiales,
             affectation = excluded.affectation,
             statut = excluded.statut`,
      [userId, prenom, nomProfil, initialesDe(prenom, nomProfil)],
    );
    await client.query(
      `insert into public.org_membres (org_id, user_id, role_id, droits, statut)
       values ($1::uuid, $2::uuid, 'administrateur', $3::text[], 'actif')
       on conflict (org_id, user_id) do update
         set role_id = excluded.role_id,
             droits = excluded.droits,
             statut = excluded.statut`,
      [orgId, userId, `{${droits.join(",")}}`],
    );
    await client.query("commit");
  } catch (erreur) {
    await client.query("rollback").catch(() => undefined);
    throw erreur;
  } finally {
    client.release();
  }
}
