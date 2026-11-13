import { describe, expect, it } from "vitest";
import {
  chargerEntite,
  ecrireCollections,
  insererEntite,
  modifierEntite,
  lireEtat,
  type DepsEtat,
} from "@/data/etat-distant";
import { etatVide, type EtatSession } from "@/data/etat-session";
import { DROITS_PAR_ROLE, type DroitId, type RoleId } from "@/auth/permissions";
import type { Sql } from "@/lib/sql";

const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";

function sqlEspion(lignes: unknown[] = []) {
  const appels: { texte: string; valeurs: unknown[] }[] = [];
  const query = (texte: string, valeurs: unknown[] = []) => {
    appels.push({ texte, valeurs });
    return Promise.resolve(lignes);
  };
  const tag = Object.assign(
    (_g: TemplateStringsArray, ..._v: unknown[]) => Promise.resolve(lignes),
    { query },
  ) as Sql;
  return { tag, appels };
}

function deps(
  options: Partial<{
    orgId: string | null;
    orgType: "gestionnaire" | "prestataire";
    roleId: RoleId;
    lignes: unknown[];
    sansSql: boolean;
    droits: readonly DroitId[];
  }> = {},
) {
  const espion = sqlEspion(options.lignes ?? []);
  const orgId = "orgId" in options ? (options.orgId ?? null) : ORG_A;
  const roleId = options.roleId ?? "administrateur";
  const d: DepsEtat = {
    sessionOrg: async () =>
      orgId
        ? {
            orgId,
            orgType: options.orgType ?? "gestionnaire",
            roleId,
            droits: options.droits ? [...options.droits] : [...DROITS_PAR_ROLE[roleId]],
          }
        : null,
    sql: () => (options.sansSql ? null : espion.tag),
  };
  return { d, espion };
}

describe("lireEtat", () => {
  it("refuse une requête sans session", async () => {
    const { d, espion } = deps({ orgId: null });
    expect(await lireEtat(d)).toEqual({ ok: false, raison: "non_authentifie" });
    expect(espion.appels).toHaveLength(0);
  });

  it("signale l'absence de base sans échouer", async () => {
    const { d } = deps({ sansSql: true });
    expect(await lireEtat(d)).toEqual({ ok: false, raison: "non_configure" });
  });

  it("ne requête que l'org issue de la session", async () => {
    const { d, espion } = deps({ lignes: [] });
    const res = await lireEtat(d);
    expect(res.ok).toBe(true);
    expect(espion.appels.some((a) => a.valeurs.includes(ORG_A))).toBe(true);
    expect(espion.appels.some((a) => a.valeurs.includes(ORG_B))).toBe(false);
  });
});

