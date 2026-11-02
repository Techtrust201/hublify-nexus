import { describe, expect, it } from "vitest";
import { forceMotDePasse } from "@/lib/force-mot-de-passe";

describe("forceMotDePasse", () => {
  it("reste faible tant qu'une règle manque", () => {
    expect(forceMotDePasse("").libelle).toBe("Faible");
    expect(forceMotDePasse("abcdefghij").libelle).toBe("Faible");
    expect(forceMotDePasse("abcdefghij1").libelle).toBe("Moyen");
  });

  it("est bon avec 10 caractères, un chiffre et un caractère spécial", () => {
    const force = forceMotDePasse("abcdefghij1!");
    expect(force).toEqual({ longueur: true, chiffre: true, special: true, libelle: "Bon" });
  });
});
