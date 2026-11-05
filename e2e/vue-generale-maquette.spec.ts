import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent");

async function connecter(page: Page) {
  const reponse = await page.request.post("/api/auth/sign-in/email", {
    data: { email: "contact@tech-trust.fr", password: MOT_DE_PASSE },
  });
  expect(reponse.ok(), "connexion gestionnaire").toBeTruthy();
  await page.goto("/");
  await expect(page).toHaveTitle(/Vue générale/, { timeout: 20_000 });
}

test("la vue générale reprend la maquette et chaque lien répond", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page);

  await expect(page.getByText("Hublify", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Vue générale" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Bonjour/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Paiements en retard/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Check-in \/ Check-out/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Interventions/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Missions" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Créer une Mission" })).toBeVisible();

  await page.screenshot({
    path: "test-results/vue-generale-1440.png",
    fullPage: true,
  });

  const liens = [
    ["/reservations", "Réservations"],
    ["/documents", "Documents"],
    ["/patrimoines", "Patrimoine"],
    ["/messagerie", "Messagerie"],
    ["/analyse", "Analyse"],
    ["/formations/se-former", "Se Former"],
    ["/formations/utiliser", "Utiliser hublify"],
    ["/assistance", "Contact 24/24h"],
    ["/parrainage", "Parrainage"],
    ["/outils/debuter", "Je débute"],
    ["/outils", "Je découvre"],
    ["/team", "Team mate"],
  ] as const;

  for (const [url, nom] of liens) {
    await page.goto("/");
    await page.getByRole("link", { name: nom, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(url.replaceAll("/", "\\/")), { timeout: 15_000 });
  }

  await page.goto("/");
  await expect(async () => {
    await page.getByRole("button", { name: "Outils" }).click();
    await expect(page.getByRole("menuitem", { name: "Prestataires" })).toBeVisible({
      timeout: 2_000,
    });
  }).toPass({ timeout: 15_000 });
  await page.keyboard.press("Escape");

  await expect(async () => {
    await page.getByRole("button", { name: "Notifications" }).click();
    await expect(page.getByText("Notifications").first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Compte gestionnaire" }).click();
  await expect(page.getByRole("menuitem", { name: "Se déconnecter" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Check-in \/ Check-out/ }).click();
  await expect(page.getByRole("button", { name: "CheckIn" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Créer une Mission" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");

  const mission = page.locator("#planning button").filter({ hasText: /Ménage|Check-in|Prestation/ }).first();
  if (await mission.isVisible().catch(() => false)) {
    await mission.click();
    await expect(page.getByText("En détails")).toBeVisible();
    await expect(page.getByRole("button", { name: /Prestation/ })).toBeVisible();
  }

  await page.getByRole("button", { name: "Occupants" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/vue-generale-390.png", fullPage: true });
  const debordement = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(debordement).toBeLessThanOrEqual(1);
});
