import { expect, test, type Browser, type ConsoleMessage } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(
  !process.env["DATABASE_URL"],
  "DATABASE_URL absent : docker compose up -d && npm run db:prepare",
);

const COMPTES = [
  { email: "amelie.dubois@hublify.app", role: "gestionnaire" },
  { email: "claire.lecture@hublify.app", role: "lecture" },
] as const;

async function ouvrirBaux(browser: Browser, email: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const erreurs: string[] = [];
  const noter = (texte: string) => {
    if (/Download the React DevTools/i.test(texte)) return;
    erreurs.push(texte);
  };
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") noter(msg.text());
  });
  page.on("pageerror", (err) => noter(err.message));

  let statut = 0;
  for (let essai = 0; essai < 4; essai += 1) {
    const reponse = await page.request.post("/api/auth/sign-in/email", {
      data: { email, password: MOT_DE_PASSE },
    });
    statut = reponse.status();
    if (reponse.ok()) break;
    if (statut !== 429) break;
    await page.waitForTimeout(20_000);
  }
  expect(statut, `connexion refusée pour ${email} (${statut})`).toBeLessThan(400);

  await page.goto("/outils/baux");
  await expect(page.getByRole("heading", { name: /^Bail / })).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(() => erreurs, { timeout: 3_000, message: `${email} : erreur console` })
    .toEqual([]);
  await context.close();
}

test("aucune erreur console sur /outils/baux", async ({ browser }) => {
  test.setTimeout(120_000);
  for (const compte of COMPTES) {
    await ouvrirBaux(browser, compte.email);
  }
});
