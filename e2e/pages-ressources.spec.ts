import { expect, test } from "@playwright/test";

const PAGES = [
  ["/blog", "Notes de gestion", "Ce qu'une quittance de loyer doit contenir"],
  ["/guides", "Trois parcours, sans détour", "Ouvrir un espace sans carte bancaire"],
  ["/nouveautes", "Journal du 5 novembre 2026", "Connexion, inscription et mot de passe"],
] as const;

test("chaque ressource publique s'ouvre et se lit", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [route, titre, article] of PAGES) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: titre })).toBeVisible();
    await expect(page.getByRole("heading", { name: article })).toBeVisible();
    await expect(page.getByText(/lorem|ipsum/i)).toHaveCount(0);
  }

  await page.goto("/modeles");
  await expect(page.getByRole("heading", { name: "Les modèles déjà dans l'espace" })).toBeVisible();
  await expect(page.getByText("Modèle de quittance de loyer")).toBeVisible();
  await expect(page.getByText("Modèle de bail meublé")).toBeVisible();
  await expect(page.getByText("Modèle de facture standard")).toBeVisible();
  await page.getByRole("link", { name: "Se connecter pour les utiliser" }).click();
  await expect(page).toHaveURL(/\/connexion/);

  await page.goto("/");
  await expect(page.getByRole("link", { name: "LinkedIn" })).toHaveCount(0);
  await page.getByRole("link", { name: "Guides bailleurs" }).click();
  await expect(page).toHaveURL(/\/guides/);
  await page.goto("/");
  await page.getByRole("link", { name: "Modèles gratuits" }).click();
  await expect(page).toHaveURL(/\/modeles/);
  await page.goto("/");
  await page.getByRole("link", { name: "Nouveautés" }).click();
  await expect(page).toHaveURL(/\/nouveautes/);
  await page.getByRole("link", { name: "Espace gestionnaire" }).click();
  await expect(page.locator("#gestionnaire")).toBeInViewport();
});
