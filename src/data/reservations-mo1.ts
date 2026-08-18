// SOURCE: Maquette MO1 — Réservations & Occupants
// Noms, adresses, montants et libellés relevés dans les frames Dashboard/Calendar
// et Vision Occupations / Visions Liste occupants.

export const AUJOURD_HUI_MO1 = "2026-03-05";
export const ANCRE_PLANNING_MO1 = "2026-03-04";

export type PlateformeMo1 = "Airbnb" | "Booking.com" | "Direct" | "Autre";
export type StatutReservationMo1 = "Confirmé" | "En attente" | "Annulé";
export type PaiementMo1 = "paye" | "partiel" | "impaye";
export type TypeOccupantMo1 = "Locataire" | "Voyageur";
export type StatutOccupantMo1 = "Actif" | "À venir";
export type TypeReservationMo1 =
  | "Location saisonnière"
  | "Bail nu"
  | "Bail meublé"
  | "Bail mobilité"
  | "Bail étudiant";

export type BienMo1 = {
  id: string;
  nom: string;
  adresse: string;
  plateformes: Record<PlateformeMo1, "actif" | "inactif" | "aucun">;
};

export type ReservationMo1 = {
  id: string;
  bienId: string;
  occupant: string;
  initiales: string;
  email: string;
  telephone: string;
  arrivee: string;
  depart: string;
  heureArrivee: string;
  heureDepart: string;
  plateforme: PlateformeMo1;
  voyageurs: number;
  adultes: number;
  enfants: number;
  montant: number;
  paye: number;
  statut: StatutReservationMo1;
  couleur: string;
};

export type DateBloqueeMo1 = {
  id: string;
  bienId: string;
  date: string;
  motif: string;
};

export type OccupantMo1 = {
  id: string;
  nom: string;
  initiales: string;
  type: TypeOccupantMo1;
  logement: string;
  telephone: string;
  email: string;
  arrivee: string;
  depart?: string;
  statut: StatutOccupantMo1;
};

export type PrestataireMo1 = {
  id: string;
  nom: string;
  initiales: string;
  metier: string;
  telephone: string;
  email: string;
  statut: "Actif" | "Inactif";
};

export const BIENS_MO1: BienMo1[] = [
  {
    id: "suzette",
    nom: "Suzette",
    adresse: "12 rue des Lilas, Paris",
    plateformes: { Airbnb: "actif", "Booking.com": "inactif", Direct: "aucun", Autre: "aucun" },
  },
  {
    id: "lavandrix",
    nom: "Villa Lavandrix",
    adresse: "8 allée des Pins, Nice",
    plateformes: { Airbnb: "actif", "Booking.com": "actif", Direct: "aucun", Autre: "aucun" },
  },
  {
    id: "colette",
    nom: "Appartement Colette",
    adresse: "3 bd Haussmann, Paris",
    plateformes: { Airbnb: "inactif", "Booking.com": "actif", Direct: "actif", Autre: "aucun" },
  },
  {
    id: "raclette",
    nom: "Studio Raclette",
    adresse: "17 rue du Mont-Blanc, Lyon",
    plateformes: { Airbnb: "actif", "Booking.com": "inactif", Direct: "actif", Autre: "aucun" },
  },
];

