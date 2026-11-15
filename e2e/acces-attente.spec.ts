import { expect, test } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";

import { purgerComptesDeTest } from "./nettoyage";

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent");
test.skip(!process.env["DEMO_AUTH_PASSWORD"], "DEMO_AUTH_PASSWORD absent");
test.afterAll(purgerComptesDeTest);

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const ORIGINE = "http://127.0.0.1:8080";
const MDP_INVITE = "Invite-e2e-attente-2026!";

test("un membre « attente » ne peut ni se connecter ni lire de données, jusqu'à validation", async ({
  page,
  browser,
}) => {
  test.setTimeout(150_000);
  const email = `attente.${Date.now().toString(36)}@exemple.test`;
  const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
  try {
    // Un administrateur invite : le compte naît « attente ».
    let statut = 0;
    for (let essai = 0; essai < 4; essai += 1) {
      const r = await page.request.post("/api/auth/sign-in/email", {
        data: { email: "contact@tech-trust.fr", password: MOT_DE_PASSE },
      });
      statut = r.status();
      if (r.ok() || statut !== 429) break;
      await page.waitForTimeout(20_000);
    }
    expect(statut, "connexion de l'administrateur").toBeLessThan(400);
    await page.goto("/team");
    await expect(async () => {
      await page.getByRole("button", { name: "Inviter un membre" }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30_000 });
    const dialogue = page.getByRole("dialog");
    await dialogue.getByPlaceholder("Prénom").fill("Attente");
    await dialogue.getByPlaceholder("email@exemple.com").fill(email);
    await dialogue.getByRole("button", { name: "Envoyer l'invitation" }).click();
    await expect(page.getByText(/Invitation envoyée|Membre ajouté/).first()).toBeVisible({
      timeout: 15_000,
    });

    // Le mot de passe temporaire est inconnu du test : on pose un mot de passe connu.
    await pool.query(
      `update account set password = $2 where "userId" = (select id from "user" where email = $1)`,
      [email, await hashPassword(MDP_INVITE)],
    );
    const etat = await pool.query(
      `select m.statut from org_membres m join "user" u on u.id = m.user_id where u.email = $1`,
      [email],
    );
    expect(etat.rows[0]?.statut).toBe("attente");

    // 1) Connexion refusée, avec un motif lisible, et aucune session créée.
    const invite = await browser.newContext({ baseURL: ORIGINE });
    const refus = await invite.request.post("/api/auth/sign-in/email", {
      data: { email, password: MDP_INVITE },
      headers: { Origin: ORIGINE },
    });
    expect(refus.status()).toBe(403);
    expect(JSON.stringify(await refus.json())).toContain("en attente de validation");
    const sessions = await pool.query(
      `select count(*)::int n from "session" s join "user" u on u.id = s."userId" where u.email = $1`,
      [email],
    );
    expect(sessions.rows[0]?.n).toBe(0);

    // 2) Une session déjà ouverte ne lit plus rien dès que le compte repasse « attente ».
    await pool.query(
      `update org_membres set statut = 'actif' where user_id = (select id from "user" where email = $1)`,
      [email],
    );
    const ok = await invite.request.post("/api/auth/sign-in/email", {
      data: { email, password: MDP_INVITE },
      headers: { Origin: ORIGINE },
    });
    expect(ok.status()).toBe(200);
    const pageInvite = await invite.newPage();
    await pageInvite.goto("/reservations");
    await expect(pageInvite).toHaveURL(/reservations/);
    await pool.query(
      `update org_membres set statut = 'attente' where user_id = (select id from "user" where email = $1)`,
      [email],
    );
    await pageInvite.goto("/reservations");
    await expect(pageInvite).toHaveURL(/connexion/);
    await pool.query(
      `delete from "session" where "userId" = (select id from "user" where email = $1)`,
      [email],
    );

    // 3) L'administrateur valide l'accès : la connexion repasse.
    await page.goto("/team");
    await page.getByPlaceholder("Rechercher un membre…").fill(email);
    await page.getByRole("button", { name: "Valider l'accès" }).click();
    await expect(page.getByText("Accès validé pour Attente.")).toBeVisible({ timeout: 15_000 });
    const valide = await invite.request.post("/api/auth/sign-in/email", {
      data: { email, password: MDP_INVITE },
      headers: { Origin: ORIGINE },
    });
    expect(valide.status()).toBe(200);
    await invite.close();
  } finally {
    await pool.end();
  }
});
