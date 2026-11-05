import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import pg from "pg";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const ORG_REDRIS = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const ORG_LUCAS = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";

test.skip(
  !process.env["DATABASE_URL"],
  "DATABASE_URL absent : docker compose up -d && npm run db:prepare",
);

test.describe.configure({ mode: "serial", timeout: 90_000 });

const GESTIONNAIRE = "amelie.dubois@hublify.app";
const VOYAGEUR = "sophie.martin@hublify.app";

function clientPg() {
  const url = process.env["DATABASE_URL"] ?? "";
  const locale = url.includes("localhost") || url.includes("127.0.0.1");
  return new pg.Client({
    connectionString: url,
    ssl: locale ? false : { rejectUnauthorized: true },
  });
}

async function avecPg<T>(fn: (client: pg.Client) => Promise<T>) {
  const client = clientPg();
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

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
  expect(statut, `connexion refusée pour ${email}`).toBeLessThan(400);
}

async function contexteConnecte(
  browser: { newContext: () => Promise<BrowserContext> },
  email: string,
) {
  const contexte = await browser.newContext();
  const page = await contexte.newPage();
  await connecter(page, email);
  return { contexte, page };
}

test.beforeAll(async () => {
  await avecPg(async (client) => {
    await client.query(
      `insert into public.org_livrets (org_id, id, payload, position)
       values ($1::uuid, 'livret-lucas-secret', $2::jsonb, 0)
       on conflict (org_id, id) do update set payload = excluded.payload`,
      [
        ORG_LUCAS,
        JSON.stringify({
          id: "livret-lucas-secret",
          nom: "LIVRET-ORG-LUCAS-SECRET",
          reference: "LIV9XYZ",
          famille: "livret",
          logement: "Org Lucas",
          modifiePar: "Lucas",
          modifieLe: "2026-03-10",
          couleurFond: "#ffffff",
          logo: "Lucas",
          pages: [
            {
              id: "accueil",
              nom: "Accueil",
              titre: "Secret",
              sousTitre: "",
              texte: "Ne doit pas apparaître chez Redris.",
            },
          ],
        }),
      ],
    );
    await client.query(
      `insert into public.org_upsell_fiches
         (org_id, upsell_id, code, type, prestataire, ville, piece_jointe)
       values ($1::uuid, 'u-dej', 'SECRET-LUCAS', 'Service', '', 'VILLE-LUCAS-SECRET', '')
       on conflict (org_id, upsell_id) do update
         set code = excluded.code, ville = excluded.ville`,
      [ORG_LUCAS],
    );
    await client.query(
      `insert into public.org_precheckin_extra (org_id, caution_active, caution_montant)
       values ($1::uuid, true, 9999)
       on conflict (org_id) do update
         set caution_active = true, caution_montant = 9999`,
      [ORG_LUCAS],
    );
  });
});

test.afterAll(async () => {
  await avecPg(async (client) => {
    await client.query(
      `delete from public.org_livrets
        where org_id = $1::uuid and payload->>'nom' like 'Livret persistance %'`,
      [ORG_REDRIS],
    );
    await client.query(
      `delete from public.org_livrets where org_id = $1::uuid and id = 'livret-lucas-secret'`,
      [ORG_LUCAS],
    );
    await client.query(`delete from public.org_upsell_fiches where org_id = $1::uuid`, [ORG_LUCAS]);
    await client.query(`delete from public.org_precheckin_extra where org_id = $1::uuid`, [
      ORG_LUCAS,
    ]);
    await client.query(
      `update public.org_upsell_fiches
          set ville = 'Cannes', code = '12-01-S', type = 'Nourriture',
              prestataire = 'La Boulangerie Ducoin', piece_jointe = 'Menu.pdf'
        where org_id = $1::uuid and upsell_id = 'u-dej'`,
      [ORG_REDRIS],
    );
    await client.query(
      `update public.org_precheckin_extra
          set caution_active = false, caution_montant = 0, code_porte_jour_arrivee = false,
              upsells_proposes = '{}'
        where org_id = $1::uuid`,
      [ORG_REDRIS],
    );
  });
});

