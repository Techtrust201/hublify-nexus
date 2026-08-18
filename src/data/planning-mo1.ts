// SOURCE: Maquette MO1 — Dashboard/Calendar/Missions + Tarifs
// Textes, montants et noms relevés à l'identique dans les frames Figma.

export type VuePlanning = "3jours" | "5jours" | "mois";
export type OngletPlanning = "missions" | "reservations" | "tarifs";
export type FiltreMission = "tous" | "checkin" | "checkout";
export type StatutPastille = "a_faire" | "en_cours" | "terminee";
export type CanalMo1 = "occupants" | "prestataires" | "team";
export type ImpactEvenement = "Fort impact" | "Impact modéré" | "Opportunité";
export type TypeRegle = "weekend" | "haute" | "basse" | "evenement" | "derniere" | "long" | "perso";
export type TypeModifTarif = "majoration" | "reduction" | "fixe";

export type BienMo1 = {
  id: string;
  nom: string;
  baseNuit: number;
};

export type ReservationMo1 = {
  id: string;
  bienId: string;
  voyageur: string;
  arrivee: string;
  depart: string;
};

export type MissionMo1 = {
  id: string;
  bienId: string;
  date: string;
  titre: string;
  type: "Menage" | "Check-in" | "Check-out" | "Inventaire" | "Maintenance";
  emoji: string;
  heure: string;
  assigne: string;
  statut: StatutPastille;
  description: string;
  pastilleAccentuee?: boolean;
};

export type MessageMo1 = {
  id: string;
  canal: CanalMo1;
  auteur: string;
  initiales: string;
  bienNom?: string;
  texte: string;
  ilYa: string;
};

export type LoyerMo1 = {
  id: string;
  locataire: string;
  initiales: string;
  bienNom: string;
  echeance: string;
  montant: number;
  valide: boolean;
  quittance: boolean;
};

export type EvenementMo1 = {
  id: string;
  titre: string;
  lieu: string;
  dates: string;
  impact: ImpactEvenement;
  description: string;
};

export type RegleTarif = {
  id: string;
  ensembleId: string;
  nom: string;
  type: TypeRegle;
  debut: string;
  fin: string;
  nuits: number;
  biens: "tous" | string;
  variation: number;
  note?: string;
};

export type EnsembleRegles = {
  id: string;
  nom: string;
  description: string;
  actif: boolean;
};

export const ANCRE_MO1 = new Date(2026, 2, 4);
export const AUJOURD_HUI_MO1 = "2026-03-05";

export const BIENS_MO1: BienMo1[] = [
  { id: "suzette", nom: "Suzette", baseNuit: 120 },
  { id: "lavandrix", nom: "Villa Lavandrix", baseNuit: 180 },
  { id: "colette", nom: "Appartement Colette", baseNuit: 95 },
  { id: "raclette", nom: "Studio Raclette", baseNuit: 75 },
];

export const RESERVATIONS_MO1: ReservationMo1[] = [
  { id: "rs1", bienId: "suzette", voyageur: "Sophie Martin", arrivee: "2026-03-04", depart: "2026-03-07" },
  { id: "rs2", bienId: "lavandrix", voyageur: "Jean Dupont", arrivee: "2026-03-04", depart: "2026-03-07" },
  { id: "rs3", bienId: "colette", voyageur: "Pierre Bernard", arrivee: "2026-03-04", depart: "2026-03-06" },
  { id: "rs4", bienId: "colette", voyageur: "Anna Schmidt", arrivee: "2026-03-06", depart: "2026-03-09" },
  { id: "rs5", bienId: "lavandrix", voyageur: "Marie Curie", arrivee: "2026-03-07", depart: "2026-03-09" },
  { id: "rs6", bienId: "raclette", voyageur: "Lucas Martin", arrivee: "2026-03-07", depart: "2026-03-09" },
];

