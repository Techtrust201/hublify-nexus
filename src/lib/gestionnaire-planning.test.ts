import { describe, expect, it } from "vitest";
import { DROITS_PAR_ROLE, droitsEffectifs } from "@/auth/permissions";
import {
  actionsDate,
  actionsDateAutorisees,
  cautionDemandee,
  EXTRA_PRECHECKIN_DEFAUT,
  fusionMigrationExtra,
  descriptionVisible,
  droitsPersonnalises,
  droitAutoriseParProfil,
  conserverReglementPrestation,
  ecrireDescription,
  syntheseBlocagesJour,
  estImportOta,
  exporterAnnonces,
  facturationPrestation,
  facturesPrestataires,
  solderPrestation,
  messageRefusPaiement,
  montantDepuisSaisie,
  ficheDepuisOccupation,
  horaireDansPlage,
  importerAnnonces,
  joursPrestation,
  lireMetaPrestation,
  lirePortee,
  lignesServicesImport,
  messageRelancePaiement,
  noterPortee,
  plageValide,
  resteADevoir,
} from "@/lib/gestionnaire-planning";

describe("prestations", () => {
  it("facture le mandataire au tarif contractuel et pas le propriétaire qui fait lui-même", () => {
    expect(facturationPrestation({ attribution: "mandataire", tarif: 80 }).libelle).toMatch(
      /mandataire/,
    );
    expect(
      facturationPrestation({ attribution: "proprietaire", porteur: "proprietaire" }).facture,
    ).toBe(false);
    expect(
      facturationPrestation({
        attribution: "locataire",
        porteur: "prestataire",
        tarif: 45,
      }).destinataire,
    ).toBe("locataire");
    expect(
      facturationPrestation({ attribution: "proprietaire", porteur: "prestataire" }).libelle,
    ).toMatch(/prestataire/);
  });

  it("borne l'horaire précis à la plage et sérialise la méta hors du texte visible", () => {
    expect(plageValide("10:00", "14:00")).toBe(true);
    expect(plageValide("14:00", "10:00")).toBe(false);
    expect(horaireDansPlage("11:30", "10:00", "14:00")).toBe(true);
    expect(horaireDansPlage("09:00", "10:00", "14:00")).toBe(false);
    const description = ecrireDescription("Installer le lit bébé", {
      plageDebut: "10:00",
      plageFin: "14:00",
      linge: true,
    });
    expect(descriptionVisible(description)).toBe("Installer le lit bébé");
    expect(lireMetaPrestation(description).linge).toBe(true);
  });

  it("pose ménage, linge et consommables sans attribution à l'import OTA", () => {
    expect(estImportOta("Airbnb")).toBe(true);
    expect(estImportOta("Direct")).toBe(false);
    const lignes = lignesServicesImport();
    expect(lignes.map((l) => l.titre)).toEqual(["Ménage", "Linge de maison", "Consommables"]);
    expect(lignes.every((l) => !l.meta.attribution)).toBe(true);
    expect(joursPrestation("2026-03-01", "2026-06-01").length).toBe(31);
  });

  it("propose bloquer ou débloquer selon la case", () => {
    expect(actionsDate(false).some((a) => a.id === "bloquer")).toBe(true);
    expect(actionsDate(true).some((a) => a.id === "debloquer")).toBe(true);
    expect(actionsDate(false).some((a) => a.label.includes("note"))).toBe(true);
  });

  it("masque les actions de case que le rôle ne peut pas écrire", () => {
    const lecture = actionsDateAutorisees(false, {
      reservations: false,
      missions: false,
      finances: false,
    });
    expect(lecture).toEqual([]);
    const finances = actionsDateAutorisees(false, {
      reservations: false,
      missions: false,
      finances: true,
    }).map((a) => a.id);
    expect(finances).toEqual(["evenement"]);
  });

  it("garde le règlement prestataire quand le formulaire réécrit la méta", () => {
    const sauve = conserverReglementPrestation(
      { payePrestataire: 45, attribution: "proprietaire", tarif: 45 },
      { attribution: "proprietaire", tarif: 50, porteur: "prestataire" },
    );
    expect(sauve.payePrestataire).toBe(45);
    expect(sauve.tarif).toBe(50);
    expect(conserverReglementPrestation({}, { tarif: 20 }).payePrestataire).toBeUndefined();
  });

  it("ne ferme la case du mois que si chaque logement est bloqué", () => {
    const dates = [{ bienId: "suzette", date: "2026-03-05", motif: "Bloqué" }];
    expect(syntheseBlocagesJour(dates, ["suzette", "colette"], "2026-03-05")).toEqual({
      fermes: 1,
      ouvertures: 0,
      toutFerme: false,
      toutOuvert: false,
    });
    expect(
      syntheseBlocagesJour(
        [...dates, { bienId: "colette", date: "2026-03-05", motif: "Bloqué" }],
        ["suzette", "colette"],
        "2026-03-05",
      ).toutFerme,
    ).toBe(true);
    expect(
      syntheseBlocagesJour(
        [{ bienId: "raclette", date: "2026-03-05", motif: "Bloqué" }],
        ["suzette"],
        "2026-03-05",
      ),
    ).toEqual({ fermes: 0, ouvertures: 0, toutFerme: false, toutOuvert: false });
  });

  it("solde une facture prestataire sans dépasser le tarif", () => {
    expect(solderPrestation(80, 0, 30)).toEqual({ ok: true, paye: 30, restant: 50 });
    expect(solderPrestation(80, 30, 50)).toEqual({ ok: true, paye: 80, restant: 0 });
    expect(solderPrestation(80, 30, 60).ok).toBe(false);
    expect(solderPrestation(80, 0, 0).ok).toBe(false);
    const lignes = facturesPrestataires(
      [
        {
          id: "ms",
          bienId: "suzette",
          date: "2026-03-05",
          titre: "Ménage",
          assigne: "Lucas Ménage",
          description: ecrireDescription("Ménage", {
            attribution: "proprietaire",
            porteur: "prestataire",
            tarif: 45,
            payePrestataire: 15,
          }),
        },
      ],
      [{ id: "suzette", nom: "Suzette" }],
      { debut: "2026-01-01", fin: "2026-12-31", bienId: "tous" },
    );
    expect(lignes).toEqual([
      {
        id: "ms",
        titre: "Ménage",
        prestataire: "Lucas Ménage",
        logement: "Suzette",
        date: "2026-03-05",
        du: 45,
        paye: 15,
        restant: 30,
      },
    ]);
  });
});

