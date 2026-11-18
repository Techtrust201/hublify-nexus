import { expect, test, type Page } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";

import { ORG_REDRIS_ID } from "../src/lib/orgs";

// « Créer une Mission », PR 3 : le serveur enregistre et valide les colonnes de la
// migration 022, de bout en bout, sur une base jetable. Données fictives uniquement.
// Les écritures passent par les mêmes fonctions serveur que l'écran.

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent : npm run db:prepare");
test.skip(!process.env["DEMO_AUTH_PASSWORD"], "DEMO_AUTH_PASSWORD absent");

const ORIGINE = "http://127.0.0.1:8080";
const MOT_DE_PASSE_DEMO = process.env["DEMO_AUTH_PASSWORD"] ?? "";
const MOT_DE_PASSE = "Mission-e2e-serveur-2026!";
const GESTIONNAIRE = "amelie.dubois@hublify.app";
const SEP = "\u2063";

const jeton = Date.now().toString(36);
const FICHE = {
  id: `e2e-presta-${jeton}`,
  nom: `Presta Fictif ${jeton}`,
  email: `presta.${jeton}@exemple.test`,
};
const RESTREINT = `restreint.${jeton}@exemple.test`;
const ID = (n: string) => `e2e-ms-${n}-${jeton}`;

let pool: Pool;
let bienId = "";
let reservationId = "";

function description(meta: Record<string, unknown>) {
  return `Prestation fictive.${SEP}${JSON.stringify(meta)}`;
}

async function colonnes(id: string) {
  const r = await pool.query(
    `select assigne, attribution, porteur, reservation_id, tarif_manuel_centimes,
            tarif_calcule_centimes, tarif_source, ouverte, tva_taux::float as tva_taux, description
       from public.missions where org_id = $1::uuid and id = $2`,
    [ORG_REDRIS_ID, id],
  );
  return r.rows[0] as Record<string, unknown> | undefined;
}

test.beforeAll(async () => {
  pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
  const resa = await pool.query(
    `select id, bien_id from public.reservations_dossier where org_id = $1::uuid order by id limit 1`,
    [ORG_REDRIS_ID],
  );
  reservationId = String(resa.rows[0]?.id ?? "");
  bienId = String(resa.rows[0]?.bien_id ?? "");
  // Membre au rôle gestionnaire sans le droit « mod-finances ».
  const hash = await hashPassword(MOT_DE_PASSE);
  const user = await pool.query(
    `insert into "user" (name, email, "emailVerified") values ('Restreint Fictif', $1, true) returning id`,
    [RESTREINT],
  );
  const userId = user.rows[0]?.id as string;
  await pool.query(
    `insert into account ("accountId", "providerId", "userId", issuer, password, "updatedAt")
     values ($1::text, 'credential', $1::uuid, 'local:credential', $2, now())`,
    [userId, hash],
  );
  await pool.query(
    `insert into public.profils (user_id, prenom, nom, initiales, affectation, statut)
     values ($1::uuid, 'Restreint', 'Fictif', 'RF', 'Planning', 'actif')`,
    [userId],
  );
  await pool.query(
    `insert into public.org_membres (org_id, user_id, role_id, droits, statut)
     values ($1::uuid, $2::uuid, 'gestionnaire',
             '{voir-reservations,voir-biens,voir-calendrier,mod-missions,messagerie}'::text[], 'actif')`,
    [ORG_REDRIS_ID, userId],
  );
});

test.afterAll(async () => {
  try {
    await pool.query(`delete from public.missions where org_id = $1::uuid and id like $2`, [
      ORG_REDRIS_ID,
      `e2e-ms-%-${jeton}`,
    ]);
    await pool.query(`delete from public.tarifs_org where org_id = $1::uuid`, [ORG_REDRIS_ID]);
    await pool.query(`delete from public.prestataires where org_id = $1::uuid and id = $2`, [
      ORG_REDRIS_ID,
      FICHE.id,
    ]);
    await pool.query(`delete from "user" where email = $1`, [RESTREINT]);
  } finally {
    await pool.end();
  }
});

