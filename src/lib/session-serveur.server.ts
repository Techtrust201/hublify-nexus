import { getRequest } from "@tanstack/react-start/server";
import {
  droitsEffectifs,
  labelDuRole,
  type AuthContexte,
  type RoleId,
} from "@/auth/permissions";
import { auth } from "@/lib/auth";
import type { OrgType } from "@/lib/orgs";
import { getSql } from "@/lib/sql";

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

export async function sessionDepuisRequete(): Promise<AuthContexte | null> {
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session?.user) return null;
  const sql = getSql();
  if (!sql) return null;
  const rows = (await sql`
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
    where m.user_id = ${session.user.id}::uuid
    limit 1
  `) as MembreRow[];
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
}
