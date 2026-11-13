import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { Pool } from "pg";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const MARQUE = "Pièce jointe parcours gestion c955";
const DOC = "diagnostic-c955.pdf";
const LIEU = "Atelier C955";
const COEQUIPIER = "coequipier.c955@hublify.test";
const RAISON = "SCI Atelier C955";
const CAPTURES = "/opt/cursor/artifacts/gestion";

async function connecter(page: Page, email: string) {
  await expect(async () => {
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.locator('input[name="password"]').fill(MOT_DE_PASSE);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).not.toHaveURL(/connexion/, { timeout: 8_000 });
  }).toPass({ timeout: 40_000 });
}

async function laisserEnregistrer(page: Page) {
  await page.waitForTimeout(1200);
  await expect(page.getByText("ne sont pas enregistrées sur le serveur")).toHaveCount(0);
}

test.describe.configure({ mode: "serial", timeout: 120_000 });

test.beforeAll(() => {
  test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent");
  test.skip(!MOT_DE_PASSE, "DEMO_AUTH_PASSWORD absent");
  mkdirSync(CAPTURES, { recursive: true });
});

test.afterAll(async () => {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) return;
  const pool = new Pool({ connectionString });
  try {
    await pool.query(
      `update public.conversations set extrait = 'Merci pour votre retour rapide.'
        where id = 'c-brian' and extrait = $1`,
      [MARQUE],
    );
    await pool.query(`delete from public.messages_fil where texte = $1`, [MARQUE]);
    await pool.query(
      `update public.parametrage set rappel_paiement_heures = '24' where rappel_paiement_heures = '36'`,
    );
    await pool.query(
      `update public.org_precheckin_extra set caution_montant = 0 where caution_montant = 275`,
    );
    await pool.query(`delete from public.documents where titre = $1`, [DOC]);
    await pool.query(`delete from public.biens where nom = $1`, [LIEU]);
    await pool.query(`delete from public.notifications where titre like 'Relance — %'`);
    const users = await pool.query(`select id from "user" where email = $1`, [COEQUIPIER]);
    for (const row of users.rows as { id: string }[]) {
      await pool.query(`delete from public.org_membres where user_id = $1::uuid`, [row.id]);
      await pool.query(`delete from public.profils where user_id = $1::uuid`, [row.id]);
      await pool.query(`delete from account where "userId" = $1::uuid`, [row.id]);
      await pool.query(`delete from "user" where id = $1::uuid`, [row.id]);
    }
    await pool.query(`update public.org_compte set raison_sociale = '' where raison_sociale = $1`, [
      RAISON,
    ]);
  } finally {
    await pool.end();
  }
});

test("captures desktop et mobile des écrans de gestion", async ({ page }) => {
  const erreurs: string[] = [];
  page.on("pageerror", (erreur) => erreurs.push(erreur.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page, "amelie.dubois@hublify.app");

  const ecrans = [
    ["/messagerie", "messagerie"],
    ["/documents", "documents"],
    ["/patrimoines", "patrimoine"],
    ["/parametrage", "parametres"],
    ["/profil", "compte"],
    ["/precheckin", "precheckin"],
    ["/analyse?onglet=gestionnaires", "gestionnaires"],
    ["/cgv", "cgv"],
  ] as const;

  for (const [route, nom] of ecrans) {
    await page.goto(route);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${CAPTURES}/desktop-${nom}.png`, fullPage: false });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, nom] of ecrans) {
    await page.goto(route);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${CAPTURES}/mobile-${nom}.png`, fullPage: false });
  }
  expect(erreurs, erreurs.join("\n")).toEqual([]);
});

test("messagerie : une pièce jointe survit au rechargement", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/messagerie");
  await expect(page.getByRole("button", { name: /Bruno Girard/ }).first()).toBeVisible({
    timeout: 20_000,
  });
  const [choix] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: "Joindre un fichier" }).click(),
  ]);
  await choix.setFiles({
    name: "sejour-c955.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(12_000, 0x61)]),
  });
  await expect(page.getByText("sejour-c955.pdf").first()).toBeVisible();
  await page.getByPlaceholder("Écrire un message…").fill(MARQUE);
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.getByText("Message envoyé.").first()).toBeVisible();
  await expect(page.getByText(MARQUE).first()).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await expect(page.getByText(MARQUE).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("sejour-c955.pdf").first()).toBeVisible();
});

