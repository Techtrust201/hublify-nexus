import { expect, test } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.beforeAll(() => {
  test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent");
  test.skip(!MOT_DE_PASSE, "DEMO_AUTH_PASSWORD absent");
});

test("création prestataire : rien n'est enregistré avec des champs manquants ou invalides", async ({
  page,
}) => {
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill("contact@tech-trust.fr");
  await page.locator('input[name="password"]').fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).not.toHaveURL(/connexion/, { timeout: 10_000 });

  await page.goto("/prestataires/nouveau");
  const enregistrer = page.getByRole("button", { name: "Enregistrer le prestataire" });
  await expect(enregistrer).toBeEnabled();

  await enregistrer.click();
  await expect(page).toHaveURL(/prestataires\/nouveau/);

  await page.getByLabel("Nom et prénom").fill("   ");
  await page.getByLabel("Ville").fill("Nice");
  await page.getByLabel("Téléphone").fill("0600000000");
  await page.getByLabel("E-mail").fill("test.validation@exemple.test");
  await enregistrer.click();
  await expect(page.getByText("Indiquez le nom et la ville du prestataire.")).toBeVisible();
  await expect(page).toHaveURL(/prestataires\/nouveau/);

  await page.getByLabel("Nom et prénom").fill("Test Validation");
  await page.getByLabel("E-mail").fill("pas-un-email");
  await enregistrer.click();
  await expect(page).toHaveURL(/prestataires\/nouveau/);
  expect(
    await page
      .getByLabel("E-mail")
      .evaluate((element: HTMLInputElement) => element.validity.typeMismatch),
  ).toBe(true);
});
