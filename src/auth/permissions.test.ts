import { describe, expect, it } from "vitest";
import {
  aLeDroit,
  accueilPourRole,
  droitRequisPourChemin,
  droitsEffectifs,
  DROITS_PAR_ROLE,
  estRolePortail,
  estSuperAdmin,
  roleParLabel,
} from "@/auth/permissions";

describe("permissions", () => {
  it("identifie les trois super-administrateurs fondateurs", () => {
    expect(estSuperAdmin("contact@tech-trust.fr")).toBe(true);
    expect(estSuperAdmin("redris.gestion@gmail.com")).toBe(true);
    expect(estSuperAdmin("sasgilbois@gmail.com")).toBe(true);
    expect(estSuperAdmin("amelie.dubois@hublify.app")).toBe(false);
  });

  it("ignore une liste personnalisée pour le rôle super-admin d'une org", () => {
    expect(droitsEffectifs("super-admin", ["messagerie"])).toContain("gerer-equipe");
  });

  it("donne tous les droits à l'administrateur", () => {
    const droits = droitsEffectifs("administrateur");
    expect(droits).toContain("gerer-equipe");
    expect(droits).toContain("mod-finances");
  });

  it("retire l'admin d'équipe au gestionnaire", () => {
    expect(DROITS_PAR_ROLE.gestionnaire).not.toContain("gerer-equipe");
    expect(aLeDroit(DROITS_PAR_ROLE.gestionnaire, "mod-reservations")).toBe(true);
  });

  it("limite le prestataire aux missions", () => {
    expect(aLeDroit(DROITS_PAR_ROLE.prestataire, "voir-finances")).toBe(false);
    expect(aLeDroit(DROITS_PAR_ROLE.prestataire, "mod-missions")).toBe(true);
  });

  it("respecte une liste personnalisée", () => {
    const droits = droitsEffectifs("administrateur", ["messagerie"]);
    expect(droits).toEqual(["messagerie"]);
  });

  it("mappe les libellés vers les ids de rôle", () => {
    expect(roleParLabel("Prestataire")).toBe("prestataire");
    expect(roleParLabel("Super-administrateur")).toBe("super-admin");
    expect(roleParLabel("Inconnu")).toBe("lecteur");
  });

  it("oriente les rôles portail vers /espace", () => {
    expect(estRolePortail("prestataire")).toBe(true);
    expect(estRolePortail("locataire")).toBe(true);
    expect(estRolePortail("voyageur")).toBe(true);
    expect(estRolePortail("proprietaire")).toBe(true);
    expect(estRolePortail("gestionnaire")).toBe(false);
    expect(accueilPourRole("prestataire")).toBe("/espace");
    expect(accueilPourRole("locataire")).toBe("/espace");
    expect(accueilPourRole("gestionnaire")).toBe("/");
  });

  it("limite locataire, voyageur et propriétaire au portail", () => {
    expect(aLeDroit(DROITS_PAR_ROLE.locataire, "voir-finances")).toBe(false);
    expect(aLeDroit(DROITS_PAR_ROLE.voyageur, "mod-reservations")).toBe(false);
    expect(aLeDroit(DROITS_PAR_ROLE.proprietaire, "voir-finances")).toBe(true);
    expect(aLeDroit(DROITS_PAR_ROLE.proprietaire, "gerer-equipe")).toBe(false);
  });

  it("associe les chemins aux droits requis", () => {
    expect(droitRequisPourChemin("/team")).toBe("gerer-equipe");
    expect(droitRequisPourChemin("/reservations/nouveau")).toBe("mod-reservations");
    expect(droitRequisPourChemin("/reservations")).toBe("voir-reservations");
    expect(droitRequisPourChemin("/analyse")).toBe("voir-finances");
    expect(droitRequisPourChemin("/parametrage")).toBe("mod-biens");
    expect(droitRequisPourChemin("/prestataires/nouveau")).toBe("mod-biens");
    expect(droitRequisPourChemin("/outils/etats-des-lieux")).toBe("voir-documents");
    expect(droitRequisPourChemin("/outils/baux")).toBe("voir-documents");
    expect(droitRequisPourChemin("/espace")).toBe("messagerie");
    expect(droitRequisPourChemin("/dossiers/o3")).toBe("voir-reservations");
    expect(droitRequisPourChemin("/")).toBeUndefined();
  });
});
