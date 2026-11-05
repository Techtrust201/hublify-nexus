import { expect, test } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("la connexion ne propose pas Google et la FAQ est publiée", async ({ page }) => {
  await page.goto("/connexion");
  await expect(page.getByRole("heading", { name: "Se connecter" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuer avec Google" })).toHaveCount(0);

  await page.goto("/faq");
  const question = page.getByRole("button", {
    name: "Hublify remplace-t-il mon expert-comptable ?",
  });
  await expect(async () => {
    if ((await question.getAttribute("aria-expanded")) !== "true") await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "true");
  }).toPass();
  await expect(page.getByText("pas encore publiée")).toHaveCount(0);
  await expect(page.getByText(/ne tient pas la comptabilité légale/)).toBeVisible();
});

test("un téléversement de pièce reste visible après rechargement", async ({ page }) => {
  test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent : ./scripts/demo-local.sh");
  test.setTimeout(90_000);

  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill("contact@tech-trust.fr");
  await page.locator('input[name="password"]').fill(MOT_DE_PASSE);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveTitle(/Vue générale/, { timeout: 20_000 });

  const festival = page.locator("li", { hasText: "Festival de Jazz de Paris" });
  const mois = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(new Date());
  await expect(festival).toContainText(mois);
  await expect(festival).not.toContainText("27 avril");

  const carte = page.getByRole("link", { name: /Paiements en retard/ });
  await expect(carte).toHaveAttribute("href", "/analyse");

  await page.goto("/profil");
  await expect(page.getByRole("heading", { name: "Votre profil gestionnaire" })).toBeVisible({
    timeout: 20_000,
  });
  const recto = page.locator('input[type="file"][accept="image/*,.pdf"]').first();
  await recto.setInputFiles({
    name: "cni-recto.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(page.getByText("cni-recto.png")).toBeVisible({ timeout: 20_000 });

  await page.reload();
  await expect(page.getByText("cni-recto.png")).toBeVisible({ timeout: 20_000 });
});
