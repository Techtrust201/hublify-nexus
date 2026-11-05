import { describe, expect, it } from "vitest";
import { EVENEMENTS_MO1 } from "@/data/planning-mo1";
import { datesEvenementPourAffichage, projeterDateDemo } from "@/lib/periode-demo";

describe("période de démonstration", () => {
  const maintenant = new Date(2026, 10, 4);

  it("décale le 4 mars 2026 sur le jour courant et laisse janvier en place", () => {
    const mars = projeterDateDemo(new Date(2026, 2, 4), maintenant);
    expect(mars.getFullYear()).toBe(2026);
    expect(mars.getMonth()).toBe(10);
    expect(mars.getDate()).toBe(4);
    const janvier = projeterDateDemo(new Date(2026, 0, 15), maintenant);
    expect(janvier.getMonth()).toBe(0);
    expect(janvier.getDate()).toBe(15);
  });

  it("affiche les événements semés sur la période courante sans changer le seed", () => {
    expect(EVENEMENTS_MO1.find((e) => e.id === "ev1")?.dates).toBe("27 avril – 2 mai 2026");
    const festival = datesEvenementPourAffichage("ev1", "27 avril – 2 mai 2026", maintenant);
    expect(festival).toBe("4 – 10 novembre 2026");
    expect(festival).not.toContain("avril");
    const marathon = datesEvenementPourAffichage("ev2", "3 mai 2026", maintenant);
    expect(marathon).toBe("6 novembre 2026");
    const saisi = datesEvenementPourAffichage("ev-utilisateur", "12 juin 2027", maintenant);
    expect(saisi).toBe("12 juin 2027");
  });
});
