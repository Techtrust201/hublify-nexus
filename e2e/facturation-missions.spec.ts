import { expect, test, type Page } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";

import { ORG_REDRIS_ID } from "../src/lib/orgs";

// « Créer une Mission », PR 6 : réglages et colonnes de facturation lus par l'écran Analyse,
// derrière la date d'effet de l'org. Base jetable, données fictives uniquement. La date
// d'effet est posée en base par le test puis retirée : aucun écran ne l'écrit encore.

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent : npm run db:prepare");
test.skip(!process.env["DEMO_AUTH_PASSWORD"], "DEMO_AUTH_PASSWORD absent");

const ORIGINE = "http://127.0.0.1:8080";
const MOT_DE_PASSE_DEMO = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const MOT_DE_PASSE = "Facturation-e2e-2026!";
const GESTIONNAIRE = "amelie.dubois@hublify.app";
const SEP = "\u2063";

const jeton = Date.now().toString(36);
const SANS_FINANCES = `sans-finances.${jeton}@exemple.test`;
const ID = (n: string) => `e2e-fm-${n}-${jeton}`;

let pool: Pool;
let bienId = "";
let reservationId = "";

test.beforeAll(async () => {
  pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
  const resa = await pool.query(
    `select id, bien_id from public.reservations_dossier where org_id = $1::uuid order by id limit 1`,
    [ORG_REDRIS_ID],
  );
  reservationId = String(resa.rows[0]?.id ?? "");
  bienId = String(resa.rows[0]?.bien_id ?? "");
  // Membre gestionnaire sans le droit « voir-finances ».
  const hash = await hashPassword(MOT_DE_PASSE);
  const user = await pool.query(
    `insert into "user" (name, email, "emailVerified") values ('Sans Finances', $1, true) returning id`,
    [SANS_FINANCES],
  );
  const userId = user.rows[0]?.id as string;
  await pool.query(
    `insert into account ("accountId", "providerId", "userId", issuer, password, "updatedAt")
     values ($1::text, 'credential', $1::uuid, 'local:credential', $2, now())`,
    [userId, hash],
  );
  await pool.query(
    `insert into public.profils (user_id, prenom, nom, initiales, affectation, statut)
     values ($1::uuid, 'Sans', 'Finances', 'SF', 'Planning', 'actif')`,
    [userId],
  );
  await pool.query(
    `insert into public.org_membres (org_id, user_id, role_id, droits, statut)
     values ($1::uuid, $2::uuid, 'gestionnaire',
             '{voir-reservations,voir-biens,voir-calendrier,mod-missions}'::text[], 'actif')`,
    [ORG_REDRIS_ID, userId],
  );
});

