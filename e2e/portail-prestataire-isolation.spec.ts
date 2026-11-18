import { expect, test, type Page } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";

import { ORG_REDRIS_ID } from "../src/lib/orgs";

// Isolation du portail prestataire, de bout en bout, sur une base jetable.
// Deux comptes fictifs d'une même organisation prestataire, plus un compte au rôle
// « prestataire » mal rattaché à l'organisation gestionnaire. La réponse réseau que
// reçoit le navigateur ne doit jamais contenir la mission de l'autre.

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent : npm run db:prepare");
test.skip(!process.env["DEMO_AUTH_PASSWORD"], "DEMO_AUTH_PASSWORD absent");

const MOT_DE_PASSE = "Isolation-e2e-portail-2026!";
const MOT_DE_PASSE_DEMO = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const ORIGINE = "http://127.0.0.1:8080";

const jeton = Date.now().toString(36);
const ORG_PRESTA = crypto.randomUUID();
const ORG_PRESTA_NOM = `Org e2eprestataire${jeton}`;
const EMAIL = {
  alice: `alice.${jeton}@exemple.test`,
  bruno: `bruno.${jeton}@exemple.test`,
  egare: `egare.${jeton}@exemple.test`,
};
const MISSION = {
  alice: { id: `e2e-alice-${jeton}`, titre: `Intervention-alice-${jeton}` },
  bruno: { id: `e2e-bruno-${jeton}`, titre: `Intervention-bruno-${jeton}` },
  libre: { id: `e2e-libre-${jeton}`, titre: `Intervention-libre-${jeton}` },
  interne: { id: `e2e-interne-${jeton}`, titre: `Intervention-interne-${jeton}` },
};

