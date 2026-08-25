import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "Hublify-Demo-2026!";

// Toute cette suite exige des comptes réels : sans base, elle est ignorée
// explicitement plutôt que de rendre la CI rouge pour une raison d'environnement.
test.skip(
  !process.env["DATABASE_URL"],
  "DATABASE_URL absent : docker compose up -d && npm run db:prepare",
);

const COMPTES = {
  admin: "contact@tech-trust.fr",
  gestionnaire: "amelie.dubois@hublify.app",
  prestataire: "lucas.menage@hublify.app",
  lecteur: "claire.lecture@hublify.app",
} as const;

/**
 * Connexion par l'API : le parcours du formulaire est déjà couvert par
 * `accueil.spec.ts`. Ici on veut une session déterministe, sans dépendre du
 * moment de l'hydratation. `page.request` partage le pot de cookies du contexte.
 */
async function connecter(page: Page, email: string) {
  let statut = 0;
  // Better Auth limite à 40 requêtes/60 s : on attend la fenêtre plutôt que d'échouer.
  for (let essai = 0; essai < 4; essai += 1) {
    const reponse = await page.request.post("/api/auth/sign-in/email", {
      data: { email, password: MOT_DE_PASSE },
    });
    statut = reponse.status();
    if (reponse.ok()) break;
    if (statut !== 429) break;
    await page.waitForTimeout(20_000);
  }
  expect(statut, `connexion refusée pour ${email}`).toBeLessThan(400);
  await page.goto("/");
  await page.waitForURL((u) => u.pathname === "/", { timeout: 20_000 });
}

/** Par l'interface : c'est ce chemin qui purge aussi les copies locales. */
async function deconnecter(page: Page) {
  await expect(async () => {
    await page.getByRole("button", { name: "Se déconnecter" }).first().click();
    await expect(page).toHaveURL(/\/connexion/, { timeout: 3000 });
  }).toPass({ timeout: 30_000 });
}

/**
 * Les droits sont revérifiés côté serveur : atteindre l'URL directement doit
 * renvoyer à l'accueil, indépendamment de ce que la navigation affiche.
 */
test.describe("cloisonnement par rôle", () => {
  const interdits: Record<string, string[]> = {
    prestataire: ["/team", "/tarifs", "/reservations"],
    lecteur: ["/team", "/tarifs", "/reservations/nouveau"],
    gestionnaire: ["/team"],
  };

  for (const [role, chemins] of Object.entries(interdits)) {
    test(`un compte ${role} n'atteint pas ses routes interdites`, async ({ page }) => {
      await connecter(page, COMPTES[role as keyof typeof COMPTES]);
      for (const chemin of chemins) {
        await page.goto(chemin);
        await expect(page, `${role} ne doit pas ouvrir ${chemin}`).toHaveURL(
          (u) => u.pathname === "/",
        );
      }
    });
  }

  test("un gestionnaire garde ses routes métier", async ({ page }) => {
    await connecter(page, COMPTES.gestionnaire);
    await page.goto("/reservations");
    await expect(page).toHaveURL(/\/reservations/);
    await page.goto("/tarifs");
    await expect(page).toHaveURL(/\/tarifs/);
  });
});

/** Ouvre le dialogue de création d'événement du tableau de bord. */
async function ouvrirDialogueEvenement(page: Page) {
  const section = page.locator("section").filter({ hasText: "Événements en Cours" }).first();
  const dialogue = page.getByRole("dialog").filter({ hasText: "Créer un événement" });
  // Le HTML est servi par le serveur : un clic avant l'hydratation n'a pas d'effet.
  await expect(async () => {
    await section.getByRole("button", { name: "Ajouter" }).click();
    await expect(dialogue).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 30_000 });
  return dialogue;
}

async function creerEvenement(page: Page, titre: string) {
  const dialogue = await ouvrirDialogueEvenement(page);
  await dialogue.getByLabel("Nom de l'événement *").fill(titre);
  await dialogue.getByLabel("Date de début *").fill("2026-09-01");
  await dialogue.getByRole("button", { name: "Créer l'événement" }).click();
  await expect(dialogue).toBeHidden();
  await expect(page.getByText(titre).first()).toBeVisible();
}

/**
 * Une écriture qui n'atteint pas le serveur doit être signalée. Auparavant
 * l'erreur était avalée : l'utilisateur croyait son travail enregistré.
 */
test("un échec d'enregistrement est signalé à l'utilisateur", async ({ page }) => {
  test.setTimeout(90_000);
  await connecter(page, COMPTES.admin);

  await page.route("**/_serverFn/**", (route) => {
    if (route.request().method() === "POST") return route.abort("failed");
    return route.fallback();
  });

  await creerEvenement(page, `Hors-ligne-${Date.now().toString(36)}`);

  const bandeau = page.getByRole("status").filter({ hasText: "ne sont pas enregistrées" });
  await expect(bandeau).toBeVisible({ timeout: 20_000 });
  await expect(bandeau.getByRole("button", { name: "Réessayer" })).toBeVisible();

  // Une fois le réseau rétabli, la reprise fait disparaître l'alerte.
  await page.unroute("**/_serverFn/**");
  await bandeau.getByRole("button", { name: "Réessayer" }).click();
  await expect(bandeau).toBeHidden({ timeout: 20_000 });
});

/**
 * Régression IDOR / poste partagé : l'état métier écrit par un compte ne doit
 * apparaître ni côté serveur ni dans le stockage local d'un autre compte,
 * y compris dans le même navigateur.
 */
test("un événement est partagé dans l'org et isolé hors de l'org", async ({ page }) => {
  test.setTimeout(120_000);
  const marqueur = `Marqueur-${Date.now().toString(36)}`;

  await connecter(page, COMPTES.admin);
  await creerEvenement(page, marqueur);
  await page.waitForTimeout(2000);
  await deconnecter(page);

  await connecter(page, COMPTES.gestionnaire);
  await expect(page.getByText(marqueur).first()).toBeVisible({ timeout: 15_000 });
  await deconnecter(page);

  await connecter(page, COMPTES.prestataire);
  await page.waitForTimeout(2000);
  await expect(page.getByText(marqueur)).toHaveCount(0);

  const fuiteLocale = await page.evaluate((m) => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const cle = localStorage.key(i);
      if (!cle) continue;
      if ((localStorage.getItem(cle) ?? "").includes(m)) return cle;
    }
    return null;
  }, marqueur);
  expect(fuiteLocale, "aucune clé locale ne doit contenir l'état d'une autre org").toBeNull();
});