async function connecter(page: Page, email: string, motDePasse: string) {
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
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

/** Une redirection ou un rechargement de Vite au premier chargement détruit le contexte. */
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

async function inserer(page: Page, collection: string, item: Record<string, unknown>) {
  return evaluer(
    page,
    async ({ collection, item }: { collection: string; item: Record<string, unknown> }) => {
      const mod = await import("/src/data/session-remote.ts");
      return mod.insererLigneMetier({ data: { collection, item: item as { id: string } } });
    },
    { collection, item },
  );
}

async function modifier(page: Page, id: string, patch: Record<string, unknown>) {
  return evaluer(
    page,
    async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const mod = await import("/src/data/session-remote.ts");
      return mod.modifierLigneMetier({ data: { collection: "missions", id, patch } });
    },
    { id, patch },
  );
}

async function missionLue(page: Page, id: string) {
  const lecture = await evaluer(
    page,
    async () => {
      const mod = await import("/src/data/session-remote.ts");
      return mod.chargerEtatDistant();
    },
    undefined,
  );
  expect(lecture.ok).toBe(true);
  if (!lecture.ok) return undefined;
  return lecture.payload.missions.find((m) => m.id === id);
}

function mission(id: string, meta: Record<string, unknown>, assigne = FICHE.nom) {
  return {
    id,
    bienId,
    date: "2026-11-25",
    titre: `Ménage fictif ${jeton}`,
    type: "Menage",
    emoji: "🧹",
    heure: "10:00",
    assigne,
    statut: "a_faire",
    description: description(meta),
  };
}

