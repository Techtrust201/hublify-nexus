import { describe, expect, it } from "vitest";
import {
  chargerEntite,
  ecrireCollections,
  insererEntite,
  lireEtat,
  type DepsEtat,
} from "@/data/etat-distant";
import { etatVide, type EtatSession } from "@/data/etat-session";
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
    roleId: "administrateur" | "lecteur" | "prestataire";
    lignes: unknown[];
    sansSql: boolean;
  }> = {},
) {
  const espion = sqlEspion(options.lignes ?? []);
  const orgId = "orgId" in options ? options.orgId ?? null : ORG_A;
  const d: DepsEtat = {
    sessionOrg: async () =>
      orgId
        ? {
            orgId,
            orgType: options.orgType ?? "gestionnaire",
            roleId: options.roleId ?? "administrateur",
            droits: ["mod-reservations", "mod-finances", "gerer-equipe", "mod-missions", "messagerie", "mod-biens"],
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
      evenements: [{ id: "e1", titre: "x", lieu: "", dates: "", impact: "Impact modéré", description: "" }],
    };
    expect(await ecrireCollections(d, patch)).toEqual({ ok: true });
    expect(espion.appels[0]?.valeurs[0]).toBe(ORG_A);
    expect(espion.appels.flatMap((a) => a.valeurs)).not.toContain(ORG_B);
  });
});

describe("insererEntite / chargerEntite", () => {
  it("insère sans prendre d'org_id client", async () => {
    const { d, espion } = deps();
    expect(await insererEntite(d, "evenements", { id: "e-x" })).toEqual({ ok: true });
    expect(espion.appels[0]?.valeurs[0]).toBe(ORG_A);
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
