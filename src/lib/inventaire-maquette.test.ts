import { describe, expect, it } from "vitest";
import {
  besoinStock,
  centimesDepuisSaisie,
  champsDe,
  ecrireConsommable,
  euroCentimes,
  lieuxDepuisSerie,
  lireConsommable,
  serieAEnregistrer,
  serieDepuisLieux,
  verdictStock,
} from "./inventaire-maquette";

describe("inventaire maquette", () => {
  it("conserve un ancien numéro de série tant qu'aucun champ maquette n'est saisi", () => {
    expect(serieAEnregistrer(champsDe("REF-101"), "REF-101")).toBe("REF-101");
    expect(lireConsommable("LINGE")).toBeNull();
  });

  it("encode et relit marque, type, prix, lieu et seuils", () => {
    const serie = ecrireConsommable({
      marque: "Marque 1",
      typeArticle: "Savon mains",
      prixCentimes: 820,
      lieuStockage: "Cave",
      seuil: 4,
      qteParOccupant: 1,
    });
    expect(lireConsommable(serie)).toEqual({
      marque: "Marque 1",
      typeArticle: "Savon mains",
      prixCentimes: 820,
      lieuStockage: "Cave",
      seuil: 4,
      qteParOccupant: 1,
    });
  });

  it("calcule le stock à partir des occupants, sinon du seuil", () => {
    const parOccupant = {
      marque: "M",
      typeArticle: "Savon",
      prixCentimes: 0,
      lieuStockage: "",
      seuil: 99,
      qteParOccupant: 2,
    };
    expect(besoinStock(parOccupant, 3)).toBe(6);
    expect(verdictStock(6, 6)).toBe("correct");
    expect(verdictStock(5, 6)).toBe("insuffisant");
    expect(verdictStock(1, 0)).toBe("non-suivi");
    expect(besoinStock({ ...parOccupant, qteParOccupant: 0, seuil: 4 }, 10)).toBe(4);
  });

  it("persiste la liste des lieux assignés", () => {
    const serie = serieDepuisLieux(["Appartement Colette", "Suzette"]);
    expect(lieuxDepuisSerie(serie)).toEqual(["Appartement Colette", "Suzette"]);
    expect(lieuxDepuisSerie("REF-1")).toEqual([]);
  });

  it("lit un prix saisi en français", () => {
    expect(centimesDepuisSaisie("8,20")).toBe(820);
    expect(centimesDepuisSaisie("")).toBe(0);
    expect(centimesDepuisSaisie("abc")).toBeNull();
    expect(euroCentimes(820)).toMatch(/8,20/);
  });
});
