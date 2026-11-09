import { describe, expect, it } from "vitest";
import { etatCanon } from "@/data/etat-canon";
import { ACCES_RESTREINT, DROITS_PAR_ROLE } from "@/auth/permissions";
import {
  decisionRetrait,
  filtrerConversationsPrestataire,
  filtrerDocumentsPrestataire,
  filtrerEtatPourRole,
  peutEcrireCollection,
  peutLireCollection,
  peutRemplacerCollections,
  roleInvitable,
  validerInsertion,
  type ActeurPortee,
} from "@/data/portee-role";
import type { EtatSession } from "@/data/etat-session";

function acteur(partiel: Partial<ActeurPortee> & Pick<ActeurPortee, "roleId">): ActeurPortee {
  return { droits: [], email: "", prenom: "", nom: "", ...partiel };
}

describe("filtrerEtatPourRole", () => {
  const etat = etatCanon();

  it("ne donne au locataire que son logement, son bail et ses messages", () => {
    const vue = filtrerEtatPourRole(
      etat,
      acteur({
        roleId: "locataire",
        email: "jean.martin@hublify.app",
        prenom: "Jean",
        nom: "Martin",
      }),
    );
    expect(vue.reservationsDossier.map((r) => r.id)).toEqual(["r-jmartin"]);
    expect(vue.loyers.map((l) => l.locataire)).toEqual(["Jean Martin"]);
    expect(vue.biens.map((b) => b.id)).toEqual(["colette"]);
    expect(vue.conversations.map((c) => c.id)).toContain("c-jean-martin");
    expect(vue.conversations.map((c) => c.id)).not.toContain("c-louisette");
    expect(vue.ensembles).toEqual([]);
    expect(vue.droitsPersonnalises).toEqual([]);
    const avecContact: EtatSession = {
      ...etat,
      conversations: [
        ...etat.conversations,
        {
          id: "c-contact",
          section: "inbox",
          nom: "gestion.parcours@exemple.test",
          initiales: "GP",
          type: "voyageur",
          badge: "Contact",
          extrait: "Lien directionnel",
          ilYa: "À l'instant",
          nonLu: true,
          archivee: false,
          assigne: "jean.martin@hublify.app",
        },
      ],
    };
    const avec = filtrerEtatPourRole(
      avecContact,
      acteur({
        roleId: "locataire",
        email: "jean.martin@hublify.app",
        prenom: "Jean",
        nom: "Martin",
      }),
    );
    expect(avec.conversations.map((c) => c.id)).toContain("c-contact");
    const sophie = filtrerEtatPourRole(
      avecContact,
      acteur({
        roleId: "voyageur",
        email: "sophie.martin@hublify.app",
        prenom: "Sophie",
        nom: "Martin",
      }),
    );
    expect(sophie.conversations.map((c) => c.id)).not.toContain("c-contact");
    expect(vue.dossiersLocation.map((d) => d.id)).toContain("dos-jean");
    expect(vue.documents.map((d) => d.id)).toContain("d-bail-jean");
    expect(vue.documents.some((d) => d.vue === "proprio" || d.titre.startsWith("CNI"))).toBe(false);
    expect(vue.documents.some((d) => d.logement.includes("Lavandrix"))).toBe(false);
    expect(JSON.stringify(vue)).not.toMatch(/sophie\.martin@hublify\.app/i);
  });

  it("conserve accents et emojis dans le message du locataire", () => {
    const avec: EtatSession = {
      ...etat,
      messagesFil: [
        ...etat.messagesFil,
        {
          id: "msg-cafe",
          conversationId: "c-jean-martin",
          kind: "envoye",
          texte: "Café prêt 🎉 — à tout à l'heure",
        },
      ],
    };
    const vue = filtrerEtatPourRole(
      avec,
      acteur({
        roleId: "locataire",
        email: "jean.martin@hublify.app",
        prenom: "Jean",
        nom: "Martin",
      }),
    );
    expect(vue.messagesFil.some((m) => m.texte.includes("Café prêt 🎉"))).toBe(true);
  });

  it("isole le voyageur de Sophie des séjours et fils des autres", () => {
    const vue = filtrerEtatPourRole(
      etat,
      acteur({
        roleId: "voyageur",
        email: "sophie.martin@hublify.app",
        prenom: "Sophie",
        nom: "Martin",
      }),
    );
    expect(vue.reservationsDossier.every((r) => r.email === "sophie.martin@hublify.app")).toBe(
      true,
    );
    expect(vue.reservationsDossier.length).toBeGreaterThan(0);
    expect(vue.dossiersLocation).toEqual([]);
    expect(vue.conversations.every((c) => c.type !== "team")).toBe(true);
    expect(vue.biens.every((b) => b.id === "suzette")).toBe(true);
    expect(vue.documents.some((d) => d.id === "d-bail-jean" || d.vue === "proprio")).toBe(false);
  });

  it("limite le propriétaire à ses biens, sans la messagerie d'équipe", () => {
    const vue = filtrerEtatPourRole(
      etat,
      acteur({ roleId: "proprietaire", prenom: "Pierre", nom: "Moreau" }),
    );
    expect(vue.biens.map((b) => b.id)).toEqual(["colette"]);
    expect(vue.reservationsDossier.every((r) => r.bienId === "colette")).toBe(true);
    expect(vue.conversations.every((c) => c.type !== "team")).toBe(true);
    expect(vue.dossiersLocation).toEqual([]);
    expect(vue.biens.some((b) => b.id === "suzette")).toBe(false);
    expect(vue.documents.some((d) => d.titre.includes("Attestation"))).toBe(false);
    expect(vue.documents.some((d) => d.id === "d-bail-jean")).toBe(false);
    expect(vue.documents.map((d) => d.id)).toContain("d4");
  });

  it("retire les finances et la messagerie au rôle lecture", () => {
    const vue = filtrerEtatPourRole(etat, acteur({ roleId: "lecteur" }));
    expect(vue.loyers).toEqual([]);
    expect(vue.ensembles).toEqual([]);
    expect(vue.regles).toEqual([]);
    expect(vue.conversations).toEqual([]);
    expect(vue.biens.length).toBeGreaterThan(0);
  });

  it("ne donne à un prestataire que le fil qui le désigne", () => {
    expect(
      filtrerConversationsPrestataire(etat.conversations, "Linge & Entretien").map((c) => c.id),
    ).toEqual(["c-lentil"]);
    expect(
      filtrerConversationsPrestataire(
        etat.conversations,
        "Lucas Ménage",
        "lucas.menage@hublify.app",
      ).map((c) => c.id),
    ).toEqual(["c-lentil"]);
    const autre = filtrerConversationsPrestataire(etat.conversations, "Studio Sérénité");
    expect(autre.map((c) => c.id)).toEqual(["c-silver"]);
    expect(autre.some((c) => c.id === "c-lentil")).toBe(false);
    expect(filtrerConversationsPrestataire(etat.conversations, "Inconnu Total")).toEqual([]);
  });

  it("retire au gestionnaire restreint les collections hors de ses droits", () => {
    const vue = filtrerEtatPourRole(
      etat,
      acteur({
        roleId: "gestionnaire",
        droits: [ACCES_RESTREINT, "messagerie"],
        email: "invite@exemple.test",
        prenom: "Yann",
        nom: "Invite",
      }),
    );
    expect(vue.conversations.length).toBeGreaterThan(0);
    expect(vue.loyers).toEqual([]);
    expect(vue.documents).toEqual([]);
    expect(vue.biens).toEqual([]);
    expect(vue.occupants).toEqual([]);
    expect(vue.dossiersLocation).toEqual([]);
    expect(
      peutRemplacerCollections(
        acteur({ roleId: "gestionnaire", droits: [ACCES_RESTREINT, "messagerie"] }),
      ),
    ).toBe(false);
    expect(
      peutRemplacerCollections(
        acteur({ roleId: "gestionnaire", droits: [...DROITS_PAR_ROLE.gestionnaire] }),
      ),
    ).toBe(true);
    expect(
      peutLireCollection(
        acteur({ roleId: "gestionnaire", droits: [ACCES_RESTREINT, "messagerie"] }),
        "documents",
      ),
    ).toBe(false);
  });

  it("limite les rapports prestataire aux biens de ses missions", () => {
    const docs = filtrerDocumentsPrestataire(
      [
        { id: "a", vue: "inventaire-presta", logement: "Appartement Colette" },
        { id: "b", vue: "inventaire-presta", logement: "Villa Lavandrix" },
        { id: "c", vue: "proprio", logement: "Appartement Colette" },
      ],
      [{ nom: "Appartement Colette" }],
    );
    expect(docs.map((d) => d.id)).toEqual(["a"]);
  });
});

