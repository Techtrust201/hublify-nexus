import { expect, test } from "@playwright/test";

test("sans session, l'app redirige vers la connexion", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Connexion/);
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
});

test("une route inconnue sans session mène à la connexion", async ({ page }) => {
  await page.goto("/page-inconnue-xyz");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
});

test("un administrateur accède à la vue générale", async ({ page }) => {
  test.skip(
    !process.env["DATABASE_URL"],
    "DATABASE_URL absent : docker compose up -d && npm run db:prepare",
  );
  await page.goto("/connexion");
  await page.getByLabel("Email").fill("contact@tech-trust.fr");
  await page.getByLabel("Mot de passe").fill("Hublify-Demo-2026!");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveTitle(/Vue générale/, { timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Réservations" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Team mate" })).toBeVisible();
});
