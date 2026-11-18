import { expect, test, type Page } from "@playwright/test";
import { Pool } from "pg";

import { ORG_REDRIS_ID } from "../src/lib/orgs";

// « Créer une Mission », PR 4 : la fenêtre, sur une base jetable, données fictives.

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent : npm run db:prepare");
test.skip(!process.env["DEMO_AUTH_PASSWORD"], "DEMO_AUTH_PASSWORD absent");

const ORIGINE = "http://127.0.0.1:8080";
const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const CAPTURES = process.env["CAPTURES_FENETRE"] ?? "test-results";
const jeton = Date.now().toString(36);
const TITRE = `Mission fenêtre ${jeton}`;

// Les utilisateurs sont en français : champs heure en 24 h, comme sur leurs appareils.
test.use({ locale: "fr-FR", timezoneId: "Europe/Paris" });

let pool: Pool;

function aujourdhui() {
  const d = new Date();
  const deux = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

test.beforeAll(() => {
  pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
});

test.afterAll(async () => {
  try {
    await pool.query(`delete from public.missions where org_id = $1::uuid and titre like $2`, [
      ORG_REDRIS_ID,
      `%${jeton}%`,
    ]);
  } finally {
    await pool.end();
  }
});

async function connecter(page: Page) {
  let statut = 0;
  for (let essai = 0; essai < 4; essai += 1) {
    const r = await page.request.post("/api/auth/sign-in/email", {
      data: { email: "amelie.dubois@hublify.app", password: MOT_DE_PASSE },
      headers: { Origin: ORIGINE },
    });
    statut = r.status();
    if (r.ok() || statut !== 429) break;
    await page.waitForTimeout(20_000);
  }
  expect(statut).toBeLessThan(400);
}

async function ouvrir(page: Page) {
  await page.goto("/");
  await expect(page).toHaveTitle(/Vue générale/, { timeout: 30_000 });
  await page.getByRole("button", { name: "Créer une Mission" }).first().click();
  const dialogue = page.getByRole("dialog");
  await expect(dialogue.getByRole("heading", { name: "Créer une Mission" })).toBeVisible();
  return dialogue;
}

test("fenêtre : ordre de la maquette, une seule liste « Assigné à », tarif auto puis modifié", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await connecter(page);
  const dialogue = await ouvrir(page);

  // Ordre des champs de la maquette.
  const libelles = (await dialogue.locator("label").allInnerTexts())
    .map((t) => t.split("\n")[0]?.trim() ?? "")
    .filter(Boolean);
  const ordre = [
    "Type",
    "Titre",
    "Date",
    "Associer la mission à la réservation",
    "Ouverture d'une période de réalisation",
    "Assigné à",
    "Description",
    "Prestation attribuée au",
    "Modifier le tarif (€)",
  ].map((l) => libelles.indexOf(l));
  expect(ordre.every((i) => i >= 0), JSON.stringify(libelles)).toBe(true);
  expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);

  // Retirés de la création : horaire précis, Ménage / Linge / Consommable.
  await expect(dialogue.getByText("Horaire précis")).toHaveCount(0);
  await expect(dialogue.getByText("Linge", { exact: true })).toHaveCount(0);
  await expect(dialogue.getByText("Consommable", { exact: true })).toHaveCount(0);

  // Une seule liste « Assigné à ».
  const options = await dialogue.getByLabel("Assigné à").locator("option").allInnerTexts();
  expect(options).toContain("Propriétaire (pas de facturation)");
  expect(options).toContain("Ouvert (marketplace)");
  await expect(dialogue.getByLabel("Assigné à").locator("optgroup[label='Prestataires']")).toHaveCount(1);
  await expect(dialogue.getByLabel("Réalisée par")).toHaveCount(0);

  // Période optionnelle.
  await expect(dialogue.getByLabel("Fin de la période")).toHaveCount(0);
  await dialogue.getByLabel("Ouverture d'une période de réalisation").check();
  await expect(dialogue.getByLabel("Fin de la période")).toBeVisible();
  await dialogue.getByLabel("Ouverture d'une période de réalisation").uncheck();

  // Tarif : barème par défaut (aucune grille sur la base de démo), puis modifié à la main.
  const tarif = dialogue.getByTestId("tarif-facture");
  await expect(tarif).toContainText("auto");
  await expect(tarif).toContainText("45,00");
  await dialogue.getByLabel("Modifier le tarif (€)").fill("52");
  await expect(tarif).toContainText("52,00");
  await expect(tarif).toContainText("modifié");
  await dialogue.getByLabel("Assigné à").selectOption("proprio");
  await expect(dialogue.getByText("Le propriétaire réalise la mission : pas de facturation.")).toBeVisible();
  await expect(dialogue.getByLabel("Prestation attribuée au")).toHaveCount(0);
  await dialogue.getByLabel("Assigné à").selectOption("ouvert");

  await page.screenshot({ path: `${CAPTURES}/fenetre-mission-1440.png` });

  // Facturée au locataire sans réservation : refusée avant l'envoi.
  await dialogue.getByLabel("Date", { exact: true }).fill(aujourdhui());
  await dialogue.getByLabel("Titre").fill(TITRE);
  await dialogue.getByLabel("Prestation attribuée au").selectOption("locataire");
  await expect(dialogue.getByText("associez la mission à une réservation")).toBeVisible();
  await dialogue.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("doit être associée à une réservation")).toBeVisible();
  await expect(dialogue).toBeVisible();

  // Mandataire, « Ouvert » : créée, rangée en base dans les colonnes de la PR 3.
  await dialogue.getByLabel("Prestation attribuée au").selectOption("mandataire");
  await dialogue.getByRole("button", { name: "Enregistrer" }).click();
  await expect(dialogue).toBeHidden({ timeout: 15_000 });
  await expect(async () => {
    const r = await pool.query(
      `select ouverte, attribution, tarif_manuel_centimes, assigne from public.missions
        where org_id = $1::uuid and titre = $2`,
      [ORG_REDRIS_ID, TITRE],
    );
    expect(r.rows[0]).toMatchObject({
      ouverte: true,
      attribution: "mandataire",
      tarif_manuel_centimes: 5200,
      assigne: "Non assigné",
    });
  }).toPass({ timeout: 15_000 });
});

for (const largeur of [390, 320]) {
  test(`fenêtre lisible sur mobile (${largeur} px)`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: largeur, height: 844 });
    await connecter(page);
    const dialogue = await ouvrir(page);
    await page.screenshot({ path: `${CAPTURES}/fenetre-mission-${largeur}-haut.png` });
    await dialogue.getByLabel("Ouverture d'une période de réalisation").check();
    await dialogue.getByLabel("Associer la mission à la réservation").check();
    const debordement = await dialogue.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(debordement).toBeLessThanOrEqual(1);
    const boite = await dialogue.boundingBox();
    expect(boite).not.toBeNull();
    expect(boite!.x).toBeGreaterThanOrEqual(0);
    expect(boite!.x + boite!.width).toBeLessThanOrEqual(largeur + 1);
    for (const champ of ["Fin de la période", "Heure de fin", "Assigné à", "Modifier le tarif (€)"]) {
      const b = await dialogue.getByLabel(champ).boundingBox();
      expect(b, champ).not.toBeNull();
      expect(b!.x + b!.width, champ).toBeLessThanOrEqual(largeur + 1);
    }
    await page.screenshot({ path: `${CAPTURES}/fenetre-mission-${largeur}.png` });
    await dialogue.getByLabel("Assigné à").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${CAPTURES}/fenetre-mission-${largeur}-bas.png` });
  });
}
