import { expect, test, type Browser, type Page } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";

import { ORG_REDRIS_ID } from "../src/lib/orgs";

// Marketplace (« Créer une Mission », PR 5, règle R2), de bout en bout sur une base jetable.
// Données fictives uniquement. Orgs prestataires : une liée (lien actif), une au lien
// inactif, une sans lien. Plus un compte au rôle prestataire mal rattaché à l'org
// gestionnaire. Avant la prise, la réponse réseau ne contient que sept champs.

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent : npm run db:prepare");
test.skip(!process.env["DEMO_AUTH_PASSWORD"], "DEMO_AUTH_PASSWORD absent");

const ORIGINE = "http://127.0.0.1:8080";
const MOT_DE_PASSE = "Marketplace-e2e-2026!";
const MOT_DE_PASSE_DEMO = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const GESTIONNAIRE = "amelie.dubois@hublify.app";
const SEP = "\u2063";
const BIEN = "raclette";

const jeton = Date.now().toString(36);
const ORG = {
  liee: crypto.randomUUID(),
  inactive: crypto.randomUUID(),
  sansLien: crypto.randomUUID(),
};
const EMAIL = {
  alice: `alice.${jeton}@exemple.test`,
  bruno: `bruno.${jeton}@exemple.test`,
  carla: `carla.${jeton}@exemple.test`,
  denis: `denis.${jeton}@exemple.test`,
  egare: `egare.${jeton}@exemple.test`,
};
const ID = (n: string) => `e2e-mk-${n}-${jeton}`;
const SECRET = `CodePorte-${jeton}`;

let pool: Pool;
let reservationId = "";
let occupant = "";
let adresse = "";
let proprietaire = "";

function dansJours(n: number) {
  const d = new Date(Date.now() + n * 86_400_000);
  return d.toISOString().slice(0, 10);
}

async function creerCompte(email: string, prenom: string, orgId: string) {
  const hash = await hashPassword(MOT_DE_PASSE);
  const user = await pool.query(
    `insert into "user" (name, email, "emailVerified") values ($1, $2, true) returning id`,
    [`${prenom} Fictif`, email],
  );
  const userId = user.rows[0]?.id as string;
  await pool.query(
    `insert into account ("accountId", "providerId", "userId", issuer, password, "updatedAt")
     values ($1::text, 'credential', $1::uuid, 'local:credential', $2, now())`,
    [userId, hash],
  );
  await pool.query(
    `insert into public.profils (user_id, prenom, nom, initiales, affectation, statut)
     values ($1::uuid, $2, 'Fictif', $3, 'Interventions', 'actif')`,
    [userId, prenom, prenom.slice(0, 1).toUpperCase() + "F"],
  );
  const droits = await pool.query(
    `select droits from public.org_membres where role_id = 'prestataire' limit 1`,
  );
  const liste = (droits.rows[0]?.droits as string[] | undefined) ?? [];
  await pool.query(
    `insert into public.org_membres (org_id, user_id, role_id, droits, statut)
     values ($1::uuid, $2::uuid, 'prestataire', $3::text[], 'actif')`,
    [orgId, userId, `{${liste.join(",")}}`],
  );
}

async function creerMissionOuverte(id: string, titre: string) {
  const meta = {
    marketplace: true,
    porteur: "prestataire",
    attribution: "locataire",
    reservationId,
  };
  await pool.query(
    `insert into public.missions
       (org_id, id, bien_id, jour, titre, type_mission, heure, assigne, statut, description,
        ouverte, attribution, reservation_id)
     values ($1::uuid, $2, $3, $4::date, $5, 'Menage', '10:00', '', 'a_faire', $6,
             true, 'locataire', $7)`,
    [
      ORG_REDRIS_ID,
      id,
      BIEN,
      dansJours(3),
      titre,
      `${SECRET} voyageur ${occupant}${SEP}${JSON.stringify(meta)}`,
      reservationId,
    ],
  );
}

async function ligne(id: string) {
  const r = await pool.query(
    `select assigne, ouverte, org_prestataire_id, porteur, description
       from public.missions where org_id = $1::uuid and id = $2`,
    [ORG_REDRIS_ID, id],
  );
  return r.rows[0] as
    | {
        assigne: string;
        ouverte: boolean;
        org_prestataire_id: string | null;
        porteur: string;
        description: string;
      }
    | undefined;
}

