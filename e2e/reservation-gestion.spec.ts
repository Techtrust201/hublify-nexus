import { expect, test, type Page } from "@playwright/test";
import { Pool } from "pg";

import { ORG_REDRIS_ID } from "../src/lib/orgs";

// Réservation : Gestion Ménage / Linge / Consommables Oui / Non (colonnes de la 024).
// Base jetable, données fictives. Écritures par les mêmes fonctions serveur que l'écran.

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent : npm run db:prepare");
test.skip(!process.env["DEMO_AUTH_PASSWORD"], "DEMO_AUTH_PASSWORD absent");

const ORIGINE = "http://127.0.0.1:8080";
const MOT_DE_PASSE_DEMO = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const GESTIONNAIRE = "amelie.dubois@hublify.app";
const jeton = Date.now().toString(36);
const ID = `e2e-rg-${jeton}`;
const OCCUPANT_FENETRE = `Voyageur Fenetre ${jeton}`;

let pool: Pool;
let bienId = "";

async function colonnes() {
  const r = await pool.query(
    `select menage_gere, linge_gere, consommable_gere, occupant
       from public.reservations_dossier where org_id = $1::uuid and id = $2`,
    [ORG_REDRIS_ID, ID],
  );
  return r.rows[0] as Record<string, unknown> | undefined;
}

test.beforeAll(async () => {
  pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
  const b = await pool.query(
    `select id from public.biens where org_id = $1::uuid order by id limit 1`,
    [ORG_REDRIS_ID],
  );
  bienId = String(b.rows[0]?.id ?? "");
});

test.afterAll(async () => {
  try {
    await pool.query(
      `delete from public.reservations_dossier where org_id = $1::uuid and id = $2`,
      [ORG_REDRIS_ID, ID],
    );
    await pool.query(
      `delete from public.reservations_cal where org_id = $1::uuid and voyageur = $2`,
      [ORG_REDRIS_ID, OCCUPANT_FENETRE],
    );
    await pool.query(
      `delete from public.reservations_dossier where org_id = $1::uuid and occupant = $2`,
      [ORG_REDRIS_ID, OCCUPANT_FENETRE],
    );
  } finally {
    await pool.end();
  }
});

async function connecter(page: Page) {
  let statut = 0;
  for (let essai = 0; essai < 4; essai += 1) {
    const r = await page.request.post("/api/auth/sign-in/email", {
      data: { email: GESTIONNAIRE, password: MOT_DE_PASSE_DEMO },
      headers: { Origin: ORIGINE },
    });
    statut = r.status();
    if (r.ok() || statut !== 429) break;
    await page.waitForTimeout(20_000);
  }
  expect(statut).toBeLessThan(400);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

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

test("gestion Oui / Non : enregistrée, relue, modifiée, gardée par la sauvegarde en bloc", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await connecter(page);

  expect(
    await evaluer(
      page,
      async () => {
        const mod = await import("/src/data/session-remote.ts");
        return mod.gestionReservationDistant();
      },
      undefined,
    ),
  ).toEqual({ ok: true, disponible: true });

  const item = {
    id: ID,
    bienId,
    occupant: `Voyageur Fictif ${jeton}`,
    initiales: "VF",
    email: `voyageur.${jeton}@exemple.test`,
    telephone: "",
    arrivee: "2031-03-02",
    depart: "2031-03-05",
    heureArrivee: "16:00",
    heureDepart: "10:00",
    plateforme: "Direct",
    voyageurs: 2,
    adultes: 2,
    enfants: 0,
    montant: 300,
    paye: 0,
    statut: "Confirmé",
    couleur: "#0f766e",
    menageGere: true,
    lingeGere: false,
  };
  expect(
    await evaluer(
      page,
      async (item) => {
        const mod = await import("/src/data/session-remote.ts");
        return mod.insererLigneMetier({ data: { collection: "reservationsDossier", item } });
      },
      item,
    ),
  ).toEqual({ ok: true });
  // Non renseigné reste NULL : aucun « Non » par défaut.
  expect(await colonnes()).toMatchObject({
    menage_gere: true,
    linge_gere: false,
    consommable_gere: null,
  });

  expect(
    await evaluer(
      page,
      async (id) => {
        const mod = await import("/src/data/session-remote.ts");
        return mod.modifierLigneMetier({
          data: {
            collection: "reservationsDossier",
            id,
            patch: { consommableGere: false, menageGere: null },
          },
        });
      },
      ID,
    ),
  ).toEqual({ ok: true });
  expect(await colonnes()).toMatchObject({
    menage_gere: null,
    linge_gere: false,
    consommable_gere: false,
  });

  // Relue par l'écran, puis renvoyée telle quelle par la sauvegarde en bloc.
  const lue = await evaluer(
    page,
    async (id) => {
      const mod = await import("/src/data/session-remote.ts");
      const lecture = await mod.chargerEtatDistant();
      if (!lecture.ok) return { lecture };
      const resa = lecture.payload.reservationsDossier.find((r) => r.id === id);
      const sauve = await mod.sauverEtatDistant({
        data: { patch: { reservationsDossier: lecture.payload.reservationsDossier } },
      });
      return { resa, sauve };
    },
    ID,
  );
  expect(lue.resa).toMatchObject({ menageGere: null, lingeGere: false, consommableGere: false });
  expect(lue.sauve).toEqual({ ok: true });
  expect(await colonnes()).toMatchObject({
    menage_gere: null,
    linge_gere: false,
    consommable_gere: false,
  });
});