function aujourdhui() {
  const d = new Date();
  const deux = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

let pool: Pool;

async function creerCompte(
  email: string,
  prenom: string,
  orgId: string,
  roleId: string,
  motDePasse: string,
) {
  const hash = await hashPassword(motDePasse);
  const user = await pool.query(
    `insert into "user" (name, email, "emailVerified") values ($1, $2, true) returning id`,
    [`${prenom} Fictif`, email],
  );
  const userId = user.rows[0]?.id as string;
  await pool.query(
    `insert into account ("accountId", "providerId", "userId", issuer, password, "updatedAt")
     values ($1::text, 'credential', $1::uuid, 'local:credential', $2, now())`,
    [userId, hash],
  );
  await pool.query(
    `insert into public.profils (user_id, prenom, nom, initiales, affectation, statut)
     values ($1::uuid, $2, 'Fictif', $3, 'Interventions', 'actif')`,
    [userId, prenom, prenom.slice(0, 1).toUpperCase() + "F"],
  );
  const droits = await pool.query(
    `select droits from public.org_membres where role_id = $1 limit 1`,
    [roleId],
  );
  const liste = (droits.rows[0]?.droits as string[] | undefined) ?? [];
  await pool.query(
    `insert into public.org_membres (org_id, user_id, role_id, droits, statut)
     values ($1::uuid, $2::uuid, $3, $4::text[], 'actif')`,
    [orgId, userId, roleId, `{${liste.join(",")}}`],
  );
}

async function creerMission(
  m: { id: string; titre: string },
  assigne: string,
  orgPrestataire: string | null,
) {
  await pool.query(
    `insert into public.missions
       (org_id, id, org_prestataire_id, bien_id, jour, titre, type_mission, assigne, statut)
     values ($1::uuid, $2, $3, (select id from public.biens where org_id = $1::uuid limit 1),
             $4::date, $5, 'Menage', $6, 'a_faire')`,
    [ORG_REDRIS_ID, m.id, orgPrestataire, aujourdhui(), m.titre, assigne],
  );
}

test.beforeAll(async () => {
  pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
  await pool.query(`insert into public.orgs (id, nom, type) values ($1::uuid, $2, 'prestataire')`, [
    ORG_PRESTA,
    ORG_PRESTA_NOM,
  ]);
  await pool.query(
    `insert into public.liens_org (org_gestionnaire_id, org_prestataire_id, statut)
     values ($1::uuid, $2::uuid, 'actif')`,
    [ORG_REDRIS_ID, ORG_PRESTA],
  );
  await creerCompte(EMAIL.alice, "Alice", ORG_PRESTA, "prestataire", MOT_DE_PASSE);
  await creerCompte(EMAIL.bruno, "Bruno", ORG_PRESTA, "prestataire", MOT_DE_PASSE);
  // Rôle prestataire posé à la main dans l'organisation gestionnaire : aucun écran ne le permet.
  await creerCompte(EMAIL.egare, "Egare", ORG_REDRIS_ID, "prestataire", MOT_DE_PASSE);
  await creerMission(MISSION.alice, EMAIL.alice, ORG_PRESTA);
  await creerMission(MISSION.bruno, EMAIL.bruno, ORG_PRESTA);
  await creerMission(MISSION.libre, "", ORG_PRESTA);
  await creerMission(MISSION.interne, "Lucas Interne", null);
});

test.afterAll(async () => {
  try {
    await pool.query(`delete from public.missions where id like $1`, [`e2e-%-${jeton}`]);
    await pool.query(`delete from public.liens_org where org_prestataire_id = $1::uuid`, [
      ORG_PRESTA,
    ]);
    await pool.query(`delete from "user" where email like $1`, [`%.${jeton}@exemple.test`]);
    await pool.query(`delete from public.orgs where id = $1::uuid`, [ORG_PRESTA]);
  } finally {
    await pool.end();
  }
});

async function connecter(page: Page, email: string, motDePasse: string) {
  let statut = 0;
  for (let essai = 0; essai < 4; essai += 1) {
    const r = await page.request.post("/api/auth/sign-in/email", {
      data: { email, password: motDePasse },
      headers: { Origin: ORIGINE },
    });
    statut = r.status();
    if (r.ok() || statut !== 429) break;
    await page.waitForTimeout(20_000);
  }
  expect(statut, `connexion ${email}`).toBeLessThan(400);
}

/** Corps de toutes les réponses des fonctions serveur reçues par le navigateur. */
function espionnerReseau(page: Page) {
  const corps: string[] = [];
  page.on("response", async (reponse) => {
    if (!reponse.url().includes("/_serverFn/")) return;
    try {
      corps.push(await reponse.text());
    } catch {
      // Réponse déjà libérée : rien à contrôler.
    }
  });
  return corps;
}

async function etatDistant(page: Page) {
  return page.evaluate(async () => {
    const mod = await import("/src/data/session-remote.ts");
    return mod.chargerEtatDistant();
  });
}

async function ouvrirMissions(page: Page, email: string) {
  await connecter(page, email, MOT_DE_PASSE);
  const corps = espionnerReseau(page);
  await page.goto("/espace/missions");
  await page.waitForLoadState("networkidle");
  return corps;
}

test.describe("portail prestataire : isolation entre personnes", () => {
  test("Alice ne reçoit ni ne voit la mission de Bruno", async ({ page }) => {
    test.setTimeout(150_000);
    const reseau = await ouvrirMissions(page, EMAIL.alice);
    await expect(page.getByText(MISSION.alice.titre)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(MISSION.bruno.titre)).toHaveCount(0);

    const lecture = await etatDistant(page);
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    expect(lecture.payload.missions.map((m) => m.id)).toEqual([MISSION.alice.id]);

    // Ce que le navigateur a réellement reçu du serveur, pas seulement ce qui s'affiche.
    expect(reseau.length, "réponses serveur captées").toBeGreaterThan(0);
    expect(reseau.join("\n")).toContain(MISSION.alice.titre);
    const brut = [...reseau, JSON.stringify(lecture)].join("\n");
    expect(brut).toContain(MISSION.alice.titre);
    for (const autre of [MISSION.bruno, MISSION.libre, MISSION.interne]) {
      expect(brut).not.toContain(autre.id);
      expect(brut).not.toContain(autre.titre);
    }
    expect(brut).not.toContain(EMAIL.bruno);
  });

  test("Bruno ne reçoit ni ne voit la mission d'Alice", async ({ page }) => {
    test.setTimeout(150_000);
    const reseau = await ouvrirMissions(page, EMAIL.bruno);
    await expect(page.getByText(MISSION.bruno.titre)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(MISSION.alice.titre)).toHaveCount(0);

    const lecture = await etatDistant(page);
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    expect(lecture.payload.missions.map((m) => m.id)).toEqual([MISSION.bruno.id]);
    const brut = [...reseau, JSON.stringify(lecture)].join("\n");
    for (const autre of [MISSION.alice, MISSION.libre, MISSION.interne]) {
      expect(brut).not.toContain(autre.id);
      expect(brut).not.toContain(autre.titre);
    }
    expect(brut).not.toContain(EMAIL.alice);
  });

  test("un compte au rôle prestataire hors organisation prestataire ne reçoit rien", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    const reseau = await ouvrirMissions(page, EMAIL.egare);
    const lecture = await etatDistant(page);
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    const p = lecture.payload;
    expect(p.missions).toEqual([]);
    expect(p.documents).toEqual([]);
    expect(p.conversations).toEqual([]);
    expect(p.messagesFil).toEqual([]);
    expect(p.biens).toEqual([]);
    const brut = [...reseau, JSON.stringify(lecture)].join("\n");
    for (const m of Object.values(MISSION)) {
      expect(brut).not.toContain(m.id);
      expect(brut).not.toContain(m.titre);
    }
    await expect(page.getByText(MISSION.interne.titre)).toHaveCount(0);

    const acces = await page.evaluate(async () => {
      const mod = await import("/src/data/session-remote.ts");
      return mod.chargerAccesLieux();
    });
    expect(acces).toEqual({ ok: true, acces: [] });
  });
});

test.describe("portail prestataire : non-régression", () => {
  test("le compte de démo reçoit toujours sa mission", async ({ page }) => {
    test.setTimeout(150_000);
    await connecter(page, "lucas.menage@hublify.app", MOT_DE_PASSE_DEMO);
    await page.goto("/espace");
    await page.waitForLoadState("networkidle");
    const lecture = await etatDistant(page);
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    const missions = lecture.payload.missions.map((m) => m.id).sort();
    expect(missions).toEqual(["ms1", "ms6"]);
    expect(missions.some((id) => id.includes(jeton))).toBe(false);
  });

  test("un administrateur reçoit toujours toutes les missions de son organisation", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await connecter(page, "contact@tech-trust.fr", MOT_DE_PASSE_DEMO);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const lecture = await etatDistant(page);
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    const ids = lecture.payload.missions.map((m) => m.id);
    for (const m of Object.values(MISSION)) expect(ids).toContain(m.id);
  });
});