describe("ecrireCollections", () => {
  it("refuse une écriture sans session", async () => {
    const { d, espion } = deps({ orgId: null });
    expect(await ecrireCollections(d, { evenements: [] })).toEqual({
      ok: false,
      raison: "non_authentifie",
    });
    expect(espion.appels).toHaveLength(0);
  });

  it("refuse une écriture au rôle lecture", async () => {
    const { d } = deps({ roleId: "lecteur" });
    expect(await ecrireCollections(d, { evenements: [] })).toEqual({
      ok: false,
      raison: "interdit",
    });
  });

  it("écrit sur l'org de session, jamais une org tierce", async () => {
    const { d, espion } = deps();
    const patch: Partial<EtatSession> = {
      evenements: [
        { id: "e1", titre: "x", lieu: "", dates: "", impact: "Impact modéré", description: "" },
      ],
    };
    expect(await ecrireCollections(d, patch)).toEqual({ ok: true });
    expect(espion.appels[0]?.valeurs[0]).toBe(ORG_A);
    expect(espion.appels.flatMap((a) => a.valeurs)).not.toContain(ORG_B);
  });

  it("refuse au locataire de remplacer la collection des réservations", async () => {
    const { d, espion } = deps({ roleId: "locataire" });
    expect(await ecrireCollections(d, { reservationsDossier: [] })).toEqual({
      ok: false,
      raison: "interdit",
    });
    expect(espion.appels).toHaveLength(0);
  });

  it("refuse au voyageur d'insérer une réservation ou un montant négatif", async () => {
    const voyageur = deps({ roleId: "voyageur" });
    expect(
      await insererEntite(voyageur.d, "reservationsDossier", {
        id: "r-pirate",
        montant: 1,
        arrivee: "2026-05-01",
        depart: "2026-05-03",
      } as { id: string }),
    ).toEqual({ ok: false, raison: "interdit" });
    const admin = deps();
    expect(
      await insererEntite(admin.d, "reservationsDossier", {
        id: "r-neg",
        montant: -12,
        arrivee: "2026-05-04",
        depart: "2026-05-01",
      } as { id: string }),
    ).toEqual({ ok: false, raison: "invalide" });
  });

  it("limite le voyageur au pré-check-in de sa réservation", async () => {
    const { d } = deps({
      roleId: "voyageur",
      lignes: [{ email: "autre@hublify.app", occupant: "Autre" }],
    });
    expect(
      await modifierEntite(d, "reservationsDossier", "r-autre", {
        montant: 1,
        precheckinNote: "note",
      }),
    ).toEqual({ ok: false, raison: "introuvable" });
  });
});

describe("insererEntite / chargerEntite", () => {
  it("insère sans prendre d'org_id client", async () => {
    const { d, espion } = deps();
    expect(await insererEntite(d, "evenements", { id: "e-x" })).toEqual({ ok: true });
    expect(espion.appels[0]?.valeurs[0]).toBe(ORG_A);
  });

  it("refuse à un gestionnaire restreint la lecture d'un document par identifiant", async () => {
    const { d, espion } = deps({
      roleId: "gestionnaire",
      droits: ["messagerie"],
    });
    expect(await chargerEntite(d, "documents", "o1")).toEqual({
      ok: false,
      raison: "interdit",
    });
    expect(espion.appels).toHaveLength(0);
  });

  it("refuse à un gestionnaire messagerie seule une notification par identifiant", async () => {
    const { d, espion } = deps({
      roleId: "gestionnaire",
      droits: ["messagerie"],
      lignes: [{ id: "n-loyer", titre: "Loyer à valider", detail: "Sophie Martin · 850 €" }],
    });
    expect(await chargerEntite(d, "notifications", "n-loyer")).toEqual({
      ok: false,
      raison: "interdit",
    });
    expect(espion.appels).toHaveLength(0);
  });

  it("lit une notification pour un gestionnaire qui voit les réservations", async () => {
    const ligne = { id: "n-loyer", titre: "Loyer à valider", detail: "Sophie Martin · 850 €" };
    const { d } = deps({
      roleId: "gestionnaire",
      droits: ["voir-reservations"],
      lignes: [ligne],
    });
    expect(await chargerEntite(d, "notifications", "n-loyer")).toEqual({
      ok: true,
      entite: ligne,
    });
  });

  it("ne trouve pas une ligne d'une autre org", async () => {
    const { d, espion } = deps({ lignes: [] });
    expect(await chargerEntite(d, "reservationsDossier", "r-secret")).toEqual({
      ok: false,
      raison: "introuvable",
    });
    expect(espion.appels[0]?.valeurs).toEqual([ORG_A, "r-secret"]);
  });
});

describe("etatVide", () => {
  it("n'embarque aucun parc Redris", () => {
    const vide = etatVide();
    expect(vide.biens).toEqual([]);
    expect(JSON.stringify(vide)).not.toMatch(/Suzette|Sophie Martin/i);
  });
});

