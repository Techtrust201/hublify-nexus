import { describe, expect, it } from "vitest";
import {
  echeanceIso,
  rattachementsNonAmbigus,
  type LoyerARattacher,
  type SejourCandidat,
} from "@/lib/rattachement-loyers";

const loyer = (p: Partial<LoyerARattacher> = {}): LoyerARattacher => ({
  orgId: "o1",
  id: "ly1",
  locataire: "Sophie Martin",
  bienNom: "Suzette",
  echeance: "2026-03-05",
  reservationId: null,
  ...p,
});
const sejour = (p: Partial<SejourCandidat> = {}): SejourCandidat => ({
  orgId: "o1",
  id: "r1",
  occupant: "Sophie Martin",
  bienNom: "Suzette",
  arrivee: "2026-03-03",
  depart: "2026-03-10",
  statut: "Confirmé",
  ...p,
});

describe("echeanceIso", () => {
  it("lit l'ISO et le format français", () => {
    expect(echeanceIso("2026-03-05")).toBe("2026-03-05");
    expect(echeanceIso("05 mars 2026")).toBe("2026-03-05");
    expect(echeanceIso("1 février 2026")).toBe("2026-02-01");
  });
  it("renvoie null pour une date illisible ou impossible", () => {
    expect(echeanceIso("")).toBeNull();
    expect(echeanceIso("31 février 2026")).toBeNull();
    expect(echeanceIso("5 marsss 2026")).toBeNull();
  });
});

describe("rattachementsNonAmbigus", () => {
  it("rattache un correspondant unique", () => {
    expect(rattachementsNonAmbigus([loyer()], [sejour()])).toEqual([
      { orgId: "o1", loyerId: "ly1", reservationId: "r1" },
    ]);
  });
  it("accepte l'échéance en français", () => {
    expect(rattachementsNonAmbigus([loyer({ echeance: "05 mars 2026" })], [sejour()])).toHaveLength(
      1,
    );
  });
  it("ne fait rien si l'échéance est hors séjour", () => {
    expect(rattachementsNonAmbigus([loyer({ echeance: "01 mars 2026" })], [sejour()])).toEqual([]);
  });
  it("ne fait rien si deux séjours correspondent", () => {
    expect(rattachementsNonAmbigus([loyer()], [sejour(), sejour({ id: "r2" })])).toEqual([]);
  });
  it("ignore les séjours annulés", () => {
    expect(rattachementsNonAmbigus([loyer()], [sejour({ statut: "Annulé" })])).toEqual([]);
    expect(
      rattachementsNonAmbigus([loyer()], [sejour({ statut: "Annulé" }), sejour({ id: "r2" })]),
    ).toEqual([{ orgId: "o1", loyerId: "ly1", reservationId: "r2" }]);
  });
  it("ne mélange pas les organisations, locataires ni logements", () => {
    expect(rattachementsNonAmbigus([loyer()], [sejour({ orgId: "o2" })])).toEqual([]);
    expect(rattachementsNonAmbigus([loyer()], [sejour({ occupant: "Autre" })])).toEqual([]);
    expect(rattachementsNonAmbigus([loyer()], [sejour({ bienNom: "Autre" })])).toEqual([]);
  });
  it("ne réécrit jamais un lien existant", () => {
    expect(rattachementsNonAmbigus([loyer({ reservationId: "rX" })], [sejour()])).toEqual([]);
  });
});
