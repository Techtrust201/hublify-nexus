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

  const apercu = page.getByTestId("apercu-livret");
  await expect(apercu).toBeVisible();
  await expect(apercu).toHaveCSS("width", "598px");
  await expect(apercu.getByText("Titre principal").or(apercu.getByText("Bonjour et bienvenue"))).toBeVisible();
  await expect(apercu.getByText("Image de Couverture")).toBeVisible();
  await expect(apercu.getByText("Aperçu dynamique")).toBeVisible();

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

  await page.getByRole("button", { name: /Informations pratique|Le quartier|Règles de la maison/ }).first().click();
  const grille = page.getByTestId("apercu-livret");
  await expect(grille.getByText("Arrivée")).toBeVisible();
  await expect(grille.getByText("à Partir de 00h00")).toBeVisible();
  await expect(grille.getByText("Départ")).toBeVisible();
  await expect(grille.getByText("Avant 00h00")).toBeVisible();
  await expect(grille.getByText("Wifi", { exact: true })).toBeVisible();
  await expect(grille.getByText("Nom", { exact: true })).toBeVisible();
  await expect(grille.getByText("Code", { exact: true })).toBeVisible();
  await expect(grille.getByText("Rappel des règles de base")).toBeVisible();

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Livret enregistré.")).toBeVisible();
  await expect(page.getByRole("status", { name: "Synchronisation des livrets" })).toHaveText(
    "Enregistré",
    { timeout: 15_000 },
  );

  await page.getByRole("button", { name: "Télécharger l'aperçu" }).click();
  await page.getByRole("button", { name: /Outils \/ Livret d'accueil/ }).click();
  await expect(page.getByRole("row", { name: /Livret d'accueil standard/ }).first()).toBeVisible();

  await page
    .getByRole("row", { name: /Fiche d'accès — Appartement Colette/ })
    .first()
    .getByRole("button", { name: "Modifier" })
    .click();
  await page.getByRole("button", { name: /^Accès/ }).click();
  const plan = page.getByTitle("Plan du logement");
  await expect(plan).toBeVisible({ timeout: 20_000 });
  await expect(plan).toHaveAttribute("src", /openstreetmap\.org\/export\/embed\.html/);
  await expect(plan).toHaveAttribute("src", /marker=/);
});