test.describe.serial("mission : enregistrement serveur", () => {
  test("gestionnaire : colonnes, tarif automatique, e-mail du prestataire, R3", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    expect(bienId, "réservation de démo").not.toBe("");
    await connecter(page, GESTIONNAIRE, MOT_DE_PASSE_DEMO);

    // Fiche prestataire créée par l'écran, tarif posé en base (pas d'écran avant la PR 4).
    expect(
      await inserer(page, "prestataires", {
        id: FICHE.id,
        nom: FICHE.nom,
        categorie: "Ménage",
        telephone: "",
        email: FICHE.email,
        ville: "",
        actif: true,
        note: 0,
      }),
    ).toEqual({ ok: true });
    await pool.query(
      `insert into public.tarifs_prestataire (org_id, prestataire_id, type_mission, montant_centimes)
       values ($1::uuid, $2, 'Menage', 3700)`,
      [ORG_REDRIS_ID, FICHE.id],
    );
    await pool.query(
      `insert into public.tarifs_org (org_id, type_mission, montant_centimes)
       values ($1::uuid, 'Check-in', 2500) on conflict do nothing`,
      [ORG_REDRIS_ID],
    );

    // 1. Mission confiée au prestataire de l'annuaire : tarif du prestataire, e-mail en base.
    expect(
      await inserer(
        page,
        "missions",
        mission(ID("a"), { porteur: "prestataire", attribution: "mandataire" }),
      ),
    ).toEqual({ ok: true });
    expect(await colonnes(ID("a"))).toMatchObject({
      assigne: FICHE.email,
      attribution: "mandataire",
      porteur: "prestataire",
      reservation_id: null,
      tarif_manuel_centimes: null,
      tarif_calcule_centimes: 3700,
      tarif_source: "prestataire",
      ouverte: false,
      tva_taux: null,
    });
    // Double écriture : la méta JSON reste dans la description.
    expect(String((await colonnes(ID("a")))?.["description"])).toContain('"porteur":"prestataire"');
    // L'écran gestionnaire relit le nom de la fiche : affichage et factures inchangés.
    expect((await missionLue(page, ID("a")))?.assigne).toBe(FICHE.nom);

    // 2. Facturée au locataire sans réservation : refusée, rien n'est écrit (R3).
    expect(
      await inserer(
        page,
        "missions",
        mission(ID("b"), { porteur: "prestataire", attribution: "locataire" }),
      ),
    ).toEqual({ ok: false, raison: "invalide" });
    expect(await colonnes(ID("b"))).toBeUndefined();

    // 3. Locataire avec réservation, tarif manuel, ouverte au marketplace.
    expect(
      await inserer(
        page,
        "missions",
        mission(ID("c"), {
          porteur: "prestataire",
          attribution: "locataire",
          reservationId,
          tarif: 55,
          marketplace: true,
        }),
      ),
    ).toEqual({ ok: true });
    expect(await colonnes(ID("c"))).toMatchObject({
      attribution: "locataire",
      reservation_id: reservationId,
      tarif_manuel_centimes: 5500,
      tarif_calcule_centimes: 3700,
      tarif_source: "prestataire",
      ouverte: true,
      tva_taux: 0.2,
    });

    // 4. Modification : type Check-in porté par un coéquipier → grille de l'org.
    expect(
      await modifier(page, ID("a"), {
        type: "Check-in",
        assigne: "Coéquipier Fictif",
        description: description({ porteur: "teammate", attribution: "mandataire" }),
      }),
    ).toEqual({ ok: true });
    expect(await colonnes(ID("a"))).toMatchObject({
      assigne: "Coéquipier Fictif",
      porteur: "teammate",
      tarif_calcule_centimes: 2500,
      tarif_source: "grille_org",
    });

    // 5. Réaffectation seule (comme « Affecter ») : l'e-mail revient.
    expect(
      await modifier(page, ID("a"), {
        assigne: FICHE.nom,
        description: description({ porteur: "prestataire", attribution: "mandataire" }),
      }),
    ).toEqual({ ok: true });
    expect((await colonnes(ID("a")))?.["assigne"]).toBe(FICHE.email);

    // 6. Modification qui casserait R3 : refusée, la ligne ne bouge pas.
    expect(
      await modifier(page, ID("c"), {
        description: description({ porteur: "prestataire", attribution: "locataire" }),
      }),
    ).toEqual({ ok: false, raison: "invalide" });
    expect((await colonnes(ID("c")))?.["reservation_id"]).toBe(reservationId);
  });

  test("sauvegarde en bloc de l'écran : colonnes recalculées, e-mail conservé", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await connecter(page, GESTIONNAIRE, MOT_DE_PASSE_DEMO);
    const resultat = await evaluer(
      page,
      async () => {
        const mod = await import("/src/data/session-remote.ts");
        const lecture = await mod.chargerEtatDistant();
        if (!lecture.ok) return lecture;
        // L'écran renvoie la liste telle qu'il l'a reçue : avec le nom de la fiche.
        return mod.sauverEtatDistant({ data: { patch: { missions: lecture.payload.missions } } });
      },
      undefined,
    );
    expect(resultat).toEqual({ ok: true });
    expect(await colonnes(ID("a"))).toMatchObject({
      assigne: FICHE.email,
      porteur: "prestataire",
      // Passée en Check-in à l'étape 4 : pas de tarif prestataire pour ce type, grille de l'org.
      tarif_source: "grille_org",
      tarif_calcule_centimes: 2500,
    });
    expect(await colonnes(ID("c"))).toMatchObject({
      attribution: "locataire",
      reservation_id: reservationId,
      tarif_manuel_centimes: 5500,
      ouverte: true,
      tva_taux: 0.2,
    });
  });

  test("droits : sans « mod-finances », pas de changement de tarif", async ({ page }) => {
    test.setTimeout(150_000);
    await connecter(page, RESTREINT, MOT_DE_PASSE);
    expect(
      await modifier(page, ID("c"), {
        description: description({
          porteur: "prestataire",
          attribution: "locataire",
          reservationId,
          tarif: 1,
          marketplace: true,
        }),
      }),
    ).toEqual({ ok: false, raison: "interdit" });
    expect((await colonnes(ID("c")))?.["tarif_manuel_centimes"]).toBe(5500);
    // Le statut et l'horaire restent modifiables.
    expect(await modifier(page, ID("c"), { statut: "en_cours", heure: "11:00" })).toEqual({
      ok: true,
    });
    expect(
      await inserer(page, "missions", mission(ID("d"), { porteur: "prestataire", tarif: 12 })),
    ).toEqual({ ok: false, raison: "interdit" });
    expect(await inserer(page, "missions", mission(ID("e"), { porteur: "prestataire" }))).toEqual({
      ok: true,
    });
  });
});