export const RESERVATIONS_MO1: ReservationMo1[] = [
  {
    id: "r-sophie",
    bienId: "suzette",
    occupant: "Sophie Martin",
    initiales: "SM",
    email: "sophie.martin@email.fr",
    telephone: "+33 6 12 34 56 78",
    arrivee: "2026-03-03",
    depart: "2026-03-10",
    heureArrivee: "16:00",
    heureDepart: "10:00",
    plateforme: "Airbnb",
    voyageurs: 3,
    adultes: 2,
    enfants: 1,
    montant: 1260,
    paye: 1260,
    statut: "Confirmé",
    couleur: "#e5e7eb",
  },
  {
    id: "r-jean",
    bienId: "lavandrix",
    occupant: "Jean Dupont",
    initiales: "JD",
    email: "jean.dupont@email.fr",
    telephone: "+33 6 98 76 54 32",
    arrivee: "2026-03-04",
    depart: "2026-03-07",
    heureArrivee: "15:00",
    heureDepart: "11:00",
    plateforme: "Booking.com",
    voyageurs: 2,
    adultes: 2,
    enfants: 0,
    montant: 340,
    paye: 340,
    statut: "Confirmé",
    couleur: "#d1d5dc",
  },
  {
    id: "r-marie",
    bienId: "lavandrix",
    occupant: "Marie Curie",
    initiales: "MC",
    email: "marie.curie@email.fr",
    telephone: "+33 6 11 22 33 44",
    arrivee: "2026-03-07",
    depart: "2026-03-10",
    heureArrivee: "16:00",
    heureDepart: "10:00",
    plateforme: "Airbnb",
    voyageurs: 1,
    adultes: 1,
    enfants: 0,
    montant: 510,
    paye: 255,
    statut: "Confirmé",
    couleur: "#e5e7eb",
  },
  {
    id: "r-pierre",
    bienId: "colette",
    occupant: "Pierre Bernard",
    initiales: "PB",
    email: "pierre.b@pro.fr",
    telephone: "+33 6 55 44 33 22",
    arrivee: "2026-03-03",
    depart: "2026-03-06",
    heureArrivee: "16:00",
    heureDepart: "10:00",
    plateforme: "Direct",
    voyageurs: 5,
    adultes: 3,
    enfants: 2,
    montant: 420,
    paye: 420,
    statut: "Confirmé",
    couleur: "#e5e7eb",
  },
  {
    id: "r-anna",
    bienId: "colette",
    occupant: "Anna Schmidt",
    initiales: "AS",
    email: "anna.schmidt@email.fr",
    telephone: "+33 6 77 88 99 00",
    arrivee: "2026-03-06",
    depart: "2026-03-09",
    heureArrivee: "15:00",
    heureDepart: "10:00",
    plateforme: "Booking.com",
    voyageurs: 2,
    adultes: 2,
    enfants: 0,
    montant: 390,
    paye: 0,
    statut: "En attente",
    couleur: "#f3f4f6",
  },
  {
    id: "r-lucas",
    bienId: "raclette",
    occupant: "Lucas Martin",
    initiales: "LM",
    email: "lucas.martin@email.fr",
    telephone: "+33 6 20 30 40 50",
    arrivee: "2026-03-07",
    depart: "2026-03-10",
    heureArrivee: "16:00",
    heureDepart: "10:00",
    plateforme: "Autre",
    voyageurs: 2,
    adultes: 2,
    enfants: 0,
    montant: 270,
    paye: 270,
    statut: "Confirmé",
    couleur: "#d1d5dc",
  },
  {
    id: "r-camille",
    bienId: "suzette",
    occupant: "Camille Morel",
    initiales: "CM",
    email: "camille.morel@email.fr",
    telephone: "+33 6 14 15 16 17",
    arrivee: "2026-03-12",
    depart: "2026-03-16",
    heureArrivee: "16:00",
    heureDepart: "10:00",
    plateforme: "Airbnb",
    voyageurs: 3,
    adultes: 2,
    enfants: 1,
    montant: 540,
    paye: 540,
    statut: "Confirmé",
    couleur: "#e5e7eb",
  },
  {
    id: "r-thomas",
    bienId: "raclette",
    occupant: "Thomas Leroy",
    initiales: "TL",
    email: "thomas.leroy@email.fr",
    telephone: "+33 6 61 62 63 64",
    arrivee: "2026-03-02",
    depart: "2026-03-06",
    heureArrivee: "14:00",
    heureDepart: "10:00",
    plateforme: "Direct",
    voyageurs: 1,
    adultes: 1,
    enfants: 0,
    montant: 210,
    paye: 105,
    statut: "Confirmé",
    couleur: "#e5e7eb",
  },
  {
    id: "r-roxan",
    bienId: "suzette",
    occupant: "Roxan Rivernet",
    initiales: "RR",
    email: "roxan@email.com",
    telephone: "+33 6 12 34 56 78",
    arrivee: "2026-01-15",
    depart: "2026-02-15",
    heureArrivee: "00:00",
    heureDepart: "10:00",
    plateforme: "Direct",
    voyageurs: 2,
    adultes: 2,
    enfants: 0,
    montant: 1800,
    paye: 1800,
    statut: "Confirmé",
    couleur: "#e5e7eb",
  },
  {
    id: "r-mdubois",
    bienId: "lavandrix",
    occupant: "Marie Dubois",
    initiales: "MD",
    email: "marie@email.com",
    telephone: "+33 6 23 45 67 89",
    arrivee: "2026-01-20",
    depart: "2026-01-27",
    heureArrivee: "00:00",
    heureDepart: "10:00",
    plateforme: "Airbnb",
    voyageurs: 2,
    adultes: 2,
    enfants: 0,
    montant: 680,
    paye: 680,
    statut: "Confirmé",
    couleur: "#e5e7eb",
  },
  {
    id: "r-jmartin",
    bienId: "colette",
    occupant: "Jean Martin",
    initiales: "JM",
    email: "jean@email.com",
    telephone: "+33 6 34 56 78 90",
    arrivee: "2024-12-10",
    depart: "2026-12-10",
    heureArrivee: "00:00",
    heureDepart: "10:00",
    plateforme: "Direct",
    voyageurs: 1,
    adultes: 1,
    enfants: 0,
    montant: 9600,
    paye: 9600,
    statut: "Confirmé",
    couleur: "#d1d5dc",
  },
  {
    id: "r-slaure",
    bienId: "raclette",
    occupant: "Sophie Laurent",
    initiales: "SL",
    email: "sophie@email.com",
    telephone: "+33 6 45 67 89 01",
    arrivee: "2026-01-25",
    depart: "2026-02-05",
    heureArrivee: "00:00",
    heureDepart: "10:00",
    plateforme: "Booking.com",
    voyageurs: 2,
    adultes: 2,
    enfants: 0,
    montant: 440,
    paye: 0,
    statut: "En attente",
    couleur: "#f3f4f6",
  },
  {
    id: "r-ppetit",
    bienId: "suzette",
    occupant: "Pierre Petit",
    initiales: "PP",
    email: "pierre@email.com",
    telephone: "+33 6 56 78 90 12",
    arrivee: "2026-01-01",
    depart: "2026-02-01",
    heureArrivee: "00:00",
    heureDepart: "10:00",
    plateforme: "Airbnb",
    voyageurs: 2,
    adultes: 2,
    enfants: 0,
    montant: 2100,
    paye: 2100,
    statut: "Confirmé",
    couleur: "#e5e7eb",
  },
  {
    id: "r-erik",
    bienId: "colette",
    occupant: "Erik Gunsel",
    initiales: "EG",
    email: "erik.gunsel@email.fr",
    telephone: "+33 6 70 71 72 73",
    arrivee: "2026-04-02",
    depart: "2026-04-08",
    heureArrivee: "16:00",
    heureDepart: "10:00",
    plateforme: "Direct",
    voyageurs: 2,
    adultes: 2,
    enfants: 0,
    montant: 480,
    paye: 240,
    statut: "Confirmé",
    couleur: "#d1d5dc",
  },
];

