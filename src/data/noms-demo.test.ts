import { describe, expect, it } from "vitest";
import { etatVide } from "@/data/etat-session";
import { corrigerCorpusDemo } from "@/data/noms-demo";
import { fusionnerParametrage } from "@/data/parametrage-mo1";

describe("corpus de démo", () => {
  it("remplace les noms de remplissage déjà enregistrés", () => {
    const etat = corrigerCorpusDemo({
      ...etatVide(),
      conversations: [
        {
          id: "c-brian",
          section: "inbox",
          nom: "Brian Griffin",
          initiales: "BG",
          type: "voyageur",
          badge: "Voyageur",
          bienNom: "Appartement Colette",
          extrait: "Merci",
          ilYa: "Il y a 1 min",
          nonLu: false,
          archivee: false,
        },
      ],
      messagesFil: [
        {
          id: "m1",
          conversationId: "c-brian",
          kind: "systeme",
          texte: "Brian Griffin s'est connecté.",
        },
      ],
      membres: [
        {
          id: "me-tu",
          nom: "Ulrica",
          prenom: "Tegerdinal",
          initiales: "TU",
          statut: "actif",
          role: "Gestionnaire",
          affectation: "Assignment Makey",
          droits: [],
        },
      ],
    });
    expect(etat.conversations[0]?.nom).toBe("Bruno Girard");
    expect(etat.messagesFil[0]?.texte).toContain("Bruno Girard");
    expect(etat.membres[0]).toMatchObject({ prenom: "Inès", nom: "Lambert" });
  });

  it("ramène un rappel à 00 h vers 24 h", () => {
    expect(fusionnerParametrage({ rappelPaiementHeures: "00" }).rappelPaiementHeures).toBe("24");
    expect(fusionnerParametrage({ rappelPaiementHeures: "48" }).rappelPaiementHeures).toBe("48");
  });
});
