import { describe, expect, it } from "vitest";
import { ibanValide } from "@/lib/iban";
import { validerIbanServeur } from "@/data/parametres-remote";

describe("validation IBAN", () => {
  it("accepte un IBAN FR de test et refuse une clé altérée", () => {
    expect(ibanValide("FR14 2004 1010 0505 0001 3M02 606")).toBe(true);
    expect(ibanValide("FR1420041010050500013M02606")).toBe(true);
    expect(ibanValide("FR14 2004 1010 0505 0001 3M02 607")).toBe(false);
    expect(ibanValide("")).toBe(false);
    expect(ibanValide("FR00")).toBe(false);
  });

  it("expose la même règle côté serveur", () => {
    expect(validerIbanServeur("FR14 2004 1010 0505 0001 3M02 606")).toBe(true);
    expect(validerIbanServeur("DE00")).toBe(false);
  });
});
