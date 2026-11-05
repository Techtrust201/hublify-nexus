import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent");

async function connecter(page: Page) {
  const reponse = await page.request.post("/api/auth/sign-in/email", {
    data: { email: "contact@tech-trust.fr", password: MOT_DE_PASSE },
  });
  expect(reponse.ok()).toBeTruthy();
}

test("modèles, timeline, upsells et inventaire reprennent les libellés des frames", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page);

  await page.goto("/outils/modeles");
  await expect(page.getByRole("heading", { name: "Modèles de documents" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Archivés et triés par préférence.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Extraire le tableau" })).toBeVisible();
  await page.getByRole("button", { name: "Créer un nouveau document" }).click();
  await expect(page.getByRole("heading", { name: "Créer un nouveau modèle" })).toBeVisible();
  await expect(page.getByText("Importer document")).toBeVisible();
  await expect(page.getByText("Ajouter aux favoris")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/outils/timeline");
  await expect(page.getByRole("heading", { name: "Time line des événements" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByPlaceholder("Rechercher")).toBeVisible();
  await expect(page.getByText("Tri par TYPE")).toBeVisible();

  await page.goto("/outils/upsells");
  await expect(page.getByRole("heading", { name: "Upsells", exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Liste des Upsells et Ventes additionnels")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ajouter" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Télécharger le tableau" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "TARIF UNITAIRE" })).toBeVisible();

  await page.goto("/inventaire");
  await expect(
    page.getByRole("heading", { name: "Inventaire", exact: true }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.locator("#contenu-principal").getByText(
      "Tous les inventaires des consommables sont réunis ici",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Inventaire consommables 1" })).toBeVisible();
  await expect(page.getByText("Proposition commerciale — À VOIR PLUS TARD")).toBeVisible();
  await expect(page.getByText("Assigner un ou plusieurs lieu d'utilisation")).toBeVisible();

  await page.goto("/messagerie");
  await page.getByRole("button", { name: "Messages automatiques" }).click();
  await expect(page.getByRole("heading", { name: "Automatisation des messages" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("button", { name: "Créer un nouveau parcours" })).toBeVisible();
});
