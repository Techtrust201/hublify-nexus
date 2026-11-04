import { describe, expect, it } from "vitest";
import { csvUpsells, ficheEffective, filtrerUpsells } from "@/data/upsells-catalogue";

describe("catalogue upsells", () => {
  const lignes = [
    { id: "u-dej", nom: "Petit-déjeuner", prix: 15, actif: true },
    { id: "u-late", nom: "Late check-out", prix: 25, actif: true },
  ];

  it("retrouve un service par prestataire ou par code", () => {
    const trouves = filtrerUpsells(lignes, {}, "ducoin");
    expect(trouves.map((l) => l.id)).toEqual(["u-dej"]);
    expect(ficheEffective("u-dej").code).toBe("12-01-S");
    expect(ficheEffective("nouveau", { ville: "Lyon" }).ville).toBe("Lyon");
  });

  it("exporte un CSV avec séparateur point-virgule", () => {
    const csv = csvUpsells(lignes, {});
    expect(csv.split("\n")[0]).toBe(
      "Code;Désignation;Type;Prestataire;Pièce jointe;Ville;Tarif unitaire;Actif",
    );
    expect(csv).toContain("12-01-S;Petit-déjeuner;Nourriture");
    expect(csv).toContain("15,00;oui");
  });
});
