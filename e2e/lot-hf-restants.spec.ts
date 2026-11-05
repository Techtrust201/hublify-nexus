import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(!process.env["DATABASE_URL"] || !MOT_DE_PASSE, "DATABASE_URL et DEMO_AUTH_PASSWORD requis");

test.describe.configure({ timeout: 120_000 });
test.use({ viewport: { width: 1440, height: 900 } });

async function connecter(page: Page, email: string) {
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
  expect(statut, `connexion ${email}`).toBeLessThan(400);
}

test("team mate : message, profil et droits d'accès", async ({ page }) => {
  await connecter(page, "contact@tech-trust.fr");
  await page.goto("/team");
  await expect(page.getByRole("button", { name: "Inviter un membre" })).toBeVisible();

  const nom = page.getByRole("button", { name: "Amélie Dubois" });
  await nom.click();
  await expect(page.getByText("Détails du profil")).toBeVisible();
  await expect(page.getByText(/listing droits d'accès/i)).toBeVisible();
  await expect(page.getByText("Actions en cours").first()).toBeVisible();

  await page.getByRole("button", { name: "Envoyer un message" }).first().click();
  const zone = page.getByPlaceholder(/Écrire un message/);
  await zone.fill("Bonjour depuis le cadre Team Mate.");
  await expect(page.getByText("34/500")).toBeVisible();
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page).toHaveURL(/\/messagerie/);

  await page.goto("/team");
  await page.getByRole("button", { name: "Modifier les droits" }).first().click();
  await expect(page.getByRole("heading", { name: "Droits d'accès", exact: true })).toBeVisible();
  await expect(page.getByText("Voir les réservations").first()).toBeVisible();
  await expect(page.getByText("Gérer l'équipe").first()).toBeVisible();
  await page.getByRole("button", { name: "Personnalisé" }).click();
  await expect(page.getByRole("heading", { name: "Droits d'accès aux biens et événements" })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByText(/ajouté aux accès/i)).toBeVisible();
});

test("patrimoine : liste des biens et fiche CONFIG", async ({ page }) => {
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/patrimoines");
  await expect(page.getByRole("columnheader", { name: "Logement", exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Notation" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Statut" }).first()).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Documents" })).toBeVisible();
  await expect(page.getByText("Bientôt disponible")).toHaveCount(0);
  const debord = await page.locator("table").first().evaluate((table) => {
    const scroller = table.parentElement;
    const entetes = [...table.querySelectorAll("th")].map((th) => th.getBoundingClientRect());
    const horsCadre = entetes.some((r) => r.right > window.innerWidth + 1 || r.left < 0);
    return !scroller || scroller.scrollWidth > scroller.clientWidth + 1 || horsCadre;
  });
  expect(debord).toBe(false);
  const documents = await page.getByRole("columnheader", { name: "Documents" }).boundingBox();
  expect((documents?.x ?? 0) + (documents?.width ?? 0)).toBeLessThanOrEqual(1440);

  await page.getByRole("button", { name: "Ajouter un lieu ou logement" }).click();
  const dialogue = page.getByRole("dialog");
  await expect(dialogue.getByText("Lieu ou Logement")).toBeVisible();
  await expect(dialogue.getByText("Surface totale (m²)")).toBeVisible();
  await expect(dialogue.getByText("Nombre d'étages")).toBeVisible();
  await expect(dialogue.getByText("Places de parking")).toBeVisible();
  await expect(dialogue.getByText("Nombre d'ascenseurs")).toBeVisible();
  await expect(dialogue.getByText("Type de chauffage")).toBeVisible();
  await dialogue.getByLabel("Nom du lieu / logement").fill(`Atelier HF ${Date.now()}`);
  await dialogue.getByRole("button", { name: "Photos & Médias" }).click();
  await dialogue.getByRole("button", { name: "Ajouter une photo" }).click();
  await expect(dialogue.getByLabel(/Nom de Photo/)).toBeVisible();
  await dialogue.getByRole("button", { name: "Charges Immeubles" }).click();
  await expect(dialogue.getByText("Charges", { exact: true })).toBeVisible();
  await dialogue.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(/ajouté au parc/)).toBeVisible();
});

test("paramétrage notifications, check-in et documents obligatoires", async ({ page }) => {
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/parametrage");
  await expect(page.getByText("Préférences de notifications")).toBeVisible();
  await expect(page.getByText("Nouvelles notifications et alertes")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Signature" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Paiements" })).toBeVisible();
  await page.getByLabel("Relance automatique d'appel de loyer — jours après l'échéance").fill("5");
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await expect(page.getByText("Modifications enregistrées.").first()).toBeVisible();

  await page.getByRole("button", { name: "Formulaires" }).click();
  await expect(page.getByText("Documents à fournir obligatoires")).toBeVisible();
  await expect(page.getByText("Exiger le téléchargement du identifiant légal")).toBeVisible();
  await expect(page.getByText("Paramétrage check-in / check-out")).toBeVisible();
  await expect(page.getByText("Heure de check-in")).toBeVisible();
  await page.getByRole("switch", { name: "Signature du voyageur" }).click();
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await expect(page.getByText("Modifications enregistrées.").first()).toBeVisible();
});

test("profil gestionnaire, je débute et vue missions 3 jours", async ({ page }) => {
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/profil");
  await expect(page.getByRole("heading", { name: "Votre profil gestionnaire" })).toBeVisible();
  await expect(page.getByText("ajouter Carte d'identité")).toBeVisible();
  await expect(page.getByText("Informations de l'entreprise")).toBeVisible();
  await expect(page.getByText(/market place/i)).toBeVisible();
  await expect(page.getByText("Mes autorisations tierces")).toBeVisible();
  await expect(page.getByText("ajouter votre rib")).toBeVisible();

  await page.goto("/outils/debuter");
  await page.getByRole("link", { name: "Inventaire du logement" }).click();
  await expect(page).toHaveURL(/\/inventaire/);
  await expect(page.getByRole("heading", { name: "Inventaire", exact: true }).first()).toBeVisible();

  await page.goto("/outils/debuter");
  await expect(page.getByText("Je reçois une proposition de bail de la part des gestionnaires")).toBeVisible();
  await page.getByRole("link", { name: "Je recherche une prestation" }).last().click();
  await expect(page).toHaveURL(/\/prestataires/);

  await page.goto("/");
  await page.getByRole("button", { name: "3 jours", exact: true }).click();
  await expect(page.getByText("Les Loyers Payés Cette Semaine")).toBeVisible();
  await expect(page.getByText(/paiements totaux/i)).toBeVisible();
  await expect(page.getByText("Événements en cours")).toBeVisible();
});
