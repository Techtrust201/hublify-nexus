import { describe, expect, it } from "vitest";
import {
  TOTAUX_JULIETTE_CENTIMES,
  appliquerTaux,
  centimes,
  decomposerTtc,
  formatCentimes,
  honorairesAgence,
  montantDu,
  montantReverse,
  montantsLigne,
  netProprietaire,
  partsPourcent,
  solderCaution,
  totauxFacture,
  ventilationSejour,
} from "@/lib/analyse-finance";

describe("net propriétaire", () => {
  it("prend le payout saisi (paye) sans déduire ménage ni agence", () => {
    expect(
      netProprietaire({
        payeCentimes: 100_000,
        montantCentimes: 120_000,
        fraisPlateformeCentimes: 18_000,
      }),
    ).toBe(100_000);
  });

  it("estime montant − frais_plateforme quand paye est absent ou à 0", () => {
    expect(
      netProprietaire({
        montantCentimes: 126_000,
        fraisPlateformeCentimes: 18_900,
      }),
    ).toBe(107_100);
    expect(
      netProprietaire({
        payeCentimes: 0,
        montantCentimes: 39_000,
        fraisPlateformeCentimes: 5_850,
      }),
    ).toBe(33_150);
  });

  it("laisse ménage et honoraires hors de la formule", () => {
    const base = {
      payeCentimes: 85_000,
      montantCentimes: 100_000,
      fraisPlateformeCentimes: 15_000,
    };
    expect(netProprietaire(base)).toBe(85_000);
    // Les colonnes informatives (ménage, agence) ne passent pas par netProprietaire.
    const vent = ventilationSejour({
      montantEuros: 1000,
      fraisMenageEuros: 80,
      plateforme: "Airbnb",
      fraisPlateformeEuros: 150,
      commissionMontantEuros: 150,
    });
    expect(vent.menageLocataire).toBe(8_000);
    expect(vent.commissionAgenceTtc).toBe(15_000);
    expect(
      netProprietaire({
        payeCentimes: 85_000,
        montantCentimes: vent.prixReference,
        fraisPlateformeCentimes: vent.commissionOta,
      }),
    ).toBe(85_000);
  });

  it("conserve les colonnes Juliette comme totaux informatifs", () => {
    const t = TOTAUX_JULIETTE_CENTIMES;
    expect(t.prix).toBe(1_548_907);
    expect(t.menage + t.autres + t.taxe + t.ota + t.agence).toBeGreaterThan(0);
  });
});

describe("honoraires et TVA", () => {
  it("traite le montant saisi comme du TTC et reconstruit HT + TVA", () => {
    const h = honorairesAgence({
      prixCentimes: centimes(1260),
      commissionMontantEuros: 189,
      commissionPourcent: 15,
    });
    expect(h.ttc).toBe(18_900);
    expect(h.ht + h.tva).toBe(h.ttc);
    expect(h.tva).toBe(Math.round(h.ht * 0) || h.ttc - h.ht);
    expect(decomposerTtc(18_900)).toEqual({ ht: 15_750, tva: 3_150, ttc: 18_900 });
  });

  it("applique 15 % TTC en saisonnier et 8 % TTC sur un bail, sans saisie", () => {
    expect(honorairesAgence({ prixCentimes: 100_000 }).ttc).toBe(15_000);
    expect(honorairesAgence({ prixCentimes: 100_000, type: "Bail meublé" }).ttc).toBe(8_000);
  });

  it("n'ajoute pas la TVA une seconde fois sur un pourcentage saisi", () => {
    const h = honorairesAgence({ prixCentimes: 200_000, commissionPourcent: 10 });
    expect(h.ttc).toBe(20_000);
    expect(h.ht + h.tva).toBe(20_000);
  });

  it("groupe la TVA par taux sur la facture", () => {
    const totaux = totauxFacture([
      {
        id: "loyer",
        nature: "Location",
        periode: "mars 2026",
        quantite: 1,
        prixUnitaireHt: 10_000,
        tauxTva: 0,
      },
      {
        id: "menage",
        nature: "Ménage",
        periode: "mars 2026",
        quantite: 2,
        prixUnitaireHt: 4_500,
        tauxTva: 0.2,
      },
      {
        id: "linge",
        nature: "Linge",
        periode: "mars 2026",
        quantite: 1,
        prixUnitaireHt: 1_200,
        tauxTva: 0.2,
      },
    ]);
    expect(
      montantsLigne({
        id: "menage",
        nature: "Ménage",
        periode: "mars 2026",
        quantite: 2,
        prixUnitaireHt: 4_500,
        tauxTva: 0.2,
      }),
    ).toEqual({ ht: 9_000, tva: 1_800, ttc: 10_800 });
    expect(totaux.totalHt).toBe(20_200);
    expect(totaux.totalTva).toBe(2_040);
    expect(totaux.totalTtc).toBe(22_240);
    expect(totaux.tvaParTaux).toEqual([
      { taux: 0, baseHt: 10_000, tva: 0 },
      { taux: 0.2, baseHt: 10_200, tva: 2_040 },
    ]);
  });
});

describe("perception et caution", () => {
  it("reverse la somme des nets et facture les honoraires dans l'autre cas", () => {
    expect(montantReverse([10_000, -500, 2_500])).toBe(12_000);
    expect(montantDu(15_000, 4_500)).toBe(19_500);
  });

  it("encaisse la caution à l'arrivée et la restitue au départ", () => {
    const pendant = solderCaution({
      cautionEuros: 1700,
      statut: "Confirmé",
      arrivee: "2026-03-03",
      depart: "2026-03-10",
      aujourdhui: "2026-03-05",
    });
    expect(pendant.encaisse).toBe(170_000);
    expect(pendant.rembourse).toBe(0);
    expect(pendant.solde).toBe(170_000);

    const apres = solderCaution({
      cautionEuros: 1700,
      statut: "Confirmé",
      arrivee: "2026-03-03",
      depart: "2026-03-10",
      aujourdhui: "2026-03-10",
      retenuEuros: 50,
    });
    expect(apres.rembourse).toBe(165_000);
    expect(apres.retenu).toBe(5_000);
    expect(apres.solde).toBe(0);
    expect(apres.dateRemboursement).toBe("2026-03-10");
  });

  it("n'encaisse rien sur une réservation annulée ou à venir", () => {
    expect(
      solderCaution({
        cautionEuros: 500,
        statut: "Annulé",
        arrivee: "2026-01-01",
        depart: "2026-01-05",
        aujourdhui: "2026-03-05",
      }).encaisse,
    ).toBe(0);
    expect(
      solderCaution({
        cautionEuros: 500,
        statut: "Confirmé",
        arrivee: "2026-04-02",
        depart: "2026-04-08",
        aujourdhui: "2026-03-05",
      }).encaisse,
    ).toBe(0);
  });
});

describe("parts par plateforme", () => {
  it("fait sommer les pourcentages à 100", () => {
    const parts = partsPourcent([102, 68, 34, 23, 23]);
    expect(parts.reduce((s, n) => s + n, 0)).toBe(100);
    expect(parts.every((n) => n >= 0)).toBe(true);
  });

  it("rend 0 quand il n'y a aucune nuit", () => {
    expect(partsPourcent([0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe("arrondis", () => {
  it("arrondit le taux au centime le plus proche", () => {
    expect(appliquerTaux(100_01, 0.15)).toBe(15_00);
    expect(centimes(15.775)).toBe(1_578);
    expect(formatCentimes(746_501, 2)).toBe("7\u202f465,01 €");
  });
});
