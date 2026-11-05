import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent");

async function connecter(page: Page) {
  const reponse = await page.request.post("/api/auth/sign-in/email", {
    data: { email: "contact@tech-trust.fr", password: MOT_DE_PASSE },
  });
  expect(reponse.ok()).toBeTruthy();
}

test("les tarifs dessinent l'événement et la quittance porte ses libellés", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page);
  await page.goto("/tarifs");
  await expect(page.getByText("Festival de Jazz de Paris").first()).toBeVisible({
    timeout: 20_000,
  });

  await page.goto("/");
  const quittance = page.getByRole("button", { name: /quittance/i }).first();
  await expect(quittance).toBeVisible({ timeout: 20_000 });
  await quittance.click();
  await expect(page.getByRole("heading", { name: "Générer un reçu ou une quittance" })).toBeVisible();
  await expect(page.getByText("Bailleur — Nom complet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Aperçu PDF" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enregistrer" })).toBeVisible();
});
