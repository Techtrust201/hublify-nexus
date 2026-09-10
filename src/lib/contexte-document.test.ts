import { describe, expect, it } from "vitest";
import { enrichirContexte, formaterDateFr, kindDocument } from "@/lib/contexte-document";
import { octetsDocument } from "@/lib/pdf-documents";

describe("kindDocument", () => {
  it("classe les gabarits du dossier", () => {
    expect(kindDocument("Modèle de bail meublé")).toBe("modele");
    expect(kindDocument("Carte d'identité-Passeport.pdf")).toBe("identite");
    expect(kindDocument("Bail_location.pdf")).toBe("bail");
    expect(kindDocument("Bail location signé.pdf")).toBe("bail");
    expect(kindDocument("Bail — Dupont Jean")).toBe("bail");
    expect(kindDocument("Quittance Août 2026")).toBe("quittance");
    expect(kindDocument("Vue générale")).toBe("photo");
    expect(kindDocument("Photo Salon — Vue générale")).toBe("photo");
    expect(kindDocument("Attestation_assurance.pdf")).toBe("assurance");
    expect(kindDocument("État des lieux entrée.pdf")).toBe("edl");
  });
});

describe("enrichirContexte", () => {
  it("remplit le bail Dupont depuis le titre et le catalogue", () => {
    const ctx = enrichirContexte("Bail — Dupont Jean", {
      logement: "Appartement Colette",
      extra: ["Type : Bail", "Logement : Appartement Colette"],
    });
    expect(ctx.locataire).toBe("Jean Dupont");
    expect(ctx.logement).toBe("Appartement Colette");
    expect(ctx.adresse).toBe("3 bd Haussmann, Paris");
    expect(ctx.date).toBe("15/01/2026");
    expect(ctx.locataire).not.toBe("Gestionnaire Hublify");
    expect(ctx.logement).not.toBe("Bien au dossier");
  });

  it("reprend la date catalogue du bail Dupont sans contexte", () => {
    expect(formaterDateFr("15 Jan 2026")).toBe("15/01/2026");
    expect(enrichirContexte("Bail — Dupont Jean").date).toBe("15/01/2026");
  });

  it("remplit un bail générique depuis la conversation", () => {
    const ctx = enrichirContexte("Bail_location.pdf", {
      titulaire: "Brian Griffin",
      logement: "Appartement Colette",
      extra: ["Locataire : Brian Griffin", "Logement : Appartement Colette"],
    });
    expect(ctx.locataire).toBe("Brian Griffin");
    expect(ctx.logement).toBe("Appartement Colette");
    expect(ctx.adresse).toBe("3 bd Haussmann, Paris");
  });

  it("conserve les montants saisis d'une quittance", () => {
    const ctx = enrichirContexte("Quittance Août 2026", {
      locataire: "Jean Dupont",
      logement: "Appartement Colette",
      extra: [
        "Bailleur : Hublify",
        "Locataire : Jean Dupont",
        "Logement : Appartement Colette",
        "Mois : Août 2026",
        "Loyer : 1280 EUR",
        "Charges : 80 EUR",
      ],
    });
    expect(ctx.locataire).toBe("Jean Dupont");
    expect(ctx.periode).toBe("Août 2026");
    expect(ctx.loyer).toBe("1280 EUR");
    expect(ctx.charges).toBe("80 EUR");
    expect(ctx.bailleur).toBe("Hublify");
  });

  it("classe une vue générale comme photo rattachée au logement", () => {
    const ctx = enrichirContexte("Vue générale", {
      extra: [
        "Légende : Vue générale",
        "Pièce : Salon",
        "Logement : Suzette",
        "Locataire : Sophie Martin",
      ],
      logement: "Suzette",
      locataire: "Sophie Martin",
      piece: "Salon",
      legende: "Vue générale",
    });
    expect(kindDocument("Vue générale", ctx.extra)).toBe("photo");
    expect(ctx.logement).toBe("Suzette");
    expect(ctx.locataire).toBe("Sophie Martin");
    expect(ctx.piece).toBe("Salon");
    expect(ctx.adresse).toBe("12 rue des Lilas, Paris");
  });

  it("conserve la date du bail signé", () => {
    const ctx = enrichirContexte("Bail location signé.pdf", {
      titulaire: "Brian Griffin",
      extra: ["Locataire : Brian Griffin", "Logement : Appartement Colette", "Date : 01/01/2026"],
    });
    expect(ctx.date).toBe("01/01/2026");
    expect(ctx.locataire).toBe("Brian Griffin");
  });

  it("laisse un modèle sans occupant réel", () => {
    const ctx = enrichirContexte("Modèle de bail meublé", {
      extra: ["Type : Modèle", "Modèle Hublify — Modèle de bail meublé"],
    });
    expect(ctx.locataire).toBeUndefined();
    expect(kindDocument("Modèle de bail meublé", ctx.extra)).toBe("modele");
  });
});

describe("octetsDocument", () => {
  it("écrit un bail Dupont avec le contexte du dossier", async () => {
    const ctx = enrichirContexte("Bail — Dupont Jean", {
      logement: "Appartement Colette",
      extra: ["Logement : Appartement Colette"],
    });
    const { nom, octets } = await octetsDocument("Bail — Dupont Jean", {
      logement: "Appartement Colette",
      extra: ["Logement : Appartement Colette"],
    });
    expect(nom).toBe("Bail — Dupont Jean.pdf");
    expect(octets[0]).toBe(0x25);
    expect(ctx.locataire).toBe("Jean Dupont");
    expect(ctx.logement).toBe("Appartement Colette");
    expect(ctx.adresse).toContain("Haussmann");
    expect(ctx.date).toBe("15/01/2026");
    expect(enrichirContexte("Bail — Dupont Jean").date).toBe("15/01/2026");
  });

  it("écrit Brian Griffin sur un bail de conversation", async () => {
    const ctx = enrichirContexte("Bail_location.pdf", {
      titulaire: "Brian Griffin",
      extra: ["Locataire : Brian Griffin", "Logement : Appartement Colette"],
    });
    const { octets } = await octetsDocument("Bail_location.pdf", {
      titulaire: "Brian Griffin",
      extra: ["Locataire : Brian Griffin", "Logement : Appartement Colette"],
    });
    expect(octets[0]).toBe(0x25);
    expect(ctx.locataire).toBe("Brian Griffin");
    expect(ctx.logement).toBe("Appartement Colette");
  });

  it("garde les blancs d'un modèle", async () => {
    const { nom, octets } = await octetsDocument("Modèle de bail meublé");
    expect(kindDocument("Modèle de bail meublé")).toBe("modele");
    expect(nom).toBe("Modèle de bail meublé.pdf");
    expect(octets[0]).toBe(0x25);
    expect(enrichirContexte("Modèle de bail meublé").locataire).toBeUndefined();
  });

  it("génère une fiche photo et non un courrier", async () => {
    expect(
      kindDocument("Vue générale", [
        "Légende : Vue générale",
        "Pièce : Salon",
        "Logement : Suzette",
      ]),
    ).toBe("photo");
    const { octets } = await octetsDocument("Vue générale", {
      extra: ["Légende : Vue générale", "Pièce : Salon", "Logement : Suzette"],
      logement: "Suzette",
      piece: "Salon",
    });
    expect(octets[0]).toBe(0x25);
  });
});
