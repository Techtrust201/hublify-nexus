import { describe, expect, it } from "vitest";
import { completerMessagesFil } from "@/data/messagerie-mo1";
import {
  ajouterParcours,
  ajouterTypeMessage,
  basculerParcours,
  basculerType,
  cibleConversation,
  messagesDeclenches,
  parcoursInitiaux,
  rendreModele,
} from "@/data/messagerie-auto";
import { normaliserReglages } from "@/data/reglages-messagerie";

const vars = {
  nom: "Albert Flores",
  heure: "14h35",
  date: "01/01/2026",
  bien: "Appartement Colette",
};

describe("messages automatiques", () => {
  it("rend les variables du modèle", () => {
    expect(rendreModele("Bonjour {nom}, {bien} à {heure}.", vars)).toBe(
      "Bonjour Albert Flores, Appartement Colette à 14h35.",
    );
  });

  it("déclenche le message de proposition pour un prospect actif", () => {
    const textes = messagesDeclenches(parcoursInitiaux(), "proposition-bail", "prospect", vars);
    expect(textes).toEqual([
      "Le gestionnaire a émis une proposition de bail à 14h35 le 01/01/2026.",
    ]);
  });

  it("ignore un parcours ou un type désactivé, et une autre cible", () => {
    const coupes = basculerType(parcoursInitiaux(), "mt-bail", false);
    expect(messagesDeclenches(coupes, "proposition-bail", "prospect", vars)).toEqual([]);
    const parcoursOff = basculerParcours(parcoursInitiaux(), "parcours-1", false);
    expect(messagesDeclenches(parcoursOff, "checkin", "team", vars)).toEqual([]);
    expect(messagesDeclenches(parcoursInitiaux(), "checkin", "voyageur", vars)).toEqual([]);
  });

  it("ajoute un message type au parcours 1", () => {
    const resultat = ajouterTypeMessage(parcoursInitiaux(), "parcours-1", {
      libelle: "Relance signature",
      declencheur: "proposition-bail",
      cible: "prospect",
      modele: "Relance pour {nom}.",
    });
    expect(resultat.erreur).toBeUndefined();
    const textes = messagesDeclenches(resultat.parcours, "proposition-bail", "prospect", vars);
    expect(textes).toContain("Relance pour Albert Flores.");
  });

  it("refuse un libellé vide", () => {
    const resultat = ajouterTypeMessage(parcoursInitiaux(), "parcours-1", {
      libelle: "   ",
      declencheur: "checkin",
      cible: "team",
      modele: "x",
    });
    expect(resultat.erreur).toBe("Indiquez un libellé.");
    expect(resultat.parcours).toHaveLength(1);
  });

  it("nomme le parcours suivant", () => {
    const suite = ajouterParcours(parcoursInitiaux());
    expect(suite[1]?.nom).toBe("Parcours 2");
    expect(suite[1]?.types[0]?.actif).toBe(false);
  });

  it("reconnaît un prospect même si le type reste voyageur", () => {
    expect(cibleConversation("voyageur", "Prospect")).toBe("prospect");
    expect(cibleConversation("prestataire", "Prestataire")).toBe("prestataire");
  });

  it("réapplique la fiche et les actions absentes du chargement SQL", () => {
    const completes = completerMessagesFil([
      {
        id: "m-af-1",
        conversationId: "c-albert",
        kind: "recu",
        texte: "Je suis très intéressé par votre location pour août.",
      },
    ]);
    expect(completes[0]?.fiche?.[0]).toContain("15/09/2026");
    expect(completes[0]?.actions?.map((a) => a.id)).toEqual(["voir-dossier", "proposer-bail"]);
    const ordonnes = completerMessagesFil([
      { id: "m-af-4", conversationId: "c-albert", kind: "envoye", texte: "suite" },
      { id: "m-af-sys", conversationId: "c-albert", kind: "systeme", texte: "demande" },
      { id: "m-local", conversationId: "c-albert", kind: "envoye", texte: "nouveau" },
    ]);
    expect(ordonnes.map((m) => m.id)).toEqual(["m-af-sys", "m-af-4", "m-local"]);
  });

  it("retombe sur le parcours d’usine si le stockage est vide", () => {
    expect(normaliserReglages(null).parcours[0]?.nom).toBe("Parcours 1");
    expect(normaliserReglages({ parcours: [] }).parcours).toHaveLength(1);
  });
});
