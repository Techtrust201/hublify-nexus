/**
 * Tests de caractérisation (chantier « Créer une Mission », PR 1).
 *
 * Ils figent AU CENTIME PRÈS les montants calculés aujourd'hui, avant toute
 * évolution des règles de facturation : facture propriétaire (barème fixe,
 * totaux, pieds « Montant dû »), KPI « Frais de gestion », facture voyageur
 * et son CSV, facturation et paiement des prestataires.
 *
 * Les données sont fictives. Les missions reprennent les cas rencontrés en
 * prod : attribution mandataire / locataire / propriétaire, avec ou sans
 * tarif, avec ou sans réservation liée, réalisée par le propriétaire, sans
 * aucune méta. Un écart sur ces tests signale un changement de montant déjà
 * présenté : il doit être voulu, daté (date d'effet) et validé.
 */
import { describe, expect, it } from "vitest";
import { etatVide, type EtatSession } from "@/data/etat-session";
import type { MissionMo1 } from "@/data/planning-mo1";
import type { ReservationMo1 } from "@/data/reservations-mo1";
import { BAREME_FRAIS_GESTION_CENTIMES, totauxFacture } from "@/lib/analyse-finance";
import {
  construireAnalyse,
  exporterFactureVoyageurCsv,
  piedsFacture,
  type FiltreAnalyse,
} from "@/lib/analyse-vue";
import {
  ecrireDescription,
  facturationPrestation,
  facturesPrestataires,
  lireMetaPrestation,
  reglerPrestation,
  type MetaPrestation,
} from "@/lib/gestionnaire-planning";
import { analyserReservations } from "@/lib/kpi";

const NOVEMBRE: FiltreAnalyse = {
  debut: "2026-11-01",
  fin: "2026-11-30",
  aujourdhui: "2026-11-18",
};

function resa(r: Partial<ReservationMo1> & Pick<ReservationMo1, "id" | "bienId">): ReservationMo1 {
  return {
    occupant: `Voyageur ${r.id}`,
    initiales: "VF",
    email: "",
    telephone: "",
    arrivee: "2026-11-01",
    depart: "2026-11-02",
    heureArrivee: "16:00",
    heureDepart: "11:00",
    plateforme: "Direct",
    voyageurs: 2,
    adultes: 2,
    enfants: 0,
    montant: 0,
    paye: 0,
    statut: "Confirmé",
    couleur: "#000000",
    ...r,
  } as ReservationMo1;
}

function mission(
  id: string,
  bienId: string,
  date: string,
  type: MissionMo1["type"],
  meta: MetaPrestation | null,
  assigne = "Prestataire Fictif",
): MissionMo1 {
  return {
    id,
    bienId,
    date,
    titre: `${type} ${id}`,
    type,
    emoji: "",
    heure: "10:00",
    assigne,
    statut: "a_faire",
    description: meta ? ecrireDescription("Consigne fictive", meta) : "Consigne fictive",
  };
}

