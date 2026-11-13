import { describe, expect, it } from "vitest";
import { identiteDepuisNom } from "@/lib/espace-compte";

describe("identité d'un compte Google", () => {
  it("sépare prénom et nom", () => {
    expect(identiteDepuisNom("Camille Essai", "camille@exemple.fr")).toEqual({
      prenom: "Camille",
      nom: "Essai",
      nomOrg: "Camille Essai",
    });
  });

  it("reprend l'adresse quand Google ne donne pas de nom", () => {
    expect(identiteDepuisNom("  ", "camille@exemple.fr").prenom).toBe("camille");
  });
});
