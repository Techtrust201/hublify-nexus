import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

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

test("le hub documents place l'alerte avant la recherche", async ({ page }) => {
  await page.goto("/documents");
  const alerte = page.getByText(/documents obligatoires/i).first();
  const recherche = page.getByPlaceholder("Rechercher un document, un logement, un locataire…");
  await expect(alerte).toBeVisible();
  await expect(recherche).toBeVisible();
  const yAlerte = (await alerte.boundingBox())?.y ?? 0;
  const yRecherche = (await recherche.boundingBox())?.y ?? 0;
  expect(yAlerte).toBeLessThan(yRecherche);
});

test("la fiche lieu expose la grille du frame HD", async ({ page }) => {
  await page.goto("/patrimoines");
  await page
    .getByRole("button", { name: /^Configurer / })
    .first()
    .click();
  const dialogue = page.getByRole("dialog");
  await expect(dialogue.getByText("Lieu ou logement")).toBeVisible();
  await expect(dialogue.getByRole("button", { name: "Informations", pressed: true })).toBeVisible();
  for (const libelle of [
    "Surface totale (m²)",
    "Nombre d'étages",
    "ascenseur Y/N",
    "Numéro d'enregistrement mairie, en cas de location touristique. Obligatoire",
    "numero DPE. Optionnel",
    "Paramétrage des tarifs",
    "Nom du Wifi",
    "Code du Wifi",
    "Composition du logement",
  ]) {
    await expect(dialogue.getByText(libelle).first()).toBeVisible();
  }
  await dialogue.getByRole("button", { name: "Immeuble" }).click();
  await expect(dialogue.getByRole("button", { name: "Immeuble", pressed: true })).toBeVisible();
});

test("le profil locataire calcule le résumé et enregistre un envoi", async ({ page }) => {
  await page.goto("/dossiers/o1");
  await expect(page.getByRole("heading", { name: /^Profil / }).first()).toBeVisible();
  await expect(page.getByText("Contact supplémentaire et Garants")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Historique de location" })).toBeVisible();
  await expect(page.getByText("Total payé")).toBeVisible();
  await page.getByRole("button", { name: "Analyse du dossier" }).click();
  await expect(
    page.getByText(/Taux d'effort \d|Revenus ou loyer manquants pour calculer/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Envoyer un document" }).click();
  await expect(page.getByText("Document enregistré. Le message est prêt à partir.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ouvrir le message" })).toBeVisible();
  await page.getByRole("button", { name: "Générer un rapport financier" }).click();
  await expect(
    page.getByText("Rapport financier généré à partir des paiements du dossier."),
  ).toBeVisible();
});

test("le bail affiche l'en-tête, la date et les trois rubriques", async ({ page }) => {
  await page.goto("/outils/etats-des-lieux");
  await page
    .getByRole("button", { name: /pièces/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: /^Bail / })).toBeVisible();
  await expect(page.getByText(/Date de rédaction/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Type de Bail" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Soussignés" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Loyer et charges" })).toBeVisible();
  await page.getByRole("button", { name: "Soussignés" }).click();
  const champ = page.getByLabel("Soussignés");
  const avant = await champ.inputValue();
  await champ.fill(`${avant} HD`);
  await expect(page.getByRole("heading", { name: new RegExp(`${avant} HD`) })).toBeVisible();
});