/** Missions : les cas des 5 missions prod avec méta + missions sans méta. */
const MISSIONS: MissionMo1[] = [
  // Prod 1 : ménage au mandataire, sans tarif, réservation liée.
  mission("p1-menage-mandataire", "b-alpha", "2026-11-06", "Menage", {
    attribution: "mandataire",
    porteur: "prestataire",
    reservationId: "r-air",
    linge: true,
  }),
  // Prod 2 : check-out au mandataire réalisé par le propriétaire, réservation liée.
  mission("p2-checkout-proprio", "b-beta", "2026-11-13", "Check-out", {
    attribution: "mandataire",
    porteur: "proprietaire",
    reservationId: "r-dir",
  }),
  // Prod 3 : ménage au locataire, tarif 45 €, réservation liée.
  mission("p3-menage-locataire", "b-alpha", "2026-11-24", "Menage", {
    attribution: "locataire",
    porteur: "prestataire",
    tarif: 45,
    reservationId: "r-book",
    consommable: true,
  }),
  // Prod 4 : check-in sans attribution, sans réservation.
  mission("p4-checkin", "b-beta", "2026-11-10", "Check-in", { porteur: "prestataire" }),
  // Prod 5 : ménage sur un bien sans propriétaire, marketplace.
  mission("p5-menage-sans-proprio", "b-gamma", "2026-11-15", "Menage", {
    porteur: "prestataire",
    marketplace: true,
  }),
  // Propriétaire avec tarif et acompte prestataire (absent de la prod, couvert ici).
  mission("x1-menage-proprio-tarif", "b-beta", "2026-11-14", "Menage", {
    attribution: "proprietaire",
    porteur: "prestataire",
    tarif: 60,
    payePrestataire: 20,
  }),
  // Propriétaire sans tarif : en attente de prix.
  mission("x2-menage-proprio-sans-tarif", "b-gamma", "2026-11-16", "Menage", {
    attribution: "proprietaire",
    porteur: "prestataire",
  }),
  // Mandataire avec tarif contractuel saisi, réalisé par un team mate.
  mission("x3-maintenance-mandataire", "b-alpha", "2026-11-09", "Maintenance", {
    attribution: "mandataire",
    porteur: "teammate",
    tarif: 70.555,
  }),
  // Missions sans méta (12 sur 17 en prod).
  mission("s1-maintenance", "b-alpha", "2026-11-03", "Maintenance", null),
  mission("s2-inventaire", "b-beta", "2026-11-04", "Inventaire", null),
  mission("s3-checkin", "b-alpha", "2026-11-02", "Check-in", null),
  // Hors période (décembre) : ne compte pas en novembre.
  mission("h1-menage-decembre", "b-alpha", "2026-12-05", "Menage", { tarif: 50 }),
];

function session(): EtatSession {
  const s = etatVide();
  return {
    ...s,
    biens: [
      { id: "b-alpha", nom: "Logement Alpha", baseNuit: 100, proprietaire: "Propriétaire Alpha" },
      { id: "b-beta", nom: "Logement Beta", baseNuit: 80, proprietaire: "Propriétaire Beta" },
      { id: "b-gamma", nom: "Logement Gamma", baseNuit: 60, proprietaire: "" },
    ],
    reservationsDossier: [
      resa({
        id: "r-air",
        bienId: "b-alpha",
        plateforme: "Airbnb",
        arrivee: "2026-11-02",
        depart: "2026-11-06",
        montant: 600,
        paye: 600,
        fraisMenage: 50,
        taxeSejour: 8,
        upsellIds: ["u-panier"],
      }),
      resa({
        id: "r-dir",
        bienId: "b-beta",
        plateforme: "Direct",
        arrivee: "2026-11-10",
        depart: "2026-11-13",
        montant: 360,
        paye: 0,
        commissionPourcent: 20,
      }),
      resa({
        id: "r-book",
        bienId: "b-alpha",
        plateforme: "Booking.com",
        arrivee: "2026-11-20",
        depart: "2026-11-24",
        montant: 480,
        paye: 200,
        fraisMenage: 40,
      }),
      resa({
        id: "r-bail",
        bienId: "b-beta",
        plateforme: "Direct",
        type: "Bail meublé",
        arrivee: "2026-01-01",
        depart: "2026-12-31",
        montant: 900,
        paye: 900,
      }),
      resa({
        id: "r-annule",
        bienId: "b-gamma",
        plateforme: "Airbnb",
        statut: "Annulé",
        arrivee: "2026-11-05",
        depart: "2026-11-07",
        montant: 200,
      }),
    ],
    missions: MISSIONS,
    edl: [
      { id: "e1", date: "2026-11-02" },
      { id: "e2", date: "2026-11-24" },
      { id: "e3", date: "2026-10-31" },
    ] as unknown as EtatSession["edl"],
    parametrage: {
      ...s.parametrage,
      upsells: [{ id: "u-panier", nom: "Panier", prix: 30, actif: true }],
    },
  };
}

