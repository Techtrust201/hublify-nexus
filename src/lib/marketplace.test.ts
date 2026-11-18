import { describe, expect, it } from "vitest";
import {
  peutUtiliserMarketplace,
  plageMission,
  projeterMissionOuverte,
  villeDepuisAdresse,
  type LigneMissionOuverte,
} from "@/lib/marketplace";
import { DROITS_PAR_ROLE } from "@/auth/permissions";

const SEP = "\u2063";

describe("projection d'une mission ouverte", () => {
  it("ne garde que les sept champs autorisés, même si la ligne en porte d'autres", () => {
    const ligne = {
      id: "m1",
      jour: "2026-12-03",
      type_mission: "Menage",
      titre: "Ménage studio",
      heure: "10:00",
      description: `Code porte 4321, voyageur Jean Fictif.${SEP}${JSON.stringify({
        plageDebut: "09:00",
        plageFin: "12:00",
        reservationId: "r-secret",
        tarif: 45,
      })}`,
      bien_nom: "Studio Alpha",
      bien_adresse: "12 rue Secrète, 97400 Saint-Denis",
      // Champs qu'une requête trop large aurait pu ramener :
      proprietaire: "Propriétaire Fictif",
      reservation_id: "r-secret",
      voyageur: "Jean Fictif",
      tarif_manuel_centimes: 4500,
    } as LigneMissionOuverte;
    const p = projeterMissionOuverte(ligne);
    expect(p).toEqual({
      id: "m1",
      date: "2026-12-03",
      type: "Menage",
      titre: "Ménage studio",
      plage: "09:00–12:00",
      logement: "Studio Alpha",
      ville: "Saint-Denis",
    });
    const brut = JSON.stringify(p);
    for (const interdit of ["4321", "Jean", "r-secret", "Secrète", "Propriétaire", "45"]) {
      expect(brut).not.toContain(interdit);
    }
  });

  it("ville : jamais la rue ni le numéro ; vide si l'adresse n'a pas de virgule", () => {
    expect(villeDepuisAdresse("12 rue X, 97400 Saint-Denis")).toBe("Saint-Denis");
    expect(villeDepuisAdresse("3 chemin Y, Le Tampon")).toBe("Le Tampon");
    expect(villeDepuisAdresse("12 rue X")).toBe("");
    expect(villeDepuisAdresse(null)).toBe("");
  });

  it("plage : méta si présente, sinon l'heure", () => {
    expect(plageMission("10:00", "Sans méta")).toBe("10:00");
    expect(plageMission("10:00", `x${SEP}${JSON.stringify({ horairePrecise: "11:15" })}`)).toBe(
      "11:15",
    );
  });
});

describe("accès à la marketplace", () => {
  const presta = {
    orgType: "prestataire",
    roleId: "prestataire",
    droits: [...DROITS_PAR_ROLE.prestataire],
    email: "presta@exemple.test",
  };
  it("rôle prestataire d'une org prestataire, avec « mod-missions » et un e-mail", () => {
    expect(peutUtiliserMarketplace(presta)).toBe(true);
  });
  it("refusé au compte mal rattaché (rôle prestataire sur une org gestionnaire)", () => {
    expect(peutUtiliserMarketplace({ ...presta, orgType: "gestionnaire" })).toBe(false);
  });
  it("refusé aux autres rôles, sans « mod-missions » ou sans e-mail", () => {
    expect(peutUtiliserMarketplace({ ...presta, roleId: "gestionnaire" })).toBe(false);
    expect(peutUtiliserMarketplace({ ...presta, droits: ["voir-calendrier"] })).toBe(false);
    expect(peutUtiliserMarketplace({ ...presta, email: "" })).toBe(false);
    expect(peutUtiliserMarketplace({ ...presta, email: "Presta Fictif" })).toBe(false);
  });
});
