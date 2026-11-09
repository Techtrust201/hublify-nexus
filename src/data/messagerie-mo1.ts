// SOURCE: Maquette MO1 — Dashboard/Messagerie + Vision TeamMate
// Noms et textes relevés tels quels dans les frames.

import { DROITS_CATALOGUE } from "@/auth/permissions";

export { DROITS_CATALOGUE };

export type SectionConversation = "inbox" | "prospections" | "prestataires" | "team";

export type TypeInterlocuteur = "voyageur" | "locataire" | "prestataire" | "team";

export type DocumentLie = {
  nom: string;
  date: string;
  mime?: string;
  base64?: string;
};

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
  assigne?: string;
  documents?: DocumentLie[];
};

export type PieceJointe = {
  nom: string;
  taille: string;
  mime?: string;
  base64?: string;
};

export type KindMessage = "systeme" | "recu" | "envoye";

export type IconeSysteme = "login" | "usercheck" | "key";

export type ActionFil = {
  id: "voir-dossier" | "proposer-bail";
  libelle: string;
};

export type MessageFil = {
  id: string;
  conversationId: string;
  kind: KindMessage;
  texte: string;
  heure?: string;
  iconeSysteme?: IconeSysteme;
  pieces?: PieceJointe[];
  /** Carte de synthèse (période, loyer) affichée sous la bulle. */
  fiche?: string[];
  actions?: ActionFil[];
};

export type StatutMembre = "actif" | "externe" | "attente";

export type RoleMembre =
  | "Super-administrateur"
  | "Administrateur"
  | "Gestionnaire"
  | "Prestataire"
  | "Locataire"
  | "Voyageur"
  | "Propriétaire"
  | "Lecture";

