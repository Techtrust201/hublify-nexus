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

  describe("lien reservationId", () => {
    const avecId = { ...sejour, id: "r-1" };

    it("associe d'abord par reservationId, même si locataire et logement diffèrent", () => {
      const l = loyer({
        id: "lie",
        locataire: "Autre Nom",
        bienNom: "Autre bien",
        reservationId: "r-1",
      });
      expect(loyerDuSejour([l], avecId)?.id).toBe("lie");
    });

    it("préfère le loyer lié au candidat de la règle historique", () => {
      const loyers = [
        loyer({ id: "regle" }),
        loyer({ id: "lie", reservationId: "r-1", echeance: "2026-03-20" }),
      ];
      expect(loyerDuSejour(loyers, avecId)?.id).toBe("lie");
    });

    it("ignore un loyer lié mais déjà validé et retombe sur la règle", () => {
      const loyers = [
        loyer({ id: "lie", reservationId: "r-1", valide: true }),
        loyer({ id: "regle" }),
      ];
      expect(loyerDuSejour(loyers, avecId)?.id).toBe("regle");
    });

    it("départage plusieurs loyers liés par l'échéance dans le séjour", () => {
      const loyers = [
        loyer({ id: "avant", reservationId: "r-1", echeance: "2026-01-05" }),
        loyer({ id: "pendant", reservationId: "r-1", echeance: "2026-03-05" }),
      ];
      expect(loyerDuSejour(loyers, avecId)?.id).toBe("pendant");
    });

    it("ne retombe pas sur la règle quand plusieurs loyers liés restent ambigus", () => {
      const loyers = [
        loyer({ id: "a", reservationId: "r-1", echeance: "2026-03-05" }),
        loyer({ id: "b", reservationId: "r-1", echeance: "2026-03-20" }),
        loyer({ id: "regle" }),
      ];
      expect(loyerDuSejour(loyers, avecId)).toBeNull();
    });

    it("ne prend jamais un loyer lié à un autre séjour via la règle historique", () => {
      expect(loyerDuSejour([loyer({ id: "ailleurs", reservationId: "r-2" })], avecId)).toBeNull();
    });

    it("sans identifiant de séjour, garde la règle historique", () => {
      expect(loyerDuSejour([loyer({ id: "l1", reservationId: "r-2" })], sejour)?.id).toBe("l1");
    });

    it("traite un lien null comme l'absence de lien", () => {
      expect(loyerDuSejour([loyer({ id: "l1", reservationId: null })], avecId)?.id).toBe("l1");
    });
  });
});