export const DATES_BLOQUEES_MO1: DateBloqueeMo1[] = [
  { id: "blk-1", bienId: "raclette", date: "2026-03-06", motif: "Maintenance" },
];

export const OCCUPANTS_MO1: OccupantMo1[] = [
  {
    id: "o1",
    nom: "Roxan Rivernet",
    initiales: "RR",
    type: "Locataire",
    logement: "Suzette",
    telephone: "+33 6 12 34 56 78",
    email: "roxan@email.com",
    arrivee: "15/01/2026",
    statut: "Actif",
  },
  {
    id: "o2",
    nom: "Marie Dubois",
    initiales: "MD",
    type: "Voyageur",
    logement: "Villa Lavandrix",
    telephone: "+33 6 23 45 67 89",
    email: "marie@email.com",
    arrivee: "20/01/2026",
    depart: "27/01/2026",
    statut: "Actif",
  },
  {
    id: "o3",
    nom: "Jean Martin",
    initiales: "JM",
    type: "Locataire",
    logement: "Appartement Colette",
    telephone: "+33 6 34 56 78 90",
    email: "jean@email.com",
    arrivee: "10/12/2025",
    statut: "Actif",
  },
  {
    id: "o4",
    nom: "Sophie Laurent",
    initiales: "SL",
    type: "Voyageur",
    logement: "Studio Raclette",
    telephone: "+33 6 45 67 89 01",
    email: "sophie@email.com",
    arrivee: "25/01/2026",
    depart: "05/02/2026",
    statut: "À venir",
  },
  {
    id: "o5",
    nom: "Pierre Petit",
    initiales: "PP",
    type: "Locataire",
    logement: "Suzette",
    telephone: "+33 6 56 78 90 12",
    email: "pierre@email.com",
    arrivee: "01/01/2026",
    statut: "Actif",
  },
];