test.beforeAll(async () => {
  pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
  const resa = await pool.query(
    `select r.id, r.occupant, b.adresse, b.proprietaire
       from public.reservations_dossier r join public.biens b on b.org_id = r.org_id and b.id = r.bien_id
      where r.org_id = $1::uuid and r.bien_id = $2 order by r.id limit 1`,
    [ORG_REDRIS_ID, BIEN],
  );
  reservationId = String(resa.rows[0]?.id ?? "");
  occupant = String(resa.rows[0]?.occupant ?? "");
  adresse = String(resa.rows[0]?.adresse ?? "");
  proprietaire = String(resa.rows[0]?.proprietaire ?? "");
  for (const [id, statut] of [
    [ORG.liee, "actif"],
    [ORG.inactive, "inactif"],
    [ORG.sansLien, null],
  ] as const) {
    await pool.query(
      `insert into public.orgs (id, nom, type) values ($1::uuid, $2, 'prestataire')`,
      [id, `Org e2e marketplace ${id.slice(0, 8)}`],
    );
    if (statut) {
      await pool.query(
        `insert into public.liens_org (org_gestionnaire_id, org_prestataire_id, statut)
         values ($1::uuid, $2::uuid, $3)`,
        [ORG_REDRIS_ID, id, statut],
      );
    }
  }
  await creerCompte(EMAIL.alice, "Alice", ORG.liee);
  await creerCompte(EMAIL.bruno, "Bruno", ORG.liee);
  await creerCompte(EMAIL.carla, "Carla", ORG.inactive);
  await creerCompte(EMAIL.denis, "Denis", ORG.sansLien);
  // Rôle prestataire posé à la main dans l'org gestionnaire : compte mal rattaché.
  await creerCompte(EMAIL.egare, "Egare", ORG_REDRIS_ID);
  await creerMissionOuverte(ID("course"), `Course-${jeton}`);
  await creerMissionOuverte(ID("bouton"), `Bouton-${jeton}`);
  await creerMissionOuverte(ID("reste"), `Reste-${jeton}`);
  for (const n of [1, 2, 3]) await creerMissionOuverte(ID(`rafale${n}`), `Rafale${n}-${jeton}`);
});

test.afterAll(async () => {
  try {
    await pool.query(`delete from public.missions where org_id = $1::uuid and id like $2`, [
      ORG_REDRIS_ID,
      `e2e-mk-%-${jeton}`,
    ]);
    await pool.query(`delete from public.liens_org where org_prestataire_id = any($1::uuid[])`, [
      Object.values(ORG),
    ]);
    await pool.query(`delete from "user" where email like $1`, [`%.${jeton}@exemple.test`]);
    await pool.query(`delete from public.orgs where id = any($1::uuid[])`, [Object.values(ORG)]);
  } finally {
    await pool.end();
  }
});

async function connecter(page: Page, email: string, motDePasse = MOT_DE_PASSE) {
  let statut = 0;
  for (let essai = 0; essai < 4; essai += 1) {
    const r = await page.request.post("/api/auth/sign-in/email", {
      data: { email, password: motDePasse },
      headers: { Origin: ORIGINE },
    });
    statut = r.status();
    if (r.ok() || statut !== 429) break;
    await page.waitForTimeout(20_000);
  }
  expect(statut, `connexion ${email}`).toBeLessThan(400);
}

/** Corps de toutes les réponses des fonctions serveur reçues par le navigateur. */
function espionnerReseau(page: Page) {
  const corps: string[] = [];
  page.on("response", async (reponse) => {
    if (!reponse.url().includes("/_serverFn/")) return;
    try {
      corps.push(await reponse.text());
    } catch {
      // Réponse déjà libérée : rien à contrôler.
    }
  });
  return corps;
}

async function evaluer<T, A>(page: Page, fn: (arg: A) => Promise<T>, arg: A): Promise<T> {
  for (let essai = 0; ; essai += 1) {
    try {
      return await page.evaluate(fn, arg);
    } catch (e) {
      if (essai >= 3 || !String(e).includes("Execution context was destroyed")) throw e;
      await page.waitForLoadState("networkidle");
    }
  }
}

