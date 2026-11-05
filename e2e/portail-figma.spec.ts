import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const CAPTURES = "/opt/cursor/artifacts/portail";

test.skip(!process.env["DATABASE_URL"] || !MOT_DE_PASSE, "DATABASE_URL ou mot de passe démo absent");

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

test.describe("portail maquette", () => {
  test.beforeAll(() => {
    mkdirSync(CAPTURES, { recursive: true });
  });

  test("onboarding seulement avant connexion", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.context().clearCookies();
    await page.goto("/espace");
    await expect(page.locator("[data-portail-pret='1']")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Management & gestion" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Bonjour|Ma Journée/ })).toHaveCount(0);
    await page.screenshot({ path: `${CAPTURES}/apres-onboarding-390.png` });
    const mode = page.getByRole("switch", { name: "Mode Prestataire" });
    await mode.click();
    await expect(mode).toHaveAttribute("aria-checked", "true");
    await page.getByRole("button", { name: "Partager l'accès" }).click();
    await page.getByRole("button", { name: "Let's Start" }).click();
    await expect(page.getByRole("heading", { name: "Se connecter" })).toBeVisible();
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/espace");
    await expect(page.locator("[data-portail-pret='1']")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Management & gestion" })).toBeVisible();
    await page.screenshot({ path: `${CAPTURES}/apres-onboarding-360x740.png` });
  });

  for (const viewport of [
    { nom: "390x844", width: 390, height: 844 },
    { nom: "360x740", width: 360, height: 740 },
  ]) {
    test(`locataire ${viewport.nom} : accueil, clics et captures`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await connecter(page, "jean.martin@hublify.app");
      await page.goto("/espace");
      await expect(page.locator("[data-portail-pret='1']")).toBeVisible();
      await expect(page.getByRole("heading", { name: /Bonjour/ })).toBeVisible();
      await expect(page.getByRole("button", { name: "Let's Start" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Résident" })).toHaveCount(0);
      await page.screenshot({ path: `${CAPTURES}/apres-accueil-locataire-${viewport.nom}.png` });

      const tache = page.locator("main ul button").first();
      await expect(tache).toBeVisible();
      await tache.click();
      await expect(page).not.toHaveURL(/\/espace\/?$/);
      await page.goBack();

      await page.getByRole("button", { name: /Tâches en cours/ }).click();
      await expect(page.getByRole("heading", { name: "Toutes les tâches en cours" })).toBeVisible();
      await page.getByRole("button", { name: "Retour" }).click();

      await page.getByRole("button", { name: "Notifications" }).click();
      await expect(page.getByText("Notifications").first()).toBeVisible();
      await page.getByRole("button", { name: "Fermer les notifications" }).click();

      await page.getByRole("link", { name: "Agenda" }).click();
      await expect(page.getByRole("heading", { name: "Calendrier" })).toBeVisible();
      await page.getByRole("button", { name: "Aujourd'hui" }).click();
      await page.screenshot({ path: `${CAPTURES}/apres-calendrier-${viewport.nom}.png` });
      await page.getByRole("button", { name: "Mois suivant" }).click();
      await page.getByRole("button", { name: "Mois précédent" }).click();

      await page.getByRole("link", { name: "Documents" }).click();
      await expect(page.getByRole("heading", { name: "Vos Documents" })).toBeVisible();
      await page.screenshot({ path: `${CAPTURES}/apres-documents-${viewport.nom}.png` });
      await page.getByRole("button", { name: /Ma location/ }).click();
      await expect(page.getByRole("heading", { name: "Mon logement" })).toBeVisible();
      await page.getByRole("button", { name: "Retour" }).click();
      await page.getByRole("button", { name: /Quittances/ }).click();
      await page.getByRole("button", { name: "Retour" }).click();
      await page.getByRole("button", { name: /État des lieux/ }).click();
      await page.getByRole("button", { name: "Retour" }).click();
      await page.getByRole("button", { name: "Information à propos du propriétaire" }).click();
      await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();

      await page.goto("/espace/messages");
      await expect(page.getByRole("heading", { name: "Messagerie" })).toBeVisible();
      await page.getByRole("tab", { name: "Prospects" }).click();
      await page.getByRole("tab", { name: "Tous" }).click();
      await page.screenshot({ path: `${CAPTURES}/apres-messages-${viewport.nom}.png` });
      await page.getByRole("button", { name: "Nouveau contact" }).click();
      await expect(page.getByRole("heading", { name: "Nouveau contact" })).toBeVisible();

      await page.goto("/espace/logement");
      await expect(page.getByRole("heading", { name: "Mon logement" })).toBeVisible();
      await page.screenshot({ path: `${CAPTURES}/apres-logement-${viewport.nom}.png` });
      await page.getByRole("button", { name: "J'ai un problème dans mon logement" }).click();
      await expect(page.getByLabel("Rechercher dans la FAQ")).toBeVisible();

      await page.goto("/espace/precheckin");
      await page.getByRole("button", { name: "Continuer" }).click();
      await expect(page.getByRole("heading", { name: "Formulaire de check-in" })).toBeVisible();
      await page.screenshot({ path: `${CAPTURES}/apres-precheckin-${viewport.nom}.png` });

      await page.goto("/espace/dossier");
      await expect(page.getByRole("heading", { name: /Martin|Jean/ })).toBeVisible();
      await page.screenshot({ path: `${CAPTURES}/apres-profil-${viewport.nom}.png` });

      await page.goto("/espace/missions");
      await expect(page.getByRole("heading", { name: "Toutes les tâches en cours" })).toBeVisible();
      await page.screenshot({ path: `${CAPTURES}/apres-taches-${viewport.nom}.png` });

      await page.goto("/espace");
      await expect(page.locator("[data-portail-pret='1']")).toBeVisible();
      await page.getByRole("button", { name: "Ajouter" }).click();
      await expect(page.getByRole("button", { name: "Rechercher une location" })).toBeVisible();
      await page.getByRole("button", { name: "Fermer" }).click();
    });
  }

  test("prestataire : Ma Journée et missions", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await connecter(page, "lucas.menage@hublify.app");
    await page.goto("/espace");
    await expect(page.locator("[data-portail-pret='1']")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ma Journée" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Bonjour/ })).toHaveCount(0);
    await page.screenshot({ path: `${CAPTURES}/apres-journee-prestataire-390.png` });
    const jour = page.locator("main button[aria-pressed]").first();
    await jour.click();
    await page.getByRole("button", { name: "Ajouter" }).click();
    await page.getByRole("button", { name: "Rapport d'intervention" }).click();
    await expect(page).toHaveURL(/\/espace\/missions/);
    await expect(page.getByRole("heading", { name: "Toutes les tâches en cours" })).toBeVisible();
    await page.screenshot({ path: `${CAPTURES}/apres-missions-prestataire-390.png` });
  });

  test("voyageur : candidature", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await connecter(page, "sophie.martin@hublify.app");
    await page.goto("/espace");
    await expect(page.getByRole("heading", { name: /Bonjour/ })).toBeVisible();
    await page.goto("/espace/candidature");
    await expect(page.getByRole("heading", { name: "Proposer ma candidature" })).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
    await page.screenshot({ path: `${CAPTURES}/apres-candidature-390.png` });
  });
});
