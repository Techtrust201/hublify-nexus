import { describe, expect, it } from "vitest";
import { jourLocalIso } from "@/lib/jour-local";

describe("jourLocalIso", () => {
  it("renvoie le jour local, pas le jour UTC (00h30 locale)", () => {
    // Construit en heure locale : valable quel que soit le fuseau de la machine de test.
    const ref = new Date(2026, 10, 14, 0, 30, 0);
    expect(jourLocalIso(ref)).toBe("2026-11-14");
  });

  it("renvoie le jour local à 23h59", () => {
    expect(jourLocalIso(new Date(2026, 0, 5, 23, 59, 59))).toBe("2026-01-05");
  });

  it("complète le mois et le jour sur deux chiffres", () => {
    expect(jourLocalIso(new Date(2026, 2, 4, 12))).toBe("2026-03-04");
  });
});
