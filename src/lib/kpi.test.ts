import { describe, expect, it } from "vitest";
import { etatCanon } from "@/data/etat-canon";
import { calculerKpi } from "@/lib/kpi";

describe("calculerKpi", () => {
  it("compte les loyers non validés du canon MO1", () => {
    const kpi = calculerKpi(etatCanon());
    expect(kpi.plomberie).toBeGreaterThanOrEqual(0);
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

  it("dérive les paiements d'analyse depuis les réservations", async () => {
    const { analyserReservations } = await import("@/lib/kpi");
    const { etatCanon } = await import("@/data/etat-canon");
    const analyse = analyserReservations(etatCanon());
    expect(analyse.paiements.length).toBeGreaterThan(0);
    expect(analyse.kpi.nuits).toBeGreaterThan(0);
  });

  it("écarte les baux longue durée du revenu moyen par nuit", async () => {
    const { analyserReservations } = await import("@/lib/kpi");
    const { etatCanon } = await import("@/data/etat-canon");
    const base = etatCanon();
    const court = base.reservationsDossier.find((r) => r.montant > 0);
    expect(court).toBeDefined();
    if (!court) return;

    // Un séjour de trois nuits à 300 € face à un bail d'un an au même prix : sans
    // filtre, la moyenne tombe à quelques euros la nuit.
    const analyse = analyserReservations({
      ...base,
      reservationsDossier: [
        { ...court, id: "r-court", arrivee: "2026-03-01", depart: "2026-03-04", montant: 300 },
        { ...court, id: "r-bail", arrivee: "2026-01-01", depart: "2026-12-31", montant: 300 },
      ],
    });

    expect(analyse.kpi.longsSejours).toBe(1);
    expect(analyse.kpi.nuitsCourteDuree).toBe(3);
    expect(analyse.kpi.revenuNuit).toBe(100);
    // Le total des nuits occupées, lui, reste complet.
    expect(analyse.kpi.nuits).toBeGreaterThan(300);
  });
});
