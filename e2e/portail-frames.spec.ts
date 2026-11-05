import { expect, test } from "@playwright/test";
import { FRAMES_HD } from "../src/data/frames-hd";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(!process.env["DATABASE_URL"] || !MOT_DE_PASSE, "DATABASE_URL ou mot de passe démo absent");

test("chaque frame HD s'ouvre par un clic", async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill("jean.martin@hublify.app");
  await page.locator('input[name="password"]').fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).not.toHaveURL(/connexion/);
  await page.goto("/espace");
  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("button", { name: "Étapes du séjour" }).click();
  await expect(page.getByRole("heading", { name: "Étapes du séjour" })).toBeVisible();
  expect(await page.getByRole("button").count()).toBeGreaterThanOrEqual(FRAMES_HD.length);

  for (const frame of FRAMES_HD) {
    await page.getByRole("button", { name: frame.noeud }).click();
    await expect(page.locator(`[data-frame="${frame.id}"]`)).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Étapes du séjour" })).toBeVisible();
  }
});

test("intro du pré-check-in puis formulaire", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill("sophie.martin@hublify.app");
  await page.locator('input[name="password"]').fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).not.toHaveURL(/connexion/);
  await page.goto("/espace/precheckin");
  await expect(page.getByRole("button", { name: "Continuer" })).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("heading", { name: "Formulaire de check-in" })).toBeVisible();
});
