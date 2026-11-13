import { getRequest } from "@tanstack/react-start/server";
import { droitsEffectifs, labelDuRole, type AuthContexte, type RoleId } from "@/auth/permissions";
import { assurerEspaceSiOrphelin } from "@/lib/espace-compte";
import { auth } from "@/lib/auth";
import type { OrgType } from "@/lib/orgs";
import { getSql, type Sql } from "@/lib/sql";

type MembreRow = {
  prenom: string;
  nom: string;
  initiales: string;
  affectation: string;
  role_id: RoleId;
  droits: string[] | null;
  org_id: string;
  org_type: OrgType;
  org_nom: string;
};

async function lireMembre(sql: Sql, userId: string) {
  return (await sql`
    select
      p.prenom,
      p.nom,
      p.initiales,
      p.affectation,
      m.role_id,
      m.droits,
      o.id as org_id,
      o.type as org_type,
      o.nom as org_nom
    from public.org_membres m
    join public.orgs o on o.id = m.org_id
    join public.profils p on p.user_id = m.user_id
    where m.user_id = ${userId}::uuid
    limit 1
  `) as MembreRow[];
}

export async function sessionDepuisRequete(): Promise<AuthContexte | null> {
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    session = await auth.api.getSession({ headers: getRequest().headers });
  } catch {
    return null;
  }
  if (!session?.user) return null;
  const sql = getSql();
  if (!sql) return null;
  try {
    let rows = await lireMembre(sql, session.user.id);
    if (!rows[0]) {
      // Compte Google dont l'ouverture d'espace a échoué : on réessaie à la lecture.
      try {
        await assurerEspaceSiOrphelin(session.user.id);
      } catch {
        return null;
      }
      rows = await lireMembre(sql, session.user.id);
    }
    const ligne = rows[0];
    if (!ligne) return null;
    const roleId = ligne.role_id;
    return {
      userId: session.user.id,
      email: session.user.email,
      prenom: ligne.prenom,
      nom: ligne.nom,
      initiales: ligne.initiales,
      roleId,
      role: labelDuRole(roleId),
      droits: droitsEffectifs(roleId, ligne.droits),
      affectation: ligne.affectation,
      orgId: ligne.org_id,
      orgType: ligne.org_type,
      orgNom: ligne.org_nom,
    };
  } catch {
    return null;
  }
}
