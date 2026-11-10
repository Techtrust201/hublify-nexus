import { expect, test, type Page } from "@playwright/test";
import { Pool } from "pg";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const TITRE = "Contrôle pilotage e2e";

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent");

async function connecter(page: Page) {
  const reponse = await page.request.post("/api/auth/sign-in/email", {
    data: { email: "contact@tech-trust.fr", password: MOT_DE_PASSE },
  });
  expect(reponse.ok(), "connexion gestionnaire").toBeTruthy();
}

async function nettoyer() {
  const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
  try {
    await pool.query(`delete from public.missions where titre = $1`, [TITRE]);
    await pool.query(
      `delete from public.notifications where titre in ('Demande de paiement', 'Relance de paiement', 'Paiement prestataire') and detail ilike $1`,
      [`%${TITRE}%`],
    );
    await pool.query(`delete from public.messages_dash where texte ilike $1`, [`%${TITRE}%`]);
  } finally {
    await pool.end();
  }
}

test.afterAll(async () => {
  await nettoyer();
});

test("le pilotage enregistre prestation, blocage, relance et facture prestataire", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const erreurs: string[] = [];
  page.on("pageerror", (erreur) => erreurs.push(String(erreur)));
  page.on("console", (message) => {
    if (message.type() === "error") erreurs.push(message.text());
  });
  await nettoyer();

  await connecter(page);
  await page.goto("/");
  await expect(page).toHaveTitle(/Vue générale/, { timeout: 20_000 });

  await page.getByRole("button", { name: "Créer une Mission" }).click();
  const dialogue = page.getByRole("dialog");
  await expect(dialogue.getByRole("heading", { name: "Ajouter une prestation" })).toBeVisible();
  await dialogue.getByLabel("Logement").selectOption({ label: "Appartement Colette" });
  await dialogue.getByLabel("Date de début").fill("2026-03-05");
  await dialogue.getByLabel("Date de fin").fill("2026-03-05");
  await dialogue.getByLabel("Titre").fill(TITRE);
  await dialogue.getByLabel("Attribuée à").selectOption("proprietaire");
  await dialogue.getByLabel("Tarif facturé (€)").fill("60");
  const sejours = dialogue.getByLabel("Associée à la réservation").locator("option");
  const nb = await sejours.count();
  for (let i = 0; i < nb; i += 1) {
    const valeur = await sejours.nth(i).getAttribute("value");
    if (valeur) {
      await dialogue.getByLabel("Associée à la réservation").selectOption(valeur);
      break;
    }
  }
  await dialogue.getByRole("button", { name: "Créer la prestation" }).click();
  await expect(dialogue).toBeHidden({ timeout: 15_000 });

  await page.goto("/analyse?onglet=revenus");
  await expect(page.getByRole("heading", { name: "Paiements en attente" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("heading", { name: "Facturation prestataires" })).toBeVisible();
  const ligne = page.getByRole("row", { name: new RegExp(TITRE) });
  await expect(ligne).toBeVisible({ timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(TITRE) })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("row", { name: new RegExp(TITRE) }).getByRole("button", { name: "Payer" }).click();
  await expect(page.getByText("Facture prestataire soldée.")).toBeVisible({ timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole("row", { name: new RegExp(TITRE) }).getByText("Payé")).toBeVisible({
    timeout: 20_000,
  });

  const relancer = page.getByRole("button", { name: "Relancer" }).first();
  await expect(relancer).toBeVisible();
  await relancer.click();
  await expect(page.getByText("Relance enregistrée.")).toBeVisible({ timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Paiements en attente" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(async () => {
    await page.getByRole("button", { name: "Notifications" }).click();
    await expect(page.getByText("Relance de paiement").first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await page.keyboard.press("Escape");

  await page.goto("/");
  await page.getByLabel("Mois").selectOption("2");
  await page.getByLabel("Année").selectOption("2026");
  await page.getByRole("button", { name: "Précédent" }).click();
  await page.getByRole("button", { name: "Précédent" }).click();
  await page.getByRole("button", { name: /Non assigné/ }).first().click();
  const demande = page.getByRole("button", { name: /Demander un paiement|Demande envoyée/ });
  await expect(demande).toBeVisible({ timeout: 15_000 });
  await demande.click();
  await expect(page.getByRole("button", { name: /Demande envoyée le/ })).toBeVisible();
  await page.reload();
  await page.getByLabel("Mois").selectOption("2");
  await page.getByLabel("Année").selectOption("2026");
  await page.getByRole("button", { name: "Précédent" }).click();
  await page.getByRole("button", { name: "Précédent" }).click();
  await page.getByRole("button", { name: /Non assigné/ }).first().click();
  await expect(page.getByRole("button", { name: /Demande envoyée le/ })).toBeVisible({
    timeout: 15_000,
  });

  await page.goto("/");
  const ajout = page.getByRole("button", { name: /Ajouter une prestation — Studio Raclette/ }).first();
  await ajout.click();
  const choix = page.getByRole("heading", { name: "Que souhaitez-vous faire à cette date ?" });
  await expect(choix).toBeVisible();
  const bloquer = page.getByRole("button", { name: "Bloquer cette date" });
  if (await bloquer.isVisible()) {
    await bloquer.click();
  } else {
    await page.getByRole("button", { name: "Retirer le blocage" }).click();
    await page.getByRole("button", { name: /Ajouter une prestation — Studio Raclette/ }).first().click();
    await page.getByRole("button", { name: "Bloquer cette date" }).click();
  }
  await expect(page.getByText("Date bloquée.")).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(900);
  await page.reload();
  await expect(page.getByText("Bloqué", { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Ajouter une prestation — Studio Raclette/ }).first().click();
  await page.getByRole("button", { name: "Retirer le blocage" }).click();
  await expect(page.getByText("Date rouverte.")).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(900);
  await page.reload();
  await expect(page.getByText("Bloqué", { exact: true })).toHaveCount(0);

  await page.goto("/reservations");
  await expect(page.getByRole("heading", { name: "Réservations" })).toBeVisible();
  await page.getByRole("button", { name: "Annulé" }).click();
  await expect(page.getByText(/Affichage de \d+ réservation/)).toBeVisible();

  await page.goto("/tarifs");
  await expect(page.getByRole("tab", { name: "Tarifs" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "5 jours", exact: true }).click();
  await page.getByRole("button", { name: "Mois", exact: true }).click();
  await expect(page.getByText(/Tarifs affichés/)).toBeVisible();

  expect(erreurs.filter((e) => !e.includes("favicon")), erreurs.join("\n")).toEqual([]);
});
