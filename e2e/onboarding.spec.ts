import { expect, test } from "@playwright/test";

test.skip(
  !process.env["DATABASE_URL"],
  "DATABASE_URL absent : docker compose up -d && npm run db:prepare",
);

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "Hublify-Demo-2026!";

test("une inscription crée un org vide, sans parc Redris", async ({ page }) => {
  test.setTimeout(90_000);
  const suffixe = Date.now().toString(36);
  const email = `adherent.${suffixe}@exemple.test`;

  await page.goto("/inscription");
  await page.locator('input[name="prenom"]').fill("Nina");
  await page.locator('input[name="nom"]').fill("Martin");
  await page.locator('input[name="nomOrg"]').fill(`Org ${suffixe}`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("Hublify-Adherent-2026!");
  await page.getByRole("button", { name: "Créer mon espace" }).click();

  await expect(page).toHaveURL((u) => u.pathname === "/", { timeout: 20_000 });
  await expect(page.getByText("Suzette")).toHaveCount(0);
  await expect(page.getByText("Sophie Martin")).toHaveCount(0);
});

test("l'invitation n'expose pas le mot de passe et envoie un mail capturé", async ({ page }) => {
  test.setTimeout(90_000);
  const suffixe = Date.now().toString(36);
  const email = `invitee.${suffixe}@exemple.test`;

  const connexion = await page.request.post("/api/auth/sign-in/email", {
    data: { email: "contact@tech-trust.fr", password: MOT_DE_PASSE },
  });
  expect(connexion.ok()).toBeTruthy();
  await page.goto("/team");
  await expect(page.getByRole("heading", { name: "Team Mate" }).first()).toBeVisible({
    timeout: 15_000,
  });

  await expect(async () => {
    await page.getByRole("button", { name: "Inviter un membre" }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 30_000 });
  const dialogue = page.getByRole("dialog");
  await dialogue.getByPlaceholder("Prénom").fill("Inès");
  await dialogue.getByPlaceholder("email@exemple.com").fill(email);
  await dialogue.getByRole("button", { name: "Envoyer l'invitation" }).click();

  await expect(page.getByText(/Mot de passe temporaire/)).toHaveCount(0);
  await expect(page.getByText(/Invitation envoyée/)).toBeVisible({ timeout: 15_000 });

  const mails = await page.request.get(`/api/test/mails?destinataire=${encodeURIComponent(email)}`);
  expect(mails.ok()).toBeTruthy();
  const corps = (await mails.json()) as { mails: Array<{ html: string; sujet: string }> };
  expect(corps.mails.length).toBeGreaterThan(0);
  expect(corps.mails[0]?.html ?? "").toMatch(/Hublify-/);
  expect(JSON.stringify(corps)).not.toContain("motDePasseTemporaire");
});
