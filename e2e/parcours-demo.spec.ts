import { expect, test, type Page } from "@playwright/test";
import { purgerComptesDeTest, purgerParcoursDemo } from "./nettoyage";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const OCCUPANT = "Voyageur Parcours Démo";
const PRESTATAIRE = "Léa Parcours Démo";
const NOTE = "Note parcours démo";
const NOTE_MAJ = "Note parcours démo modifiée";
const INVENTAIRE = "Serviette parcours démo";
const INVENTAIRE_MAJ = "Serviette parcours démo modifiée";
const MESSAGE = "Message parcours démo";
const MEMBRE = "Parcours";

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
  await page.waitForTimeout(1500);
  await expect(page.getByText("ne sont pas enregistrées sur le serveur")).toHaveCount(0);
}

test.describe.configure({ mode: "serial", timeout: 90_000 });

test.beforeAll(() => {
  test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent");
  test.skip(!MOT_DE_PASSE, "DEMO_AUTH_PASSWORD absent");
});

test.afterAll(async () => {
  await purgerParcoursDemo();
  await purgerComptesDeTest();
});

test("gestionnaire : réservation, filtre, édition, suppression", async ({ page }) => {
  await connecter(page, "contact@tech-trust.fr");
  await page.goto("/reservations/nouveau");
  await page.getByRole("button", { name: "Sélectionner le type" }).click();
  await page.getByRole("button", { name: "Location saisonnière" }).click();
  await page
    .locator('select:has(option:text("Sélectionner le logement"))')
    .selectOption({ index: 1 });
  await page.getByPlaceholder("Nom de l'occupant 1").fill(OCCUPANT);
  await page.getByPlaceholder("prenom.nom@email.fr").fill("voyageur.parcours@exemple.test");
  await page.getByPlaceholder("+33 6 12 34 56 78").fill("0600000000");
  await page.locator('input[type="date"]').nth(0).fill("2028-06-01");
  await page.locator('input[type="date"]').nth(1).fill("2028-06-05");
  await page.getByRole("button", { name: "Créer une réservation" }).click();
  await expect(page.getByText("Réservation créée.")).toBeVisible();
  await laisserEnregistrer(page);

  await page.reload();
  await expect(page.getByText(OCCUPANT).first()).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder("Rechercher par occupant ou logement…").fill(OCCUPANT);
  await expect(page.getByText(/Affichage de 1 réservation/)).toBeVisible();

  const modifier = page.getByRole("link", { name: "Modifier" });
  if (!(await modifier.isVisible())) {
    await page.getByRole("button", { name: new RegExp(OCCUPANT) }).click();
  }
  await modifier.click();
  await expect(page).toHaveTitle(/Modifier une réservation/);
  const tel = page.getByPlaceholder("+33 6 12 34 56 78");
  await expect(tel).toHaveValue("0600000000");
  await tel.fill("0611111111");
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await expect(page.getByText("Réservation mise à jour.")).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await page.getByPlaceholder("Rechercher par occupant ou logement…").fill(OCCUPANT);
  await page.getByRole("button", { name: new RegExp(OCCUPANT) }).click();
  await expect(page.getByText("0611111111")).toBeVisible();

  await page.getByRole("button", { name: "Supprimer" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText("Réservation supprimée.")).toBeVisible();
  await expect(page.getByRole("button", { name: new RegExp(OCCUPANT) })).toHaveCount(0);
  await laisserEnregistrer(page);
  await page.goto("/reservations");
  await page.getByPlaceholder("Rechercher par occupant ou logement…").fill(OCCUPANT);
  await expect(page.getByRole("button", { name: new RegExp(OCCUPANT) })).toHaveCount(0);
  await page.getByRole("button", { name: "Annulé" }).click();
  await expect(page.getByRole("button", { name: new RegExp(OCCUPANT) })).toBeVisible();
});

test("gestionnaire : prestataire, filtre, édition, suppression", async ({ page }) => {
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/prestataires/nouveau");
  await expect(page.getByRole("heading", { name: "Ajouter un prestataire" })).toBeVisible();
  const enregistrer = page.locator('button[data-pret="1"]', {
    hasText: "Enregistrer le prestataire",
  });
  await enregistrer.waitFor();
  await page.locator("#nom").fill(PRESTATAIRE);
  await page.locator("#email").fill("lea.parcours@exemple.test");
  await page.locator("#telephone").fill("0493000000");
  await page.locator("#ville").fill("Cannes");
  await enregistrer.click();
  await expect(page).toHaveURL(/\/prestataires\/p-/);
  await laisserEnregistrer(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: PRESTATAIRE })).toBeVisible({ timeout: 15_000 });

  await page.goto("/prestataires");
  await expect(page.getByRole("heading", { name: "Prestataires" })).toBeVisible();
  await page.getByLabel("Rechercher un prestataire").fill("Parcours Démo");
  await expect(page.getByRole("link", { name: new RegExp(PRESTATAIRE) })).toBeVisible();
  await page.getByRole("button", { name: "Ménage" }).click();
  await expect(page.getByRole("link", { name: new RegExp(PRESTATAIRE) })).toBeVisible();
  await page.reload();
  await page.getByLabel("Rechercher un prestataire").fill(PRESTATAIRE);
  await page.getByRole("link", { name: new RegExp(PRESTATAIRE) }).click();

  await page.getByLabel("Ville").fill("Nice");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Prestataire mis à jour.")).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await expect(page.getByLabel("Ville")).toHaveValue("Nice");

  await page.getByRole("button", { name: "Supprimer" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText("Prestataire supprimé.")).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await page.getByLabel("Rechercher un prestataire").fill(PRESTATAIRE);
  await expect(page.getByRole("link", { name: new RegExp(PRESTATAIRE) })).toHaveCount(0);
});

