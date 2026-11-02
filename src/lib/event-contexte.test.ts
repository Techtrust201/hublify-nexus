import { describe, expect, it } from "vitest";

/** Miroir de la logique PlanningGrid : conserver date + bien au clic « événement ». */
function contexteEvenementDepuisCase(bienId: string, date: string) {
  return { debut: date, bienId };
}

describe("création note/événement depuis une case", () => {
  it("préremplit la date et le bien cliqués", () => {
    const ctx = contexteEvenementDepuisCase("suzette", "2026-11-04");
    expect(ctx.debut).toBe("2026-11-04");
    expect(ctx.bienId).toBe("suzette");
    const bienNom = [{ id: "suzette", nom: "Suzette" }].find((b) => b.id === ctx.bienId)?.nom;
    expect(bienNom).toBe("Suzette");
  });
});
