import { expect, test } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(
  !process.env["DATABASE_URL"] || !MOT_DE_PASSE,
  "DATABASE_URL ou mot de passe démo absent",
);

async function connecter(page: import("@playwright/test").Page, email: string) {
  await expect(async () => {
    await page.context().clearCookies();
    await page.goto("/connexion");
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled();
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.locator('input[name="password"]').fill(MOT_DE_PASSE);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).not.toHaveURL(/connexion/, { timeout: 8_000 });
  }).toPass({ timeout: 40_000 });
}

test("prestataire : la semaine part d'aujourd'hui et filtre les missions", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await connecter(page, "lucas.menage@hublify.app");
  await page.goto("/espace/missions");
  const jours = page.getByRole("group", { name: "Jours" });
  const aujourdhui = String(new Date().getDate());
  await expect(jours.getByRole("button", { pressed: true })).toContainText(aujourdhui);
  const avant = await jours.getByRole("button", { pressed: true }).textContent();
  await jours.getByRole("button", { pressed: false }).first().click();
  await expect
    .poll(async () => jours.getByRole("button", { pressed: true }).textContent())
    .not.toBe(avant);
  await expect(page.getByRole("status")).toContainText("mission");
});

test("calendrier : Aujourd'hui reste visible même si on y est déjà", async ({ page }) => {
  test.setTimeout(90_000);
  await connecter(page, "jean.martin@hublify.app");
  await page.goto("/espace/calendrier");
  await page.getByRole("button", { name: "Mois suivant" }).click();
  const retour = page.getByRole("status").filter({ hasText: "Aujourd'hui est affiché" });
  await page.getByRole("button", { name: "Aujourd'hui" }).click();
  await expect(retour).toBeVisible();
  await page.getByRole("button", { name: "Aujourd'hui" }).click();
  await expect(retour).toBeVisible();
});

test("assistance : formulaire vide affiche les erreurs", async ({ page }) => {
  test.setTimeout(90_000);
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/assistance");
  await expect(page.locator("form[data-pret='oui']")).toBeVisible();
  await page.getByRole("button", { name: "Envoyer à l'assistance" }).click();
  await expect(page.locator("#erreur-sujet")).toHaveText("Indiquez un sujet.");
  await expect(page.locator("#erreur-message")).toHaveText("Indiquez un message.");
});