describe("caractérisation — facture propriétaire (barème fixe)", () => {
  const vue = construireAnalyse(session(), NOVEMBRE);

  it("garde le barème fixe actuel", () => {
    expect(BAREME_FRAIS_GESTION_CENTIMES).toEqual({
      Menage: 4_500,
      Linge: 1_200,
      "Check-in": 2_000,
      "Check-out": 1_500,
      Maintenance: 8_000,
      "Etat des lieux": 8_000,
    });
  });

  it("compte les missions par type sans regarder attribution, tarif ni porteur", () => {
    // Novembre : 5 ménages (p1, p3, p5, x1, x2), 2 check-in (p4, s3),
    // 1 check-out (p2), 2 maintenances (x3, s1), 2 EDL. L'inventaire n'est pas facturé.
    expect(vue.fraisGestion).toEqual([
      { nature: "Ménage", quantite: 5, prixUnitaireHt: 4_500, totalHt: 22_500 },
      { nature: "Linge et consommables", quantite: 5, prixUnitaireHt: 1_200, totalHt: 6_000 },
      { nature: "Check-in", quantite: 2, prixUnitaireHt: 2_000, totalHt: 4_000 },
      { nature: "Check-out", quantite: 1, prixUnitaireHt: 1_500, totalHt: 1_500 },
      {
        nature: "Commission exceptionnelle (travaux)",
        quantite: 2,
        prixUnitaireHt: 8_000,
        totalHt: 16_000,
      },
      { nature: "État des lieux", quantite: 2, prixUnitaireHt: 8_000, totalHt: 16_000 },
    ]);
  });

  it("fige les lignes de la facture propriétaire", () => {
    expect(vue.factureProprietaire).toMatchInlineSnapshot(`
      [
        {
          "id": "hon-r-bail",
          "nature": "Honoraires de gestion locative — Logement Beta (8 % TTC du loyer, mise en location et état des lieux inclus s'ils sont au mandat)",
          "periode": "2026-01-01 → 2026-12-31",
          "prixUnitaireHt": 6000,
          "quantite": 1,
          "tauxTva": 0.2,
          "tvaForcee": 1200,
        },
        {
          "id": "hon-r-air",
          "nature": "Honoraires de gestion des séjours — Logement Alpha (15 % TTC du loyer)",
          "periode": "2026-11-02 → 2026-11-06",
          "prixUnitaireHt": 7500,
          "quantite": 1,
          "tauxTva": 0.2,
          "tvaForcee": 1500,
        },
        {
          "id": "hon-r-dir",
          "nature": "Honoraires de gestion des séjours — Logement Beta (20 % TTC du loyer)",
          "periode": "2026-11-10 → 2026-11-13",
          "prixUnitaireHt": 6000,
          "quantite": 1,
          "tauxTva": 0.2,
          "tvaForcee": 1200,
        },
        {
          "id": "hon-r-book",
          "nature": "Honoraires de gestion des séjours — Logement Alpha (15 % TTC du loyer)",
          "periode": "2026-11-20 → 2026-11-24",
          "prixUnitaireHt": 6000,
          "quantite": 1,
          "tauxTva": 0.2,
          "tvaForcee": 1200,
        },
        {
          "id": "frais-Ménage",
          "nature": "Ménage",
          "periode": "2026-11-01 → 2026-11-30",
          "prixUnitaireHt": 4500,
          "quantite": 5,
          "tauxTva": 0.2,
        },
        {
          "id": "frais-Linge et consommables",
          "nature": "Linge et consommables",
          "periode": "2026-11-01 → 2026-11-30",
          "prixUnitaireHt": 1200,
          "quantite": 5,
          "tauxTva": 0.2,
        },
        {
          "id": "frais-Check-in",
          "nature": "Check-in",
          "periode": "2026-11-01 → 2026-11-30",
          "prixUnitaireHt": 2000,
          "quantite": 2,
          "tauxTva": 0.2,
        },
        {
          "id": "frais-Check-out",
          "nature": "Check-out",
          "periode": "2026-11-01 → 2026-11-30",
          "prixUnitaireHt": 1500,
          "quantite": 1,
          "tauxTva": 0.2,
        },
        {
          "id": "frais-Commission exceptionnelle (travaux)",
          "nature": "Commission exceptionnelle (travaux)",
          "periode": "2026-11-01 → 2026-11-30",
          "prixUnitaireHt": 8000,
          "quantite": 2,
          "tauxTva": 0.2,
        },
        {
          "id": "frais-État des lieux",
          "nature": "État des lieux",
          "periode": "2026-11-01 → 2026-11-30",
          "prixUnitaireHt": 8000,
          "quantite": 2,
          "tauxTva": 0.2,
        },
      ]
    `);
  });

  it("fige les totaux HT / TVA / TTC", () => {
    expect(totauxFacture(vue.factureProprietaire)).toMatchInlineSnapshot(`
      {
        "totalHt": 91500,
        "totalTtc": 109800,
        "totalTva": 18300,
        "tvaParTaux": [
          {
            "baseHt": 91500,
            "taux": 0.2,
            "tva": 18300,
          },
        ],
      }
    `);
  });

  it("fige les pieds de facture (montant reversé, montant dû)", () => {
    expect(piedsFacture(vue)).toMatchInlineSnapshot(`
      {
        "du": 93600,
        "fraisTtc": 79200,
        "honorairesNonPercus": 14400,
        "honorairesPercus": 16200,
        "nets": 206000,
        "reverse": 80000,
      }
    `);
  });

  it("filtre par logement : seules les missions du bien, mais tous les EDL", () => {
    const alpha = construireAnalyse(session(), { ...NOVEMBRE, bienId: "b-alpha" });
    expect(alpha.fraisGestion).toMatchInlineSnapshot(`
      [
        {
          "nature": "Ménage",
          "prixUnitaireHt": 4500,
          "quantite": 2,
          "totalHt": 9000,
        },
        {
          "nature": "Linge et consommables",
          "prixUnitaireHt": 1200,
          "quantite": 2,
          "totalHt": 2400,
        },
        {
          "nature": "Check-in",
          "prixUnitaireHt": 2000,
          "quantite": 1,
          "totalHt": 2000,
        },
        {
          "nature": "Commission exceptionnelle (travaux)",
          "prixUnitaireHt": 8000,
          "quantite": 2,
          "totalHt": 16000,
        },
        {
          "nature": "État des lieux",
          "prixUnitaireHt": 8000,
          "quantite": 2,
          "totalHt": 16000,
        },
      ]
    `);
    expect(totauxFacture(alpha.factureProprietaire)).toMatchInlineSnapshot(`
      {
        "totalHt": 58900,
        "totalTtc": 70680,
        "totalTva": 11780,
        "tvaParTaux": [
          {
            "baseHt": 58900,
            "taux": 0.2,
            "tva": 11780,
          },
        ],
      }
    `);
    expect(piedsFacture(alpha)).toMatchInlineSnapshot(`
      {
        "du": 54480,
        "fraisTtc": 54480,
        "honorairesNonPercus": 0,
        "honorairesPercus": 16200,
        "nets": 80000,
        "reverse": 80000,
      }
    `);
  });
});

