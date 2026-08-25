import { droitsEffectifs, initialesDe, type DroitId, type RoleId } from "@/auth/permissions";
import type { Sql } from "@/lib/sql";

export async function rattacherUtilisateur(params: {
  sql: Sql;
  userId: string;
  prenom: string;
  nom: string;
  roleId: RoleId;
  affectation: string;
  statut: "actif" | "attente";
  orgId: string;
  droits?: DroitId[];
}) {
  const nom = params.nom || params.prenom;
  const droits = params.droits ?? droitsEffectifs(params.roleId);
  await params.sql`
    insert into public.profils (user_id, prenom, nom, initiales, affectation, statut)
    values (
      ${params.userId}::uuid,
      ${params.prenom},
      ${nom},
      ${initialesDe(params.prenom, nom)},
      ${params.affectation},
      ${params.statut}
    )
    on conflict (user_id) do update
      set prenom = excluded.prenom,
          nom = excluded.nom,
          initiales = excluded.initiales,
          affectation = excluded.affectation,
          statut = excluded.statut
  `;
  await params.sql`
    insert into public.org_membres (org_id, user_id, role_id, droits, statut)
    values (
      ${params.orgId}::uuid,
      ${params.userId}::uuid,
      ${params.roleId},
      ${`{${droits.join(",")}}`}::text[],
      ${params.statut}
    )
    on conflict (org_id, user_id) do update
      set role_id = excluded.role_id,
          droits = excluded.droits,
          statut = excluded.statut
  `;
}
