import { describe, expect, it } from "vitest";
import { loyerDuSejour, type LoyerRelance } from "@/lib/relance-loyer";

const sejour = {
  occupant: "Jean Martin",
  logement: "Appartement Colette",
  checkIn: "2026-03-01",
  checkOut: "2026-03-31",
};

const loyer = (p: Partial<LoyerRelance> & { id: string }): LoyerRelance => ({
  locataire: "Jean Martin",
  bienNom: "Appartement Colette",
  echeance: "2026-03-05",
  valide: false,
  ...p,
});

describe("loyerDuSejour", () => {
  it("associe le loyer du même locataire et du même logement", () => {
    expect(loyerDuSejour([loyer({ id: "l1" })], sejour)?.id).toBe("l1");
  });

  it("ignore le loyer du même locataire sur un autre logement", () => {
    expect(loyerDuSejour([loyer({ id: "l1", bienNom: "Villa Lavandrix" })], sejour)).toBeNull();
  });

  it("ignore un loyer déjà validé", () => {
    expect(loyerDuSejour([loyer({ id: "l1", valide: true })], sejour)).toBeNull();
  });

  it("ignore la casse et les espaces", () => {
    const l = loyer({ id: "l1", locataire: "  jean   MARTIN ", bienNom: "appartement colette" });
    expect(loyerDuSejour([l], sejour)?.id).toBe("l1");
  });

  it("départage deux loyers du même logement par l'échéance dans le séjour", () => {
    const loyers = [
      loyer({ id: "avant", echeance: "2026-01-05" }),
      loyer({ id: "pendant", echeance: "2026-03-05" }),
    ];
    expect(loyerDuSejour(loyers, sejour)?.id).toBe("pendant");
  });

  it("ne choisit aucun loyer quand l'association reste ambiguë", () => {
    const loyers = [
      loyer({ id: "a", echeance: "2026-03-05" }),
      loyer({ id: "b", echeance: "2026-03-20" }),
    ];
    expect(loyerDuSejour(loyers, sejour)).toBeNull();
  });
});
