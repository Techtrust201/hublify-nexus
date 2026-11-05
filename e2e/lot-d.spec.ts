import { expect, test, type Page } from "@playwright/test";
import { Pool } from "pg";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const MARQUE = "Marqueur lot D e2e";

async function connecter(page: Page) {
  await expect(async () => {
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill("amelie.dubois@hublify.app");
    await page.locator('input[name="password"]').fill(MOT_DE_PASSE);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).not.toHaveURL(/connexion/, { timeout: 8_000 });
  }).toPass({ timeout: 40_000 });
}

async function laisserEnregistrer(page: Page) {
  await page.waitForTimeout(1500);
  await expect(page.getByText("ne sont pas enregistrées sur le serveur")).toHaveCount(0);
}

test.describe.configure({ mode: "serial", timeout: 90_000 });

test.beforeAll(() => {
  test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent");
  test.skip(!MOT_DE_PASSE, "DEMO_AUTH_PASSWORD absent");
});

test.afterAll(async () => {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) return;
  const pool = new Pool({ connectionString });
  try {
    await pool.query(`delete from public.messages_fil where texte ilike $1`, [`%${MARQUE}%`]);
    await pool.query(
      `update public.conversations set extrait = 'Merci pour votre retour rapide.'
        where id = 'c-brian' and extrait ilike $1`,
      [`%${MARQUE}%`],
    );
  } finally {
    await pool.end();
  }
});

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page);
});

test("analyse : onglets, filtres et chiffres", async ({ page }) => {
  await page.goto("/analyse");
  await expect(page.getByRole("heading", { name: "Analyse, Revenus & Paiements" })).toBeVisible();
  await expect(page.getByText("Taux d'occupation")).toBeVisible();
  await page.screenshot({ path: "test-results/lot-d-analyse.png", fullPage: false });
  const taux = page.getByText("Taux d'occupation").locator("xpath=following-sibling::p[1]");
  await expect(taux).toBeVisible();
  await page.getByRole("tab", { name: "Revenus et paiements" }).click();
  await expect(page.getByText("Loyers attendus")).toBeVisible();
  await expect(page).toHaveURL(/onglet=revenus/);

  await page.getByRole("tab", { name: "Gestionnaires" }).click();
  await expect(page.getByRole("heading", { name: "Portefeuille en gestion" })).toBeVisible();

  await page.getByRole("tab", { name: "Tableau de bord" }).click();
  await page.getByRole("tab", { name: "Occupation" }).click();
  const annee = ((await taux.textContent()) ?? "").trim();
  await page.getByLabel("Début").fill("2026-06-01");
  await page.getByLabel("Fin").fill("2026-06-15");
  await expect(page).toHaveURL(/debut=2026-06-01/);
  await expect(page).toHaveURL(/fin=2026-06-15/);
  await expect(taux).not.toHaveText(annee);
  expect(annee).toMatch(/%/);

  const logements = page.getByLabel("Logements");
  const options = logements.locator("option");
  const nb = await options.count();
  if (nb > 1) {
    await logements.selectOption({ index: 1 });
    await expect(page).toHaveURL(/logement=/);
  }

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter" }).click();
  expect((await download).suggestedFilename()).toContain("encaissements");

  await page.getByRole("tab", { name: "Analyse 2" }).click();
  await expect(page.getByRole("tab", { name: "Revenus & Paiements" })).toBeVisible();
  await page.getByRole("tab", { name: "Analyse 3" }).click();
  await expect(page.getByText(/Historique|transaction/i).first()).toBeVisible();
});

