import { expect, test } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(
  !process.env["DATABASE_URL"] || !MOT_DE_PASSE,
  "DATABASE_URL et DEMO_AUTH_PASSWORD sont requis",
);

test.describe.configure({ mode: "serial", timeout: 90_000 });
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test.beforeEach(async ({ page }) => {
  let statut = 0;
  for (let essai = 0; essai < 4; essai += 1) {
    const reponse = await page.request.post("/api/auth/sign-in/email", {
      data: { email: "redris.gestion@gmail.com", password: MOT_DE_PASSE },
    });
    statut = reponse.status();
    if (reponse.ok()) break;
    if (statut !== 429) break;
    await page.waitForTimeout(20_000);
  }
  expect(statut, "connexion gestionnaire").toBeLessThan(400);
});

test("un prestataire vide n'est pas créé", async ({ page }) => {
  await page.goto("/prestataires/nouveau");
  await expect(page.getByRole("heading", { name: "Ajouter un prestataire" })).toBeVisible();
  await page.getByRole("button", { name: "Enregistrer le prestataire" }).click();
  await expect(page).toHaveURL(/\/prestataires\/nouveau/);
  await expect(page.getByText("Prestataire ajouté.")).toHaveCount(0);
});

test("un occupant sans nom reste à l'écran avec un message", async ({ page }) => {
  await page.goto("/occupants");
  await expect(page.getByRole("heading", { name: "Liste des occupants" })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Indiquez le nom.")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("un upsell sans nom n'est pas enregistré en silence", async ({ page }) => {
  await page.goto("/outils/upsells");
  await expect(page.getByRole("heading", { name: "Upsells" })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Indiquez le nom de l'upsell.")).toBeVisible();
});

test("les libellés du gestionnaire sont en français cohérent", async ({ page }) => {
  await page.goto("/team");
  await expect(page.getByRole("heading", { name: "Team mate" })).toBeVisible();

  await page.goto("/outils/vue-annuelle");
  await expect(page.getByRole("heading", { name: "Vue annuelle" })).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("button", { name: /Événements en cours/ })).toBeVisible();

  await page.goto("/parametrage");
  await expect(page.getByText(/Rappel de paiement 24 h avant/)).toBeVisible();

  await page.goto("/outils/debuter");
  await expect(page.getByText("Comment ajouter mon premier logement ?")).toBeVisible();
  await expect(page.getByText(/soirées ou un propriétaire/)).toHaveCount(0);

  await page.goto("/messagerie");
  await expect(page.getByText("Bruno Girard").first()).toBeVisible();
  await expect(page.getByText("Brian Griffin")).toHaveCount(0);
  await expect(page.getByText("Mes coéquipiers")).toBeVisible();
});

test("voir les documents d'un lieu filtre sans ouvrir le dialogue", async ({ page }) => {
  const erreurs: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /same key/i.test(message.text())) {
      erreurs.push(message.text());
    }
  });
  await page.goto("/patrimoines");
  await expect(page.getByRole("heading", { name: "Patrimoine" })).toBeVisible();
  const ligne = page.getByRole("row", { name: /Appartement Colette/ });
  await ligne.getByRole("button", { name: "Voir docs" }).click();
  await expect(page).toHaveURL(/\/documents\?.*logement=Appartement/);
  await expect(page.getByRole("heading", { name: "Documents Logements" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Filtres" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Appartement Colette", exact: true }),
  ).toBeVisible();
  expect(erreurs).toEqual([]);
});

test("le lien de parrainage confirme la copie", async ({ page }) => {
  await page.goto("/parrainage");
  await expect(page.getByRole("heading", { name: "Parrainage boosté" })).toBeVisible();
  await expect(async () => {
    const bouton = page.getByRole("button", { name: /Proposez votre filleul|Lien copié/ });
    if ((await bouton.innerText()) !== "Lien copié") await bouton.click();
    await expect(page.getByRole("button", { name: "Lien copié" })).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 15_000 });
});
