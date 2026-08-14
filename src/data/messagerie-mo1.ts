// SOURCE: Maquette MO1 — Dashboard/Messagerie + Vision TeamMate
// Noms et textes relevés tels quels dans les frames.

export type SectionConversation = "inbox" | "prospections" | "prestataires" | "team";

export type TypeInterlocuteur = "voyageur" | "locataire" | "prestataire" | "team";

export type Conversation = {
  id: string;
  section: SectionConversation;
  nom: string;
  initiales: string;
  type: TypeInterlocuteur;
  badge: string;
  bienNom?: string;
  extrait: string;
  ilYa: string;
  nonLu: boolean;
  archivee: boolean;
};

export type PieceJointe = {
  nom: string;
  taille: string;
};

export type KindMessage = "systeme" | "recu" | "envoye";

export type IconeSysteme = "login" | "usercheck" | "key";

export type MessageFil = {
  id: string;
  conversationId: string;
  kind: KindMessage;
  texte: string;
  heure?: string;
  iconeSysteme?: IconeSysteme;
  pieces?: PieceJointe[];
};

export type DocumentLie = {
  nom: string;
  date: string;
};

export type StatutMembre = "actif" | "externe" | "attente";

export type RoleMembre = "Administrateur" | "Gestionnaire";

export type MembreEquipe = {
  id: string;
  nom: string;
  prenom: string;
  initiales: string;
  statut: StatutMembre;
  role: RoleMembre;
  affectation: string;
  droits: string[];
};

export type DroitCatalogue = {
  id: string;
  groupe: "Lecture" | "Modification" | "Administration";
  titre: string;
  description: string;
};

export type DroitPersonnalise = {
  id: string;
  nom: string;
  description: string;
  membresIds: string[];
};

export type ActionEnCours = {
  id: string;
  titre: string;
  quand: string;
  detail: string;
};

export const CONVERSATIONS_MO1: Conversation[] = [
  {
    id: "c-brian",
    section: "inbox",
    nom: "Brian Griffin",
    initiales: "BG",
    type: "voyageur",
    badge: "Voyageur",
    bienNom: "Appartement Colette",
    extrait: "Merci pour votre retour rapide.",
    ilYa: "Il y a 1 min",
    nonLu: false,
    archivee: false,
  },
  {
    id: "c-cleveland",
    section: "inbox",
    nom: "Cleveland Brown",
    initiales: "CB",
    type: "locataire",
    badge: "Locataire",
    bienNom: "Suzette",
    extrait: "Pouvez-vous m'envoyer le règlement intérieur ?",
    ilYa: "Il y a 1j",
    nonLu: false,
    archivee: false,
  },
  {
    id: "c-albert",
    section: "prospections",
    nom: "Albert Flores",
    initiales: "AF",
    type: "voyageur",
    badge: "Voyageur",
    bienNom: "Villa Lavandrix",
    extrait: "Je suis très intéressé par votre villa pour août.",
    ilYa: "Il y a 1 min",
    nonLu: true,
    archivee: false,
  },
  {
    id: "c-floyd",
    section: "prospections",
    nom: "Floyd Miles",
    initiales: "FM",
    type: "voyageur",
    badge: "Voyageur",
    bienNom: "Studio Raclette",
    extrait: "Quel est le tarif pour un séjour d'une semaine ?",
    ilYa: "Il y a 1j",
    nonLu: false,
    archivee: false,
  },
  {
    id: "c-lentil",
    section: "prestataires",
    nom: "Lentil Entertainment",
    initiales: "LE",
    type: "prestataire",
    badge: "Prestataire",
    bienNom: "Villa Lavandrix",
    extrait: "Intervention planifiée demain 9h.",
    ilYa: "Il y a 1 min",
    nonLu: true,
    archivee: false,
  },
  {
    id: "c-silver",
    section: "prestataires",
    nom: "Silverlight Studio",
    initiales: "SS",
    type: "prestataire",
    badge: "Prestataire",
    bienNom: "Appartement Colette",
    extrait: "Rapport de ménage envoyé.",
    ilYa: "Il y a 1j",
    nonLu: false,
    archivee: false,
  },
  {
    id: "c-louisette",
    section: "team",
    nom: "Team Louisette",
    initiales: "TL",
    type: "team",
    badge: "Team",
    bienNom: "Appartement Colette",
    extrait: "J'ai fait le check-in de Sophie Martin.",
    ilYa: "Il y a 1 min",
    nonLu: true,
    archivee: false,
  },
  {
    id: "c-arborio",
    section: "team",
    nom: "Team Arborio",
    initiales: "TA",
    type: "team",
    badge: "Team",
    bienNom: "Villa Lavandrix",
    extrait: "Les rapports d'états des lieux sont prêts.",
    ilYa: "Il y a 1j",
    nonLu: false,
    archivee: false,
  },
  {
    id: "c-sophie",
    section: "inbox",
    nom: "Sophie Martin",
    initiales: "SM",
    type: "locataire",
    badge: "Locataire",
    bienNom: "Appartement Colette",
    extrait: "Est-ce que je peux avoir le code WIFI ?",
    ilYa: "Il y a 5 min",
    nonLu: true,
    archivee: true,
  },
];