async function ouvrir(page: Page, email: string, motDePasse = MOT_DE_PASSE) {
  await connecter(page, email, motDePasse);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

async function lister(page: Page) {
  return evaluer(
    page,
    async () => {
      const mod = await import("/src/data/session-remote.ts");
      return mod.missionsOuvertesDistant();
    },
    undefined,
  );
}

async function prendre(page: Page, id: string) {
  return evaluer(
    page,
    async (id: string) => {
      const mod = await import("/src/data/session-remote.ts");
      return mod.prendreMissionDistant({ data: { id } });
    },
    id,
  );
}

async function nouvellePage(browser: Browser, email: string, motDePasse = MOT_DE_PASSE) {
  const contexte = await browser.newContext({ baseURL: ORIGINE });
  const page = await contexte.newPage();
  await ouvrir(page, email, motDePasse);
  return { page, fermer: () => contexte.close() };
}

test.describe.serial("marketplace : missions ouvertes", () => {
  test("org liée : sept champs seulement, rien d'interdit dans la réponse réseau", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    expect(reservationId, "réservation de démo").not.toBe("");
    await connecter(page, EMAIL.alice);
    const corps = espionnerReseau(page);
    await page.goto("/espace/missions");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(`Course-${jeton}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Prendre" }).first()).toBeVisible();

    const r = await lister(page);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const nos = r.missions.filter((m) => m.id.endsWith(jeton));
    expect(nos.map((m) => m.id).sort()).toEqual(
      ["bouton", "course", "reste", "rafale1", "rafale2", "rafale3"].map(ID).sort(),
    );
    for (const m of nos) {
      expect(Object.keys(m).sort()).toEqual(
        ["date", "id", "logement", "plage", "titre", "type", "ville"].sort(),
      );
      expect(m.logement).toBe("Studio Raclette");
      expect(m.ville).toBe("Chamonix");
    }
    const rue = adresse.split(",")[0]!.trim();
    expect(corps.length).toBeGreaterThan(0);
    for (const brut of corps) {
      for (const interdit of [SECRET, rue, proprietaire, occupant, reservationId, "locataire"]) {
        expect(brut, `champ interdit « ${interdit} »`).not.toContain(interdit);
      }
    }
  });

  test("lien inactif ou aucun lien : rien à voir, rien à prendre", async ({ browser }) => {
    test.setTimeout(150_000);
    for (const email of [EMAIL.carla, EMAIL.denis]) {
      const { page, fermer } = await nouvellePage(browser, email);
      const r = await lister(page);
      expect(r).toEqual({ ok: true, missions: [] });
      expect(await prendre(page, ID("reste"))).toEqual({ ok: false, raison: "indisponible" });
      await fermer();
    }
    expect(await ligne(ID("reste"))).toMatchObject({ ouverte: true, assigne: "" });
  });

  test("compte mal rattaché ou gestionnaire : refusé, rien pris", async ({ browser }) => {
    test.setTimeout(150_000);
    for (const [email, mdp] of [
      [EMAIL.egare, MOT_DE_PASSE],
      [GESTIONNAIRE, MOT_DE_PASSE_DEMO],
    ] as const) {
      const { page, fermer } = await nouvellePage(browser, email, mdp);
      expect(await lister(page)).toEqual({ ok: false, raison: "interdit" });
      expect(await prendre(page, ID("reste"))).toEqual({ ok: false, raison: "interdit" });
      await fermer();
    }
    expect(await ligne(ID("reste"))).toMatchObject({
      ouverte: true,
      assigne: "",
      org_prestataire_id: null,
    });
  });

  test("deux prises simultanées : une seule réussit, la mission disparaît pour les autres", async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const a = await nouvellePage(browser, EMAIL.alice);
    const b = await nouvellePage(browser, EMAIL.bruno);
    const [ra, rb] = await Promise.all([
      prendre(a.page, ID("course")),
      prendre(b.page, ID("course")),
    ]);
    const reussites = [ra, rb].filter((r) => r.ok);
    expect(reussites).toHaveLength(1);
    expect([ra, rb].find((r) => !r.ok)).toEqual({ ok: false, raison: "indisponible" });
    const gagnant = ra.ok ? EMAIL.alice : EMAIL.bruno;
    const apres = await ligne(ID("course"));
    expect(apres).toMatchObject({
      assigne: gagnant,
      ouverte: false,
      org_prestataire_id: ORG.liee,
      porteur: "prestataire",
    });
    const meta = JSON.parse(apres!.description.split(SEP)[1]!);
    expect(meta).toMatchObject({ marketplace: false, porteur: "prestataire" });

    // Plus proposée à personne, ni au perdant, ni au gagnant.
    for (const p of [a.page, b.page]) {
      const r = await lister(p);
      expect(r.ok && r.missions.some((m) => m.id === ID("course"))).toBe(false);
    }
    // Le gagnant la reçoit dans ses missions ; le perdant non (filtre par e-mail, #63).
    const etats = await Promise.all(
      [a.page, b.page].map((p) =>
        evaluer(
          p,
          async () => {
            const mod = await import("/src/data/session-remote.ts");
            return mod.chargerEtatDistant();
          },
          undefined,
        ),
      ),
    );
    const recoit = etats.map((e) => e.ok && e.payload.missions.some((m) => m.id === ID("course")));
    expect(recoit).toEqual(ra.ok ? [true, false] : [false, true]);
    // Rafale : trois missions, quatre prises simultanées chacune (deux par compte).
    const rafale = await Promise.all(
      [1, 2, 3].flatMap((n) =>
        [a.page, b.page, a.page, b.page].map((p) => prendre(p, ID(`rafale${n}`))),
      ),
    );
    for (let n = 0; n < 3; n += 1) {
      expect(rafale.slice(n * 4, n * 4 + 4).filter((r) => r.ok)).toHaveLength(1);
      const l = await ligne(ID(`rafale${n + 1}`));
      expect([EMAIL.alice, EMAIL.bruno]).toContain(l?.assigne);
      expect(l?.ouverte).toBe(false);
    }
    // Seconde tentative après coup : refusée.
    expect(await prendre(a.page, ID("course"))).toEqual({ ok: false, raison: "indisponible" });
    await a.fermer();
    await b.fermer();
  });

  test("bouton « Prendre » ; un écran gestionnaire périmé ne la rouvre pas", async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000);
    // Le gestionnaire charge son écran AVANT la prise.
    const g = await nouvellePage(browser, GESTIONNAIRE, MOT_DE_PASSE_DEMO);
    const lecture = await evaluer(
      g.page,
      async () => {
        const mod = await import("/src/data/session-remote.ts");
        return mod.chargerEtatDistant();
      },
      undefined,
    );
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    const perimee = lecture.payload.missions.find((m) => m.id === ID("bouton"));
    expect(perimee?.assigne).toBe("");

    await connecter(page, EMAIL.alice);
    await page.goto("/espace/missions");
    await page.waitForLoadState("networkidle");
    const carte = page.locator("li", { hasText: `Bouton-${jeton}` });
    await carte.getByRole("button", { name: "Prendre" }).click();
    await expect(page.getByText("Mission prise")).toBeVisible();
    await expect(page.getByText(`Bouton-${jeton}`)).toHaveCount(0);
    expect(await ligne(ID("bouton"))).toMatchObject({ assigne: EMAIL.alice, ouverte: false });

    // Modification ligne à ligne avec l'état d'avant la prise.
    const modif = await evaluer(
      g.page,
      async (m: { id: string; description: string }) => {
        const mod = await import("/src/data/session-remote.ts");
        return mod.modifierLigneMetier({
          data: {
            collection: "missions",
            id: m.id,
            patch: { assigne: "", description: m.description },
          },
        });
      },
      { id: ID("bouton"), description: perimee!.description },
    );
    expect(modif).toEqual({ ok: true });
    expect(await ligne(ID("bouton"))).toMatchObject({ assigne: EMAIL.alice, ouverte: false });

    // Sauvegarde en bloc de la liste d'avant la prise.
    const bloc = await evaluer(
      g.page,
      async (missions: unknown[]) => {
        const mod = await import("/src/data/session-remote.ts");
        return mod.sauverEtatDistant({ data: { patch: { missions: missions as never } } });
      },
      lecture.payload.missions as unknown[],
    );
    expect(bloc).toEqual({ ok: true });
    const fin = await ligne(ID("bouton"));
    expect(fin).toMatchObject({ assigne: EMAIL.alice, ouverte: false });
    expect(JSON.parse(fin!.description.split(SEP)[1]!).marketplace).toBe(false);
    // Une mission jamais prise reste ouverte après la même sauvegarde.
    expect(await ligne(ID("reste"))).toMatchObject({ ouverte: true, assigne: "" });
    await g.fermer();
  });
});