test("livret : création, édition, rechargement et isolation", async ({ browser }) => {
  const nom = `Livret persistance ${Date.now().toString(36)}`;
  const { contexte, page } = await contexteConnecte(browser, GESTIONNAIRE);
  try {
    await page.goto("/outils/livret");
    await expect(page.locator("[data-hydrated='oui']")).toBeVisible();
    await expect(page.getByText("LIVRET-ORG-LUCAS-SECRET")).toHaveCount(0);
    const creer = page.getByRole("button", { name: "Livret", exact: true });
    await expect(creer).toBeEnabled();
    await creer.click();
    const nouveau = page.getByRole("row", { name: /Nouveau livret d'accueil/ });
    await expect(nouveau).toBeVisible();
    const statut = page.getByRole("status", { name: "Synchronisation des livrets" });
    await expect(statut).toHaveText("Enregistré");
    const revision = Number((await statut.getAttribute("data-revision")) ?? "0");
    await nouveau.getByRole("button", { name: "Modifier" }).click();
    await page.getByLabel("Renommez ce livret").fill(nom);
    await expect(statut).toHaveAttribute("data-revision", String(revision + 1));
    await page.reload();
    await expect(page.getByText(nom)).toBeVisible();
    await expect(page.getByText("LIVRET-ORG-LUCAS-SECRET")).toHaveCount(0);
    const orgs = await avecPg((client) =>
      client.query<{ org_id: string }>(
        `select org_id::text from public.org_livrets where payload->>'nom' = $1`,
        [nom],
      ),
    );
    expect(orgs.rows.map((r) => r.org_id)).toEqual([ORG_REDRIS]);
  } finally {
    await contexte.close();
  }
});

test("upsell : édition de la fiche, rechargement et isolation", async ({ browser }) => {
  const ville = `Nice${Date.now().toString(36).slice(-4)}`;
  const { contexte, page } = await contexteConnecte(browser, GESTIONNAIRE);
  try {
    await page.goto("/outils/upsells");
    await expect(page.getByText("VILLE-LUCAS-SECRET")).toHaveCount(0);
    await expect(page.getByText("SECRET-LUCAS")).toHaveCount(0);
    const modifier = page.getByRole("button", { name: "Modifier Petit-déjeuner" });
    await expect(modifier).toBeEnabled();
    await modifier.click();
    await page.getByLabel("Ville").fill(ville);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Upsell mis à jour.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("cell", { name: ville })).toBeVisible();
    await expect(page.getByText("VILLE-LUCAS-SECRET")).toHaveCount(0);
    const lignes = await avecPg((client) =>
      client.query<{ org_id: string; ville: string }>(
        `select org_id::text, ville from public.org_upsell_fiches where upsell_id = 'u-dej' order by org_id`,
      ),
    );
    const parOrg = new Map(lignes.rows.map((r) => [r.org_id, r.ville]));
    expect(parOrg.get(ORG_REDRIS)).toBe(ville);
    expect(parOrg.get(ORG_LUCAS)).toBe("VILLE-LUCAS-SECRET");
  } finally {
    await contexte.close();
  }
});

test("pré-check-in : options extra conservées et lues par le voyageur", async ({ browser }) => {
  const { contexte, page } = await contexteConnecte(browser, GESTIONNAIRE);
  try {
    await page.goto("/precheckin");
    const montant = page.getByLabel("Montant (€)");
    await expect(montant).toBeVisible();
    await montant.fill("321");
    const caution = page.getByRole("switch", { name: "Demander une caution" });
    if ((await caution.getAttribute("aria-checked")) !== "true") await caution.click();
    const code = page.getByRole("switch", {
      name: "Le code de la porte sera affiché le jour de l'enregistrement",
    });
    if ((await code.getAttribute("aria-checked")) !== "true") await code.click();
    const proposer = page.getByRole("button", { name: "Proposer" }).first();
    if (await proposer.isVisible()) await proposer.click();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Pré-checkin enregistré.")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Montant (€)")).toHaveValue("321");
    await expect(page.getByRole("switch", { name: "Demander une caution" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  } finally {
    await contexte.close();
  }

  const voyageur = await contexteConnecte(browser, VOYAGEUR);
  try {
    await voyageur.page.goto("/espace/precheckin");
    const continuer = voyageur.page.getByRole("button", { name: "Continuer" });
    if (await continuer.isVisible().catch(() => false)) await continuer.click();
    await expect(voyageur.page.getByText("Caution à prévoir : 321 €")).toBeVisible();
    await expect(voyageur.page.getByText("9999")).toHaveCount(0);
    await expect(
      voyageur.page.getByText("Le code de la porte sera affiché le jour de l'arrivée."),
    ).toBeVisible();
    await expect(voyageur.page.getByText("Petit-déjeuner")).toBeVisible();
  } finally {
    await voyageur.contexte.close();
  }

  const montants = await avecPg((client) =>
    client.query<{ org_id: string; caution_montant: string | number }>(
      `select org_id::text, caution_montant
         from public.org_precheckin_extra
        where org_id = any($1::uuid[])`,
      [[ORG_REDRIS, ORG_LUCAS]],
    ),
  );
  const parOrg = new Map(montants.rows.map((r) => [r.org_id, Number(r.caution_montant)]));
  expect(parOrg.get(ORG_REDRIS)).toBe(321);
  expect(parOrg.get(ORG_LUCAS)).toBe(9999);
});
