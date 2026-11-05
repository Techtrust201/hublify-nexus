import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

async function connecter(page: Page) {
  await expect(async () => {
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill("amelie.dubois@hublify.app");
    await page.locator('input[name="password"]').fill(MOT_DE_PASSE);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).not.toHaveURL(/connexion/, { timeout: 8_000 });
  }).toPass({ timeout: 40_000 });
}

test.beforeAll(() => {
  test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent");
  test.skip(!MOT_DE_PASSE, "DEMO_AUTH_PASSWORD absent");
});

test("livret : pages, aperçu, style et enregistrement", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page);
  await page.goto("/outils/livret");
  await expect(page.locator("[data-hydrated=oui]")).toBeVisible();
  await page
    .getByRole("row", { name: /Livret d'accueil standard/ })
    .first()
    .getByRole("button", { name: "Modifier" })
    .click();

  await expect(page.getByRole("heading", { name: "Livret d'accueil", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Entête du livret|Page d'accueil/ })).toBeVisible();

  await page.getByRole("button", { name: "Aperçu du document" }).click();
  await expect(page.getByRole("button", { name: "Aperçu", pressed: true })).toBeVisible();
  await page.getByRole("button", { name: "Mobile", pressed: false }).click();
  await expect(page.getByRole("button", { name: "Mobile", pressed: true })).toBeVisible();

  const bienvenue = page.getByRole("button", { name: /Bienvenue/ });
  if (await bienvenue.count()) {
    await bienvenue.first().click();
  }
  const texte = page.getByLabel("Texte d'introduction");
  const marque = `Livret frame ${Date.now().toString(36)}`;
  await texte.fill(marque);
  await page.getByRole("button", { name: "Gras" }).click();
  await expect(page.getByText(marque).first()).toBeVisible();

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Livret enregistré.")).toBeVisible();
  await expect(page.getByRole("status", { name: "Synchronisation des livrets" })).toHaveText(
    "Enregistré",
    { timeout: 15_000 },
  );

  await page.getByRole("button", { name: "Télécharger l'aperçu" }).click();
  await page.getByRole("button", { name: /Outils \/ Livret d'accueil/ }).click();
  await expect(page.getByRole("row", { name: /Livret d'accueil standard/ }).first()).toBeVisible();
});
