import { describe, expect, it } from "vitest";
import {
  ibanValide,
  luhnValide,
  messageCompte,
  profilCarteTVerifie,
  siretValide,
  COMPTE_DEFAUT,
} from "@/data/compte-gestionnaire";
import { planPrestationsAuto, REGLAGES_DEFAUT } from "@/data/reglages-etendus";

describe("compte gestionnaire", () => {
  it("contrôle le SIRET par la clé de Luhn", () => {
    expect(siretValide("123")).toBe(false);
    expect(siretValide("73282932000074")).toBe(luhnValide("73282932000074"));
    const corps = "1234567890001";
    let cle = 0;
    for (let i = 0; i < 10; i += 1) {
      if (luhnValide(corps + String(i))) cle = i;
    }
    expect(siretValide(`${corps}${cle}`)).toBe(true);
  });

  it("accepte l'IBAN de test FR et refuse un chiffre changé", () => {
    expect(ibanValide("FR14 2004 1010 0505 0001 3M02 606")).toBe(true);
    expect(ibanValide("FR14 2004 1010 0505 0001 3M02 607")).toBe(false);
  });

  it("vérifie le profil carte T seulement avec agrément, recto et verso", () => {
    expect(
      profilCarteTVerifie({
        detenteurCarteT: true,
        numeroAgrement: "CPI 7501 2018 000 012 345",
        recto: true,
        verso: true,
      }),
    ).toBe(true);
    expect(
      profilCarteTVerifie({
        detenteurCarteT: true,
        numeroAgrement: "CPI 7501 2018 000 012 345",
        recto: true,
        verso: false,
      }),
    ).toBe(false);
    expect(
      profilCarteTVerifie({
        detenteurCarteT: false,
        numeroAgrement: "CPI 7501 2018 000 012 345",
        recto: true,
        verso: true,
      }),
    ).toBe(false);
  });

  it("exige l'agrément dès que la carte T est déclarée", () => {
    expect(
      messageCompte({ ...COMPTE_DEFAUT, detenteurCarteT: true, numeroAgrement: "12" }),
    ).toMatch(/agrément/);
    expect(messageCompte({ ...COMPTE_DEFAUT, iban: "FR00" })).toMatch(/IBAN/);
  });
});

describe("prestations automatiques", () => {
  it("prévoit le ménage en fin de séjour et l'état des lieux aux deux dates d'un bail", () => {
    expect(
      planPrestationsAuto(REGLAGES_DEFAUT, { debut: "2026-06-01", fin: "2026-06-08", bail: true }),
    ).toEqual([
      "Prestation de ménage le 2026-06-08, jour de fin de réservation.",
      "État des lieux d'entrée le 2026-06-01.",
      "État des lieux de sortie le 2026-06-08.",
    ]);
    expect(
      planPrestationsAuto(
        { autoMenage: false, autoEdlBail: true },
        { debut: "2026-06-01", fin: "2026-06-08", bail: false },
      ),
    ).toEqual([]);
  });
});
