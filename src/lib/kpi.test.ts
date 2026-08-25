import { describe, expect, it } from "vitest";
import { etatCanon } from "@/data/etat-canon";
import { calculerKpi } from "@/lib/kpi";

describe("calculerKpi", () => {
  it("compte les loyers non validés du canon MO1", () => {
    const kpi = calculerKpi(etatCanon());
    expect(kpi.loyersRetard).toBeGreaterThan(0);
    expect(kpi.impaye).toBeGreaterThan(0);
  });

  it("ignore les réservations annulées", () => {
    const kpi = calculerKpi({
      ...etatCanon(),
      reservationsDossier: etatCanon().reservationsDossier.map((r) => ({
        ...r,
        statut: "Annulé",
      })),
    });
    expect(kpi.reservationsActives).toBe(0);
    expect(kpi.checkIn).toBe(0);
    expect(kpi.checkOut).toBe(0);
  });
});
