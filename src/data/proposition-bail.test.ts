import { describe, expect, it } from "vitest";
import { profilDepuisConversation } from "@/data/profil-interlocuteur";
import type { Conversation } from "@/data/messagerie-mo1";
import {
  SITUATIONS_LOCATAIRE,
  brouillonInitial,
  periodeValide,
  progressionBail,
} from "@/data/proposition-bail";

describe("proposition de bail", () => {
  it("reprend les sept situations annotées, apostrophes comprises", () => {
    expect(SITUATIONS_LOCATAIRE).toEqual([
      "En études supérieures",
      "En formation Professionnelle",
      "En contrat d’apprentissage",
      "En stage",
      "En engagement volontaire dans le cadre d’un service civique",
      "En mutation Professionnelle",
      "En mission temporaire dans le cadre de son activité Professionnelle",
    ]);
  });

  it("compte 4 pièces sur 7, soit 57 %, pour le brouillon de départ", () => {
    const bilan = progressionBail(
      brouillonInitial({ locataire: "Albert Flores", redacteur: "Yannick Rath" }),
    );
    expect(bilan.faites).toBe(4);
    expect(bilan.total).toBe(7);
    expect(bilan.pourcentage).toBe(57);
    expect(bilan.pieces.find((p) => p.id === "caution")?.fait).toBe(false);
  });

  it("refuse une fin de bail antérieure au début", () => {
    expect(periodeValide("2026-09-12", "2026-05-10")).toBe(false);
    const brouillon = brouillonInitial({ locataire: "Albert Flores", redacteur: "Yannick Rath" });
    const bilan = progressionBail({ ...brouillon, fin: "2026-05-10" });
    expect(bilan.pieces.find((p) => p.id === "periode")?.fait).toBe(false);
    expect(bilan.faites).toBe(3);
  });
});

describe("profil interlocuteur", () => {
  const conversation: Conversation = {
    id: "c-albert",
    section: "prospections",
    nom: "Albert Flores",
    initiales: "AF",
    type: "voyageur",
    badge: "Prospect",
    bienNom: "Appartement Colette",
    extrait: "Je suis très intéressé par votre location pour août.",
    ilYa: "Il y a 1 min",
    nonLu: true,
    archivee: false,
  };

  it("relie le logement canonique et la fiche de demande", () => {
    const profil = profilDepuisConversation(
      conversation,
      [
        {
          id: "m1",
          conversationId: "c-albert",
          kind: "recu",
          texte: "Demande",
          fiche: ["Période souhaitée : du 15/09/2026 au 10/05/2026", "Loyer mensuel : 750 €"],
        },
        {
          id: "m2",
          conversationId: "c-albert",
          kind: "systeme",
          texte: "Albert Flores a émis une demande de location à 11h40 le 01/01/2026",
        },
      ],
      [{ nom: "Pièce d'identité.pdf", date: "01/01/2026" }],
      { email: "albert.flores@hublify.app" },
    );
    expect(profil.adresse).toBe("3 bd Haussmann, Paris");
    expect(profil.loyer).toBe("750 €");
    expect(profil.periode).toContain("15/09/2026");
    expect(profil.evenements).toHaveLength(1);
    expect(profil.documents).toHaveLength(1);
    expect(profil.email).toBe("albert.flores@hublify.app");
    expect(profil.peutProposerBail).toBe(true);
  });
});
