import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(
  !process.env["DATABASE_URL"],
  "DATABASE_URL absent : docker compose up -d && npm run db:prepare",
);

test.use({ viewport: { width: 1440, height: 900 } });

async function connecter(page: Page) {
  let statut = 0;
  for (let essai = 0; essai < 4; essai += 1) {
    const reponse = await page.request.post("/api/auth/sign-in/email", {
      data: { email: "amelie.dubois@hublify.app", password: MOT_DE_PASSE },
    });
    statut = reponse.status();
    if (reponse.ok()) break;
    if (statut !== 429) break;
    await page.waitForTimeout(20_000);
  }
  expect(statut, "connexion gestionnaire refusée").toBeLessThan(400);
}

test("la vue par défaut de /reservations est le tableau de la maquette", async ({ page }) => {
  test.setTimeout(60_000);
  await connecter(page);
  await page.goto("/reservations");
  await expect(page).toHaveURL(/\/reservations\/?$/);
  await expect(page.getByRole("heading", { name: "Réservations" })).toBeVisible();
  await expect(page.getByText("Gérer toutes vos réservations en un endroit")).toBeVisible();

  const tableau = page.getByRole("table");
  await expect(tableau).toBeVisible();
  for (const colonne of ["Statut", "Propriété", "Occupant", "Arrivée", "TYPE", "Montant"]) {
    await expect(tableau.getByRole("columnheader", { name: colonne })).toBeVisible();
  }

  await expect(page.getByRole("button", { name: "En cours" })).toBeVisible();
  await expect(page.getByRole("button", { name: "À venir" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Départs" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Passés" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tout", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmé" })).toBeVisible();
  await expect(page.getByRole("button", { name: "En attente" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Annulé" })).toBeVisible();

  await expect(page.getByText(/Affichage de \d+ réservation/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Précédent" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Suivant" })).toBeVisible();

  await expect(tableau.getByRole("row").nth(1)).toBeVisible();
});