test.afterAll(async () => {
  try {
    await pool.query(`delete from public.missions where org_id = $1::uuid and id like $2`, [
      ORG_REDRIS_ID,
      `e2e-fm-%-${jeton}`,
    ]);
    await pool.query(`delete from public.org_facturation where org_id = $1::uuid`, [ORG_REDRIS_ID]);
    await pool.query(
      `update public.reservations_dossier set linge_gere = null, consommable_gere = null
        where org_id = $1::uuid and id = $2`,
      [ORG_REDRIS_ID, reservationId],
    );
    await pool.query(`delete from "user" where email = $1`, [SANS_FINANCES]);
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
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

/** Une redirection ou un rechargement de Vite au premier chargement détruit le contexte. */
async function evaluer<T, A>(page: Page, fn: (arg: A) => Promise<T>, arg: A): Promise<T> {
  for (let essai = 0; ; essai += 1) {
    try {
      return await page.evaluate(fn, arg);
    } catch (e) {
      if (essai >= 3 || !String(e).includes("Execution context was destroyed")) throw e;
      await page.waitForLoadState("networkidle");
    }
  }
}

async function inserer(page: Page, item: Record<string, unknown>) {
  return evaluer(
    page,
    async (item: Record<string, unknown>) => {
      const mod = await import("/src/data/session-remote.ts");
      return mod.insererLigneMetier({
        data: { collection: "missions", item: item as { id: string } },
      });
    },
    item,
  );
}

async function lireFacturation(page: Page) {
  return evaluer(
    page,
    async () => {
      const mod = await import("/src/data/session-remote.ts");
      return mod.facturationOrgDistant();
    },
    undefined,
  );
}

function mission(id: string, date: string, type: string, meta: Record<string, unknown>) {
  return {
    id,
    bienId,
    date,
    titre: `${type} fictif ${jeton}`,
    type,
    emoji: "",
    heure: "10:00",
    assigne: "Coéquipier Fictif",
    statut: "a_faire",
    description: `Prestation fictive.${SEP}${JSON.stringify(meta)}`,
  };
}

test.describe.serial("facturation : réglages et colonnes pour Analyse", () => {
  test("gestionnaire : rien sans date d'effet, colonnes après", async ({ page }) => {
    test.setTimeout(150_000);
    expect(bienId, "réservation de démo").not.toBe("");
    await connecter(page, GESTIONNAIRE, MOT_DE_PASSE_DEMO);

    for (const m of [
      mission(ID("a"), "2026-11-25", "Check-in", {
        porteur: "teammate",
        attribution: "mandataire",
        tarif: 33,
      }),
      mission(ID("b"), "2026-11-25", "Menage", {
        porteur: "teammate",
        attribution: "locataire",
        reservationId,
        tarif: 45,
      }),
      mission(ID("c"), "2026-11-25", "Check-out", {
        porteur: "proprietaire",
        attribution: "proprietaire",
      }),
      mission(ID("d"), "2026-10-15", "Menage", {
        porteur: "teammate",
        attribution: "proprietaire",
        tarif: 99,
      }),
    ]) {
      expect(await inserer(page, m)).toEqual({ ok: true });
    }

    // Pas de réglages : date vide, aucune mission envoyée.
    expect(await lireFacturation(page)).toEqual({
      ok: true,
      facturation: { dateEffet: null, tvaLocataire: null, missions: {}, reservations: {} },
    });

    await pool.query(
      `insert into public.org_facturation (org_id, tva_prestations_locataire, date_effet_facturation)
       values ($1::uuid, 0.1, '2026-11-01')`,
      [ORG_REDRIS_ID],
    );
    await pool.query(
      `update public.reservations_dossier set linge_gere = false, consommable_gere = false
        where org_id = $1::uuid and id = $2`,
      [ORG_REDRIS_ID, reservationId],
    );
    const lecture = await lireFacturation(page);
    expect(lecture.ok).toBe(true);
    if (!lecture.ok || !lecture.facturation) throw new Error("facturation absente");
    const f = lecture.facturation;
    expect(f.dateEffet).toBe("2026-11-01");
    expect(f.tvaLocataire).toBe(0.1);
    expect(f.missions[ID("a")]).toEqual({
      attribution: "mandataire",
      porteur: "teammate",
      reservationId: null,
      tarifCentimes: 3_300,
      tvaTaux: null,
    });
    expect(f.missions[ID("b")]).toEqual({
      attribution: "locataire",
      porteur: "teammate",
      reservationId,
      tarifCentimes: 4_500,
      // Taux figé à l'enregistrement de la mission (PR 3) : il n'y avait pas encore de
      // réglage, donc 20 %. Le taux de l'org (10 %) ne vaut que pour les missions suivantes.
      tvaTaux: 0.2,
    });
    expect(f.missions[ID("c")]).toMatchObject({
      attribution: "proprietaire",
      porteur: "proprietaire",
    });
    // Avant la date d'effet : non envoyée.
    expect(f.missions[ID("d")]).toBeUndefined();
    expect(f.reservations[reservationId]).toEqual({
      menage: null,
      linge: false,
      consommable: false,
    });

    // L'écran Facture affiche la mention et le total à la charge du mandataire.
    await page.goto("/analyse?vue=facture&debut=2026-11-01&fin=2026-11-30");
    const bloc = page.getByTestId("regles-facturation");
    await expect(bloc).toContainText("Règles de facturation en vigueur au 01/11/2026");
    await expect(bloc).toContainText("à la charge du mandataire");
    await expect(bloc).toContainText("33");
  });

  test("sans « voir-finances » : refusé", async ({ page }) => {
    test.setTimeout(90_000);
    await connecter(page, SANS_FINANCES, MOT_DE_PASSE);
    expect(await lireFacturation(page)).toEqual({ ok: false, raison: "interdit" });
  });
});
