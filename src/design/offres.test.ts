import { describe, expect, it } from "vitest";
import {
  demandeCarte,
  estIdOffre,
  formaterEuros,
  lienParrainage,
  prixAnnuelCentimes,
  prixMoisRemise,
} from "@/design/offres";
import { estCheminAuth, estCheminMarketing } from "@/lib/routes-publiques";

describe("offres V1", () => {
  it("applique la remise annuelle de 20 % sans dérive de centimes", () => {
    expect(prixMoisRemise(1490, "annuel")).toBe(1192);
    expect(prixAnnuelCentimes(1490)).toBe(14304);
    expect(prixAnnuelCentimes(2990)).toBe(28704);
    expect(prixAnnuelCentimes(9990)).toBe(95904);
    expect(prixMoisRemise(null, "annuel")).toBeNull();
    expect(prixMoisRemise(2990, "mensuel")).toBe(2990);
  });

  it("formate les euros comme la maquette, avec une virgule française", () => {
    expect(formaterEuros(1490)).toBe("14,90 €");
    expect(formaterEuros(0)).toBe("0,00 €");
  });

  it("ne demande pas de carte, y compris pour le freemium", () => {
    expect(demandeCarte("freemium")).toBe(false);
    expect(demandeCarte("solo")).toBe(false);
    expect(estIdOffre("standard")).toBe(true);
    expect(estIdOffre("agence")).toBe(false);
  });

  it("construit un lien de parrainage vers l'inscription", () => {
    expect(lienParrainage("https://hublify.example")).toBe(
      "https://hublify.example/inscription?parrainage=1",
    );
  });
});

describe("routes publiques", () => {
  it("distingue l'authentification et le marketing", () => {
    expect(estCheminAuth("/connexion")).toBe(true);
    expect(estCheminMarketing("/")).toBe(true);
    expect(estCheminMarketing("/faq")).toBe(true);
    expect(estCheminMarketing("/cgv")).toBe(true);
    expect(estCheminAuth("/faq")).toBe(false);
    expect(estCheminMarketing("/reservations")).toBe(false);
  });
});
