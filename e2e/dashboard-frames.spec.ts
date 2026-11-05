import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent");

async function connecter(page: Page) {
  const reponse = await page.request.post("/api/auth/sign-in/email", {
    data: { email: "contact@tech-trust.fr", password: MOT_DE_PASSE },
  });
  expect(reponse.ok()).toBeTruthy();
  await page.goto("/");
  await expect(page).toHaveTitle(/Vue générale/, { timeout: 20_000 });
}

test("vue générale et missions 3 jours / mois suivent le dashboard", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1577, height: 900 });
  await connecter(page);

  await expect(page.getByRole("link", { name: "Vue générale" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Patrimoine" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Se Former" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Bonjour/ })).toBeVisible();

  const creer = page.getByRole("button", { name: "Créer une Mission" });
  await expect(creer).toBeVisible();
  const boite = await creer.boundingBox();
  expect(boite).not.toBeNull();
  expect(Math.round(boite!.width)).toBe(200);
  expect(Math.round(boite!.height)).toBe(38);

  const rayon = await page.getByRole("link", { name: "Je débute" }).evaluate((el) => {
    return getComputedStyle(el).borderRadius;
  });
  expect(rayon).toBe("10px");

  await page.screenshot({
    path: "test-results/frame-vue-generale-1577.png",
    fullPage: false,
  });

  await page.getByRole("link", { name: "Réservations", exact: true }).click();
  await expect(page).toHaveURL(/\/reservations/);
  await page.goto("/");

  await creer.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/missions");
  await expect(page.getByRole("tab", { name: "Missions" })).toBeVisible();
  await page.getByRole("button", { name: "Mois", exact: true }).click();
  await expect(page.getByText("lun", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/frame-missions-mois-1577.png", fullPage: false });
  await page.getByRole("button", { name: "3 jours", exact: true }).click();
  await expect(page.getByRole("button", { name: "Créer une Mission" })).toBeVisible();
  await page.screenshot({ path: "test-results/frame-missions-3j-1577.png", fullPage: false });
});
