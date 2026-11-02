import { describe, expect, it } from "vitest";
import { correspondFiltreDocument, libelleOccupant, referenceDocument } from "./filtres-documents";

const bail = {
  type: "Bail",
  filtre: "Bail",
  titre: "Bail meublé — Jean Martin",
  occupant: "locataires",
};

describe("filtres documents de la maquette", () => {
  it("retrouve un bail, une quittance et un courrier", () => {
    expect(correspondFiltreDocument(bail, "Bail")).toBe(true);
    expect(correspondFiltreDocument(bail, "Quittances de loyer")).toBe(false);
    expect(
      correspondFiltreDocument(
        {
          type: "Quittance",
          filtre: "Quittances",
          titre: "Quittance loyer — Mars 2026",
          occupant: "locataires",
        },
        "Quittances de loyer",
      ),
    ).toBe(true);
    expect(
      correspondFiltreDocument(
        {
          type: "Courrier",
          filtre: "Courrier libre",
          titre: "Courrier libre — Relance",
          occupant: "locataires",
        },
        "Autres",
      ),
    ).toBe(true);
  });

  it("sépare la facture voyageur du syndic", () => {
    expect(
      correspondFiltreDocument(
        {
          type: "Facture",
          filtre: "Factures",
          titre: "Facture séjour",
          occupant: "voyageurs",
        },
        "Factures voyageur",
      ),
    ).toBe(true);
    expect(
      correspondFiltreDocument(
        {
          type: "Facture syndic",
          filtre: "Syndic / Copro",
          titre: "Appel de fonds T2",
        },
        "Syndic — Appels de fonds",
      ),
    ).toBe(true);
  });

  it("forme une référence courte et un libellé d'occupant", () => {
    expect(referenceDocument("d-bail-jean")).toBe("BAILJEAN");
    expect(libelleOccupant("voyageurs")).toBe("Voyageur");
    expect(libelleOccupant(undefined)).toBe("—");
  });
});