describe("caractérisation — KPI « Frais de gestion » (Revenus, Gestionnaires, Analyse 2)", () => {
  it("fige le montant HT affiché sur les trois écrans", () => {
    const vue = construireAnalyse(session(), NOVEMBRE);
    // Les trois écrans lisent la même valeur `vue.kpi.fraisGestionHt`.
    expect(vue.kpi.fraisGestionHt).toBe(66_000);
    expect(vue.kpi.fraisGestionHt).toBe(vue.fraisGestion.reduce((n, f) => n + f.totalHt, 0));
    expect(
      construireAnalyse(session(), { ...NOVEMBRE, bienId: "b-beta" }).kpi.fraisGestionHt,
    ).toMatchInlineSnapshot(`25200`);
  });

  it("fige le KPI dérivé de kpi.ts (frais prestataires en euros)", () => {
    const k = analyserReservations(session(), 2026).kpi;
    expect({ fraisPresta: k.fraisPresta, nbPresta: k.nbPresta, partPresta: k.partPresta })
      .toMatchInlineSnapshot(`
        {
          "fraisPresta": 797,
          "nbPresta": 20,
          "partPresta": "34 %",
        }
      `);
  });
});

describe("caractérisation — facture voyageur et CSV", () => {
  const vue = construireAnalyse(session(), NOVEMBRE);

  it("ignore les prestations attribuées au locataire (tarif de mission)", () => {
    const book = vue.facturesVoyageurs.find((f) => f.id === "r-book");
    expect(book?.lignes.map((l) => l.nature)).toEqual([
      "Location Logement Alpha",
      "Ménage locataire",
    ]);
  });

  it("fige les factures voyageurs (lignes et total TTC)", () => {
    expect(vue.facturesVoyageurs).toMatchInlineSnapshot(`
      [
        {
          "id": "r-bail",
          "lignes": [
            {
              "id": "r-bail-loyer",
              "nature": "Location Logement Beta",
              "periode": "2026-01-01 → 2026-12-31",
              "prixUnitaireHt": 90000,
              "quantite": 1,
              "tauxTva": 0,
            },
          ],
          "logement": "Logement Beta",
          "occupant": "Voyageur r-bail",
          "periode": "2026-01-01 → 2026-12-31",
          "reference": "BAIL",
          "totalTtc": 90000,
        },
        {
          "id": "r-air",
          "lignes": [
            {
              "id": "r-air-loyer",
              "nature": "Location Logement Alpha",
              "periode": "2026-11-02 → 2026-11-06",
              "prixUnitaireHt": 60000,
              "quantite": 1,
              "tauxTva": 0,
            },
            {
              "id": "r-air-menage",
              "nature": "Ménage locataire",
              "periode": "2026-11-06",
              "prixUnitaireHt": 5000,
              "quantite": 1,
              "tauxTva": 0.2,
            },
            {
              "id": "r-air-services",
              "nature": "Autres services",
              "periode": "2026-11-02 → 2026-11-06",
              "prixUnitaireHt": 3000,
              "quantite": 1,
              "tauxTva": 0.2,
            },
            {
              "id": "r-air-taxe",
              "nature": "Taxe de séjour (non soumise à TVA)",
              "periode": "2026-11-02 → 2026-11-06",
              "prixUnitaireHt": 800,
              "quantite": 1,
              "tauxTva": 0,
            },
          ],
          "logement": "Logement Alpha",
          "occupant": "Voyageur r-air",
          "periode": "2026-11-02 → 2026-11-06",
          "reference": "AIR",
          "totalTtc": 70400,
        },
        {
          "id": "r-dir",
          "lignes": [
            {
              "id": "r-dir-loyer",
              "nature": "Location Logement Beta",
              "periode": "2026-11-10 → 2026-11-13",
              "prixUnitaireHt": 36000,
              "quantite": 1,
              "tauxTva": 0,
            },
          ],
          "logement": "Logement Beta",
          "occupant": "Voyageur r-dir",
          "periode": "2026-11-10 → 2026-11-13",
          "reference": "DIR",
          "totalTtc": 36000,
        },
        {
          "id": "r-book",
          "lignes": [
            {
              "id": "r-book-loyer",
              "nature": "Location Logement Alpha",
              "periode": "2026-11-20 → 2026-11-24",
              "prixUnitaireHt": 48000,
              "quantite": 1,
              "tauxTva": 0,
            },
            {
              "id": "r-book-menage",
              "nature": "Ménage locataire",
              "periode": "2026-11-24",
              "prixUnitaireHt": 4000,
              "quantite": 1,
              "tauxTva": 0.2,
            },
          ],
          "logement": "Logement Alpha",
          "occupant": "Voyageur r-book",
          "periode": "2026-11-20 → 2026-11-24",
          "reference": "BOOK",
          "totalTtc": 52800,
        },
      ]
    `);
  });

  it("fige l'export CSV", () => {
    const csv = vue.facturesVoyageurs.map((f) => exporterFactureVoyageurCsv(f.lignes));
    expect(csv).toMatchInlineSnapshot(`
      [
        "Nature;Période;HT;TVA
      Location Logement Beta;2026-01-01 → 2026-12-31;900.00;0 %",
        "Nature;Période;HT;TVA
      Location Logement Alpha;2026-11-02 → 2026-11-06;600.00;0 %
      Ménage locataire;2026-11-06;50.00;20 %
      Autres services;2026-11-02 → 2026-11-06;30.00;20 %
      Taxe de séjour (non soumise à TVA);2026-11-02 → 2026-11-06;8.00;0 %",
        "Nature;Période;HT;TVA
      Location Logement Beta;2026-11-10 → 2026-11-13;360.00;0 %",
        "Nature;Période;HT;TVA
      Location Logement Alpha;2026-11-20 → 2026-11-24;480.00;0 %
      Ménage locataire;2026-11-24;40.00;20 %",
      ]
    `);
  });
});

