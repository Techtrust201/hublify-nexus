import { expect, test } from "@playwright/test";

test("landing 1440 : pied de page et hero du frame HD", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "essayer gratuitement", exact: true })).toBeVisible();
  await expect(page.getByText("petites agences.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Nous écrire" })).toBeVisible();

  await expect(page.getByRole("link", { name: "LinkedIn" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Instagram" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "YouTube" })).toHaveCount(0);
  await page.getByRole("link", { name: "Sécurité" }).click();
  await expect(page).toHaveURL(/\/confidentialite/);
  await page.goto("/");
  await page.getByRole("link", { name: "Nous rejoindre" }).click();
  await expect(page).toHaveURL(/\/choix-du-profil/);
  await page.goto("/");
  await page.getByRole("link", { name: "Partenaires" }).click();
  await expect(page).toHaveURL(/\/parrainage/);
  await page.goto("/");
  await page.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/faq/);
  await page.goto("/");
  await page.getByRole("link", { name: "Statut des services" }).click();
  await expect(page.locator("#statut-services")).toBeVisible();
});

test("auth HD : marque Hublify, 10 caractères, pas de Google", async ({ page }) => {
  await page.setViewportSize({ width: 920, height: 1024 });
  await page.goto("/connexion");
  await expect(page.getByText("espace Hublify")).toBeVisible();
  await expect(page.getByText("© 2026 Hublify")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuer avec Google" })).toHaveCount(0);
  await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
  await expect(page.getByRole("link", { name: "aide@hublify.app" })).toBeVisible();
  await page.goto("/inscription");
  await expect(page.getByText("10 caractères")).toBeVisible();
  await expect(page.getByRole("button", { name: "S'inscrire avec Google" })).toHaveCount(0);
});
