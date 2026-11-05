import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(!process.env["DATABASE_URL"] || !MOT_DE_PASSE, "DATABASE_URL ou mot de passe démo absent");

test.describe.configure({ timeout: 90_000 });

async function connecter(page: Page) {
  let statut = 0;
  for (let essai = 0; essai < 4; essai += 1) {
    const reponse = await page.request.post("/api/auth/sign-in/email", {
      data: { email: "amelie.dubois@hublify.app", password: MOT_DE_PASSE },
    });
    statut = reponse.status();
    if (reponse.ok()) return;
    if (statut !== 429) break;
    await page.waitForTimeout(8_000);
  }
  expect(statut, "connexion gestionnaire").toBeLessThan(400);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page);
});

test("vue annuelle : une case ouvre le détail du jour", async ({ page }) => {
  await page.goto("/outils/vue-annuelle");
  await page.getByRole("button", { name: "1 Janvier 2026", exact: true }).click();
  await expect(page.getByRole("region", { name: "Détail du jour" })).toContainText(
    "Détail du 2026-01-01",
  );
});

test("je débute : étapes, logements et prestataires se sélectionnent", async ({ page }) => {
  await page.goto("/outils/debuter");
  await page.getByRole("button", { name: /La réservation/ }).click();
  await expect(page.getByRole("button", { name: /La réservation/, pressed: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Créer la réservation" })).toBeVisible();

  await page.getByRole("button", { name: /Le logement/ }).click();
  const logement = page.getByRole("button", { name: /Colette/ });
  await logement.click();
  await expect(logement).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /La mission/ }).click();
  const prestataire = page.getByRole("button", { name: /Karim Benali/ });
  await prestataire.click();
  await expect(prestataire).toHaveAttribute("aria-pressed", "true");
});

test("réservations : tri Propriété, Arrivée et pagination", async ({ page }) => {
  await page.goto("/reservations");
  const tri = page.getByRole("group", { name: "Tri" });
  const statut = page.getByRole("status").filter({ hasText: /Page \d+ sur/ });
  await expect(statut).toContainText("Sans tri");
  await tri.getByRole("button", { name: "Propriété" }).click();
  await expect(statut).toContainText("Tri Propriété croissant");
  await tri.getByRole("button", { name: "Arrivée" }).click();
  await expect(statut).toContainText("Tri Arrivée croissant");

  const avant = await page.locator("tbody tr").first().innerText();
  await page.getByRole("navigation", { name: "Pagination" }).getByRole("button", { name: "Page 2" }).click();
  await expect(statut).toContainText("Page 2 sur");
  await expect(page.locator("tbody tr").first()).not.toHaveText(avant);
});

test("documents : cartes Prestataires et Gestion des accès", async ({ page }) => {
  await page.goto("/documents");
  await page.getByRole("button", { name: /^Prestataires/ }).click();
  await expect(page.getByRole("heading", { name: "Prestataires" })).toBeVisible();
  await expect(page).toHaveURL(/onglet=prestataires/);

  await page.goto("/documents");
  await page.getByRole("button", { name: /^Gestion des accès/ }).click();
  await expect(page.getByRole("heading", { name: "Gestion des accès" })).toBeVisible();
  await expect(page).toHaveURL(/vue=fiches/);
});

test("lieux : exporter en CSV", async ({ page }) => {
  await page.goto("/patrimoines");
  const telechargement = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter en CSV" }).click();
  expect((await telechargement).suggestedFilename()).toContain(".csv");
});

test("analyse : le tableau de bord revient au premier écran", async ({ page }) => {
  await page.goto("/analyse?vue=analyse-2");
  await expect(page.getByRole("tab", { name: "Analyse 2", selected: true })).toBeVisible();
  await page.getByRole("tab", { name: "Tableau de bord" }).click();
  await expect(page.getByRole("tab", { name: "Tableau de bord", selected: true })).toBeVisible();
  await expect(page.getByText("Taux d'occupation")).toBeVisible();
  await expect(page).not.toHaveURL(/vue=analyse/);
});

test("modèles : Aperçu ouvre le document", async ({ page }) => {
  await page.goto("/outils/modeles");
  await page.getByRole("button", { name: /^Aperçu / }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Modèle contrat mandant");
});

test("inventaire : consommables et Modifier", async ({ page }) => {
  await page.goto("/inventaire");
  await page.getByRole("button", { name: "Inventaire consommables 2" }).click();
  await expect(
    page.getByRole("button", { name: "Inventaire consommables 2", pressed: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Inventaire consommables 2" })).toBeVisible();
  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Modifier l'élément" })).toBeVisible();
});

test("baux : le filtre Type de bail réduit la liste", async ({ page }) => {
  await page.goto("/outils/baux");
  const liste = page.getByRole("region", { name: "Baux enregistrés" });
  await expect(liste.getByRole("status")).not.toHaveText("0 bail");
  await liste.getByRole("button", { name: "Bail meublé" }).click();
  await expect(liste.getByRole("button", { name: "Bail meublé" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(liste.getByRole("status")).toContainText("Bail meublé");
  const lignes = await liste.getByRole("listitem").allInnerTexts();
  expect(lignes.every((l) => /Bail meublé|Aucun bail/.test(l))).toBeTruthy();
});

test("prestataires : Toutes les catégories réaffiche tout le monde", async ({ page }) => {
  await page.goto("/prestataires");
  await page.getByRole("button", { name: "Ménage" }).click();
  await expect(page.getByRole("status")).toContainText("Ménage");
  await expect(page.getByText("Karim Benali")).toHaveCount(0);
  await page.getByRole("button", { name: "Toutes les catégories" }).click();
  await expect(page.getByRole("button", { name: "Toutes les catégories" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("status")).toContainText("toutes les catégories");
  await expect(page.getByText("Karim Benali")).toBeVisible();
});

test("vue générale : la carte Interventions filtre le planning", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Interventions/ }).click();
  await expect(page.getByRole("button", { name: "Taches" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status").filter({ hasText: "Interventions affichées" })).toBeVisible();
});
