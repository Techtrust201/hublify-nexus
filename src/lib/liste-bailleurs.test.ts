import { describe, expect, it } from "vitest";
import { adresseListeValide } from "@/lib/liste-bailleurs.functions";

describe("adresse de la liste bailleurs", () => {
  it("accepte une adresse et refuse le reste", () => {
    expect(adresseListeValide("  Camille@Atelier.fr ")).toBe("camille@atelier.fr");
    expect(adresseListeValide("pas-une-adresse")).toBeNull();
    expect(adresseListeValide("")).toBeNull();
  });
});
