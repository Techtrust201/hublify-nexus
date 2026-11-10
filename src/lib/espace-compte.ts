import { rattacherUtilisateur } from "@/lib/rattacher";
import { getSql } from "@/lib/sql";

/** Découpe le nom renvoyé par Google. Sans nom, la partie locale de l'e-mail sert de prénom. */
export function identiteDepuisNom(nomComplet: string, email: string) {
  const repli = email.split("@")[0]?.trim() || "Compte";
  const morceaux = (nomComplet.trim() || repli).split(/\s+/).filter(Boolean);
  const prenom = morceaux[0] ?? "Compte";
  const nom = morceaux.slice(1).join(" ");
  return { prenom, nom, nomOrg: `${prenom} ${nom}`.trim() };
}

/**
 * Ouvre un espace gestionnaire pour un compte qui n'en a pas.
 * Idempotent : un membre déjà rattaché n'est pas dupliqué.
 * L'inscription par formulaire s'en charge elle-même et doit passer avant.
 */
export async function assurerEspaceSiOrphelin(userId: string) {
  const sql = getSql();
  if (!sql) return;
  const membres = (await sql`
    select 1 from public.org_membres where user_id = ${userId}::uuid limit 1
  `) as unknown[];
  if (membres.length > 0) return;
  const lignes = (await sql`
    select name, email from "user" where id = ${userId}::uuid limit 1
  `) as { name: string | null; email: string }[];
  const ligne = lignes[0];
  if (!ligne?.email) return;
  const { prenom, nom, nomOrg } = identiteDepuisNom(ligne.name ?? "", ligne.email);
  const orgs = (await sql`
    insert into public.orgs (nom, type)
    values (${nomOrg}, 'gestionnaire')
    returning id
  `) as { id: string }[];
  const orgId = orgs[0]?.id;
  if (!orgId) return;
  try {
    await rattacherUtilisateur({
      sql,
      userId,
      prenom,
      nom,
      roleId: "administrateur",
      affectation: "Titulaire",
      statut: "actif",
      orgId,
    });
  } catch (erreur) {
    await sql`delete from public.orgs where id = ${orgId}::uuid`;
    throw erreur;
  }
}
