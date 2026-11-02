import { describe, expect, it } from "vitest";
import {
  ACTIVITES_DEMO,
  ANNONCES_DEMO,
  appliquerDecisionDemande,
  classeDocument,
  creerPaiementSimulation,
  fenetreEdl,
  filtrerActivites,
  filtrerAnnonces,
  FENETRE_EDL_MS,
  resumeFamille,
  tachesDuJour,
  TACHES_DEMO_RESIDENT,
  trierTaches,
} from "./portail-mobile";

describe("portail mobile", () => {
  it("filtre les activités, y compris les sites de gestionnaires", () => {
    const restaurants = filtrerActivites({
      activites: ACTIVITES_DEMO,
      ville: "cannes",
      types: ["Restaurant"],
      inclureSitesGestionnaires: true,
    });
    expect(restaurants.map((a) => a.id)).toEqual(["act-bambola"]);

    const sansSites = filtrerActivites({
      activites: ACTIVITES_DEMO,
      ville: "",
      types: ["Tout"],
      inclureSitesGestionnaires: false,
    });
    expect(sansSites.some((a) => a.source === "site-gestionnaire")).toBe(false);
    expect(sansSites.length).toBe(ACTIVITES_DEMO.length - 1);
  });

  it("filtre les annonces par régime, nature et chevauchement de dates", () => {
    const baux = filtrerAnnonces({
      annonces: ANNONCES_DEMO,
      ville: "Cannes",
      debut: "2026-11-13",
      fin: "2027-01-18",
      unite: "mois",
      inclureSitesGestionnaires: true,
    });
    expect(baux.map((a) => a.id)).toContain("ann-suzette");
    expect(baux.map((a) => a.id)).not.toContain("ann-colette-saison");

    const bateaux = filtrerAnnonces({
      annonces: ANNONCES_DEMO,
      ville: "",
      nature: "bateau",
      inclureSitesGestionnaires: true,
    });
    expect(bateaux).toHaveLength(1);
    expect(bateaux[0]?.professionnelVerifie).toBe(false);
    expect(bateaux[0]?.annonceVerifiee).toBe(true);
  });

  it("crée un paiement simulé, sans prestataire réel", () => {
    const paiement = creerPaiementSimulation({
      libelle: "Appel de loyer — nov. 2026",
      montant: 650.126,
      maintenant: new Date("2026-11-02T12:00:00.000Z"),
      sequence: 42,
    });
    expect(paiement.statut).toBe("simulation");
    expect(paiement.fournisseur).toBe("aucun");
    expect(paiement.montant).toBe(650.13);
    expect(paiement.reference).toBe("HUB-SIM-16");
    expect(paiement.mention.toLowerCase()).toContain("aucun débit");
    expect(JSON.stringify(paiement).toLowerCase()).not.toMatch(/stripe|paypal|adyen|checkout\.com/);
  });

  it("autorise 72 h, résilie ou signale une demande d'accès", () => {
    const ok = appliquerDecisionDemande("autoriser", new Date("2026-11-02T08:00:00.000Z"));
    expect(ok.autorise).toBe(true);
    expect(ok.dureeHeures).toBe(72);
    expect(ok.expireLe).toBe("2026-11-05T08:00:00.000Z");

    const signalement = appliquerDecisionDemande("signaler", new Date("2026-11-02T08:00:00.000Z"));
    expect(signalement.signalee).toBe(true);
    expect(signalement.autorise).toBe(false);
    expect(signalement.expireLe).toBeNull();
  });

  it("ferme la validation d'état des lieux au bout de 48 h", () => {
    const emis = "2026-11-01T10:00:00.000Z";
    const ouvert = fenetreEdl(emis, new Date("2026-11-02T10:00:00.000Z").getTime());
    expect(ouvert.ouvert).toBe(true);
    const ferme = fenetreEdl(emis, new Date(emis).getTime() + FENETRE_EDL_MS + 1);
    expect(ferme.ouvert).toBe(false);
    expect(ferme.resteMs).toBe(0);
  });

  it("classe les documents et trie les tâches du jour", () => {
    expect(classeDocument("Quittance de loyer — nov. 2026")).toBe("quittance");
    expect(classeDocument("Fiche d'accès — Suzette")).toBe("fiche");
    expect(classeDocument("AEDL Entrée — Colette")).toBe("edl");
    expect(classeDocument("Règlement intérieur")).toBe("reglement");
    expect(classeDocument("Bail — Colette")).toBe("location");

    const triees = trierTaches([...TACHES_DEMO_RESIDENT].reverse());
    expect(triees[0]?.id).toBe("t-loyer");
    expect(tachesDuJour(TACHES_DEMO_RESIDENT, "2026-05-25").map((t) => t.id)).toEqual([
      "t-loyer",
      "t-entree",
      "t-edl",
    ]);
  });

  it("résume la situation familiale d'une candidature", () => {
    expect(resumeFamille({ marie: true, pacse: false, concubinage: false, colocation: true })).toBe(
      "Marié · Colocation",
    );
    expect(
      resumeFamille({ marie: false, pacse: false, concubinage: false, colocation: false }),
    ).toMatch(/Sans situation/);
  });
});