export type MembreEquipe = {
  id: string;
  nom: string;
  prenom: string;
  initiales: string;
  statut: StatutMembre;
  role: RoleMembre;
  affectation: string;
  droits: string[];
  email?: string;
  protege?: boolean;
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
    nom: "Bruno Girard",
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
    nom: "Camille Brun",
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
    id: "c-jean-martin",
    section: "inbox",
    nom: "Jean Martin",
    initiales: "JM",
    type: "locataire",
    badge: "Locataire",
    bienNom: "Appartement Colette",
    extrait: "Pouvez-vous me confirmer le montant des charges ?",
    ilYa: "Il y a 2h",
    nonLu: false,
    archivee: false,
  },
  {
    id: "c-sophie-martin",
    section: "inbox",
    nom: "Sophie Martin",
    initiales: "SM",
    type: "voyageur",
    badge: "Voyageur",
    bienNom: "Suzette",
    extrait: "Le pré-checkin est envoyé, merci.",
    ilYa: "Il y a 3h",
    nonLu: false,
    archivee: false,
  },
  {
    id: "c-albert",
    section: "prospections",
    nom: "Alain Forest",
    initiales: "AF",
    type: "voyageur",
    badge: "Prospect",
    bienNom: "Appartement Colette",
    extrait: "Je suis très intéressé par votre location pour août.",
    ilYa: "Il y a 1 min",
    nonLu: true,
    archivee: false,
  },
  {
    id: "c-floyd",
    section: "prospections",
    nom: "François Millet",
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
    nom: "Linge & Entretien",
    initiales: "LE",
    type: "prestataire",
    badge: "Prestataire",
    bienNom: "Villa Lavandrix",
    extrait: "Intervention planifiée demain 9h.",
    ilYa: "Il y a 1 min",
    nonLu: true,
    archivee: false,
    assigne: "lucas.menage@hublify.app",
  },
  {
    id: "c-silver",
    section: "prestataires",
    nom: "Studio Sérénité",
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
    id: "m-jm-1",
    conversationId: "c-jean-martin",
    kind: "recu",
    heure: "09h10",
    texte: "Bonjour, pouvez-vous me confirmer le montant des charges de mars ?",
  },
  {
    id: "m-jm-2",
    conversationId: "c-jean-martin",
    kind: "envoye",
    heure: "09h40",
    texte:
      "Les charges de mars s'élèvent à 50 €, incluses dans l'échéance. La quittance est dans Documents.",
  },
  {
    id: "m-sm-1",
    conversationId: "c-sophie-martin",
    kind: "recu",
    heure: "16h05",
    texte: "Le pré-checkin est envoyé, merci. Nous arriverons vers 16h.",
  },
  {
    id: "m-bg-1",
    conversationId: "c-brian",
    kind: "systeme",
    iconeSysteme: "login",
    texte: "Bruno Girard s'est connecté à son compte personnel à 11h35 le 01/01/2026",
  },
  {
    id: "m-bg-2",
    conversationId: "c-brian",
    kind: "systeme",
    iconeSysteme: "usercheck",
    texte: "Bruno Girard a rempli son pré-check-in à 11h40 le 01/01/2026",
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
    id: "m-af-sys",
    conversationId: "c-albert",
    kind: "systeme",
    iconeSysteme: "usercheck",
    texte: "Alain Forest a émis une demande de location à 11h40 le 01/01/2026",
  },
  {
    id: "m-af-1",
    conversationId: "c-albert",
    kind: "recu",
    heure: "11h20",
    texte: "Je suis très intéressé par votre location pour août.",
    fiche: ["Période souhaitée : du 15/09/2026 au 10/05/2026", "Loyer mensuel : 750 €"],
    actions: [
      { id: "voir-dossier", libelle: "Voir le dossier du prospect" },
      { id: "proposer-bail", libelle: "Proposer un bail" },
    ],
  },
  {
    id: "m-af-2",
    conversationId: "c-albert",
    kind: "envoye",
    heure: "11h35",
    texte:
      "Merci pour votre message.\nNous étudions votre demande et ne manquerons pas de revenir vers vous.\nBien à vous,\nClément Dubois – Gestionnaire",
  },
  {
    id: "m-af-3",
    conversationId: "c-albert",
    kind: "recu",
    heure: "11h42",
    texte:
      "Merci j’attend votre retour rapide, je me suis trompé est’il possible de débuter le bail le 12 septembre?.",
  },
  {
    id: "m-af-sys-bail",
    conversationId: "c-albert",
    kind: "systeme",
    iconeSysteme: "key",
    texte: "Le gestionnaire a émis une proposition de bail à 14h35 le 01/01/2026",
  },
  {
    id: "m-af-4",
    conversationId: "c-albert",
    kind: "envoye",
    heure: "14h35",
    texte:
      "Bonjour,\nEn retour de votre demande vous trouverez ci-joint une proposition de bail. Merci de bien lire les conditions et de suivre le parcours de signature.\nBien à vous,\nClément Dubois – Gestionnaire",
    pieces: [{ nom: "Proposition de bail - Alain Forest - App. Colette", taille: "186 Ko" }],
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
    texte: "Super, merci !",
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

export const MODELES_MESSAGE = [
  "Bonjour, voici le code Wi-Fi : Hublify-Guest.",
  "Votre check-in est prévu à 16h. Merci de prévenir en cas de retard.",
  "Le ménage est confirmé pour le jour du départ.",
];

export type GroupeAssigne = "equipe" | "prestataire";

export type AssigneConversation = {
  id: string;
  nom: string;
  initiales: string;
  groupe: GroupeAssigne;
};

export const ASSIGNEES_CONVERSATION: AssigneConversation[] = [
  { id: "a-tl", nom: "Team Louisette", initiales: "TL", groupe: "equipe" },
  { id: "a-ta", nom: "Team Arborio", initiales: "TA", groupe: "equipe" },
  { id: "a-cg", nom: "Clément G.", initiales: "CG", groupe: "equipe" },
  { id: "a-em", nom: "Émilie Moreau", initiales: "EM", groupe: "equipe" },
  { id: "a-le", nom: "Linge & Entretien", initiales: "LE", groupe: "prestataire" },
  { id: "a-ss", nom: "Studio Sérénité", initiales: "SS", groupe: "prestataire" },
];

export const SECTIONS_DEPLACEMENT: { id: SectionConversation; label: string }[] = [
  { id: "inbox", label: "Nouveaux messages" },
  { id: "prospections", label: "Mes prospections" },
  { id: "prestataires", label: "Mes prestataires" },
  { id: "team", label: "Mes coéquipiers" },
];

const LECTURE = DROITS_CATALOGUE.filter((d) => d.groupe === "Lecture").map((d) => d.id);

export const MEMBRES_MO1: MembreEquipe[] = [
  {
    id: "me-fo",
    nom: "Durand",
    prenom: "Éric",
    initiales: "ED",
    statut: "actif",
    role: "Administrateur",
    affectation: "Portefeuille Lyon",
    droits: [...LECTURE, "gerer-equipe"],
  },
  {
    id: "me-kv",
    nom: "Moreau",
    prenom: "Émilie",
    initiales: "EM",
    statut: "actif",
    role: "Administrateur",
    affectation: "Agence",
    droits: LECTURE.slice(0, 5),
  },
  {
    id: "me-mu",
    nom: "Rolland",
    prenom: "Arthur",
    initiales: "AR",
    statut: "actif",
    role: "Gestionnaire",
    affectation: "Littoral",
    droits: ["voir-reservations", "messagerie"],
  },
  {
    id: "me-tu",
    nom: "Lambert",
    prenom: "Inès",
    initiales: "IL",
    statut: "actif",
    role: "Gestionnaire",
    affectation: "Montagne",
    droits: LECTURE.slice(0, 5),
  },
  {
    id: "me-eu",
    nom: "Ulrich",
    prenom: "Elena",
    initiales: "EU",
    statut: "actif",
    role: "Gestionnaire",
    affectation: "Partenaires",
    droits: LECTURE.slice(0, 4),
  },
  {
    id: "me-cr",
    nom: "Renard",
    prenom: "Clara",
    initiales: "CR",
    statut: "attente",
    role: "Gestionnaire",
    affectation: "Nord",
    droits: [],
  },
  {
    id: "me-ld",
    nom: "Dune",
    prenom: "Lucas",
    initiales: "LD",
    statut: "attente",
    role: "Administrateur",
    affectation: "Est",
    droits: [],
  },
];

export const ACTIONS_EN_COURS: ActionEnCours[] = [
  {
    id: "ac-1",
    titre: "Invitation Clara Renard",
    quand: "Hier",
    detail: "En attente d'acceptation",
  },
  { id: "ac-2", titre: "Invitation Lucas Dune", quand: "Hier", detail: "En attente d'acceptation" },
  {
    id: "ac-3",
    titre: "Droit messagerie",
    quand: "Aujourd'hui",
    detail: "À valider pour Éric Durand",
  },
];

export const DROIT_PERSONNALISE_INITIAL: DroitPersonnalise = {
  id: "dp-hublify",
  nom: "Accès à la messagerie du gestionnaire Hublify",
  description: "Peut gérer les mails, les réponses, et les appels",
  membresIds: ["me-fo", "me-kv", "me-mu", "me-tu", "me-eu", "me-cr", "me-ld"],
};

export function nomComplet(m: MembreEquipe) {
  return `${m.prenom} ${m.nom}`;
}

/**
 * Les colonnes SQL du fil ne portent pas la fiche ni les actions (boutons
 * « Proposer un bail », « Voir le dossier »). On les réapplique depuis le
 * catalogue maquette, sans migration.
 */
export function completerMessagesFil(messages: MessageFil[]): MessageFil[] {
  const catalogue = new Map(MESSAGES_MO1.map((m) => [m.id, m]));
  const rang = new Map(MESSAGES_MO1.map((m, index) => [m.id, index]));
  return messages
    .map((message, index) => ({ message, index }))
    .sort((a, b) => {
      const rangA = rang.get(a.message.id);
      const rangB = rang.get(b.message.id);
      if (rangA !== undefined && rangB !== undefined) return rangA - rangB;
      if (rangA !== undefined) return -1;
      if (rangB !== undefined) return 1;
      return a.index - b.index;
    })
    .map(({ message }) => {
      const source = catalogue.get(message.id);
      if (!source) return message;
      return {
        ...message,
        ...(source.fiche ? { fiche: source.fiche } : {}),
        ...(source.actions ? { actions: source.actions } : {}),
        ...(source.pieces?.length && !message.pieces?.length ? { pieces: source.pieces } : {}),
      };
    });
}
