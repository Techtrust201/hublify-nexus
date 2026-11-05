import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(!process.env["DATABASE_URL"] || !MOT_DE_PASSE, "DATABASE_URL ou mot de passe démo absent");

async function debordement(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

async function connecter(page: Page, email: string) {
  await expect(async () => {
    await page.context().clearCookies();
    await page.goto("/connexion");
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled();
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.locator('input[name="password"]').fill(MOT_DE_PASSE);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).not.toHaveURL(/connexion/, { timeout: 8_000 });
  }).toPass({ timeout: 40_000 });
}

async function demarrerPortail(page: Page) {
  await expect(page.getByRole("heading", { name: /Bonjour|Ma Journée/ })).toBeVisible();
}

test.describe("pages publiques", () => {
  for (const viewport of [
    { nom: "390", width: 390, height: 844 },
    { nom: "360", width: 360, height: 740 },
  ]) {
    test(`parcours ${viewport.nom}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const pages = [
        ["/", /Tous vos biens/],
        ["/faq", /Questions fréquemment posées/],
        ["/cgv", /Conditions de vente/],
        ["/inscription", /Créer un compte/],
        ["/connexion", /Se connecter/],
        ["/mot-de-passe-oublie", /Mot de passe oublié/],
      ] as const;
      for (const [route, titre] of pages) {
        await page.goto(route);
        await expect(page.getByRole("heading", { name: titre }).first()).toBeVisible();
        expect(await debordement(page)).toBeLessThanOrEqual(1);
      }
      await page.goto("/cgv");
      await expect(page.getByText(/maquette|frame |Stripe/i)).toHaveCount(0);
      await expect(page.getByText("sans engagement", { exact: false })).toBeVisible();
      await page.goto("/");
      await expect(page.getByRole("link", { name: "Blog" })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Tarifs" }).first()).toBeVisible();
      await page.getByRole("link", { name: "Tarifs" }).first().click();
      await expect(page.locator("#tarifs")).toBeInViewport();
    });
  }

  test("ordinateur : pages publiques sans débordement", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const route of ["/", "/faq", "/cgv", "/inscription", "/connexion", "/mot-de-passe-oublie"]) {
      await page.goto(route);
      expect(await debordement(page)).toBeLessThanOrEqual(1);
    }
    await page.goto("/");
    await page.getByRole("link", { name: "Tarifs" }).first().click();
    await expect(page.locator("#tarifs")).toBeInViewport();
  });

  test("la liste bailleurs survit au rechargement", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const email = `liste.${Date.now().toString(36)}@exemple.test`;
    await page.goto("/");
    const inscrire = page.getByRole("button", { name: "S'inscrire à la liste" });
    await expect(inscrire).toBeEnabled();
    await page.locator("#liste-bailleurs").fill(email);
    await inscrire.click();
    await expect(page.getByText("Inscription enregistrée")).toBeVisible();
    await page.reload();
    const mails = await page.request.get(`/api/test/mails?destinataire=${encodeURIComponent(email)}`);
    expect(mails.ok()).toBeTruthy();
    const corps = (await mails.json()) as { mails: unknown[] };
    expect(corps.mails.length).toBeGreaterThan(0);
  });

  test("mot de passe oublié confirme l'envoi", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/mot-de-passe-oublie");
    await page.getByLabel("Adresse e-mail").fill("amelie.dubois@hublify.app");
    await page.getByRole("button", { name: "Envoyer le lien de réinitialisation" }).click();
    await expect(page.getByText(/Si le compte existe/)).toBeVisible();
  });
});

test.describe("portails", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("locataire : onglets, note, retour et déconnexion", async ({ page }) => {
    test.setTimeout(90_000);
    const note = `Note mobile ${Date.now().toString(36)}`;
    await connecter(page, "jean.martin@hublify.app");
    await page.goto("/espace");
    await demarrerPortail(page);
    await expect(page.getByRole("heading", { name: /Bonjour/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Let's Start" })).toHaveCount(0);
    await page.getByRole("link", { name: "Agenda" }).click();
    await expect(page.getByRole("heading", { name: "Calendrier" })).toBeVisible();
    expect(await debordement(page)).toBeLessThanOrEqual(1);
    await page.goBack();
    await expect(page).toHaveURL(/\/espace\/?$/);

    await page.getByRole("button", { name: "Ajouter" }).click();
    await page.getByRole("button", { name: "Ajouter une note dans le calendrier" }).click();
    await page.getByLabel("Note du calendrier").fill(note);
    await page.getByRole("button", { name: "Enregistrer la note" }).click();
    await expect(page.getByText(note)).toBeVisible();
    await page.reload();
    await expect(page.getByText(note)).toBeVisible();
    await page.getByRole("button", { name: "Supprimer" }).click();

    await page.goto("/espace/documents");
    await page.getByRole("button", { name: /Ma location/ }).click();
    await page.goBack();
    await expect(page).toHaveURL(/\/espace\/documents\/?$/);

    await page.goto("/espace");
    await page.getByRole("button", { name: "Mon profil" }).click();
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page.getByRole("heading", { name: "Se connecter" })).toBeVisible();
  });

  test("voyageur : pré-check-in conservé", async ({ page }) => {
    test.setTimeout(90_000);
    await connecter(page, "sophie.martin@hublify.app");
    await page.goto("/espace");
    await demarrerPortail(page);
    await page.getByRole("button", { name: "Ajouter" }).click();
    await page.getByRole("button", { name: "Préparer mon arrivée" }).click();
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByRole("heading", { name: "Formulaire de check-in" })).toBeVisible();
    const identite = page.getByLabel("Identité");
    const avant = await identite.inputValue();
    await identite.fill("Sophie Martin mobile");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByText("Pré-checkin envoyé")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Identité")).toHaveValue("Sophie Martin mobile");
    await page.getByLabel("Identité").fill(avant || "Sophie Martin");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByText("Pré-checkin envoyé")).toBeVisible();
  });

  test("propriétaire : espace utile, note et messages", async ({ page }) => {
    test.setTimeout(90_000);
    await connecter(page, "pierre.moreau@hublify.app");
    await page.goto("/espace");
    await expect(page.getByText("plus tard")).toHaveCount(0);
    await demarrerPortail(page);
    await expect(page.getByRole("heading", { name: /Bonjour/ })).toBeVisible();
    expect(await debordement(page)).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.getByRole("button", { name: "Voir les loyers" })).toBeVisible();
    await page.getByRole("button", { name: "Contacter le gestionnaire" }).click();
    await expect(page.getByRole("heading", { name: "Messagerie" })).toBeVisible();
  });

  test("prestataire : missions depuis le menu", async ({ page }) => {
    test.setTimeout(90_000);
    await connecter(page, "lucas.menage@hublify.app");
    await page.goto("/espace");
    await expect(page.getByRole("heading", { name: "Ma Journée" })).toBeVisible();
    await demarrerPortail(page);
    await page.getByRole("button", { name: "Ajouter" }).click();
    await page.getByRole("button", { name: "Rapport d'intervention" }).click();
    await expect(page).toHaveURL(/\/espace\/missions/);
    expect(await debordement(page)).toBeLessThanOrEqual(1);
  });
});

test.describe("gestionnaire mobile", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 360, height: 740 },
  ]) {
    test(`navigation et réservations ${viewport.width}`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize(viewport);
      await connecter(page, "amelie.dubois@hublify.app");
      await page.goto("/");
      await expect(async () => {
        await page.getByRole("button", { name: "Ouvrir la navigation" }).click();
        await expect(
          page.getByRole("dialog").getByRole("link", { name: "Patrimoine", exact: true }),
        ).toBeVisible({ timeout: 2_000 });
      }).toPass({ timeout: 20_000 });
      await page.getByRole("button", { name: "Fermer la navigation" }).click();
      await expect(page.getByRole("dialog")).toBeHidden();

      await page.getByRole("button", { name: "Notifications" }).click();
      await expect(page.getByText("Notifications").first()).toBeVisible();
      await page.keyboard.press("Escape");

      for (const route of ["/reservations", "/messagerie", "/analyse", "/documents"]) {
        await page.goto(route);
        await expect(page).toHaveURL(new RegExp(route));
        expect(await debordement(page)).toBeLessThanOrEqual(1);
      }

      await page.goto("/reservations");
      const fiche = page.getByRole("button", { name: /Sophie Martin|Jean Martin/ }).first();
      if (await fiche.isVisible().catch(() => false)) {
        await fiche.click();
        const dialogue = page.getByRole("dialog");
        if (await dialogue.isVisible().catch(() => false)) {
          await page.keyboard.press("Escape");
          await expect(dialogue).toBeHidden();
        }
      }
    });
  }
});
