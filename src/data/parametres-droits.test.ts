import { describe, expect, it } from "vitest";
import {
  decisionLectureCompte,
  DROITS_TEST,
  masquerIban,
  peutEcrireReglagesMessagerie,
  peutGererCompteEntreprise,
  peutLireFichesLieu,
  peutLireReglagesEtendus,
  peutLireReglagesMessagerie,
} from "@/data/parametres-droits";

describe("droits lecture compte / RIB", () => {
  it.each([
    ["super-admin", true],
    ["administrateur", true],
    ["gestionnaire", true],
  ] as const)("%s peut lire et écrire le compte entreprise", (role, attendu) => {
    expect(peutGererCompteEntreprise(DROITS_TEST[role]!)).toBe(attendu);
    expect(decisionLectureCompte(DROITS_TEST[role]!).acces).toBe("complet");
  });

  it.each(["lecteur", "prestataire", "locataire", "voyageur", "proprietaire"] as const)(
    "%s ne peut pas lire le RIB (interdit)",
    (role) => {
      expect(peutGererCompteEntreprise(DROITS_TEST[role]!)).toBe(false);
      expect(decisionLectureCompte(DROITS_TEST[role]!).acces).toBe("interdit");
    },
  );

  it("masque un IBAN pour affichage non autorisé", () => {
    expect(masquerIban("FR14 2004 1010 0505 0001 3M02 606")).toBe("FR14••••••••2606");
    expect(masquerIban("")).toBe("");
  });
});

describe("droits fiches / réglages / messagerie auto", () => {
  it("refuse la lecture des fiches aux rôles portail sans voir-biens", () => {
    expect(peutLireFichesLieu(DROITS_TEST["locataire"]!)).toBe(false);
    expect(peutLireFichesLieu(DROITS_TEST["prestataire"]!)).toBe(false);
    expect(peutLireFichesLieu(DROITS_TEST["proprietaire"]!)).toBe(true);
    expect(peutLireFichesLieu(DROITS_TEST["gestionnaire"]!)).toBe(true);
  });

  it("réserve les réglages étendus aux gestionnaires", () => {
    expect(peutLireReglagesEtendus(DROITS_TEST["gestionnaire"]!)).toBe(true);
    expect(peutLireReglagesEtendus(DROITS_TEST["locataire"]!)).toBe(false);
    expect(peutLireReglagesEtendus(DROITS_TEST["lecteur"]!)).toBe(false);
  });

  it("empêche un locataire/voyageur/prestataire d'écraser la messagerie auto", () => {
    for (const role of ["locataire", "voyageur", "prestataire", "lecteur"] as const) {
      expect(peutEcrireReglagesMessagerie(DROITS_TEST[role]!)).toBe(false);
      expect(peutLireReglagesMessagerie(DROITS_TEST[role]!)).toBe(false);
    }
    expect(peutEcrireReglagesMessagerie(DROITS_TEST["gestionnaire"]!)).toBe(true);
    expect(peutLireReglagesMessagerie(DROITS_TEST["gestionnaire"]!)).toBe(true);
  });
});
