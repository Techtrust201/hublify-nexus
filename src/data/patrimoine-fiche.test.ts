import { describe, expect, it } from "vitest";
import {
  EQUIPEMENTS,
  GROUPES_TYPES,
  LIBELLES_ALERTES,
  SERVICES,
  STATIONNEMENT,
  TEXTE_LEGAL_MEUBLE,
  TYPES_LIEU,
  alertesLieu,
  annoncePublable,
  exporterAnnonce,
  extraireNotation,
  fichePourBien,
  ficheVierge,
  normaliserFiche,
  importerAnnonce,
  libelleCourt,
  litDoubleValide,
  montantLoyer,
  patchBienDepuisFiche,
  typeCanonique,
  type FicheLieu,
  type LitFiche,
} from "@/data/patrimoine-fiche";

const ANNOTATION_TYPES = [
  "Immeuble",
  "Studio",
  "Appartement (T1, T2, T3, T4, T5 et plus)",
  "Duplex / triplex",
  "Loft",
  "Maison individuelle",
  "Villa",
  "Maison de ville",
  "Chalet",
  "Bastide",
  "Toit-terrasse",
  "Chambre",
  "Maison de campagne / longère",
  "Château / manoir",
  "Gîte",
  "Mobil-home",
  "Caravane camping-car",
  "Péniche",
  "Cabane / tiny house / roulotte",
  "Yourte",
  "Bureau",
  "Local commercial / boutique",
  "Local d'activité",
  "Entrepôt",
  "Espace de coworking",
  "Cabinet médical ou paramédical",
  "Restaurant",
  "Fonds de commerce (location-gérance)",
  "Garage",
  "Box",
  "Place de parking",
  "Cave",
  "Jardin",
  "Terrain agricole",
];

describe("catalogue patrimoine", () => {
  it("reprend chaque type de l'annotation, plus le bateau demandé en commentaire", () => {
    for (const type of ANNOTATION_TYPES) expect(TYPES_LIEU).toContain(type);
    expect(TYPES_LIEU).toContain("Bateau");
    expect(TYPES_LIEU).toContain("Extérieur");
    expect(GROUPES_TYPES).toHaveLength(4);
  });

  it("range les équipements, le stationnement et les services de l'annotation", () => {
    const tous = EQUIPEMENTS.flatMap((g) => [...g.items]);
    expect(tous).toEqual(
      expect.arrayContaining([
        "Wi-Fi",
        "Détecteur de monoxyde de carbone",
        "Fer à repasser et table à repasser",
        "Réfrigérateur / congélateur",
        "Douche",
        "Baignoire",
        "Netflix / Amazon Prime / Disney+ / Canal+",
        "Piscine (privée, partagée, chauffée)",
        "Équipements adaptés aux enfants",
      ]),
    );
    expect(STATIONNEMENT).toContain("Borne de recharge véhicule électrique");
    expect(STATIONNEMENT).toContain("Accès PMR");
    expect(SERVICES).toContain("Arrivée autonome (self check-in)");
  });

  it("cite l'article L. 324-1-1 du Code du tourisme", () => {
    expect(TEXTE_LEGAL_MEUBLE.principe).toContain("L. 324-1-1");
    expect(TEXTE_LEGAL_MEUBLE.principe).toContain("Code du tourisme");
    expect(TEXTE_LEGAL_MEUBLE.concerne).toContain("chambres d'hôtes");
  });
});

describe("fiche et alertes", () => {
  const edl = [{ logement: "Suzette" }, { logement: "Villa Lavandrix" }];

  it("signale welcome book et clés sur Suzette, l'état des lieux sur le studio", () => {
    const suzette = fichePourBien({ nom: "Suzette", meuble: true, statut: "loué" });
    expect(
      alertesLieu({ nom: "Suzette", fiche: suzette, codeCles: "", edl, documents: [] }),
    ).toEqual(["welcome-book", "gestion-cles"]);
    const studio = fichePourBien({ nom: "Studio Raclette", typologie: "Studio", meuble: true });
    expect(
      alertesLieu({ nom: "Studio Raclette", fiche: studio, codeCles: "", edl, documents: [] }),
    ).toEqual(["etat-des-lieux"]);
    expect(LIBELLES_ALERTES["welcome-book"]).toBe("Welcome book manquant");
  });

  it("efface l'alerte clés dès qu'un code ou un nombre de clés est connu", () => {
    const fiche = ficheVierge();
    expect(
      alertesLieu({ nom: "A", fiche, codeCles: "1234", edl: [{ logement: "A" }], documents: [] }),
    ).not.toContain("gestion-cles");
    expect(
      alertesLieu({
        nom: "A",
        fiche: { ...fiche, nombreCles: 2 },
        codeCles: "",
        edl: [{ logement: "A" }],
        documents: [],
      }),
    ).not.toContain("gestion-cles");
  });

  it("reconnaît un livret déjà versé dans les documents", () => {
    const fiche = ficheVierge();
    expect(
      alertesLieu({
        nom: "Suzette",
        fiche,
        codeCles: "1",
        edl,
        documents: [{ titre: "Welcome book Suzette", logement: "Suzette" }],
      }),
    ).not.toContain("welcome-book");
  });
});