export const MISSIONS_MO1: MissionMo1[] = [
  {
    id: "ms1",
    bienId: "suzette",
    date: "2026-03-04",
    titre: "Ménage complet",
    type: "Menage",
    emoji: "🧹",
    heure: "13:00",
    assigne: "Amélie Dubois",
    statut: "terminee",
    description: "Ménage de fin de séjour, linge changé, photos déposées.",
  },
  {
    id: "ms2",
    bienId: "suzette",
    date: "2026-03-05",
    titre: "Check-in assisté",
    type: "Check-in",
    emoji: "🔑",
    heure: "15:00",
    assigne: "Yannick Rath",
    statut: "a_faire",
    description: "Remise des clés, présentation du logement et du règlement intérieur.",
  },
  {
    id: "ms3",
    bienId: "suzette",
    date: "2026-03-05",
    titre: "Vérif. chaudière",
    type: "Maintenance",
    emoji: "⚙️",
    heure: "09:00",
    assigne: "Électricité Pro",
    statut: "en_cours",
    description: "Contrôle annuel de la chaudière avant le week-end.",
  },
  {
    id: "ms4",
    bienId: "lavandrix",
    date: "2026-03-04",
    titre: "État des lieux entrée",
    type: "Inventaire",
    emoji: "📋",
    heure: "14:00",
    assigne: "Sofia Marchetti",
    statut: "terminee",
    description: "Vérifier la vaisselle et le mobilier de jardin.",
  },
  {
    id: "ms5",
    bienId: "lavandrix",
    date: "2026-03-06",
    titre: "Ménage inter-séjour",
    type: "Menage",
    emoji: "🧹",
    heure: "10:00",
    assigne: "Amélie Dubois",
    statut: "a_faire",
    description: "Passage en milieu de séjour.",
  },
  {
    id: "ms6",
    bienId: "lavandrix",
    date: "2026-03-06",
    titre: "Réparation volet roulant",
    type: "Maintenance",
    emoji: "🔧",
    heure: "09:00",
    assigne: "Karim Benali",
    statut: "a_faire",
    description: "Volet de la chambre 2 bloqué. Prévoir pièce de rechange.",
  },
  {
    id: "ms7",
    bienId: "colette",
    date: "2026-03-05",
    titre: "Ménage express",
    type: "Menage",
    emoji: "🧹",
    heure: "09:00",
    assigne: "Emily Smith",
    statut: "en_cours",
    description: "Ménage rapide cuisine et salle de bain. Réapprovisionnement produits.",
    pastilleAccentuee: true,
  },
  {
    id: "ms8",
    bienId: "colette",
    date: "2026-03-05",
    titre: "Livraison de linge",
    type: "Menage",
    emoji: "🧹",
    heure: "08:00",
    assigne: "Laura Mercier",
    statut: "a_faire",
    description: "4 parures complètes + 8 serviettes.",
  },
  {
    id: "ms9",
    bienId: "suzette",
    date: "2026-03-06",
    titre: "Réapprovisionnement",
    type: "Menage",
    emoji: "🛒",
    heure: "11:00",
    assigne: "Amélie Dubois",
    statut: "a_faire",
    description: "Café, savon, papier toilette, produits d'accueil.",
  },
  {
    id: "ms10",
    bienId: "lavandrix",
    date: "2026-03-07",
    titre: "Check-in Marie Curie",
    type: "Check-in",
    emoji: "🔑",
    heure: "16:00",
    assigne: "Yannick Rath",
    statut: "a_faire",
    description: "Accueil Marie Curie, remise des clés villa.",
  },
  {
    id: "ms11",
    bienId: "raclette",
    date: "2026-03-07",
    titre: "Ménage complet",
    type: "Menage",
    emoji: "🧹",
    heure: "10:00",
    assigne: "Amélie Dubois",
    statut: "a_faire",
    description: "Préparation du studio avant l'arrivée de Lucas Martin.",
  },
  {
    id: "ms12",
    bienId: "raclette",
    date: "2026-03-08",
    titre: "Maintenance climatisation",
    type: "Maintenance",
    emoji: "⚙️",
    heure: "09:30",
    assigne: "Karim Benali",
    statut: "a_faire",
    description: "Entretien filtre et contrôle de la clim.",
  },
  {
    id: "ms13",
    bienId: "colette",
    date: "2026-03-08",
    titre: "État des lieux sortie",
    type: "Inventaire",
    emoji: "📋",
    heure: "11:00",
    assigne: "Emily Smith",
    statut: "a_faire",
    description: "État des lieux de sortie Anna Schmidt.",
  },
  {
    id: "ms14",
    bienId: "colette",
    date: "2026-03-05",
    titre: "Intervention plomberie",
    type: "Maintenance",
    emoji: "🔧",
    heure: "11:00",
    assigne: "Plomberie Express",
    statut: "a_faire",
    description: "Fuite robinet cuisine signalée par Pierre Bernard.",
  },
];