test("messagerie : sélection, filtres, bulles et envoi persistant", async ({ page }) => {
  await page.goto("/messagerie");
  await expect(page).toHaveURL(/conv=/, { timeout: 15_000 });
  const liste = page.locator("aside").filter({ has: page.getByPlaceholder("Rechercher…") });
  // Les prénoms de la maquette (Brian Griffin, Lentil…) sont des remplissages :
  // le corpus affiché est le corpus français déjà corrigé.
  const bruno = liste.getByRole("button", { name: /Bruno Girard/ });
  await expect(bruno).toBeVisible();
  await expect(bruno).toHaveAttribute("aria-current", "true");
  await expect(page.getByText(/quittance de loyer/i).first()).toBeVisible({ timeout: 15_000 });
  const bulle = page.getByText(/Merci pour votre message/).first();
  await expect(bulle).toBeVisible();
  await expect(bulle).toHaveCSS("background-color", "rgb(30, 41, 57)");

  await page.getByPlaceholder("Rechercher…").fill("Linge");
  const linge = liste.getByRole("button", { name: /Linge & Entretien/ });
  await expect(linge).toBeVisible();
  await expect(bruno).toHaveCount(0);
  await linge.click();
  await expect(page.getByText("Bonjour, intervention planifiée pour demain matin 9h.")).toBeVisible();

  const prestataires = page.getByRole("button", { name: "Mes prestataires" });
  await prestataires.click();
  await expect(prestataires).toHaveAttribute("aria-expanded", "false");
  await prestataires.click();
  await expect(prestataires).toHaveAttribute("aria-expanded", "true");

  await page.getByPlaceholder("Rechercher…").fill("");
  await liste.getByRole("button", { name: /Bruno Girard/ }).click();
  await page.getByPlaceholder("Écrire un message…").fill(MARQUE);
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.getByText(MARQUE).first()).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await expect(page.getByText(MARQUE).first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Écrire" }).click();
  await expect(page.getByRole("heading", { name: "Nouveau message" })).toBeVisible();
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByRole("heading", { name: "Nouveau message" })).toHaveCount(0);

  await page.getByRole("button", { name: "Documents" }).click();
  await expect(page.getByText(/Documents liés/)).toBeVisible();
  await page.getByRole("button", { name: "Catégorie" }).click();
  await expect(page.getByText("Mes prospections").last()).toBeVisible();
  await page.getByRole("button", { name: "Assigner" }).click();
  await expect(page.getByRole("button", { name: /Team Louisette|Émilie Moreau/ }).first()).toBeVisible();

  await page.screenshot({ path: "test-results/lot-d-messagerie.png", fullPage: false });
});

test("tarifs : vues, cellule et ensembles", async ({ page }) => {
  await page.goto("/tarifs");
  await expect(page.getByRole("button", { name: "3 jours" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByPlaceholder("Rechercher par prestataire ou appartement…")).toBeVisible();

  await page.getByRole("button", { name: "5 jours" }).click();
  await expect(page.getByRole("button", { name: "5 jours" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Mois" }).click();
  await expect(page.getByRole("button", { name: "Mois" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "3 jours" }).click();

  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("button", { name: "Précédent" }).click();

  const cellule = page.getByRole("button", { name: /Suzette le / }).first();
  await expect(cellule).toBeVisible();
  await cellule.click();
  await expect(page.getByRole("heading", { name: "Créer une règle de tarification" })).toBeVisible();
  await page.getByRole("button", { name: "Annuler" }).click();

  await page.getByRole("button", { name: "Gérer les ensembles de règles" }).click();
  await expect(page.getByText(/ensemble/i).first()).toBeVisible();
  await page.keyboard.press("Escape");

  const bascule = page.getByRole("button", { name: /Désactiver Politique week-ends|Activer Politique week-ends/ });
  if (await bascule.count()) {
    const avant = (await bascule.first().getAttribute("aria-label")) ?? "";
    await bascule.first().click();
    await laisserEnregistrer(page);
    await expect(bascule.first()).not.toHaveAttribute("aria-label", avant);
    await bascule.first().click();
    await laisserEnregistrer(page);
  }

  await page.getByPlaceholder("Rechercher par prestataire ou appartement…").fill("Suzette");
  await expect(page.getByRole("button", { name: /Suzette le / }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Raclette le / })).toHaveCount(0);

  await page.screenshot({ path: "test-results/lot-d-tarifs.png", fullPage: false });
});