export const MESSAGES_MO1: MessageFil[] = [
  {
    id: "m-bg-1",
    conversationId: "c-brian",
    kind: "systeme",
    iconeSysteme: "login",
    texte: "Brian Griffin s'est connecté à son compte personnel",
  },
  {
    id: "m-bg-2",
    conversationId: "c-brian",
    kind: "systeme",
    iconeSysteme: "usercheck",
    texte: "Brian Griffin a rempli son pré-check-in à 11h40 le 01/01/2026",
  },
  {
    id: "m-bg-3",
    conversationId: "c-brian",
    kind: "recu",
    heure: "11h20",
    texte:
      "Bonjour, je souhaiterais obtenir ma quittance de loyer du mois de mai, ainsi que les documents relatifs à mon contrat de location (bail, état des lieux, attestation d'assurance si vous l'avez en copie). Je dois les transmettre à mon employeur pour une aide au logement. Merci d'avance pour votre retour. Bien cordialement,",
  },
  {
    id: "m-bg-4",
    conversationId: "c-brian",
    kind: "envoye",
    heure: "11h35",
    texte:
      "Merci pour votre message. Vous trouverez en pièces jointes la quittance de loyer de mai au format PDF, ainsi que les documents suivants :\n• Copie du bail de location signé.\n• État des lieux d'entrée.\n• Et votre attestation d'assurance habitation fournie lors de l'entrée dans les lieux.\nN'hésitez pas à me dire si un document manque ou si vous avez besoin d'un autre format. Bien à vous,\nClément Dubois – Gestionnaire",
    pieces: [
      { nom: "Quittance_mai_2026.pdf", taille: "142 Ko" },
      { nom: "Bail_location.pdf", taille: "324 Ko" },
      { nom: "Attestation_assurance.pdf", taille: "87 Ko" },
    ],
  },
  {
    id: "m-bg-5",
    conversationId: "c-brian",
    kind: "recu",
    heure: "11h42",
    texte: "Merci pour votre retour rapide.",
  },
  {
    id: "m-cb-1",
    conversationId: "c-cleveland",
    kind: "recu",
    heure: "09h12",
    texte: "Pouvez-vous m'envoyer le règlement intérieur ?",
  },
  {
    id: "m-af-1",
    conversationId: "c-albert",
    kind: "recu",
    heure: "10h04",
    texte: "Je suis très intéressé par votre villa pour août.",
  },
  {
    id: "m-fm-1",
    conversationId: "c-floyd",
    kind: "recu",
    heure: "16h22",
    texte: "Quel est le tarif pour un séjour d'une semaine ?",
  },
  {
    id: "m-le-1",
    conversationId: "c-lentil",
    kind: "recu",
    heure: "08h15",
    texte: "Bonjour, intervention planifiée pour demain matin 9h.",
  },
  {
    id: "m-le-2",
    conversationId: "c-lentil",
    kind: "envoye",
    heure: "08h40",
    texte: "Oui, confirmé. La clé sera déposée chez le gardien.",
  },
  {
    id: "m-ss-1",
    conversationId: "c-silver",
    kind: "recu",
    heure: "18h05",
    texte: "Rapport de ménage envoyé.",
  },
  {
    id: "m-tl-1",
    conversationId: "c-louisette",
    kind: "systeme",
    iconeSysteme: "key",
    texte: "Team Louisette a remis les clés à Sophie Martin le 05/03/2026",
  },
  {
    id: "m-tl-2",
    conversationId: "c-louisette",
    kind: "systeme",
    iconeSysteme: "login",
    texte: "Check-in effectué pour Sophie Martin — Appartement Colette",
  },
  {
    id: "m-tl-3",
    conversationId: "c-louisette",
    kind: "recu",
    heure: "15h10",
    texte: "J'ai fait le check-in de Sophie Martin à 15h pile.",
  },
  {
    id: "m-tl-4",
    conversationId: "c-louisette",
    kind: "envoye",
    heure: "15h15",
    texte: "Super, merci Louisette !",
  },
  {
    id: "m-ta-1",
    conversationId: "c-arborio",
    kind: "recu",
    heure: "11h08",
    texte: "Les rapports d'états des lieux sont prêts.",
  },
  {
    id: "m-sm-1",
    conversationId: "c-sophie",
    kind: "recu",
    heure: "14h20",
    texte: "Est-ce que je peux avoir le code WIFI ?",
  },
];

export const DOCUMENTS_LIES: Record<string, DocumentLie[]> = {
  "c-brian": [
    { nom: "Bail location signé.pdf", date: "01/01/2026" },
    { nom: "Attestation assurance.pdf", date: "01/01/2026" },
    { nom: "État des lieux entrée.pdf", date: "03/01/2026" },
  ],
};

