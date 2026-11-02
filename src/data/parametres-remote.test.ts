import { describe, expect, it } from "vitest";
import { ibanValide } from "@/lib/iban";
import { COMPTE_DEFAUT, messageCompte, normaliserCompte } from "@/data/compte-gestionnaire";
import { normaliserReglages, REGLAGES_DEFAUT } from "@/data/reglages-etendus";
import {
  normaliserReglages as normaliserMessagerie,
  reglagesParDefaut,
} from "@/data/reglages-messagerie";

describe("contrats des endpoints de réglages distants", () => {
  it("refuse un IBAN invalide avant persistance compte", () => {
    const mauvais = normaliserCompte({ ...COMPTE_DEFAUT, iban: "FR00 1234" });
    expect(ibanValide(mauvais.iban)).toBe(false);
    expect(messageCompte(mauvais)).toMatch(/IBAN/);
  });

  it("normalise les relances avec les défauts métier", () => {
    const r = normaliserReglages({ relanceLoyer: false });
    expect(r.relanceLoyer).toBe(false);
    expect(r.messageRelanceLoyer).toBe(REGLAGES_DEFAUT.messageRelanceLoyer);
    expect(r.offre).toBe("confort");
  });

  it("normalise la messagerie auto sans casser les parcours", () => {
    const base = reglagesParDefaut();
    const n = normaliserMessagerie({ parcours: [], situations: { a: "x" } });
    expect(n.parcours.length).toBe(base.parcours.length);
    expect(n.situations).toEqual({ a: "x" });
  });
});
