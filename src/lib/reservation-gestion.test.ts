import { describe, expect, it } from "vitest";
import { depuisChoix, gestionDepuisEntree, versChoix } from "@/lib/reservation-gestion";

describe("gestion Oui / Non d'une réservation", () => {
  it("non renseigné reste non renseigné (aucun « Non » par défaut)", () => {
    expect(versChoix(undefined)).toBe("");
    expect(versChoix(null)).toBe("");
    expect(depuisChoix("")).toBeNull();
  });

  it("Oui et Non font l'aller-retour", () => {
    expect(depuisChoix(versChoix(true))).toBe(true);
    expect(depuisChoix(versChoix(false))).toBe(false);
  });

  it("ne retient que true, false et null, et seulement les clés présentes", () => {
    expect(gestionDepuisEntree({ id: "r1", menageGere: true })).toEqual({ menageGere: true });
    expect(gestionDepuisEntree({ menageGere: "oui", lingeGere: 0, consommableGere: null })).toEqual(
      { consommableGere: null },
    );
    expect(gestionDepuisEntree({ occupant: "X" })).toEqual({});
  });
});
