import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const MARQUE = `LotF-${Date.now().toString(36)}`;
const DESIGNATION = `Savon ${MARQUE}`;

test.skip(
  !process.env["DATABASE_URL"] || !MOT_DE_PASSE,
  "DATABASE_URL et DEMO_AUTH_PASSWORD requis",
);

test.describe.configure({ mode: "serial", timeout: 90_000 });
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
  expect(statut, "connexion gestionnaire").toBeLessThan(400);
}

test.beforeEach(async ({ page }) => {
  await connecter(page);
});

test("inventaire : onglets, lieu assigné et prix persistent", async ({ page }) => {
  await page.goto("/inventaire");
  await expect(
    page.getByRole("heading", { name: "Inventaire", exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Inventaire consommables 1", pressed: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Inventaire consommables 2" }).click();
  await expect(
    page.getByRole("button", { name: "Inventaire consommables 2", pressed: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Linge de maison" }).click();
  await expect(page.getByRole("cell", { name: "Drap housse 160", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Inventaire consommables 1" }).click();
  await page.getByRole("button", { name: "Assigner un lieu" }).click();
  const choix = page.getByRole("dialog").getByRole("button").first();
  const nomLieu = (await choix.innerText()).trim();
  await choix.click();
  await expect(page.getByRole("button", { name: `Retirer ${nomLieu}` })).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.getByText("ne sont pas enregistrées sur le serveur")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: `Retirer ${nomLieu}` })).toBeVisible();
  await page.getByRole("button", { name: `Retirer ${nomLieu}` }).click();
  await expect(page.getByRole("button", { name: `Retirer ${nomLieu}` })).toHaveCount(0);

  await page.getByRole("button", { name: "Ajouter un élément" }).click();
  const dialogue = page.getByRole("dialog");
  await dialogue.getByLabel("Désignation").fill(DESIGNATION);
  await dialogue.getByLabel("Marque").fill(MARQUE);
  await dialogue.getByLabel("Type").fill("Savon");
  await dialogue.getByLabel("Prix unitaire (€)").fill("8,20");
  await dialogue.getByLabel("Lieu de stockage").fill("Cave");
  await dialogue.getByLabel("Quantité par occupant").fill("1");
  await dialogue.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Élément ajouté.")).toBeVisible();
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(page.getByRole("cell", { name: DESIGNATION, exact: true }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: MARQUE, exact: true }).first()).toBeVisible();
  await expect(page.getByText("État et prévision du stock")).toBeVisible();
  await expect(
    page.getByText(DESIGNATION).filter({ hasText: "par occupant" }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: `Supprimer ${DESIGNATION}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Retirer" }).click();
  await expect(page.getByText("Élément retiré.")).toBeVisible();
});

test("documents : chaque dossier du hub ouvre sa vue", async ({ page }) => {
  await page.goto("/documents");
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  await page
    .getByRole("button", { name: /Occupants logements/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "Dossier occupants logement" })).toBeVisible();
});

test("lieux : logements et immeubles sont visibles ensemble", async ({ page }) => {
  await page.goto("/patrimoines");
  await expect(page.getByRole("heading", { name: "Lieux" }).first()).toBeVisible();
  await expect(page.getByText("Lieux et logements")).toBeVisible();
  await expect(page.getByText("Immeubles").first()).toBeVisible();
  await page.getByRole("button", { name: "Filtres" }).click();
  await page.getByLabel("Statut").selectOption("libre");
  await expect(page.getByLabel("Statut")).toHaveValue("libre");
});

test("livret : aperçu mobile et logement assigné persistent", async ({ page }) => {
  await page.goto("/outils/livret");
  await expect(page.locator("[data-hydrated=oui]")).toBeVisible();
  const source = page.getByRole("row", { name: /Livret d'accueil standard/ }).first();
  await source.getByRole("button", { name: "Dupliquer" }).click();
  await expect(page.getByText("Modèle dupliqué.")).toBeVisible();
  const copie = page.getByRole("row", { name: /Livret d'accueil standard \(copie\)/ }).first();
  await copie.getByRole("button", { name: "Modifier" }).click();
  await page.getByRole("button", { name: "Mobile", pressed: false }).click();
  await expect(page.getByRole("button", { name: "Mobile", pressed: true })).toBeVisible();
  const logement = `Lot F ${Date.now().toString(36)}`;
  await page.getByLabel("Logement assigné").fill(logement);
  await expect(page.getByRole("status", { name: "Synchronisation des livrets" })).toHaveText(
    "Enregistré",
    { timeout: 15_000 },
  );
  await page.reload();
  await expect(page.locator("[data-hydrated=oui]")).toBeVisible();
  const rangee = page.getByRole("row", { name: new RegExp(logement) });
  await expect(rangee).toBeVisible();
  await rangee.getByRole("button", { name: "Retirer" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Retirer" }).click();
  await expect(page.getByText("Modèle retiré.")).toBeVisible();
});

test("états des lieux : ouvrir un dossier affiche l'aperçu par page", async ({ page }) => {
  await page.goto("/outils/etats-des-lieux");
  await expect(page.getByRole("heading", { name: "États des lieux" })).toBeVisible();
  await page
    .getByRole("button", { name: /pièces/ })
    .first()
    .click();
  await expect(page.getByText("affichage par page")).toBeVisible();
  await expect(page.getByText("Aperçu document")).toBeVisible();
});

test("pré-check-in, timeline, modèles et upsells répondent au clic", async ({ page }) => {
  await page.goto("/precheckin");
  await expect(
    page.getByRole("heading", { name: "Configuration Pré-checkin" }).first(),
  ).toBeVisible();

  await page.goto("/outils/timeline");
  await expect(page.getByRole("heading", { name: "Timeline des événements" })).toBeVisible();
  await page.getByRole("button", { name: "Aujourd'hui" }).click();
  await expect(page.getByRole("button", { name: "Aujourd'hui", pressed: true })).toBeVisible();

  await page.goto("/outils/modeles");
  await expect(page.getByRole("heading", { name: "Modèles de documents" }).first()).toBeVisible();

  await page.goto("/outils/upsells");
  await expect(page.getByRole("heading", { name: "Upsells" })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/outils/debuter");
  await expect(page.getByRole("heading", { name: /Je débute/ })).toBeVisible();
  await page.getByText("Comment ajouter mon premier logement ?").click();
  await expect(page.getByText("Ajouter un lieu ou logement")).toBeVisible();
});
