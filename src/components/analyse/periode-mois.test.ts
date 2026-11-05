import { describe, expect, it } from "vitest";
import {
  debutDeMois,
  finDeMois,
  libelleMois,
  plageAligneeSurLesMois,
} from "@/components/analyse/periode-mois";

describe("pilules de mois", () => {
  it("écrit le mois en français", () => {
    expect(libelleMois("2025-01-01")).toBe("Janvier 2025");
    expect(libelleMois("2026-07-31")).toBe("Juillet 2026");
  });

  it("borne un mois, y compris février", () => {
    expect(debutDeMois(2026, 6)).toBe("2026-06-01");
    expect(finDeMois(2026, 6)).toBe("2026-06-30");
    expect(finDeMois(2024, 2)).toBe("2024-02-29");
    expect(finDeMois(2026, 2)).toBe("2026-02-28");
  });

  it("reconnaît une plage de mois entiers", () => {
    expect(plageAligneeSurLesMois("2026-01-01", "2026-12-31")).toBe(true);
    expect(plageAligneeSurLesMois("2026-06-01", "2026-06-15")).toBe(false);
  });
});