export const MESSAGES_MO1: MessageMo1[] = [
  {
    id: "msg1",
    canal: "occupants",
    auteur: "Sophie Martin",
    initiales: "SM",
    bienNom: "Appartement Colette",
    texte: "Bonjour, j'arrive demain vers 15h. Est-ce que je peux avoir le code WIFI à l'avance ?",
    ilYa: "Il y a 5 min",
  },
  {
    id: "msg2",
    canal: "occupants",
    auteur: "John Doe",
    initiales: "JD",
    bienNom: "Villa Lavandrix",
    texte: "Merci pour votre accueil. Petite question : où puis-je trouver des draps supplémentaires ?",
    ilYa: "Il y a 1h",
  },
  {
    id: "msg3",
    canal: "occupants",
    auteur: "Mike Johnson",
    initiales: "MJ",
    bienNom: "Studio Raclette",
    texte: "Tout est parfait ! Merci beaucoup pour les recommandations de restaurants.",
    ilYa: "Il y a 2h",
  },
  {
    id: "msg4",
    canal: "prestataires",
    auteur: "Amélie Dubois",
    initiales: "AD",
    bienNom: "Appartement Colette",
    texte: "Ménage express terminé. Photos déposées dans le dossier mission.",
    ilYa: "Il y a 20 min",
  },
  {
    id: "msg5",
    canal: "prestataires",
    auteur: "Karim Benali",
    initiales: "KB",
    bienNom: "Villa Lavandrix",
    texte: "Je passe demain matin pour le volet de la chambre 2.",
    ilYa: "Il y a 3h",
  },
  {
    id: "msg6",
    canal: "team",
    auteur: "Erik Dunnell",
    initiales: "ER",
    texte: "Peux-tu relancer Sophie Martin pour le code Wi-Fi ?",
    ilYa: "Il y a 12 min",
  },
  {
    id: "msg7",
    canal: "team",
    auteur: "Emily Smith",
    initiales: "EM",
    texte: "Quittance Lucie Blanc générée, je l'archive dans Documents.",
    ilYa: "Il y a 45 min",
  },
];

export const LOYERS_MO1: LoyerMo1[] = [
  {
    id: "ly1",
    locataire: "Sophie Martin",
    initiales: "SO",
    bienNom: "Suzette",
    echeance: "01 mars 2026",
    montant: 850,
    valide: false,
    quittance: false,
  },
  {
    id: "ly2",
    locataire: "Théo Garnier",
    initiales: "TH",
    bienNom: "Villa Lavandrix",
    echeance: "01 mars 2026",
    montant: 1200,
    valide: false,
    quittance: false,
  },
  {
    id: "ly3",
    locataire: "Lucie Blanc",
    initiales: "LU",
    bienNom: "Studio Raclette",
    echeance: "05 mars 2026",
    montant: 620,
    valide: true,
    quittance: true,
  },
];

