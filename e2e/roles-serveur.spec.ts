import { expect, test, type Page } from "@playwright/test";

const MOT_DE_PASSE = process.env["DEMO_AUTH_PASSWORD"] ?? "";

test.skip(!process.env["DATABASE_URL"], "DATABASE_URL absent : npm run db:prepare");

const COMPTES = {
  locataire: "jean.martin@hublify.app",
  voyageur: "sophie.martin@hublify.app",
  proprietaire: "pierre.moreau@hublify.app",
  lecteur: "claire.lecture@hublify.app",
  prestataire: "lucas.menage@hublify.app",
} as const;

async function connecter(page: Page, email: string) {
  const reponse = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password: MOT_DE_PASSE },
  });
  expect(reponse.ok(), `connexion ${email}`).toBeTruthy();
  await page.goto(email === COMPTES.lecteur ? "/" : "/espace");
  await page.waitForLoadState("networkidle");
}

async function etatDistant(page: Page) {
  return page.evaluate(async () => {
    const mod = await import("/src/data/session-remote.ts");
    return mod.chargerEtatDistant();
  });
}

test.describe("appels serveur directs", () => {
  test("un locataire ne reçoit pas le parc et ne peut pas le vider", async ({ page }) => {
    await connecter(page, COMPTES.locataire);
    const lecture = await etatDistant(page);
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    const brut = JSON.stringify(lecture.payload);
    expect(brut).not.toMatch(/sophie\.martin@hublify\.app/i);
    expect(brut).not.toContain("c-louisette");
    expect(lecture.payload.reservationsDossier.every((r) => r.bienId === "colette")).toBe(true);

    const ecriture = await page.evaluate(async () => {
      const mod = await import("/src/data/session-remote.ts");
      return mod.sauverEtatDistant({ data: { patch: { reservationsDossier: [] } } });
    });
    expect(ecriture).toEqual({ ok: false, raison: "interdit" });
  });

  test("un voyageur ne voit que ses séjours et ne crée pas de réservation", async ({ page }) => {
    await connecter(page, COMPTES.voyageur);
    const lecture = await etatDistant(page);
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    expect(
      lecture.payload.reservationsDossier.every((r) => r.email === COMPTES.voyageur),
    ).toBe(true);
    const creation = await page.evaluate(async () => {
      const mod = await import("/src/data/session-remote.ts");
      return mod.insererLigneMetier({
        data: {
          collection: "reservationsDossier",
          item: {
            id: "r-pirate-e2e",
            bienId: "suzette",
            occupant: "Intrus",
            email: "intrus@example.com",
            arrivee: "2026-08-01",
            depart: "2026-08-04",
            montant: 10,
          },
        },
      });
    });
    expect(creation).toEqual({ ok: false, raison: "interdit" });
  });

  test("un propriétaire ne reçoit pas la messagerie d'équipe", async ({ page }) => {
    await connecter(page, COMPTES.proprietaire);
    const lecture = await etatDistant(page);
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    expect(lecture.payload.conversations.every((c) => c.type !== "team")).toBe(true);
    expect(lecture.payload.biens.every((b) => (b.proprietaire ?? "").includes("Moreau"))).toBe(
      true,
    );
    expect(lecture.payload.dossiersLocation).toEqual([]);
  });

  test("le rôle lecture ne reçoit pas les loyers", async ({ page }) => {
    await connecter(page, COMPTES.lecteur);
    const lecture = await etatDistant(page);
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    expect(lecture.payload.loyers).toEqual([]);
    expect(lecture.payload.biens.length).toBeGreaterThan(0);
  });

  test("un prestataire ne lit pas les réservations du gestionnaire", async ({ page }) => {
    await connecter(page, COMPTES.prestataire);
    const lecture = await etatDistant(page);
    expect(lecture.ok).toBe(true);
    if (!lecture.ok) return;
    expect(lecture.payload.reservationsDossier).toEqual([]);
    expect(lecture.payload.loyers).toEqual([]);
    expect(JSON.stringify(lecture.payload)).not.toMatch(/jean\.martin@hublify\.app/i);
  });
});
