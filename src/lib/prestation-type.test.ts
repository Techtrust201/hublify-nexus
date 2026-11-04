import { describe, expect, it } from "vitest";
import {
  ecrireDescription,
  filtrerPrestationsSeules,
  typeLibrePrestation,
  typeMissionPourSaisie,
} from "@/lib/gestionnaire-planning";

describe("types de prestation custom", () => {
  it("persiste le libellé libre sous Maintenance + typeLibre", () => {
    const saisie = typeMissionPourSaisie("Jardinage premium", "Menage");
    expect(saisie.typeStocke).toBe("Maintenance");
    expect(saisie.typeLibre).toBe("Jardinage premium");
    expect(saisie.libelle).toBe("Jardinage premium");
    const description = ecrireDescription("Jardinage premium planifié.", {
      typeLibre: "Jardinage premium",
      plageDebut: "10:00",
      plageFin: "12:00",
    });
    expect(
      typeLibrePrestation({
        type: saisie.typeStocke,
        titre: saisie.libelle,
        description,
      }),
    ).toBe("Jardinage premium");
  });

  it("ne masque pas les prestations custom en mode prestations seules", () => {
    const custom = {
      type: "Maintenance" as const,
      titre: "Jardinage premium",
      description: ecrireDescription("ok", { typeLibre: "Jardinage premium" }),
    };
    const menage = {
      type: "Menage" as const,
      titre: "Ménage",
      description: "simple",
    };
    expect(filtrerPrestationsSeules([custom, menage])).toEqual([custom, menage]);
  });
});
