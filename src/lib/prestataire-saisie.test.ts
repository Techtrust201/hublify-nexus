import { describe, expect, it } from "vitest";
import { normaliserPrestataire, saisiePrestataireValide } from "@/lib/prestataire-saisie";

describe("saisie prestataire", () => {
  it("refuse les champs vides, les espaces et un e-mail invalide", () => {
    expect(
      saisiePrestataireValide({
        nom: "   ",
        ville: "Nice",
        telephone: "0600000000",
        email: "a@b.c",
      }),
    ).toBe(false);
    expect(
      saisiePrestataireValide({
        nom: "Ada",
        ville: " ",
        telephone: "0600000000",
        email: "ada@exemple.test",
      }),
    ).toBe(false);
    expect(
      saisiePrestataireValide({
        nom: "Ada",
        ville: "Nice",
        telephone: "0600000000",
        email: "pas-un-email",
      }),
    ).toBe(false);
    expect(
      saisiePrestataireValide({
        nom: "Ada",
        ville: "Nice",
        telephone: "123",
        email: "ada@exemple.test",
      }),
    ).toBe(false);
  });

  it("normalise l'e-mail avant création", () => {
    const saisie = {
      nom: " Ada ",
      ville: " Nice ",
      telephone: " 0600000000 ",
      email: " Ada@Exemple.Test ",
    };
    expect(saisiePrestataireValide(saisie)).toBe(true);
    expect(normaliserPrestataire(saisie).email).toBe("ada@exemple.test");
  });
});