export const ASSIGNEES_CONVERSATION = [
  { id: "a-tl", nom: "Team Louisette", initiales: "TE" },
  { id: "a-ta", nom: "Team Arborio", initiales: "TE" },
  { id: "a-cg", nom: "Clément G.", initiales: "CL" },
  { id: "a-em", nom: "Emily Smith", initiales: "EM" },
];

export const SECTIONS_DEPLACEMENT: { id: SectionConversation; label: string }[] = [
  { id: "inbox", label: "Nouveaux messages" },
  { id: "prospections", label: "Mes prospections" },
  { id: "prestataires", label: "Mes prestataires" },
  { id: "team", label: "Mes teams mate" },
];

export const DROITS_CATALOGUE: DroitCatalogue[] = [
  {
    id: "voir-reservations",
    groupe: "Lecture",
    titre: "Voir les réservations",
    description: "Accès en lecture aux réservations",
  },
  {
    id: "voir-finances",
    groupe: "Lecture",
    titre: "Voir les finances",
    description: "Accès en lecture aux données financières",
  },
  {
    id: "voir-biens",
    groupe: "Lecture",
    titre: "Voir les biens",
    description: "Accès en lecture aux fiches biens",
  },
  {
    id: "voir-documents",
    groupe: "Lecture",
    titre: "Voir les documents",
    description: "Accès aux documents et contrats",
  },
  {
    id: "messagerie",
    groupe: "Lecture",
    titre: "Messagerie",
    description: "Envoyer et recevoir des messages",
  },
  {
    id: "voir-calendrier",
    groupe: "Lecture",
    titre: "Voir le calendrier",
    description: "Accès au calendrier et aux vues annuelles",
  },
  {
    id: "mod-reservations",
    groupe: "Modification",
    titre: "Modifier les réservations",
    description: "Créer et modifier des réservations",
  },
  {
    id: "mod-finances",
    groupe: "Modification",
    titre: "Modifier les finances",
    description: "Saisir et modifier les montants",
  },
  {
    id: "mod-biens",
    groupe: "Modification",
    titre: "Modifier les biens",
    description: "Créer et modifier les fiches biens",
  },
  {
    id: "gerer-equipe",
    groupe: "Administration",
    titre: "Gérer l'équipe",
    description: "Inviter, modifier et supprimer des membres",
  },
];

const LECTURE = DROITS_CATALOGUE.filter((d) => d.groupe === "Lecture").map((d) => d.id);

export const MEMBRES_MO1: MembreEquipe[] = [
  {
    id: "me-fo",
    nom: "Olive",
    prenom: "Frobisher",
    initiales: "FO",
    statut: "actif",
    role: "Administrateur",
    affectation: "Assignment Terra",
    droits: [...LECTURE, "gerer-equipe"],
  },
  {
    id: "me-kv",
    nom: "Vilma",
    prenom: "Kidderminster",
    initiales: "KV",
    statut: "actif",
    role: "Administrateur",
    affectation: "Assignment Origine",
    droits: LECTURE.slice(0, 5),
  },
  {
    id: "me-mu",
    nom: "Ufana",
    prenom: "Meddison",
    initiales: "MU",
    statut: "externe",
    role: "Gestionnaire",
    affectation: "Assignment Pradela",
    droits: ["voir-reservations", "messagerie"],
  },
  {
    id: "me-tu",
    nom: "Ulrica",
    prenom: "Tegerdinal",
    initiales: "TU",
    statut: "actif",
    role: "Gestionnaire",
    affectation: "Assignment Makey",
    droits: LECTURE.slice(0, 5),
  },
  {
    id: "me-eu",
    nom: "Ulrica",
    prenom: "Erihu",
    initiales: "EU",
    statut: "actif",
    role: "Gestionnaire",
    affectation: "Assignment Partners",
    droits: LECTURE.slice(0, 4),
  },
  {
    id: "me-cr",
    nom: "Renard",
    prenom: "Clara",
    initiales: "CR",
    statut: "attente",
    role: "Gestionnaire",
    affectation: "Assignment Nord",
    droits: [],
  },
  {
    id: "me-ld",
    nom: "Dune",
    prenom: "Lucas",
    initiales: "LD",
    statut: "attente",
    role: "Administrateur",
    affectation: "Assignment Est",
    droits: [],
  },
];

export const ACTIONS_EN_COURS: ActionEnCours[] = [
  { id: "ac-1", titre: "Item", quand: "Hier", detail: "Lorem" },
  { id: "ac-2", titre: "Item", quand: "Hier", detail: "Lorem" },
  { id: "ac-3", titre: "Item", quand: "Hier", detail: "Lorem" },
];

export const DROIT_PERSONNALISE_INITIAL: DroitPersonnalise = {
  id: "dp-redris",
  nom: "Accès à la messagerie du gestionnaire Redris",
  description: "Peut gérer les mails, les réponses, et les appels",
  membresIds: ["me-fo", "me-kv", "me-mu", "me-tu", "me-eu", "me-cr", "me-ld"],
};

export function nomComplet(m: MembreEquipe) {
  return `${m.prenom} ${m.nom}`;
}
