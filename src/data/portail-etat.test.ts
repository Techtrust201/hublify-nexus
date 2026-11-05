import { describe, expect, it } from "vitest";
import { ETAT_PORTAIL_VIDE, normaliserEtatPortail } from "./portail-etat";

describe("état du portail", () => {
  it("rejette un payload illisible et revient à l'état vide", () => {
    expect(normaliserEtatPortail(null)).toEqual(ETAT_PORTAIL_VIDE);
    expect(normaliserEtatPortail("chaine")).toEqual(ETAT_PORTAIL_VIDE);
  });

  it("conserve une note, un paiement simulé et ignore le reste", () => {
    const etat = normaliserEtatPortail({
      mode: "prestataire",
      demarre: true,
      notes: [
        { id: "n1", jour: "2026-11-04", texte: "Arrivée tardive" },
        { id: "", jour: "2026-11-04", texte: "invalide" },
        { id: "n2", jour: "pas-une-date", texte: "non" },
      ],
      paiements: [
        {
          id: "p1",
          reference: "HUB-SIM-1",
          libelle: "Loyer",
          montant: 650.129,
          creeLe: "2026-11-04T10:00:00.000Z",
          statut: "paye",
          fournisseur: "stripe",
        },
      ],
      favoris: ["ann-suzette", 12],
      rdv: { jour: "2026-11-12", heure: "10:00" },
    });
    expect(etat.mode).toBe("prestataire");
    expect(etat.demarre).toBe(true);
    expect(etat.notes).toEqual([{ id: "n1", jour: "2026-11-04", texte: "Arrivée tardive" }]);
    expect(etat.paiements[0]).toMatchObject({
      montant: 650.13,
      statut: "simulation",
      fournisseur: "aucun",
    });
    expect(etat.favoris).toEqual(["ann-suzette"]);
    expect(etat.rdv).toEqual({ jour: "2026-11-12", heure: "10:00" });
  });
});
