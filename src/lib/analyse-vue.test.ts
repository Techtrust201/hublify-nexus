import { describe, expect, it } from "vitest";
import { etatCanon } from "@/data/etat-canon";
import { netProprietaire } from "@/lib/analyse-finance";
import {
  construireAnalyse,
  exporterEncaissementsCsv,
  piedsFacture,
  sommaireEncaissements,
} from "@/lib/analyse-vue";

const FILTRE = { debut: "2026-01-01", fin: "2026-12-31", aujourdhui: "2026-03-05" };

describe("construireAnalyse", () => {
  const vue = construireAnalyse(etatCanon(), FILTRE);

  it("fait coïncider attendu, encaissé et restant", () => {
    expect(vue.kpi.loyerAttendu).toBe(vue.kpi.loyerEncaisse + vue.kpi.loyerRestant);
  });

  it("reconstruit le net propriétaire depuis les colonnes", () => {
    const s = sommaireEncaissements(vue);
    expect(s.net).toBe(
      netProprietaire({
        prixReference: s.prix,
        ajustements: s.ajustements,
        menageLocataire: s.menage,
        autresServices: s.autres,
        taxeSejour: s.taxe,
        commissionOta: s.ota,
        commissionAgenceTtc: s.agence,
      }),
    );
    expect(vue.kpi.net).toBe(s.net);
    expect(vue.lignes.every((l) => l.net === netProprietaire(l.ventilation))).toBe(true);
  });

  it("répartit les nuits par canal sans dépasser 100 %", () => {
    expect(vue.canaux.reduce((n, c) => n + c.partNuits, 0)).toBe(100);
    expect(vue.canaux.reduce((n, c) => n + c.commissionOta, 0)).toBe(vue.kpi.commissionsOta);
  });

  it("n'applique aucune commission OTA au direct ni au bail", () => {
    const sansOta = vue.lignes.filter((l) => l.canal === "Direct" || l.canal === "Bail");
    expect(sansOta.length).toBeGreaterThan(0);
    expect(sansOta.every((l) => l.ventilation.commissionOta === 0)).toBe(true);
    const bail = vue.lignes.find((l) => l.canal === "Bail");
    expect(bail?.ventilation.commissionAgenceTtc).toBe(76_800);
  });

  it("retrouve les taux par canal quand la base a stocké 0", () => {
    const base = etatCanon();
    const vueZero = construireAnalyse(
      {
        ...base,
        reservationsDossier: base.reservationsDossier.map((r) => ({
          ...r,
          fraisPlateforme: r.fraisPlateforme ?? 0,
          commissionMontant: r.commissionMontant ?? 0,
          commissionPourcent: r.commissionPourcent ?? 0,
        })),
      },
      FILTRE,
    );
    const sophie = vueZero.lignes.find((l) => l.id === "r-sophie");
    expect(sophie?.ventilation.commissionOta).toBe(18_900);
    expect(sophie?.ventilation.commissionAgenceTtc).toBe(18_900);
    const jean = vueZero.lignes.find((l) => l.id === "r-jean");
    expect(jean?.canal).toBe("Booking.com");
    expect(jean?.ventilation.commissionOta).toBe(5_100);
    expect(jean?.ventilation.commissionAgenceTtc).toBe(5_100);
    const direct = vueZero.lignes.find((l) => l.id === "r-pierre");
    expect(direct?.ventilation.commissionOta).toBe(0);
    expect(direct?.ventilation.commissionAgenceTtc).toBe(6_300);
  });

  it("respecte la commission saisie et la taxe de Sophie Martin", () => {
    const sophie = vue.lignes.find((l) => l.id === "r-sophie");
    expect(sophie?.ventilation.commissionAgenceTtc).toBe(18_900);
    expect(sophie?.ventilation.commissionOta).toBe(18_900);
    expect(sophie?.ventilation.taxeSejour).toBe(2_100);
    expect(sophie?.net).toBe(126_000 - 18_900 - 18_900 - 2_100);
  });

  it("aligne le TTC des honoraires de la facture sur les commissions", () => {
    const hon = vue.factureProprietaire.filter((l) => l.id.startsWith("hon-"));
    const ttc = hon.reduce((n, l) => n + l.prixUnitaireHt + (l.tvaForcee ?? 0), 0);
    expect(ttc).toBe(vue.kpi.commissionAgenceTtc);
    for (const ligne of hon) {
      expect(ligne.prixUnitaireHt + (ligne.tvaForcee ?? 0)).toBeGreaterThan(0);
      expect(ligne.tauxTva).toBe(0.2);
    }
  });

  it("sépare le reversement et le montant dû selon qui encaisse", () => {
    const pieds = piedsFacture(vue);
    const netsPercus = vue.lignes.filter((l) => l.percoit).reduce((n, l) => n + l.net, 0);
    const honorairesDirects = vue.lignes
      .filter((l) => !l.percoit)
      .reduce((n, l) => n + l.ventilation.commissionAgenceTtc, 0);
    expect(pieds.reverse).toBe(netsPercus);
    expect(pieds.du).toBeGreaterThanOrEqual(honorairesDirects);
    expect(vue.lignes.some((l) => l.percoit)).toBe(true);
    expect(vue.lignes.some((l) => !l.percoit)).toBe(true);
  });

  it("ignore les séjours annulés dans les totaux et annule leur commission", () => {
    const base = etatCanon();
    const annule = construireAnalyse(
      {
        ...base,
        reservationsDossier: base.reservationsDossier.map((r) => ({ ...r, statut: "Annulé" })),
      },
      FILTRE,
    );
    expect(annule.kpi.net).toBe(0);
    expect(annule.kpi.loyerAttendu).toBe(0);
    expect(annule.historique.length).toBeGreaterThan(0);
    expect(
      annule.historique.every((h) => h.commission === 0 && h.statutPaiement === "Annulé"),
    ).toBe(true);
  });

  it("exporte un CSV dont la ligne TOTAL reprend le sommaire", () => {
    const csv = exporterEncaissementsCsv(vue);
    const lignes = csv.split("\n");
    expect(lignes[0]).toContain("Net propriétaire");
    expect(lignes.at(-1)).toMatch(/^TOTAL;/);
    expect(lignes.length).toBe(vue.lignes.length + 2);
  });

  it("borne la période demandée", () => {
    const mars = construireAnalyse(etatCanon(), {
      debut: "2026-03-01",
      fin: "2026-03-31",
      aujourdhui: "2026-03-05",
    });
    expect(mars.lignes.every((l) => l.checkOut > "2026-03-01" && l.checkIn <= "2026-03-31")).toBe(
      true,
    );
    expect(mars.kpi.loyerAttendu).toBeLessThan(vue.kpi.loyerAttendu);
  });
});
