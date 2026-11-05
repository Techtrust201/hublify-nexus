import { expect, test, type Page } from "@playwright/test";

async function fond(page: Page, selecteur = "body") {
  return page.locator(selecteur).evaluate((el) => getComputedStyle(el).backgroundColor);
}

async function debordement(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

test.describe("maquette auth et fond", () => {
  test("connexion 1440 : blanc, formulaire centré, chaque clic", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto("/connexion");
    await expect(page.getByRole("heading", { name: "Se connecter" })).toBeVisible();
    await expect(page.getByText("Accédez à votre espace Hublify")).toBeVisible();
    await expect(page.getByText("© 2026 Hublify")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuer avec Google" })).toHaveCount(0);
    await expect(
      page.getByText("Utilisez l'adresse associée à votre espace de travail."),
    ).toBeVisible();
    expect(await fond(page)).toBe("rgb(255, 255, 255)");

    const champ = page.getByLabel("Adresse e-mail");
    const boite = await champ.boundingBox();
    expect(boite).not.toBeNull();
    expect(boite!.width).toBeGreaterThanOrEqual(440);
    expect(boite!.width).toBeLessThanOrEqual(470);
    expect(Math.abs(boite!.x + boite!.width / 2 - 720)).toBeLessThan(24);

    const bouton = page.getByRole("button", { name: "Se connecter" });
    const boiteBouton = await bouton.boundingBox();
    expect(Math.abs((boiteBouton?.width ?? 0) - boite!.width)).toBeLessThan(4);

    await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled();

    await page.getByRole("button", { name: "Afficher le mot de passe" }).click();
    await expect(page.locator('input[name="password"]')).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Masquer le mot de passe" }).click();
    await expect(page.locator('input[name="password"]')).toHaveAttribute("type", "password");

    const souvenir = page.getByRole("checkbox", { name: "Se souvenir de moi" });
    await expect(souvenir).toBeChecked();
    await souvenir.click();
    await expect(souvenir).not.toBeChecked();

    await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
    await expect(page).toHaveURL(/\/mot-de-passe-oublie/);
    await page.goBack();

    await page.getByRole("link", { name: "Créer un compte" }).click();
    await expect(page).toHaveURL(/\/inscription/);
    await page.goBack();

    await page.getByRole("link", { name: "Confidentialité" }).click();
    await expect(page).toHaveURL(/\/confidentialite/);
    await page.goto("/connexion");
    await page.getByRole("link", { name: "Conditions d'utilisation" }).first().click();
    await expect(page).toHaveURL(/\/cgu/);
    await page.goto("/connexion");
    await page.getByRole("link", { name: "Retour au site" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /Tous vos biens/ })).toBeVisible();
  });

  test("inscription, mot de passe oublié et choix du profil", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });

    await page.goto("/inscription");
    await expect(page.getByRole("heading", { name: "Créer un compte" })).toBeVisible();
    await expect(page.getByText("Sécurité du mot de passe")).toBeVisible();
    await expect(page.getByText("10 caractères")).toBeVisible();
    await expect(page.getByRole("button", { name: "S'inscrire avec Google" })).toHaveCount(0);
    await expect(page.getByLabel("Prénom")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Nom", exact: true })).toBeVisible();
    await expect(page.locator('input[name="nomOrg"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Continuer" })).toBeEnabled();
    await page.getByRole("link", { name: "Conditions d'utilisation" }).first().click();
    await expect(page).toHaveURL(/\/cgu/);
    await page.goto("/inscription");
    await page.getByRole("link", { name: "Politique de confidentialité" }).click();
    await expect(page).toHaveURL(/\/confidentialite/);
    await page.goto("/inscription");
    await page.getByRole("link", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/connexion/);

    await page.goto("/mot-de-passe-oublie");
    await expect(page.getByRole("heading", { name: "Mot de passe oublié ?" })).toBeVisible();
    await expect(page.getByText("Vérifiez l'orthographe avant de continuer.")).toBeVisible();
    await expect(page.getByText("Lien valable 30 minutes")).toBeVisible();
    await expect(page.getByRole("link", { name: "aide@hublify.app" })).toHaveAttribute(
      "href",
      "mailto:aide@hublify.app",
    );
    await page.getByRole("link", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/connexion/);

    await page.goto("/reinitialiser-mot-de-passe");
    await expect(page.getByRole("heading", { name: "Nouveau mot de passe" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enregistrer" })).toBeVisible();
    const boiteReset = await page.locator("#champ-mdp-reset").boundingBox();
    expect(boiteReset!.width).toBeGreaterThanOrEqual(440);

    await page.goto("/choix-du-profil");
    await expect(
      page.getByRole("heading", { name: "Quel profil voulez-vous être ?" }),
    ).toBeVisible();
    expect(await fond(page)).toBe("rgb(255, 255, 255)");
    const colonne = await page.getByRole("button", { name: "Continuer" }).boundingBox();
    expect(colonne!.width).toBeGreaterThanOrEqual(800);
    await page.getByRole("button", { name: "14.90€/mois" }).click();
    await expect(page).toHaveURL(/\/choix-du-profil/);
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page).toHaveURL(/\/inscription\?/);
    await expect(page).toHaveURL(/offre=solo|offre=standard/);
    await page.goto("/choix-du-profil");
    await page.getByRole("link", { name: "Revenir à l'étape précédente" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("390 : pas de débordement, bouton pleine largeur", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of [
      "/connexion",
      "/inscription",
      "/mot-de-passe-oublie",
      "/choix-du-profil",
      "/reinitialiser-mot-de-passe",
    ]) {
      await page.goto(route);
      expect(await debordement(page), route).toBeLessThanOrEqual(1);
      expect(await fond(page), route).toBe("rgb(255, 255, 255)");
    }
    await page.goto("/connexion");
    const champ = await page.getByLabel("Adresse e-mail").boundingBox();
    const bouton = await page.getByRole("button", { name: "Se connecter" }).boundingBox();
    expect(champ!.width).toBeGreaterThan(300);
    expect(Math.abs(champ!.width - bouton!.width)).toBeLessThan(4);
    await page.getByRole("link", { name: "Créer un compte" }).click();
    await expect(page.getByLabel("Prénom")).toBeVisible();
    await page.getByRole("link", { name: "Retour au site" }).click();
    await expect(page.getByRole("heading", { name: /Tous vos biens/ })).toBeVisible();
  });

  test("la landing garde le crème et le hero n'est pas blanc", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    expect(await fond(page)).toBe("rgb(247, 245, 240)");
    const jetons = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const sonde = document.createElement("div");
      sonde.className = "portail";
      sonde.style.backgroundColor = "var(--canvas)";
      sonde.style.color = "var(--ink-body)";
      sonde.style.borderTop = "1px solid var(--line)";
      document.body.appendChild(sonde);
      const rendu = getComputedStyle(sonde);
      const lu = {
        canvas: rendu.backgroundColor,
        line: rendu.borderTopColor,
        texte: rendu.color,
        portail: rendu.fontFamily,
        primaire: style.getPropertyValue("--gest-primaire").trim(),
        carte: style.getPropertyValue("--gest-carte").trim(),
        rayon: style.getPropertyValue("--radius-card").trim(),
      };
      sonde.remove();
      return lu;
    });
    expect(jetons).toMatchObject({
      canvas: "rgb(234, 231, 222)",
      line: "rgb(229, 231, 235)",
      texte: "rgb(74, 85, 101)",
      primaire: "#5591a9",
    });
    expect(jetons.carte).toMatch(/^#fff(fff)?$/);
    expect(jetons.rayon).toMatch(/^\.?625rem$/);
    expect(jetons.portail).toContain("Lexend Deca");
    expect(await fond(page, "#produit")).toBe("rgb(247, 246, 242)");
    expect(await fond(page, "#fonctionnalites")).toBe("rgb(247, 245, 240)");
    expect(await debordement(page)).toBeLessThanOrEqual(1);
    const titre = page.getByRole("heading", { name: /Tous vos biens/ });
    await expect(titre).toHaveCSS("font-family", /Poppins/);
  });
});