describe("loyer, lits, annonce", () => {
  it("additionne loyer et charges en classique, et ignore les charges en forfait", () => {
    expect(
      montantLoyer({ typeLoyer: "classique", loyerHorsCharges: "650", charges: "50" }).total,
    ).toBe(700);
    expect(
      montantLoyer({ typeLoyer: "classique", loyerHorsCharges: "", charges: "" }).libelle,
    ).toBe("Loyer + charges");
    expect(
      montantLoyer({ typeLoyer: "forfaitaire", loyerHorsCharges: "900", charges: "50" }).total,
    ).toBe(900);
  });

  it("exige deux configurations pour un lit double", () => {
    const double: LitFiche = { id: "l", type: "Lit double", quantite: 1, configurations: ["", ""] };
    expect(litDoubleValide(double)).toBe(false);
    expect(litDoubleValide({ ...double, configurations: ["140 × 190", "160 × 200"] })).toBe(true);
    expect(litDoubleValide({ ...double, type: "Lit simple 90", configurations: null })).toBe(true);
  });

  it("bloque la publication d'un meublé de tourisme sans numéro", () => {
    const fiche: FicheLieu = { ...ficheVierge(), meubleTourisme: true, enregistrementMairie: "" };
    expect(annoncePublable(fiche)).toMatch(/L\. 324-1-1/);
    expect(annoncePublable({ ...fiche, enregistrementMairie: "7510100000000" })).toBeNull();
  });

  it("importe et réexporte une annonce, et lit une notation dans un texte libre", () => {
    const fiche = { ...ficheVierge(), description: "Lumineux", equipements: ["Wi-Fi"] };
    const json = exporterAnnonce({
      version: 1,
      nom: "Colette",
      typologie: "Appartement (T1, T2, T3, T4, T5 et plus)",
      adresse: "Lyon",
      fiche,
    });
    const relu = importerAnnonce(json);
    expect(relu.nom).toBe("Colette");
    expect(relu.fiche?.description).toBe("Lumineux");
    expect(relu.fiche?.photos).toEqual([]);
    const avecPhoto = normaliserFiche({
      photos: [{ id: "p1", nom: "salon.jpg", dataUrl: "data:image/jpeg;base64,AAAA" }],
    });
    expect(avecPhoto.photos).toEqual([{ id: "p1", nom: "salon.jpg" }]);
    expect(JSON.stringify(avecPhoto.photos)).not.toContain("data:");

    const texte = importerAnnonce("Villa des pins\nNote : 4,8/5\nPiscine au sud.");
    expect(texte.nom).toBe("Villa des pins");
    expect(texte.notation).toBe(4.8);
    expect(texte.fiche?.description).toContain("Piscine");
    expect(extraireNotation("aucune note")).toBeNull();
    expect(extraireNotation("9/5")).toBeNull();
  });

  it("aligne le bien sur le mode d'usage", () => {
    const patch = patchBienDepuisFiche(
      { statut: "libre", meuble: true, note: 4 },
      {
        nom: "Box 3",
        typologie: "Garage",
        adresse: "Rue basse",
        proprietaire: "Pierre Moreau",
        fiche: { ...ficheVierge(), usage: "travaux", surfaceM2: "12", immeubleId: "i1" },
      },
    );
    expect(patch.statut).toBe("en travaux");
    expect(patch.surface).toBe("12 m²");
    expect(patch.initiales).toBe("PM");
    expect(patch.immeubleId).toBe("i1");
    expect(libelleCourt("Appartement (T1, T2, T3, T4, T5 et plus)")).toBe("Appartement");
    expect(typeCanonique("Exterieur")).toBe("Extérieur");
    expect(typeCanonique("Maison")).toBe("Maison individuelle");
  });
});
