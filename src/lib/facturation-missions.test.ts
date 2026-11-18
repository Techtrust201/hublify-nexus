import { describe, expect, it } from "vitest";
import {
  chargeMandataireHt,
  fraisGestionMissions,
  mentionRegles,
  missionSousNouvellesRegles,
  prestationsLocataire,
  tarifPrestataireEuros,
  type FacturationMission,
  type FacturationOrg,
} from "@/lib/facturation-missions";

const VIDE: FacturationMission = {
  attribution: null,
  porteur: null,
  reservationId: null,
  tarifCentimes: null,
  tvaTaux: null,
};

function org(
  missions: Record<string, Partial<FacturationMission>>,
  autres: Partial<FacturationOrg> = {},
): FacturationOrg {
  return {
    dateEffet: "2026-12-01",
    tvaLocataire: null,
    reservations: {},
    ...autres,
    missions: Object.fromEntries(
      Object.entries(missions).map(([id, m]) => [id, { ...VIDE, ...m }]),
    ),
  };
}

const m = (id: string, type: string, date = "2026-12-05") => ({ id, type, date, bienId: "b" });

describe("date d'effet", () => {
  it("inactive sans date, avant la date ; active le jour même et après", () => {
    expect(missionSousNouvellesRegles(null, "2026-12-05")).toBe(false);
    expect(missionSousNouvellesRegles(org({}, { dateEffet: null }), "2026-12-05")).toBe(false);
    expect(missionSousNouvellesRegles(org({}), "2026-11-30")).toBe(false);
    expect(missionSousNouvellesRegles(org({}), "2026-12-01")).toBe(true);
  });
  it("une mission avant la date garde le barème même avec un tarif", () => {
    const f = org({ a: { attribution: "mandataire", tarifCentimes: 1 } });
    expect(fraisGestionMissions([m("a", "Check-in", "2026-11-30")], f)).toEqual([
      { nature: "Check-in", quantite: 1, prixUnitaireHt: 2_000, totalHt: 2_000 },
    ]);
  });
});

describe("facture propriétaire sous les nouvelles règles", () => {
  it("attribution vide : traitée comme le propriétaire (tarif, sinon barème)", () => {
    const f = org({ a: { tarifCentimes: 3_300 }, b: {} });
    expect(fraisGestionMissions([m("a", "Check-out"), m("b", "Check-out")], f)).toEqual([
      { nature: "Check-out", quantite: 1, prixUnitaireHt: 1_500, totalHt: 1_500 },
      { nature: "Check-out", quantite: 1, prixUnitaireHt: 3_300, totalHt: 3_300 },
    ]);
  });
  it("réalisée par le propriétaire : rien, même attribuée au propriétaire", () => {
    const f = org({ a: { attribution: "proprietaire", porteur: "proprietaire" } });
    expect(fraisGestionMissions([m("a", "Menage")], f)).toEqual([]);
  });
  it("linge (R4) : retiré seulement si la réservation dit Non au linge ET aux consommables", () => {
    const missions = [m("a", "Menage"), m("b", "Menage"), m("c", "Menage")];
    const f = org(
      {
        a: { reservationId: "r1" },
        b: { reservationId: "r2" },
        c: { reservationId: "r3" },
      },
      {
        reservations: {
          r1: { menage: true, linge: false, consommable: false },
          r2: { menage: true, linge: false, consommable: true },
          r3: { menage: null, linge: null, consommable: null },
        },
      },
    );
    expect(fraisGestionMissions(missions, f).find((l) => l.nature.startsWith("Linge"))).toEqual({
      nature: "Linge et consommables",
      quantite: 2,
      prixUnitaireHt: 1_200,
      totalHt: 2_400,
    });
  });
  it("ménage à la charge du locataire ou du mandataire : ni ménage ni linge chez le propriétaire", () => {
    const f = org({
      a: { attribution: "locataire", reservationId: "r" },
      b: { attribution: "mandataire" },
    });
    expect(fraisGestionMissions([m("a", "Menage"), m("b", "Menage")], f)).toEqual([]);
  });
});

describe("facture voyageur", () => {
  it("taux : celui de la mission, sinon celui de l'org, sinon 20 %", () => {
    const missions = [m("a", "Menage"), m("b", "Check-in"), m("c", "Check-out")];
    const base = { attribution: "locataire" as const, reservationId: "r", tarifCentimes: 1_000 };
    const f = org({ a: { ...base, tvaTaux: 0.055 }, b: base, c: base }, { tvaLocataire: 0 });
    expect(prestationsLocataire(missions, f, "r", "L").map((l) => l.tauxTva)).toEqual([
      0.055, 0, 0,
    ]);
    expect(
      prestationsLocataire(missions, { ...f, tvaLocataire: null }, "r", "L").map((l) => l.tauxTva),
    ).toEqual([0.055, 0.2, 0.2]);
  });
  it("sans tarif, autre réservation ou réalisée par le propriétaire : pas de ligne", () => {
    const f = org({
      a: { attribution: "locataire", reservationId: "r" },
      b: { attribution: "locataire", reservationId: "autre", tarifCentimes: 1_000 },
      c: {
        attribution: "locataire",
        reservationId: "r",
        tarifCentimes: 1_000,
        porteur: "proprietaire",
      },
    });
    expect(
      prestationsLocataire([m("a", "Menage"), m("b", "Menage"), m("c", "Menage")], f, "r", "L"),
    ).toEqual([]);
  });
});

describe("mandataire, prestataires, mention", () => {
  it("charge du mandataire : tarif, sinon barème ; rien si réalisée par le propriétaire", () => {
    const f = org({
      a: { attribution: "mandataire", tarifCentimes: 3_000 },
      b: { attribution: "mandataire" },
      c: { attribution: "mandataire", porteur: "proprietaire" },
    });
    expect(chargeMandataireHt([m("a", "Menage"), m("b", "Check-in"), m("c", "Menage")], f)).toBe(
      5_000,
    );
  });
  it("tarif prestataire : méta avant la date d'effet, serveur après", () => {
    const f = org({ a: { tarifCentimes: 3_750 } });
    expect(tarifPrestataireEuros({ id: "a", date: "2026-11-30" }, 20, f)).toBe(20);
    expect(tarifPrestataireEuros({ id: "a", date: "2026-12-01" }, 20, f)).toBe(37.5);
    expect(tarifPrestataireEuros({ id: "z", date: "2026-12-01" }, 20, f)).toBe(20);
  });
  it("mention seulement si une mission de la période suit les nouvelles règles", () => {
    expect(mentionRegles([{ date: "2026-11-30" }], org({}))).toBeNull();
    expect(mentionRegles([{ date: "2026-12-02" }], org({}))).toBe(
      "Règles de facturation en vigueur au 01/12/2026",
    );
  });
});