describe("droits team mate", () => {
  it("démarre personnalisé avec tout restreint, sous le plafond du profil", () => {
    expect(droitsPersonnalises("gestionnaire", [])).toEqual(["__restreint__"]);
    expect(droitsEffectifs("gestionnaire", droitsPersonnalises("gestionnaire", []))).toEqual([]);
    expect(
      droitsEffectifs(
        "gestionnaire",
        droitsPersonnalises("gestionnaire", ["messagerie", "gerer-equipe"]),
      ),
    ).toEqual(["messagerie"]);
    expect(droitAutoriseParProfil("gestionnaire", "gerer-equipe")).toBe(false);
    expect(droitAutoriseParProfil("administrateur", "voir-finances")).toBe(true);
    expect(DROITS_PAR_ROLE.lecteur).not.toContain("mod-finances");
  });
});

describe("lieux et pré-checkin", () => {
  it("mappe occupation et type sur les colonnes déjà stockées", () => {
    expect(ficheDepuisOccupation("Bateau", "Meublé")).toEqual({
      typologie: "Bateau",
      meuble: true,
      statut: "libre",
    });
    expect(ficheDepuisOccupation("Villa", "Travaux").statut).toBe("en travaux");
    expect(ficheDepuisOccupation("Jardin", "Événement").typologie).toBe("Lieu d'événement");
    expect(ficheDepuisOccupation("Appartement", "Vide").meuble).toBe(false);
  });

  it("importe et exporte une annonce sans API externe", () => {
    const csv = exporterAnnonces([
      { nom: "Villa Sud", type: "Villa", occupation: "Meublé", adresse: "Nice", note: 4.5 },
    ]);
    const relu = importerAnnonces(`${csv}\n;Villa;Meublé;;\nGarage;Garage;Inconnu;;`);
    expect(relu.lignes).toHaveLength(1);
    expect(relu.lignes[0]?.nom).toBe("Villa Sud");
    expect(relu.ignorees).toBe(2);
  });

  it("applique la caution aux baux et aux voyageurs avec le même montant", () => {
    const extra = {
      rectoVerso: true,
      photo: true,
      fichier: true,
      telephone: false,
      codePorteJourArrivee: true,
      cautionActive: true,
      cautionMontant: 500,
      cautionBaux: true,
      cautionVoyageurs: true,
      upsellsProposes: ["u1"],
    };
    expect(cautionDemandee(extra, "bail")).toEqual({ demandee: true, montant: 500 });
    expect(cautionDemandee(extra, "voyageur").montant).toBe(500);
    expect(cautionDemandee({ ...extra, cautionVoyageurs: false }, "voyageur").demandee).toBe(false);
    expect(cautionDemandee({ ...extra, cautionActive: false }, "bail").demandee).toBe(false);
  });

  it("ne remplace pas un extra déjà enregistré en base", () => {
    const distant = { ...EXTRA_PRECHECKIN_DEFAUT, cautionMontant: 200, cautionActive: true };
    const legacy = { ...EXTRA_PRECHECKIN_DEFAUT, cautionMontant: 900 };
    expect(fusionMigrationExtra({ extra: distant, enregistre: true }, legacy).pousser).toBe(false);
    expect(
      fusionMigrationExtra({ extra: distant, enregistre: true }, legacy).extra.cautionMontant,
    ).toBe(200);
    expect(
      fusionMigrationExtra({ extra: EXTRA_PRECHECKIN_DEFAUT, enregistre: false }, legacy),
    ).toMatchObject({
      pousser: true,
      extra: { cautionMontant: 900 },
    });
  });
});

