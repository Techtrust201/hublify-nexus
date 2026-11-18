import { describe, expect, it } from "vitest";
import { ecrireDescription, type MetaPrestation } from "@/lib/gestionnaire-planning";
import {
  decisionReprise,
  requeteReprise,
  type MissionAReprendre,
} from "@/lib/reprise-meta-missions";

const ORG = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
function m(meta: MetaPrestation | null, colonnes: Partial<MissionAReprendre> = {}) {
  return {
    orgId: ORG,
    id: "m1",
    description: meta ? ecrireDescription("Consigne fictive", meta) : "Consigne fictive",
    attribution: null,
    porteur: null,
    reservationId: null,
    tarifManuelCentimes: null,
    ouverte: false,
    ...colonnes,
  } satisfies MissionAReprendre;
}

describe("decisionReprise — les cas des 5 missions prod (données fictives)", () => {
  it("mandataire sans tarif avec réservation", () => {
    expect(
      decisionReprise(
        m({ attribution: "mandataire", porteur: "prestataire", reservationId: "r1", linge: true }),
      ),
    ).toEqual({
      action: "maj",
      maj: { attribution: "mandataire", porteur: "prestataire", reservationId: "r1" },
    });
  });

  it("mandataire réalisée par le propriétaire", () => {
    expect(
      decisionReprise(
        m({ attribution: "mandataire", porteur: "proprietaire", reservationId: "r2" }),
      ),
    ).toEqual({
      action: "maj",
      maj: { attribution: "mandataire", porteur: "proprietaire", reservationId: "r2" },
    });
  });

  it("locataire avec tarif et réservation : tarif saisi → tarif manuel en centimes", () => {
    expect(
      decisionReprise(
        m({ attribution: "locataire", porteur: "prestataire", tarif: 45, reservationId: "r3" }),
      ),
    ).toEqual({
      action: "maj",
      maj: {
        attribution: "locataire",
        porteur: "prestataire",
        reservationId: "r3",
        tarifManuelCentimes: 4_500,
      },
    });
  });

  it("sans attribution, réalisée par un prestataire", () => {
    expect(decisionReprise(m({ porteur: "prestataire" }))).toEqual({
      action: "maj",
      maj: { porteur: "prestataire" },
    });
  });

  it("proposée sur la marketplace → ouverte", () => {
    expect(decisionReprise(m({ porteur: "prestataire", marketplace: true }))).toEqual({
      action: "maj",
      maj: { porteur: "prestataire", ouverte: true },
    });
  });
});

describe("decisionReprise — garde-fous", () => {
  it("sans méta : rien", () => {
    expect(decisionReprise(m(null))).toEqual({ action: "rien" });
  });

  it("idempotent : colonnes déjà remplies, rien à écrire", () => {
    const meta: MetaPrestation = {
      attribution: "locataire",
      porteur: "prestataire",
      tarif: 45,
      reservationId: "r3",
      marketplace: true,
    };
    expect(
      decisionReprise(
        m(meta, {
          attribution: "locataire",
          porteur: "prestataire",
          reservationId: "r3",
          tarifManuelCentimes: 4_500,
          ouverte: true,
        }),
      ),
    ).toEqual({ action: "rien" });
  });

  it("n'écrase jamais une colonne déjà remplie", () => {
    expect(
      decisionReprise(m({ attribution: "mandataire", tarif: 10 }, { tarifManuelCentimes: 999 })),
    ).toEqual({ action: "maj", maj: { attribution: "mandataire" } });
  });

  it("locataire sans réservation : ignorée (contrainte de la migration 022)", () => {
    expect(decisionReprise(m({ attribution: "locataire", tarif: 30 }))).toEqual({
      action: "ignoree",
      raison: "locataire_sans_reservation",
    });
  });

  it("valeurs inconnues ou tarif invalide : non reprises", () => {
    expect(
      decisionReprise(
        m({
          attribution: "autre" as NonNullable<MetaPrestation["attribution"]>,
          porteur: "x" as NonNullable<MetaPrestation["porteur"]>,
          tarif: -5,
          reservationId: "  ",
        }),
      ),
    ).toEqual({ action: "rien" });
  });

  it("arrondit le tarif au centime", () => {
    expect(decisionReprise(m({ tarif: 70.555 }))).toEqual({
      action: "maj",
      maj: { tarifManuelCentimes: 7_056 },
    });
  });
});

describe("requeteReprise", () => {
  it("garde chaque colonne en SQL et cible org + id", () => {
    const q = requeteReprise(ORG, "m1", {
      attribution: "locataire",
      reservationId: "r3",
      tarifManuelCentimes: 4_500,
      ouverte: true,
    });
    expect(q.texte).toContain("attribution = case when attribution is null then $1");
    expect(q.texte).toContain("reservation_id = case when reservation_id is null then $2");
    expect(q.texte).toContain("tarif_manuel_centimes is null then $3");
    expect(q.texte).toContain("ouverte = case when not ouverte then $4");
    expect(q.texte).toMatch(/where org_id = \$5::uuid and id = \$6$/);
    expect(q.params).toEqual(["locataire", "r3", 4_500, true, ORG, "m1"]);
  });
});
