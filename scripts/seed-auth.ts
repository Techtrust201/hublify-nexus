import "./charger-env.mjs";
import { DROITS_PAR_ROLE, SUPER_ADMINS, type RoleId } from "../src/auth/permissions.ts";
import { etatCanon } from "../src/data/etat-canon.ts";
import { COLLECTIONS_METIER, type CollectionMetier } from "../src/data/etat-session.ts";
import {
  ecrireParametrage,
  remplacerCollection,
  upsertLigne,
  ecrireAccesLieu,
} from "../src/data/metier.ts";
import { auth, avecInscriptionInterne } from "../src/lib/auth.ts";
import { ORG_LUCAS_ID, ORG_REDRIS_ID } from "../src/lib/orgs.ts";
import { rattacherUtilisateur } from "../src/lib/rattacher.ts";
import { fermerPool, getSql, type Sql } from "../src/lib/sql.ts";

const motDePasse = process.env.DEMO_AUTH_PASSWORD;
if (!motDePasse) {
  // Une valeur de repli écrite ici serait le mot de passe de tous les comptes
  // créés par ce script, connu de quiconque lit le dépôt.
  throw new Error("DEMO_AUTH_PASSWORD est obligatoire : renseignez-le dans .env.local");
}

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
  {
    email: "jean.martin@hublify.app",
    prenom: "Jean",
    nom: "Martin",
    roleId: "locataire",
    affectation: "Locataire Colette",
    orgId: ORG_REDRIS_ID,
  },
  {
    email: "sophie.martin@hublify.app",
    prenom: "Sophie",
    nom: "Martin",
    roleId: "voyageur",
    affectation: "Séjour Suzette",
    orgId: ORG_REDRIS_ID,
  },
  {
    email: "pierre.moreau@hublify.app",
    prenom: "Pierre",
    nom: "Moreau",
    roleId: "proprietaire",
    affectation: "Immeuble des Arts",
    orgId: ORG_REDRIS_ID,
  },
];

const emailsObsoletes = ["yannick.rath@hublify.app"];

const MISSIONS_LUCAS = ["ms1", "ms6"];

async function semerCollection(sql: Sql, orgId: string, collection: CollectionMetier, items: unknown[]) {
  // Les missions confiées à Lucas portent l'org du prestataire : c'est ce
  // rattachement qui les rend visibles depuis son compte.
  if (collection === "missions") {
    const ids = (items as { id: string }[]).map((m) => m.id);
    await sql.query(`delete from public.missions where org_id = $1::uuid and id <> all($2::text[])`, [
      orgId,
      ids,
    ]);
    for (const mission of items as { id: string; assigne?: string }[]) {
      const presta = MISSIONS_LUCAS.includes(mission.id) ? ORG_LUCAS_ID : null;
      const ligne = presta ? { ...mission, assigne: "Lucas Ménage" } : mission;
      await upsertLigne(sql, orgId, "missions", ligne, presta);
    }
    return;
  }
  await remplacerCollection(sql, orgId, collection, items);
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
  await ecrireParametrage(sql, ORG_REDRIS_ID, canon.parametrage);

  const cleAcces = process.env.APP_CRYPTO_KEY;
  if (cleAcces) {
    await ecrireAccesLieu(sql, ORG_REDRIS_ID, cleAcces, {
      bienId: "colette",
      wifi: "Hublify-Colette",
      wifiMdp: "Colette2026",
      codeCles: "4412",
      alarme: "",
      consignes: "Boîte à clés à gauche de l'entrée. Code porte A-18.",
    });
    await ecrireAccesLieu(sql, ORG_REDRIS_ID, cleAcces, {
      bienId: "suzette",
      wifi: "Hublify-Suzette",
      wifiMdp: "Suzette2026",
      codeCles: "8821",
      alarme: "",
      consignes: "Digicode 8821 puis clé dans la boîte.",
    });
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