export const PRESTATAIRES_MO1: PrestataireMo1[] = [
  {
    id: "pr1",
    nom: "Ménage Pro",
    initiales: "MP",
    metier: "Ménage",
    telephone: "+33 6 10 20 30 40",
    email: "contact@menage-pro.fr",
    statut: "Actif",
  },
  {
    id: "pr2",
    nom: "Jardinier Vert",
    initiales: "JV",
    metier: "Jardinage",
    telephone: "+33 6 11 21 31 41",
    email: "jardinier.vert@email.fr",
    statut: "Actif",
  },
  {
    id: "pr3",
    nom: "Peintre Plus",
    initiales: "PP",
    metier: "Peinture",
    telephone: "+33 6 12 22 32 42",
    email: "peintre.plus@email.fr",
    statut: "Actif",
  },
  {
    id: "pr4",
    nom: "Yannick Rath",
    initiales: "YR",
    metier: "Maintenance",
    telephone: "+33 6 13 23 33 43",
    email: "yannick.ratti@email.fr",
    statut: "Actif",
  },
  {
    id: "pr5",
    nom: "Erik Gunsel",
    initiales: "EG",
    metier: "Accueil",
    telephone: "+33 6 14 24 34 44",
    email: "erik.gunsel@email.fr",
    statut: "Actif",
  },
];

export const TYPES_RESERVATION: { groupe: string; options: TypeReservationMo1[] }[] = [
  { groupe: "Court séjour", options: ["Location saisonnière"] },
  { groupe: "Bail longue durée", options: ["Bail nu", "Bail meublé", "Bail mobilité", "Bail étudiant"] },
];

export const COULEURS_RESERVATION = [
  { id: "bleu", hex: "#4f8ef7", label: "Bleu" },
  { id: "vert", hex: "#34c98f", label: "Vert" },
  { id: "orange", hex: "#f97316", label: "Orange" },
  { id: "rose", hex: "#ec4899", label: "Rose" },
  { id: "rouge", hex: "#ef4444", label: "Rouge" },
  { id: "violet", hex: "#a855f7", label: "Violet" },
  { id: "jaune", hex: "#eab308", label: "Jaune" },
  { id: "teal", hex: "#14b8a6", label: "Sarcelle" },
];

export const CODE_PLATEFORME: Record<PlateformeMo1, string> = {
  Airbnb: "AIR",
  "Booking.com": "BK",
  Direct: "DIR",
  Autre: "AUT",
};

export const CODE_BARRE: Record<PlateformeMo1, string> = {
  Airbnb: "Air",
  "Booking.com": "Boo",
  Direct: "Dir",
  Autre: "Aut",
};

export function paiementDe(r: ReservationMo1): PaiementMo1 {
  if (r.montant <= 0 || r.paye <= 0) return "impaye";
  if (r.paye >= r.montant) return "paye";
  return "partiel";
}

export function pourcentagePaiement(r: ReservationMo1) {
  if (r.montant <= 0) return 0;
  return Math.round((r.paye / r.montant) * 100);
}

export function bienParId(id: string) {
  return BIENS_MO1.find((b) => b.id === id);
}

export function reservationCouvre(r: ReservationMo1, jour: string) {
  return r.arrivee <= jour && r.depart > jour;
}

export function isoJour(d: Date) {
  const c = new Date(d);
  c.setHours(12, 0, 0, 0);
  return c.toISOString().slice(0, 10);
}

export function ajouterJours(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function formatMontant(n: number) {
  return `${n.toLocaleString("fr-FR")} €`;
}

export function formatDateLongue(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatJourCourt(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export function nuitsEntre(arrivee: string, depart: string) {
  const a = new Date(arrivee);
  const b = new Date(depart);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}