describe("écritures et invitations", () => {
  it("interdit les écritures d'équipe au rôle lecture", () => {
    expect(peutEcrireCollection(acteur({ roleId: "lecteur" }), "reservationsDossier")).toBe(false);
    expect(peutEcrireCollection(acteur({ roleId: "locataire" }), "loyers")).toBe(false);
    expect(peutEcrireCollection(acteur({ roleId: "voyageur" }), "biens")).toBe(false);
  });

  it("refuse un montant négatif, des dates inversées et un texte vide", () => {
    expect(
      validerInsertion("reservationsDossier", {
        id: "r",
        montant: -1,
        arrivee: "2026-06-01",
        depart: "2026-06-04",
      }),
    ).toBe("invalide");
    expect(
      validerInsertion("reservationsDossier", {
        id: "r",
        montant: 10,
        arrivee: "2026-06-08",
        depart: "2026-06-01",
      }),
    ).toBe("invalide");
    expect(validerInsertion("messagesFil", { id: "m", texte: "   " })).toBe("invalide");
    expect(
      validerInsertion("messagesFil", {
        id: "m",
        texte: "",
        pieces: [{ nom: "Bail.pdf", taille: "12 Ko" }],
      }),
    ).toBe("ok");
    expect(
      validerInsertion("messagesFil", { id: "m", texte: "Séjour confirmé — été 2026 🎉" }),
    ).toBe("ok");
  });

  it("ne retire pas un compte hors organisation ni un super-administrateur", () => {
    expect(decisionRetrait({ acteurId: "a", cibleId: "b", roleCible: null })).toEqual({
      ok: false,
      erreur: "Membre introuvable",
    });
    expect(decisionRetrait({ acteurId: "a", cibleId: "b", roleCible: "super-admin" }).ok).toBe(
      false,
    );
    expect(decisionRetrait({ acteurId: "a", cibleId: "a", roleCible: "gestionnaire" }).ok).toBe(
      false,
    );
    expect(decisionRetrait({ acteurId: "a", cibleId: "b", roleCible: "lecteur" })).toEqual({
      ok: true,
    });
  });

  it("n'invite pas un rôle portail depuis l'équipe", () => {
    expect(roleInvitable("locataire")).toBe(false);
    expect(roleInvitable("voyageur")).toBe(false);
    expect(roleInvitable("proprietaire")).toBe(false);
    expect(roleInvitable("prestataire")).toBe(false);
    expect(roleInvitable("gestionnaire")).toBe(true);
    expect(roleInvitable("lecteur")).toBe(true);
  });
});