test("documents : onglets résidents et import conservé", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/documents");
  await page
    .getByRole("button", { name: /Occupants logements/ })
    .first()
    .click();
  await expect(page.getByRole("tab", { name: "Locataires" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const visible = (texte: string) => page.locator("button:visible", { hasText: texte });
  await expect(visible("Bail meublé — Jean Martin").first()).toBeVisible();
  await expect(visible("Contrat séjour — Famille Bernard")).toHaveCount(0);
  await page.getByRole("tab", { name: "Voyageurs" }).click();
  await expect(visible("Contrat séjour — Famille Bernard").first()).toBeVisible();
  await expect(visible("Bail meublé — Jean Martin")).toHaveCount(0);
  await page.getByRole("tab", { name: "Prestataires" }).click();
  await expect(page.getByRole("heading", { name: "Prestataires" })).toBeVisible();

  await page.goto("/documents");
  await page
    .getByRole("button", { name: /Documents logements/ })
    .first()
    .click();
  const [choix] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: "Importer" }).click(),
  ]);
  await choix.setFiles({
    name: DOC,
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 diagnostic c955"),
  });
  await expect(page.getByText(/Document ajouté/).first()).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await expect(page.locator("button:visible", { hasText: DOC }).first()).toBeVisible({
    timeout: 20_000,
  });
});

test("paramètres, pré-check-in et compte restent en base", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/parametrage");
  const heures = page.getByLabel("Heures avant la réservation");
  await heures.fill("36");
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await expect(page.getByText("Modifications enregistrées.").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Conditions de vente" })).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await expect(page.getByLabel("Heures avant la réservation")).toHaveValue("36");

  await page.goto("/cgv");
  await expect(page.getByRole("heading", { name: "Conditions de vente" })).toBeVisible();
  await expect(page.getByText("sans engagement et non remboursable")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Durée et résiliation" })).toBeVisible();

  await page.goto("/precheckin");
  const montant = page.getByLabel("Montant (€)");
  await montant.fill("275");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("Pré-checkin enregistré.").first()).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Montant (€)")).toHaveValue("275");

  await page.goto("/profil");
  const raison = page.getByPlaceholder("Raison sociale de l'entreprise");
  await raison.fill(RAISON);
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText(/Profil enregistré|Profil vérifié/).first()).toBeVisible();
  await page.reload();
  await expect(page.getByPlaceholder("Raison sociale de l'entreprise")).toHaveValue(RAISON);
});

test("patrimoine : import CSV d'annonce puis rechargement", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/patrimoines");
  await expect(page.getByRole("heading", { name: "Lieux" }).first()).toBeVisible();
  const csv = `Nom;Type;Occupation;Adresse;Note\n${LIEU};Studio;Meublé;1 rue du Test, Lyon;4.2\n`;
  await page.locator('input[type="file"][accept*="csv"]').setInputFiles({
    name: "annonces.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(page.getByText(/annonce importée/i).first()).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await expect(page.locator("p:visible, button:visible", { hasText: LIEU }).first()).toBeVisible({
    timeout: 20_000,
  });
});

test("équipe : invitation et droits, tableau gestionnaires : relance", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await connecter(page, "contact@tech-trust.fr");
  await page.goto("/team");
  await page.getByRole("button", { name: "Inviter un membre" }).click();
  const dialogue = page.getByRole("dialog");
  await dialogue.getByRole("textbox", { name: "Prénom *" }).fill("Camille");
  await dialogue.getByRole("textbox", { name: "Nom", exact: true }).fill("C955");
  await dialogue.getByPlaceholder("email@exemple.com").fill(COEQUIPIER);
  await dialogue.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page.getByText(/Membre ajouté|Invitation envoyée/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Camille C955" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Camille C955" })).toBeVisible({
    timeout: 20_000,
  });
  await page.screenshot({ path: `${CAPTURES}/desktop-team.png` });

  await page.goto("/analyse?onglet=gestionnaires");
  await expect(page.getByRole("heading", { name: "Portefeuille en gestion" })).toBeVisible();
  await page.getByRole("button", { name: "Relancer" }).first().click();
  await expect(page.getByText("Relance enregistrée pour Pierre Moreau.").first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Portefeuille en gestion" })).toBeVisible();
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText("Relance — Pierre Moreau").first()).toBeVisible();
});