describe("séjour lié à un logement inexistant (HUBLIFY-NEXUS-4)", () => {
  const sejour = (id: string, bienId: string) => ({
    id,
    bienId,
    voyageur: "Ada",
    arrivee: "2026-11-11",
    depart: "2026-11-13",
  });

  function depsBiens(idsConnus: string[]) {
    const appels: { texte: string; valeurs: unknown[] }[] = [];
    const query = (texte: string, valeurs: unknown[] = []) => {
      appels.push({ texte, valeurs });
      if (/select id from public\.biens/i.test(texte)) {
        return Promise.resolve(idsConnus.map((id) => ({ id })));
      }
      if (/select 1 from public\.biens/i.test(texte)) {
        const demande = String(valeurs[1] ?? "");
        return Promise.resolve(idsConnus.includes(demande) ? [{ "?column?": 1 }] : []);
      }
      return Promise.resolve([]);
    };
    const tag = Object.assign(
      (_g: TemplateStringsArray, ..._v: unknown[]) => Promise.resolve([]),
      { query },
    ) as Sql;
    const d: DepsEtat = {
      sessionOrg: async () => ({
        orgId: ORG_A,
        orgType: "gestionnaire",
        roleId: "administrateur",
        droits: [...DROITS_PAR_ROLE.administrateur],
      }),
      sql: () => tag,
    };
    return { d, appels };
  }

  it("ignore un séjour orphelin dans un remplacement sans vider ni échouer", async () => {
    const { d, appels } = depsBiens(["colette"]);
    expect(
      await ecrireCollections(d, {
        reservationsCalendrier: [
          sejour("r-ok", "colette"),
          sejour("r-orphelin", "logement-inexistant"),
        ],
      }),
    ).toEqual({ ok: true });
    const inserts = appels.filter((a) => /insert into public\.reservations_cal/i.test(a.texte));
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.valeurs).toContain("r-ok");
    expect(appels.flatMap((a) => a.valeurs)).not.toContain("r-orphelin");
    expect(appels.flatMap((a) => a.valeurs)).not.toContain("logement-inexistant");
  });

  it("n'efface pas le calendrier si le patch ne contient que des séjours orphelins", async () => {
    const { d, appels } = depsBiens(["colette"]);
    expect(
      await ecrireCollections(d, {
        reservationsCalendrier: [sejour("r-orphelin", "fantome")],
      }),
    ).toEqual({ ok: true });
    expect(appels.some((a) => /delete from public\.reservations_cal/i.test(a.texte))).toBe(false);
    expect(appels.some((a) => /insert into public\.reservations_cal/i.test(a.texte))).toBe(false);
  });

  it("accepte un séjour dont le logement est créé dans le même patch", async () => {
    const { d, appels } = depsBiens([]);
    expect(
      await ecrireCollections(d, {
        biens: [
          {
            id: "nouveau",
            nom: "Nouveau",
            adresse: "",
            typologie: "T2",
            surface: "",
            meuble: true,
            proprietaire: "",
            initiales: "N",
            note: 0,
            statut: "actif",
            baseNuit: 0,
            fiche: {},
          },
        ],
        reservationsCalendrier: [sejour("r-neuf", "nouveau")],
      } as unknown as Partial<EtatSession>),
    ).toEqual({ ok: true });
    const inserts = appels.filter((a) => /insert into public\.reservations_cal/i.test(a.texte));
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.valeurs).toContain("r-neuf");
  });

  it("refuse l'insertion et le changement de logement vers un bien absent", async () => {
    const { d } = depsBiens(["colette"]);
    expect(await insererEntite(d, "reservationsCalendrier", sejour("r-x", "fantome"))).toEqual({
      ok: false,
      raison: "invalide",
    });
    expect(await modifierEntite(d, "reservationsCalendrier", "r-x", { bienId: "fantome" })).toEqual({
      ok: false,
      raison: "invalide",
    });
    expect(await insererEntite(d, "reservationsCalendrier", sejour("r-ok", "colette"))).toEqual({
      ok: true,
    });
  });
});
