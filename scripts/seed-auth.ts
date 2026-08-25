import "./charger-env.mjs";
import { DROITS_PAR_ROLE, SUPER_ADMINS, type RoleId } from "../src/auth/permissions.ts";
import { etatCanon } from "../src/data/etat-canon.ts";
import {
  COLLECTIONS_METIER,
  TABLE_COLLECTION,
  type CollectionMetier,
} from "../src/data/etat-session.ts";
import { auth, avecInscriptionInterne } from "../src/lib/auth.ts";
import { ORG_LUCAS_ID, ORG_REDRIS_ID } from "../src/lib/orgs.ts";
import { rattacherUtilisateur } from "../src/lib/rattacher.ts";
import { fermerPool, getSql, type Sql } from "../src/lib/sql.ts";

const motDePasse = process.env.DEMO_AUTH_PASSWORD ?? "Hublify-Demo-2026!";

const comptes: Array<{
  email: string;
  prenom: string;
  nom: string;
  roleId: RoleId;
  affectation: string;
  orgId: string;
}> = [
  ...SUPER_ADMINS.map((c) => ({
    email: c.email,
    prenom: c.prenom,
    nom: c.nom,
    roleId: "super-admin" as const,
    affectation: c.affectation,
    orgId: ORG_REDRIS_ID,
  })),
  {
    email: "amelie.dubois@hublify.app",
    prenom: "Amélie",
    nom: "Dubois",
    roleId: "gestionnaire",
    affectation: "Assignment Terra",
    orgId: ORG_REDRIS_ID,
  },
  {
    email: "claire.lecture@hublify.app",
    prenom: "Claire",
    nom: "Lemoine",
    roleId: "lecteur",
    affectation: "Consultation",
    orgId: ORG_REDRIS_ID,
  },
  {
    email: "lucas.menage@hublify.app",
    prenom: "Lucas",
    nom: "Ménage",
    roleId: "prestataire",
    affectation: "Interventions",
    orgId: ORG_LUCAS_ID,
  },
];

const emailsObsoletes = ["yannick.rath@hublify.app"];

const MISSIONS_LUCAS = ["ms1", "ms6"];

function extraireId(item: unknown, indice: number): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && "id" in item && typeof item.id === "string") {
    return item.id;
  }
  return `ligne-${indice}`;
}

async function semerCollection(sql: Sql, orgId: string, collection: CollectionMetier, items: unknown[]) {
  const table = TABLE_COLLECTION[collection];
  await sql.query(`delete from public.${table} where org_id = $1::uuid`, [orgId]);
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const id = extraireId(item, i);
    const payload = typeof item === "string" ? { id, date: item } : item;
    if (table === "biens" && payload && typeof payload === "object" && "nom" in payload) {
      const nom = String((payload as { nom?: string }).nom ?? id);
      const base =
        typeof (payload as { baseNuit?: number }).baseNuit === "number"
          ? (payload as { baseNuit: number }).baseNuit
          : 0;
      await sql.query(
        `insert into public.biens (org_id, id, nom, base_nuit, payload, updated_at)
         values ($1::uuid, $2, $3, $4, $5::jsonb, now())`,
        [orgId, id, nom, base, JSON.stringify(payload)],
      );
    } else if (table === "missions") {
      const presta = MISSIONS_LUCAS.includes(id) ? ORG_LUCAS_ID : null;
      const corps =
        presta && payload && typeof payload === "object"
          ? { ...(payload as object), assigne: "Lucas Ménage" }
          : payload;
      await sql.query(
        `insert into public.missions (org_id, id, payload, org_prestataire_id, updated_at)
         values ($1::uuid, $2, $3::jsonb, $4::uuid, now())`,
        [orgId, id, JSON.stringify(corps), presta],
      );
    } else {
      await sql.query(
        `insert into public.${table} (org_id, id, payload, updated_at)
         values ($1::uuid, $2, $3::jsonb, now())`,
        [orgId, id, JSON.stringify(payload)],
      );
    }
  }
}

async function main() {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL manquant");

  await sql.query(
    `insert into public.orgs (id, nom, type) values ($1::uuid, $2, $3)
     on conflict (id) do update set nom = excluded.nom, type = excluded.type`,
    [ORG_REDRIS_ID, "Redris", "gestionnaire"],
  );
  await sql.query(
    `insert into public.orgs (id, nom, type) values ($1::uuid, $2, $3)
     on conflict (id) do update set nom = excluded.nom, type = excluded.type`,
    [ORG_LUCAS_ID, "Lucas Ménage", "prestataire"],
  );
  await sql.query(
    `insert into public.liens_org (org_gestionnaire_id, org_prestataire_id, statut)
     values ($1::uuid, $2::uuid, 'actif')
     on conflict do nothing`,
    [ORG_REDRIS_ID, ORG_LUCAS_ID],
  );

  for (const email of emailsObsoletes) {
    await sql`delete from "user" where email = ${email}`;
  }

  for (const c of comptes) {
    const existants = (await sql`
      select id from "user" where email = ${c.email} limit 1
    `) as { id: string }[];
    let userId = existants[0]?.id;
    if (userId) {
      const comptesAuth = (await sql`
        select id from "account" where "userId" = ${userId}::uuid limit 1
      `) as { id: string }[];
      if (comptesAuth.length === 0) {
        await sql`delete from "user" where id = ${userId}::uuid`;
        userId = undefined;
      }
    }
    if (!userId) {
      const cree = await avecInscriptionInterne(() =>
        auth.api.signUpEmail({
          body: {
            email: c.email,
            password: motDePasse,
            name: `${c.prenom} ${c.nom}`,
          },
        }),
      );
      userId = cree.user.id;
      console.log("créé", c.email);
    } else {
      console.log("existe déjà", c.email);
    }
    await sql`delete from public.org_membres where user_id = ${userId}::uuid and org_id <> ${c.orgId}::uuid`;
    await rattacherUtilisateur({
      sql,
      userId,
      prenom: c.prenom,
      nom: c.nom,
      roleId: c.roleId,
      affectation: c.affectation,
      statut: "actif",
      orgId: c.orgId,
      droits: [...DROITS_PAR_ROLE[c.roleId]],
    });
  }

  const canon = etatCanon();
  for (const cle of COLLECTIONS_METIER) {
    await semerCollection(sql, ORG_REDRIS_ID, cle, canon[cle] as unknown[]);
  }

  const n = await sql`select count(*)::int as n from public.org_membres`;
  const biens = await sql`select count(*)::int as n from public.biens where org_id = ${ORG_REDRIS_ID}::uuid`;
  console.log(
    "Membres",
    (n[0] as { n: number }).n,
    "· Biens Redris",
    (biens[0] as { n: number }).n,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => fermerPool());