test("gestionnaire : inventaire, filtre, édition, suppression", async ({ page }) => {
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/inventaire");
  await page.getByRole("button", { name: "Ajouter item" }).click();
  await page.getByRole("dialog").getByLabel("Désignation").fill(INVENTAIRE);
  await page.getByRole("dialog").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Élément ajouté.")).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await page.getByPlaceholder("Rechercher par code ou désignation...").fill(INVENTAIRE);
  await expect(page.getByRole("cell", { name: INVENTAIRE, exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Modifier ${INVENTAIRE}` }).click();
  await page.getByRole("dialog").getByLabel("Désignation").fill(INVENTAIRE_MAJ);
  await page.getByRole("dialog").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Élément mis à jour.")).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await page.getByPlaceholder("Rechercher par code ou désignation...").fill("parcours démo");
  await expect(page.getByRole("cell", { name: INVENTAIRE_MAJ, exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Supprimer ${INVENTAIRE_MAJ}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Retirer" }).click();
  await expect(page.getByText("Élément retiré.")).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await page.getByPlaceholder("Rechercher par code ou désignation...").fill("parcours démo");
  await expect(page.getByText(INVENTAIRE_MAJ)).toHaveCount(0);
});

test("gestionnaire : documents filtre et messagerie", async ({ page }) => {
  await connecter(page, "amelie.dubois@hublify.app");
  await page.goto("/documents");
  const rechercheDocs = page.getByPlaceholder("Rechercher un document, un logement, un locataire…");
  await rechercheDocs.fill("zzzz-aucun-document");
  await expect(page.getByText(/Aucun document ne correspond/)).toBeVisible();
  await rechercheDocs.fill("");

  await page.goto("/messagerie");
  await page.getByRole("button", { name: "Écrire" }).click();
  await page.getByPlaceholder("Destinataire…").fill("Contact Parcours Démo");
  await page.getByPlaceholder("Rédigez votre message…").fill(MESSAGE);
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText("Conversation créée.")).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await page.getByPlaceholder("Rechercher…").fill("Parcours Démo");
  await expect(page.getByText("Contact Parcours Démo").first()).toBeVisible();
  await page.getByText("Contact Parcours Démo").first().click();
  await expect(page.getByText(MESSAGE).first()).toBeVisible();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText("Conversation supprimée.")).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await page.getByPlaceholder("Rechercher…").fill("Parcours Démo");
  await expect(page.getByText("Contact Parcours Démo")).toHaveCount(0);
});

test("gestionnaire : équipe, filtre et invitation", async ({ page }) => {
  await connecter(page, "contact@tech-trust.fr");
  await page.goto("/team");
  await page.getByPlaceholder("Rechercher un membre…").fill("Amélie");
  await expect(page.getByText("Amélie").first()).toBeVisible();
  await page.getByPlaceholder("Rechercher un membre…").fill("personne-absente-xyz");
  await expect(page.getByText(/Aucun membre/)).toBeVisible();
  await page.getByPlaceholder("Rechercher un membre…").fill("");

  await page.getByRole("button", { name: "Inviter un membre" }).click();
  await page.getByPlaceholder("Prénom", { exact: true }).fill(MEMBRE);
  await page.getByPlaceholder("Nom", { exact: true }).fill("Démo");
  await page.getByPlaceholder("email@exemple.com").fill("parcours.equipe@exemple.test");
  await page.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page.getByText(/Membre ajouté|Invitation envoyée|Invitation créée/)).toBeVisible({
    timeout: 20_000,
  });
  await laisserEnregistrer(page);
  await page.goto("/team");
  await page.getByPlaceholder("Rechercher un membre…").fill("parcours.equipe@exemple.test");
  await expect(page.getByText("Parcours").first()).toBeVisible();
  await page.getByRole("button", { name: "Supprimer le membre" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  await laisserEnregistrer(page);
  await page.reload();
  await page.getByPlaceholder("Rechercher un membre…").fill("parcours.equipe@exemple.test");
  await expect(page.getByText("Aucun membre ne correspond")).toBeVisible();
});

test("portail locataire : accueil, note, recherche, rendez-vous, paiement, message", async ({
  page,
}) => {
  await connecter(page, "jean.martin@hublify.app");
  await page.goto("/espace");
  const journee = page.getByRole("heading", { name: /Bonjour/ });
  await expect(journee).toBeVisible();

  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("button", { name: "Ajouter une note dans le calendrier" }).click();
  await page.getByLabel("Note du calendrier").fill(NOTE);
  await page.getByRole("button", { name: "Enregistrer la note" }).click();
  await expect(page.getByText("Note ajoutée au calendrier.")).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await expect(page.getByText(NOTE)).toBeVisible();

  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Note du calendrier").fill(NOTE_MAJ);
  await page.getByRole("button", { name: "Enregistrer la modification" }).click();
  await laisserEnregistrer(page);
  await page.reload();
  await expect(page.getByText(NOTE_MAJ)).toBeVisible();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await laisserEnregistrer(page);
  await page.reload();
  await expect(page.getByText(NOTE_MAJ)).toHaveCount(0);

  await page.goto("/espace");
  await expect(page.getByRole("heading", { name: /Bonjour/ })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("button", { name: "Rechercher une location" }).click();
  await expect(page.getByRole("button", { name: "Saisonnier" })).toBeVisible();
  await page.getByRole("button", { name: "Bail" }).click();
  await page.getByRole("button", { name: "Rechercher" }).click();
  await expect(page.getByText(/offres pour votre période/)).toBeVisible();

  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("button", { name: "J'ai un problème dans mon logement" }).click();
  await page.getByLabel("Rechercher dans la FAQ").fill("électricité");
  await expect(page.getByText("Panne d'électricité")).toBeVisible();

  await page.goto("/espace/logement#rdv");
  await page.locator('input[type="date"]').fill("2028-04-12");
  await page.locator('input[type="time"]').fill("11:30");
  await page.getByRole("button", { name: "Je fixe un rendez-vous" }).click();
  await expect(page.getByText(/Rendez-vous/)).toBeVisible();
  await laisserEnregistrer(page);
  await page.reload();
  await expect(page.locator('input[type="date"]')).toHaveValue("2028-04-12");

  await page.goto("/espace/documents#paiement");
  await page.getByRole("button", { name: "Confirmer la simulation" }).click();
  await expect(page.getByText(/Simulation confirmée/)).toBeVisible();
  const reference = await page.getByText(/HUB-SIM-/).textContent();
  await laisserEnregistrer(page);
  await page.goto("/espace/documents#historique");
  await expect(
    page.getByText(reference?.replace("Simulation confirmée · ", "") ?? "HUB-SIM-"),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText(/HUB-SIM-/).first()).toBeVisible();

  await page.goto("/espace/messages");
  await page.getByRole("button", { name: "Nouveau contact" }).click();
  await page.getByLabel("E-mail du contact").fill("gestion.parcours@exemple.test");
  await page.getByRole("button", { name: "Préparer le contact" }).click();
  await expect(page.getByText(/Lien directionnel/)).toBeVisible();
  await laisserEnregistrer(page);
  await page.goto("/espace/messages");
  await expect(page.getByText("gestion.parcours@exemple.test").first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("gestion.parcours@exemple.test").first()).toBeVisible();
});

test("portail prestataire : mission et rapport", async ({ page }) => {
  await connecter(page, "lucas.menage@hublify.app");
  await page.goto("/espace");
  await expect(page.getByRole("heading", { name: "Ma Journée" })).toBeVisible();
  await page.goto("/espace/missions");
  const rapport = page.getByPlaceholder("Rapport d'intervention");
  const jours = page.getByRole("group", { name: "Jours" }).getByRole("button");
  const nombre = await jours.count();
  let indexMission = -1;
  for (let i = 0; i < nombre && (await rapport.count()) === 0; i++) {
    await jours.nth(i).click();
    if ((await rapport.count()) > 0) indexMission = i;
  }
  if ((await rapport.count()) > 0) {
    await rapport.first().fill("Rapport parcours démo");
    await page.getByRole("button", { name: "Enregistrer le rapport" }).first().click();
    await expect(page.getByText("Rapport enregistré.")).toBeVisible();
    await laisserEnregistrer(page);
    await page.reload();
    if (indexMission >= 0) {
      await page.getByRole("group", { name: "Jours" }).getByRole("button").nth(indexMission).click();
    }
    await expect(page.getByText("Rapport parcours démo")).toBeVisible();
  } else {
    await expect(page.getByText("Aucune mission ce jour.")).toBeVisible();
  }
});