describe("paiements et tarifs", () => {
  it("calcule le reste à devoir et le message de relance", () => {
    expect(resteADevoir(340, false)).toBe(340);
    expect(resteADevoir(340, true)).toBe(0);
    expect(
      messageRelancePaiement({
        locataire: "Jean",
        montant: 340,
        bienNom: "Suzette",
        echeance: "04/03/2026",
        lien: "https://hublify.test/payer/1",
      }),
    ).toMatch(/340/);
  });

  it("marque une règle comme valable uniquement sur sa période", () => {
    const note = noterPortee("Week-end", true);
    expect(lirePortee(note)).toEqual({ periodeSeule: true, note: "Week-end" });
    expect(lirePortee(noterPortee(note, false)).periodeSeule).toBe(false);
  });
});

describe("saisie d'un paiement prestataire (le dialogue ne ferme qu'après succès)", () => {
  it("lit la virgule ou le point comme séparateur décimal", () => {
    expect(montantDepuisSaisie("12,5")).toBe(12.5);
    expect(montantDepuisSaisie(" 1 200.75 ")).toBe(1200.75);
  });

  it("refuse une saisie vide ou illisible avec un message exploitable", () => {
    for (const saisie of ["", "   ", "abc"]) {
      const r = solderPrestation(100, 0, montantDepuisSaisie(saisie));
      expect(r.ok).toBe(false);
      if (!r.ok)
        expect(messageRefusPaiement(r.raison)).toBe("Indiquez un montant supérieur à zéro.");
    }
  });

  it("refuse un montant supérieur au restant dû sans rien enregistrer", () => {
    const r = solderPrestation(100, 40, montantDepuisSaisie("70"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(messageRefusPaiement(r.raison)).toBe("Le montant dépasse le restant dû.");
  });

  it("accepte un montant valide", () => {
    expect(solderPrestation(100, 40, montantDepuisSaisie("60")).ok).toBe(true);
  });
});
