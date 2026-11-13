import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(
  !process.env["DATABASE_URL"] || !MOT_DE_PASSE,
  "DATABASE_URL ou mot de passe démo absent",
);

async function connecter(page: Page, email: string) {
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

test("Google reste masqué et l'accueil du portail est en français", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/connexion");
  await expect(page.getByRole("button", { name: "Continuer avec Google" })).toHaveCount(0);
  await page.goto("/inscription");
  await expect(page.getByRole("button", { name: "S'inscrire avec Google" })).toHaveCount(0);
  await page.goto("/espace");
  await expect(page.locator("[data-portail-pret='1']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pilotage et gestion" })).toBeVisible();
  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(page.getByRole("heading", { name: "Se connecter" })).toBeVisible();
});

test("le locataire enregistre un message qui survit au rechargement", async ({ page }) => {
  test.setTimeout(90_000);
  const texte = `Relance portail ${Date.now().toString(36)}`;
  await page.setViewportSize({ width: 390, height: 844 });
  await connecter(page, "jean.martin@hublify.app");
  await page.goto("/espace/messages");
  await expect(page.getByRole("heading", { name: "Messagerie" })).toBeVisible();
  const debordement = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(debordement).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: /Yannick Ratti/ }).click();
  await expect(page.getByRole("heading", { name: "Yannick Ratti" })).toBeVisible();
  await page.getByRole("textbox", { name: "Message", exact: true }).fill(texte);
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText(texte)).toBeVisible();
  await page.reload();
  await expect(page.getByText(texte)).toBeVisible();

  await connecter(page, "sophie.martin@hublify.app");
  await page.goto("/espace/messages");
  await expect(page.getByText(texte)).toHaveCount(0);
});

test("Je débute affiche le téléphone du profil, pas un numéro figé", async ({ page }) => {
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/outils/debuter");
  await expect(page.getByRole("heading", { name: "Je débute sur Hublify" })).toBeVisible();
  await expect(page.getByText("Téléphone à renseigner")).toBeVisible();
  await expect(page.getByText("+33 6 12 45 78 90")).toHaveCount(0);
});

test("l'inscription crée un espace qui reste ouvert après rechargement", async ({ page }) => {
  test.setTimeout(90_000);
  const email = `camille.${Date.now().toString(36)}@exemple.fr`;
  await page.goto("/inscription");
  await page.getByRole("textbox", { name: "Prénom", exact: true }).fill("Camille");
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Essai");
  await page.getByRole("textbox", { name: "Adresse e-mail" }).fill(email);
  await page.locator('input[name="password"]').fill("Hublify-essai-1");
  await page.locator('input[name="confirmation"]').fill("Hublify-essai-1");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).not.toHaveURL(/inscription/, { timeout: 20_000 });
  await page.reload();
  await expect(page).not.toHaveURL(/connexion/);
  await expect(page.getByRole("heading", { name: "Bonjour Camille" })).toBeVisible();
});
