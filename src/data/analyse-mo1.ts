export type OngletAnalyse = "occupation" | "revenus" | "gestionnaire";

export type PaiementAnalyse = {
  id: string;
  nom: string;
  initiales: string;
  logement: string;
  localisation: string;
  reservation: string;
  reservationId: string;
  arrivee: string;
  depart: string;
  booking: string;
  nuits: number;
  montant: number;
  commission: number;
  canal: "Airbnb" | "Booking.com" | "Direct";
  statut: "Validé" | "En attente";
};

export const EVOLUTION_REVENUS = [
  { mois: "JAN 2025", brut: 3200, net: 2800 },
  { mois: "FEV 2025", brut: 3500, net: 3000 },
  { mois: "MAR 2025", brut: 4100, net: 3500 },
  { mois: "AVR 2025", brut: 3800, net: 3200 },
  { mois: "MAI 2025", brut: 4500, net: 3900 },
  { mois: "JUN 2025", brut: 5200, net: 4700 },
];

export const OCCUPATION_MENSUELLE = [
  { mois: "Jan", taux: 62 },
  { mois: "Fév", taux: 71 },
  { mois: "Mar", taux: 84 },
  { mois: "Avr", taux: 78 },
  { mois: "Mai", taux: 88 },
  { mois: "Juin", taux: 92 },
];

export const KPI_ANALYSE = {
  net: 21100,
  variationNet: 18,
  deltaNet: 3200,
  revenuNuit: 93,
  nuits: 227,
  variationNuit: -3,
  fraisPresta: 1680,
  nbPresta: 56,
  partPresta: "10-15%",
  commissionsOta: 2870,
  partOta: "13,6 % moy.",
  variationOta: 24,
  autres: 1450,
  partAutres: "6,9 %",
  commissionGestionnaire: 1000,
  revenusValides: 18230,
  partValides: "86,4 %",
};

export const PAIEMENTS_ANALYSE: PaiementAnalyse[] = [
  {
    id: "p1",
    nom: "Sophie Martin",
    initiales: "SM",
    logement: "Suzette",
    localisation: "Paris",
    reservation: "HUB-000123",
    reservationId: "r-sophie",
    arrivee: "03/03/2026",
    depart: "10/03/2026",
    booking: "BK000123",
    nuits: 7,
    montant: 1260,
    commission: 126,
    canal: "Airbnb",
    statut: "Validé",
  },
  {
    id: "p2",
    nom: "Jean Dupont",
    initiales: "JD",
    logement: "Villa Lavandrix",
    localisation: "Nice",
    reservation: "HUB-000124",
    reservationId: "r-jean",
    arrivee: "04/03/2026",
    depart: "07/03/2026",
    booking: "BK000124",
    nuits: 3,
    montant: 340,
    commission: 34,
    canal: "Booking.com",
    statut: "Validé",
  },
  {
    id: "p3",
    nom: "Pierre Bernard",
    initiales: "PB",
    logement: "Appartement Colette",
    localisation: "Paris",
    reservation: "HUB-000125",
    reservationId: "r-pierre",
    arrivee: "03/03/2026",
    depart: "06/03/2026",
    booking: "BK000125",
    nuits: 3,
    montant: 420,
    commission: 42,
    canal: "Direct",
    statut: "Validé",
  },
  {
    id: "p4",
    nom: "Anna Schmidt",
    initiales: "AS",
    logement: "Appartement Colette",
    localisation: "Paris",
    reservation: "HUB-000126",
    reservationId: "r-anna",
    arrivee: "06/03/2026",
    depart: "09/03/2026",
    booking: "BK000126",
    nuits: 3,
    montant: 390,
    commission: 39,
    canal: "Booking.com",
    statut: "En attente",
  },
  {
    id: "p5",
    nom: "Marie Curie",
    initiales: "MC",
    logement: "Villa Lavandrix",
    localisation: "Nice",
    reservation: "HUB-000127",
    reservationId: "r-marie",
    arrivee: "07/03/2026",
    depart: "10/03/2026",
    booking: "BK000127",
    nuits: 3,
    montant: 510,
    commission: 51,
    canal: "Airbnb",
    statut: "En attente",
  },
  {
    id: "p6",
    nom: "Lucas Martin",
    initiales: "LM",
    logement: "Studio Raclette",
    localisation: "Lyon",
    reservation: "HUB-000128",
    reservationId: "r-lucas",
    arrivee: "07/03/2026",
    depart: "10/03/2026",
    booking: "BK000128",
    nuits: 3,
    montant: 270,
    commission: 27,
    canal: "Direct",
    statut: "Validé",
  },
  {
    id: "p7",
    nom: "Camille Morel",
    initiales: "CM",
    logement: "Suzette",
    localisation: "Paris",
    reservation: "HUB-000129",
    reservationId: "r-camille",
    arrivee: "12/03/2026",
    depart: "16/03/2026",
    booking: "BK000129",
    nuits: 4,
    montant: 540,
    commission: 54,
    canal: "Airbnb",
    statut: "Validé",
  },
  {
    id: "p8",
    nom: "Thomas Leroy",
    initiales: "TL",
    logement: "Studio Raclette",
    localisation: "Lyon",
    reservation: "HUB-000130",
    reservationId: "r-thomas",
    arrivee: "02/03/2026",
    depart: "06/03/2026",
    booking: "BK000130",
    nuits: 4,
    montant: 210,
    commission: 21,
    canal: "Direct",
    statut: "Validé",
  },
];