export const EVENEMENTS_MO1: EvenementMo1[] = [
  {
    id: "ev1",
    titre: "Festival de Jazz de Paris",
    lieu: "Paris · à 2km de Villa Lavandrix",
    dates: "27 avril – 2 mai 2026",
    impact: "Fort impact",
    description:
      "Grande affluence attendue. Vos propriétés à Paris pourraient bénéficier d'une forte demande.",
  },
  {
    id: "ev2",
    titre: "Marathon de Lyon",
    lieu: "Lyon Centre · à 500m du Studio Raclette",
    dates: "3 mai 2026",
    impact: "Impact modéré",
    description: "Circulation perturbée le dimanche. Pensez à informer vos occupants des déviations.",
  },
  {
    id: "ev3",
    titre: "Salon de l'Immobilier",
    lieu: "Paris Expo Porte de Versailles · à 4km",
    dates: "19-20 avril 2026",
    impact: "Opportunité",
    description: "Augmentation des réservations courtes durées, 3 demandes reçues cette semaine.",
  },
];

export const ENSEMBLES_MO1: EnsembleRegles[] = [
  {
    id: "en1",
    nom: "Politique week-ends",
    description: "Majoration automatique les vendredis, samedis et dimanches",
    actif: true,
  },
  {
    id: "en2",
    nom: "Saison 2026",
    description: "Tarifs haute et basse saison sur toute l'année",
    actif: true,
  },
  {
    id: "en3",
    nom: "Événements locaux",
    description: "Fêtes, festivals et événements de la région",
    actif: false,
  },
];

export const REGLES_MO1: RegleTarif[] = [
  {
    id: "rg1",
    ensembleId: "en1",
    nom: "Week-end mars",
    type: "weekend",
    debut: "2026-03-06",
    fin: "2026-03-08",
    nuits: 2,
    biens: "tous",
    variation: 25,
  },
  {
    id: "rg2",
    ensembleId: "en1",
    nom: "Week-end prolongé",
    type: "weekend",
    debut: "2026-03-13",
    fin: "2026-03-15",
    nuits: 2,
    biens: "tous",
    variation: 30,
  },
  {
    id: "rg3",
    ensembleId: "en2",
    nom: "Haute saison été",
    type: "haute",
    debut: "2026-07-01",
    fin: "2026-08-31",
    nuits: 61,
    biens: "tous",
    variation: 40,
  },
  {
    id: "rg4",
    ensembleId: "en2",
    nom: "Basse saison hiver",
    type: "basse",
    debut: "2026-12-01",
    fin: "2026-12-20",
    nuits: 19,
    biens: "tous",
    variation: -20,
  },
  {
    id: "rg5",
    ensembleId: "en3",
    nom: "Festival Jazz",
    type: "evenement",
    debut: "2026-04-10",
    fin: "2026-04-13",
    nuits: 3,
    biens: "tous",
    variation: 50,
    note: "Festival Jazz de la ville, forte demande attendue.",
  },
];

export const TYPES_REGLE: { id: TypeRegle; emoji: string; label: string }[] = [
  { id: "weekend", emoji: "🎉", label: "Week-end" },
  { id: "haute", emoji: "☀️", label: "Haute saison" },
  { id: "basse", emoji: "❄️", label: "Basse saison" },
  { id: "evenement", emoji: "📍", label: "Événement" },
  { id: "derniere", emoji: "⚡", label: "Dernière minute" },
  { id: "long", emoji: "🏠", label: "Long séjour" },
  { id: "perso", emoji: "✏️", label: "Personnalisé" },
];

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

export function reservationCouvre(r: ReservationMo1, jour: string) {
  return r.arrivee <= jour && r.depart > jour;
}

export function libelleStatut(s: StatutPastille) {
  if (s === "terminee") return "Terminée";
  if (s === "en_cours") return "En cours";
  return "À faire";
}

export function emojiType(type: TypeRegle) {
  return TYPES_REGLE.find((t) => t.id === type)?.emoji ?? "🎉";
}

export function prixDuJour(bien: BienMo1, jour: string, ensembles: EnsembleRegles[], regles: RegleTarif[]) {
  const actives = regles.filter((r) => {
    const ens = ensembles.find((e) => e.id === r.ensembleId);
    return ens?.actif && r.debut <= jour && r.fin > jour;
  });
  const variation = actives.reduce((s, r) => s + r.variation, 0);
  const prix = Math.round(bien.baseNuit * (1 + variation / 100));
  const regle = actives[0];
  return { prix, base: bien.baseNuit, variation, regle };
}