describe("caractérisation — facturation et paiement des prestataires", () => {
  it("fige le destinataire et le montant calculés par mission", () => {
    expect(
      MISSIONS.map((m) => {
        const f = facturationPrestation(lireMetaPrestation(m.description));
        return `${m.id} → ${f.facture ? "facturé" : "non facturé"} · ${f.destinataire ?? "—"} · ${f.montant ?? "—"}`;
      }),
    ).toMatchInlineSnapshot(`
      [
        "p1-menage-mandataire → facturé · mandataire · —",
        "p2-checkout-proprio → non facturé · — · —",
        "p3-menage-locataire → facturé · locataire · 45",
        "p4-checkin → non facturé · — · —",
        "p5-menage-sans-proprio → non facturé · — · —",
        "x1-menage-proprio-tarif → facturé · proprietaire · 60",
        "x2-menage-proprio-sans-tarif → non facturé · proprietaire · —",
        "x3-maintenance-mandataire → facturé · mandataire · 70.555",
        "s1-maintenance → non facturé · — · —",
        "s2-inventaire → non facturé · — · —",
        "s3-checkin → non facturé · — · —",
        "h1-menage-decembre → non facturé · — · —",
      ]
    `);
  });

  it("fige la liste « Facturation prestataires » de novembre", () => {
    expect(
      facturesPrestataires(MISSIONS, session().biens, {
        debut: NOVEMBRE.debut,
        fin: NOVEMBRE.fin,
        bienId: "tous",
      }),
    ).toMatchInlineSnapshot(`
      [
        {
          "date": "2026-11-24",
          "du": 45,
          "id": "p3-menage-locataire",
          "logement": "Logement Alpha",
          "paye": 0,
          "prestataire": "Prestataire Fictif",
          "restant": 45,
          "titre": "Menage p3-menage-locataire",
        },
        {
          "date": "2026-11-14",
          "du": 60,
          "id": "x1-menage-proprio-tarif",
          "logement": "Logement Beta",
          "paye": 20,
          "prestataire": "Prestataire Fictif",
          "restant": 40,
          "titre": "Menage x1-menage-proprio-tarif",
        },
        {
          "date": "2026-11-09",
          "du": 70.56,
          "id": "x3-maintenance-mandataire",
          "logement": "Logement Alpha",
          "paye": 0,
          "prestataire": "Prestataire Fictif",
          "restant": 70.56,
          "titre": "Maintenance x3-maintenance-mandataire",
        },
      ]
    `);
  });

  it("fige les versements (solde par défaut, acompte, dépassement, montant nul)", () => {
    const meta = (id: string) =>
      lireMetaPrestation(MISSIONS.find((m) => m.id === id)?.description ?? "");
    expect({
      soldeParDefaut: reglerPrestation(meta("x1-menage-proprio-tarif")),
      acompte: reglerPrestation(meta("x1-menage-proprio-tarif"), 15.5),
      depasse: reglerPrestation(meta("x1-menage-proprio-tarif"), 40.01),
      arrondiTarif: reglerPrestation(meta("x3-maintenance-mandataire")),
      sansTarif: reglerPrestation(meta("p1-menage-mandataire")),
      porteurProprietaire: reglerPrestation(meta("p2-checkout-proprio"), 10),
    }).toMatchInlineSnapshot(`
      {
        "acompte": {
          "ok": true,
          "paye": 35.5,
          "restant": 24.5,
        },
        "arrondiTarif": {
          "ok": true,
          "paye": 70.56,
          "restant": 0,
        },
        "depasse": {
          "ok": false,
          "raison": "depasse",
        },
        "porteurProprietaire": {
          "ok": false,
          "raison": "depasse",
        },
        "sansTarif": {
          "ok": false,
          "raison": "montant",
        },
        "soldeParDefaut": {
          "ok": true,
          "paye": 60,
          "restant": 0,
        },
      }
    `);
  });
});
