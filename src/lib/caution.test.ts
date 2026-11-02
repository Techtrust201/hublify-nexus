import { describe, expect, it } from "vitest";
import { cautionSuggeree, libelleStatutCaution, peutEncaisserCaution } from "./caution";

describe("prise de caution", () => {
  it("propose deux mois de loyer charges comprises", () => {
    expect(cautionSuggeree(850, 50)).toBe(1800);
    expect(cautionSuggeree(-10, 40)).toBe(80);
    expect(cautionSuggeree(Number.NaN, 10)).toBe(20);
  });

  it("nomme les statuts et n'encaisse qu'un montant positif encore dû", () => {
    expect(libelleStatutCaution("a_encaisser")).toBe("À encaisser");
    expect(libelleStatutCaution("encaissee")).toBe("Encaissée");
    expect(libelleStatutCaution("restituee")).toBe("Restituée");
    expect(peutEncaisserCaution(1700, "a_encaisser")).toBe(true);
    expect(peutEncaisserCaution(0, "a_encaisser")).toBe(false);
    expect(peutEncaisserCaution(1700, "encaissee")).toBe(false);
  });
});