test("fenêtre de réservation : Ménage, Linge, Consommables en Oui / Non, enregistrés", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const occupant = OCCUPANT_FENETRE;
  await connecter(page);
  await page.goto("/reservations/nouveau");
  await page.getByRole("button", { name: "Sélectionner le type" }).click();
  await page.getByRole("button", { name: "Location saisonnière" }).click();
  const gestion = page.getByRole("group", { name: "Gestion" });
  await expect(gestion).toBeVisible({ timeout: 20_000 });
  for (const libelle of ["Ménage", "Linge", "Consommables"]) {
    const choix = gestion.getByLabel(libelle);
    await expect(choix).toHaveValue("");
    await expect(choix.locator("option")).toHaveText(["Non renseigné", "Oui", "Non"]);
  }
  await gestion.getByLabel("Linge").selectOption("non");
  await gestion.getByLabel("Consommables").selectOption("non");

  await page
    .locator('select:has(option:text("Sélectionner le logement"))')
    .selectOption({ index: 1 });
  await page.getByPlaceholder("Nom de l'occupant 1").fill(occupant);
  await page.getByPlaceholder("prenom.nom@email.fr").fill(`fenetre.${jeton}@exemple.test`);
  await page.getByPlaceholder("+33 6 12 34 56 78").fill("0600000000");
  await page.locator('input[type="date"]').nth(0).fill("2031-04-01");
  await page.locator('input[type="date"]').nth(1).fill("2031-04-04");
  await page.getByRole("button", { name: "Créer une réservation" }).click();
  await expect(page.getByText("Réservation créée.")).toBeVisible();

  await expect
    .poll(
      async () => {
        const r = await pool.query(
          `select menage_gere, linge_gere, consommable_gere from public.reservations_dossier
            where org_id = $1::uuid and occupant = $2`,
          [ORG_REDRIS_ID, occupant],
        );
        return r.rows[0] ?? null;
      },
      { timeout: 30_000 },
    )
    .toEqual({ menage_gere: null, linge_gere: false, consommable_gere: false });
  // Le séjour du calendrier part juste après : on l'attend pour tout nettoyer ensuite.
  await expect
    .poll(
      async () =>
        (
          await pool.query(
            `select 1 from public.reservations_cal where org_id = $1::uuid and voyageur = $2`,
            [ORG_REDRIS_ID, occupant],
          )
        ).rowCount,
      { timeout: 30_000 },
    )
    .toBe(1);
});
