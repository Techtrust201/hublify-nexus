import { describe, expect, it } from "vitest";
import {
  decisionDossier,
  decisionMission,
  fichierAutorise,
  type ActeurFichier,
} from "@/lib/acces-fichiers";
import type { Sql } from "@/lib/sql";

const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";

const DOSSIERS: Record<string, Record<string, { email: string; nom: string }>> = {
  [ORG_A]: {
    "dos-jean": { email: "jean.martin@hublify.app", nom: "Jean Martin" },
    "dos-sophie": { email: "sophie.martin@hublify.app", nom: "Sophie Martin" },
  },
  [ORG_B]: {
    "dos-paul": { email: "paul@autre.test", nom: "Paul Autre" },
  },
};

const RESAS: Record<string, Record<string, { email: string; nom: string }>> = {
  [ORG_A]: {
    "resa-sophie": { email: "sophie.martin@hublify.app", nom: "Sophie Martin" },
    "resa-jean": { email: "jean.martin@hublify.app", nom: "Jean Martin" },
  },
};

function sqlFichiers() {
  const appels: { texte: string; valeurs: unknown[] }[] = [];
  const query = (texte: string, valeurs: unknown[] = []) => {
    appels.push({ texte, valeurs });
    const repondre = () => {
      const orgId = String(valeurs[0] ?? "");
      const id = String(valeurs[1] ?? "");
      if (texte.includes("dossiers_location"))
        return DOSSIERS[orgId]?.[id] ? [DOSSIERS[orgId][id]] : [];
      if (texte.includes("reservations_dossier"))
        return RESAS[orgId]?.[id] ? [RESAS[orgId][id]] : [];
      if (texte.includes("liens_org")) {
        return orgId === ORG_B ? [{ id: ORG_A }] : [];
      }
      if (texte.includes("from public.missions")) {
        if (orgId !== ORG_A) return [];
        if (id === "ms-lucas") return [{ assigne: "Lucas Ménage", org_prestataire_id: ORG_B }];
        if (id === "ms-autre") return [{ assigne: "Autre Société", org_prestataire_id: null }];
        return [];
      }
      return [];
    };
    return Promise.resolve(repondre());
  };
  const tag = Object.assign(async () => [], { query }) as Sql;
  return { tag, appels };
}

function acteur(partiel: Partial<ActeurFichier> & Pick<ActeurFichier, "roleId">): ActeurFichier {
  return {
    userId: "user-1",
    orgId: ORG_A,
    orgType: "gestionnaire",
    droits: [],
    email: "",
    prenom: "",
    nom: "",
    ...partiel,
  };
}

describe("decisionDossier", () => {
  it("laisse le gestionnaire lire et écrire un dossier de son organisation", () => {
    const base = {
      roleId: "gestionnaire" as const,
      droits: ["voir-documents", "mod-reservations"],
      trouve: true,
      correspond: false,
    };
    expect(decisionDossier({ ...base, ecriture: false })).toBe(true);
    expect(decisionDossier({ ...base, ecriture: true })).toBe(true);
  });

  it("refuse le lecteur, le prestataire et le propriétaire même si la ligne existe", () => {
    for (const roleId of ["lecteur", "prestataire", "proprietaire"] as const) {
      expect(
        decisionDossier({
          roleId,
          droits: ["voir-documents", "mod-missions"],
          ecriture: false,
          trouve: true,
          correspond: true,
        }),
      ).toBe(false);
    }
  });
});

describe("fichierAutorise — deux comptes, deux organisations", () => {
  const jean = acteur({
    roleId: "locataire",
    email: "jean.martin@hublify.app",
    prenom: "Jean",
    nom: "Martin",
    droits: ["voir-documents", "messagerie"],
  });
  const sophie = acteur({
    roleId: "voyageur",
    email: "sophie.martin@hublify.app",
    prenom: "Sophie",
    nom: "Martin",
    droits: ["voir-documents"],
  });

  it("autorise l'occupant sur son dossier et refuse celui d'un autre occupant", async () => {
    const jeanSql = sqlFichiers();
    expect(await fichierAutorise(jeanSql.tag, jean, "dossier", "dos-jean:piece-id", true)).toEqual({
      ok: true,
    });
    expect(jeanSql.appels[0]?.valeurs[0]).toBe(ORG_A);
    expect(jeanSql.appels[0]?.valeurs).not.toContain(ORG_B);

    const croise = sqlFichiers();
    expect(
      await fichierAutorise(croise.tag, jean, "dossier", "dos-sophie:piece-id", false),
    ).toEqual({ ok: false, erreur: "Droits insuffisants." });
  });

  it("refuse un dossier d'une autre organisation", async () => {
    const { tag, appels } = sqlFichiers();
    const resultat = await fichierAutorise(tag, jean, "dossier", "dos-paul:piece-id", true);
    expect(resultat.ok).toBe(false);
    expect(appels[0]?.valeurs[0]).toBe(ORG_A);
    expect(appels.flatMap((appel) => appel.valeurs)).not.toContain(ORG_B);
  });

  it("refuse le lecteur et le prestataire sur le dossier d'un tiers", async () => {
    const lecteur = acteur({
      roleId: "lecteur",
      droits: ["voir-documents", "voir-biens"],
      email: "claire.lecture@hublify.app",
      prenom: "Claire",
      nom: "Lecture",
    });
    const presta = acteur({
      roleId: "prestataire",
      orgId: ORG_B,
      orgType: "prestataire",
      droits: ["voir-documents", "mod-missions"],
      email: "lucas.menage@hublify.app",
      prenom: "Lucas",
      nom: "Ménage",
    });
    expect(
      (await fichierAutorise(sqlFichiers().tag, lecteur, "dossier", "dos-jean:piece-id", false)).ok,
    ).toBe(false);
    expect(
      (await fichierAutorise(sqlFichiers().tag, lecteur, "dossier", "dos-jean:piece-id", true)).ok,
    ).toBe(false);
    expect(
      (await fichierAutorise(sqlFichiers().tag, presta, "dossier", "dos-jean:piece-id", true)).ok,
    ).toBe(false);
  });

  it("laisse le voyageur déposer sa pièce de pré-check-in et pas celle d'un autre", async () => {
    expect(
      (await fichierAutorise(sqlFichiers().tag, sophie, "dossier", "precheckin:resa-sophie", true))
        .ok,
    ).toBe(true);
    expect(
      (await fichierAutorise(sqlFichiers().tag, sophie, "dossier", "precheckin:resa-jean", false))
        .ok,
    ).toBe(false);
    expect(
      (await fichierAutorise(sqlFichiers().tag, sophie, "dossier", "precheckin:", true)).ok,
    ).toBe(false);
  });

  it("limite les photos de mission du prestataire à ses interventions", async () => {
    const lucas = acteur({
      roleId: "prestataire",
      orgId: ORG_B,
      orgType: "prestataire",
      droits: ["mod-missions", "voir-documents"],
      email: "lucas.menage@hublify.app",
      prenom: "Lucas",
      nom: "Ménage",
    });
    expect((await fichierAutorise(sqlFichiers().tag, lucas, "mission", "ms-lucas", true)).ok).toBe(
      true,
    );
    expect((await fichierAutorise(sqlFichiers().tag, lucas, "mission", "ms-autre", true)).ok).toBe(
      false,
    );
    expect(
      decisionMission({
        roleId: "locataire",
        droits: ["voir-documents"],
        ecriture: false,
        trouve: true,
        affecte: false,
      }),
    ).toBe(false);
  });
});
