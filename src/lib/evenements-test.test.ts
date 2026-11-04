import { describe, expect, it } from "vitest";
import { EVENEMENTS_MO1 } from "@/data/planning-mo1";
import { estEvenementDeTest } from "./evenements-test";

describe("événements laissés par les tests e2e", () => {
  it("reconnaît uniquement les titres Marqueur-* et Hors-ligne-*", () => {
    expect(estEvenementDeTest("Marqueur-k3f9")).toBe(true);
    expect(estEvenementDeTest("Hors-ligne-ab12")).toBe(true);
    expect(estEvenementDeTest("Marqueur festival")).toBe(false);
    expect(estEvenementDeTest("Marathon de Lyon")).toBe(false);
  });

  it("ne classe aucun événement de démonstration comme résidu de test", () => {
    for (const evenement of EVENEMENTS_MO1) {
      expect(estEvenementDeTest(evenement.titre)).toBe(false);
    }
  });
});
