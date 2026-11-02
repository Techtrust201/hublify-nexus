/**
 * Règles du portail mobile locataire / prestataire (Hublify V1, section
 * « Version Mobile LOCATAIRE PRESATAIRE »). Aucun appel réseau, aucun
 * prestataire de paiement : les encaissements sont des simulations locales.
 */

export type ModePortail = "resident" | "prestataire";

export const FENETRE_EDL_MS = 48 * 60 * 60 * 1000;
export const DUREE_ACCES_DEMANDE_H = 72;

export const MENTION_PAIEMENT_SIMULE =
  "Simulation Hublify — aucun débit, aucun prestataire de paiement contacté.";

export const JUSTIFICATIFS_REVENUS =
  "3 derniers bulletins de salaire. Justificatif de versement des indemnités (Pôle emploi, CAF, caisse de retraite, etc.). Attestation de l'employeur mentionnant la rémunération, ou justificatif de versement des indemnités de stage. Pour les travailleurs indépendants : justificatif d'inscription au RCS ou répertoire des métiers + dernier bilan comptable, ou attestation d'un comptable/expert-comptable, ou copie de la déclaration de résultat. Titre de propriété d'un bien immobilier (revenus locatifs par exemple). Justificatif de versement de revenus fonciers, rentes viagères, etc.";

export const AIDE_TYPE_BAIL =
  "Meublé : bail meublé, en principe un an. Vide : bail nu, en principe trois ans. Saisonnier : occupation de courte durée. Étudiant et mobilité : bail mobilité, de un à dix mois. Événement et travaux : occupation temporaire, hors habitation principale.";

export type TypeService = "Tout" | "Taxi" | "Boat" | "Jet ski" | "Parapente" | "Restaurant";

export type Activite = {
  id: string;
  nom: string;
  type: Exclude<TypeService, "Tout">;
  ville: string;
  reduction: string;
  adresse: string;
  telephone: string;
  site: string;
  note: number;
  source: "hublify" | "site-gestionnaire";
  gestionnaire?: string;
};

export type RegimeLocation =
  "meuble" | "vide" | "saisonnier" | "etudiant" | "mobilite" | "evenement" | "travaux";

export type NatureBien = "appartement" | "maison" | "villa" | "jardin" | "garage" | "bateau";

export type Annonce = {
  id: string;
  titre: string;
  ville: string;
  prix: number;
  unite: "mois" | "nuit";
  regime: RegimeLocation;
  nature: NatureBien;
  chambres: number;
  note: number;
  professionnelVerifie: boolean;
  annonceVerifiee: boolean;
  source: "hublify" | "site-gestionnaire";
  siteAnnonceur: string;
  disponibleDu: string;
  disponibleAu: string;
  description: string;
  typeLoyer: string;
  garantie: number;
  fraisDossier: number;
  fraisEdl: number;
};

export type PaiementSimulation = {
  id: string;
  reference: string;
  libelle: string;
  montant: number;
  creeLe: string;
  statut: "simulation";
  fournisseur: "aucun";
  mention: string;
};

export type DecisionDemande = "autoriser" | "resilier" | "signaler";

export type SuiteDemande = {
  decision: DecisionDemande;
  autorise: boolean;
  resiliee: boolean;
  signalee: boolean;
  dureeHeures: number;
  expireLe: string | null;
};

export type ClasseDocument = "location" | "quittance" | "edl" | "reglement" | "fiche" | "autre";

export type TachePortail = {
  id: string;
  categorie: "Finance" | "Action" | "Mission";
  titre: string;
  quand: string;
  heureLabel: string;
  route:
    | "/espace"
    | "/espace/documents"
    | "/espace/logement"
    | "/espace/precheckin"
    | "/espace/missions"
    | "/espace/dossier"
    | "/espace/calendrier";
  hash: string;
};

const MOIS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

export const ACTIVITES_DEMO: Activite[] = [
  {
    id: "act-bambola",
    nom: "Restaurant — La Bambola",
    type: "Restaurant",
    ville: "Cannes",
    reduction: "10 % de réduction",
    adresse: "4 rue du Suquet, 06400 Cannes",
    telephone: "04 93 39 12 20",
    site: "https://exemple-gestionnaire.hublify.app/bambola",
    note: 4.6,
    source: "hublify",
  },
  {
    id: "act-taxi",
    nom: "Taxi — Croisette",
    type: "Taxi",
    ville: "Cannes",
    reduction: "Transfert gare inclus",
    adresse: "Gare de Cannes",
    telephone: "04 93 99 27 27",
    site: "https://exemple-gestionnaire.hublify.app/taxi",
    note: 4.2,
    source: "hublify",
  },
  {
    id: "act-boat",
    nom: "Boat — Îles de Lérins",
    type: "Boat",
    ville: "Cannes",
    reduction: "Sortie demi-journée",
    adresse: "Vieux Port, 06400 Cannes",
    telephone: "04 93 38 66 33",
    site: "https://exemple-gestionnaire.hublify.app/boat",
    note: 4.8,
    source: "hublify",
  },
  {
    id: "act-jet",
    nom: "Jet ski — Palm Beach",
    type: "Jet ski",
    ville: "Cannes",
    reduction: "Créneau 30 min",
    adresse: "Palm Beach, 06400 Cannes",
    telephone: "06 12 00 44 21",
    site: "https://exemple-gestionnaire.hublify.app/jet",
    note: 4.1,
    source: "site-gestionnaire",
    gestionnaire: "Agence Colette",
  },
  {
    id: "act-para",
    nom: "Parapente — Esterel",
    type: "Parapente",
    ville: "Cannes",
    reduction: "Vol découverte",
    adresse: "Départ Théoule",
    telephone: "06 20 11 45 90",
    site: "https://exemple-gestionnaire.hublify.app/parapente",
    note: 4.9,
    source: "hublify",
  },
];

export const ANNONCES_DEMO: Annonce[] = [
  {
    id: "ann-suzette",
    titre: "Appartement — Suzette — Cannes",
    ville: "Cannes",
    prix: 650,
    unite: "mois",
    regime: "meuble",
    nature: "appartement",
    chambres: 2,
    note: 4.7,
    professionnelVerifie: true,
    annonceVerifiee: true,
    source: "hublify",
    siteAnnonceur: "https://exemple-gestionnaire.hublify.app/annonces/suzette",
    disponibleDu: "2026-11-01",
    disponibleAu: "2027-02-01",
    description:
      "Deux pièces lumineuses, proche du Suquet. Loyer forfaitaire, charges incluses. Le premier et le dernier mois sont calculés au prorata.",
    typeLoyer: "Forfaitaire (tout inclus)",
    garantie: 350,
    fraisDossier: 50,
    fraisEdl: 40,
  },
  {
    id: "ann-colette-saison",
    titre: "Appartement — Colette — Cannes",
    ville: "Cannes",
    prix: 80,
    unite: "nuit",
    regime: "saisonnier",
    nature: "appartement",
    chambres: 1,
    note: 4.5,
    professionnelVerifie: true,
    annonceVerifiee: true,
    source: "hublify",
    siteAnnonceur: "https://exemple-gestionnaire.hublify.app/annonces/colette",
    disponibleDu: "2026-11-10",
    disponibleAu: "2026-11-20",
    description: "Studio meublé pour un séjour court, draps et ménage inclus.",
    typeLoyer: "Nuitée",
    garantie: 200,
    fraisDossier: 0,
    fraisEdl: 0,
  },
  {
    id: "ann-villa",
    titre: "Villa — Californie — Cannes",
    ville: "Cannes",
    prix: 2400,
    unite: "mois",
    regime: "vide",
    nature: "villa",
    chambres: 4,
    note: 4.9,
    professionnelVerifie: true,
    annonceVerifiee: false,
    source: "site-gestionnaire",
    siteAnnonceur: "https://exemple-gestionnaire.hublify.app/annonces/californie",
    disponibleDu: "2026-12-01",
    disponibleAu: "2027-12-01",
    description: "Villa vide avec jardin, publiée aussi sur le site de l'agence.",
    typeLoyer: "Loyer hors charges",
    garantie: 2400,
    fraisDossier: 120,
    fraisEdl: 80,
  },
  {
    id: "ann-bateau",
    titre: "Bateau — Vieux Port",
    ville: "Cannes",
    prix: 980,
    unite: "mois",
    regime: "evenement",
    nature: "bateau",
    chambres: 2,
    note: 4,
    professionnelVerifie: false,
    annonceVerifiee: true,
    source: "hublify",
    siteAnnonceur: "https://exemple-gestionnaire.hublify.app/annonces/bateau",
    disponibleDu: "2026-06-01",
    disponibleAu: "2026-09-30",
    description: "Occupation événementielle, hors habitation principale.",
    typeLoyer: "Forfait période",
    garantie: 500,
    fraisDossier: 40,
    fraisEdl: 40,
  },
];

export const TACHES_DEMO_RESIDENT: TachePortail[] = [
  {
    id: "t-loyer",
    categorie: "Finance",
    titre: "Appel de loyer — mai 2026 — Colette — Cannes",
    quand: "2026-05-25T10:00:00",
    heureLabel: "10:00",
    route: "/espace/documents",
    hash: "paiement",
  },
  {
    id: "t-entree",
    categorie: "Action",
    titre: "Entrée dans les lieux — Colette — Cannes",
    quand: "2026-05-25T12:00:00",
    heureLabel: "12:00",
    route: "/espace/logement",
    hash: "rdv",
  },
  {
    id: "t-edl",
    categorie: "Action",
    titre: "Validation état des lieux — Colette — Cannes",
    quand: "2026-05-25T12:05:00",
    heureLabel: "12:05",
    route: "/espace/logement",
    hash: "edl",
  },
  {
    id: "t-checkin",
    categorie: "Action",
    titre: "Formulaire de check-in — Suzette — Cannes",
    quand: "2026-11-10T10:00:00",
    heureLabel: "10/11/2026 10:00",
    route: "/espace/precheckin",
    hash: "",
  },
  {
    id: "t-plomb",
    categorie: "Action",
    titre: "Intervention plomberie",
    quand: "2026-05-26T09:00:00",
    heureLabel: "09:00",
    route: "/espace",
    hash: "intervention",
  },
  {
    id: "t-acces",
    categorie: "Action",
    titre: "Autoriser l'accès à vos documents",
    quand: "2026-05-26T15:00:00",
    heureLabel: "15:00",
    route: "/espace",
    hash: "demande",
  },
  {
    id: "t-bail",
    categorie: "Action",
    titre: "Signature du bail",
    quand: "2026-05-27T12:00:00",
    heureLabel: "12:00",
    route: "/espace/documents",
    hash: "location",
  },
];

export const TACHES_DEMO_PRESTATAIRE: TachePortail[] = [
  {
    id: "m-suzette",
    categorie: "Mission",
    titre: "Ménage — App. Suzette — Cannes",
    quand: "2026-05-25T12:00:00",
    heureLabel: "12:00",
    route: "/espace/missions",
    hash: "",
  },
  {
    id: "m-colette",
    categorie: "Mission",
    titre: "Ménage — App. Colette — Cannes",
    quand: "2026-05-25T15:00:00",
    heureLabel: "15:00",
    route: "/espace/missions",
    hash: "",
  },
];

export function filtrerActivites(params: {
  activites: Activite[];
  ville: string;
  types: TypeService[];
  inclureSitesGestionnaires: boolean;
}) {
  const ville = params.ville.trim().toLowerCase();
  const types = params.types.filter((t) => t !== "Tout");
  const tout = params.types.length === 0 || params.types.includes("Tout");
  return params.activites.filter((a) => {
    if (!params.inclureSitesGestionnaires && a.source === "site-gestionnaire") return false;
    if (ville && ville !== "autour de moi" && !a.ville.toLowerCase().includes(ville)) return false;
    if (!tout && !types.includes(a.type)) return false;
    return true;
  });
}

export function filtrerAnnonces(params: {
  annonces: Annonce[];
  ville: string;
  debut?: string;
  fin?: string;
  regime?: RegimeLocation | "";
  nature?: NatureBien | "";
  prixMax?: number;
  chambresMin?: number;
  noteMin?: number;
  inclureSitesGestionnaires: boolean;
  unite?: "mois" | "nuit" | "";
}) {
  const ville = params.ville.trim().toLowerCase();
  return params.annonces.filter((a) => {
    if (!params.inclureSitesGestionnaires && a.source === "site-gestionnaire") return false;
    if (ville && !a.ville.toLowerCase().includes(ville)) return false;
    if (params.regime && a.regime !== params.regime) return false;
    if (params.nature && a.nature !== params.nature) return false;
    if (params.unite && a.unite !== params.unite) return false;
    if (params.prixMax && params.prixMax > 0 && a.prix > params.prixMax) return false;
    if (params.chambresMin && a.chambres < params.chambresMin) return false;
    if (params.noteMin && a.note < params.noteMin) return false;
    if (params.debut && params.fin && params.fin >= params.debut) {
      if (a.disponibleAu < params.debut || a.disponibleDu > params.fin) return false;
    }
    return true;
  });
}

export function creerPaiementSimulation(input: {
  libelle: string;
  montant: number;
  maintenant?: Date;
  sequence?: number;
}): PaiementSimulation {
  const date = input.maintenant ?? new Date();
  const seq = input.sequence ?? date.getTime();
  const reference = `HUB-SIM-${seq.toString(36).toUpperCase()}`;
  return {
    id: `sim-${reference}`,
    reference,
    libelle: input.libelle.trim(),
    montant: Math.round(input.montant * 100) / 100,
    creeLe: date.toISOString(),
    statut: "simulation",
    fournisseur: "aucun",
    mention: MENTION_PAIEMENT_SIMULE,
  };
}

export function appliquerDecisionDemande(
  decision: DecisionDemande,
  maintenant = new Date(),
): SuiteDemande {
  const autorise = decision === "autoriser";
  const expire = new Date(maintenant.getTime());
  if (autorise) expire.setHours(expire.getHours() + DUREE_ACCES_DEMANDE_H);
  return {
    decision,
    autorise,
    resiliee: decision === "resilier",
    signalee: decision === "signaler",
    dureeHeures: autorise ? DUREE_ACCES_DEMANDE_H : 0,
    expireLe: autorise ? expire.toISOString() : null,
  };
}

export function fenetreEdl(emisLe: string, maintenant = Date.now()) {
  const emis = new Date(emisLe).getTime();
  if (Number.isNaN(emis)) return { ouvert: false, resteMs: 0 };
  const resteMs = FENETRE_EDL_MS - (maintenant - emis);
  return { ouvert: resteMs > 0, resteMs: Math.max(0, resteMs) };
}

export function classeDocument(titre: string, type = ""): ClasseDocument {
  const s = `${titre} ${type}`.toLowerCase();
  if (/fiche|acc[eè]s|wifi/.test(s)) return "fiche";
  if (/r[eè]glement/.test(s)) return "reglement";
  if (/inventaire|etat des lieux|état des lieux|\bedl\b|aedl/.test(s)) return "edl";
  if (/quittance|appel de loyer/.test(s)) return "quittance";
  if (/bail|facture|location/.test(s)) return "location";
  return "autre";
}

export function trierTaches(taches: TachePortail[]) {
  return [...taches].sort(
    (a, b) => a.quand.localeCompare(b.quand) || a.titre.localeCompare(b.titre),
  );
}

export function tachesDuJour(taches: TachePortail[], jourIso: string) {
  const duJour = taches.filter((t) => t.quand.slice(0, 10) === jourIso);
  return duJour.length > 0 ? duJour : taches.slice(0, 4);
}

export function joursAutour(centre: Date, rayon = 2) {
  return Array.from({ length: rayon * 2 + 1 }, (_, i) => {
    const d = new Date(centre);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + i - rayon);
    return d;
  });
}

export function etiquetteJour(date: Date) {
  return {
    mois: MOIS[date.getMonth()] ?? "",
    numero: String(date.getDate()),
    semaine: JOURS[date.getDay()] ?? "",
    iso: date.toISOString().slice(0, 10),
  };
}

export function libelleMois(date: Date) {
  const brut = date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
  return brut.replace(".", "");
}

export function resumeFamille(flags: {
  marie: boolean;
  pacse: boolean;
  concubinage: boolean;
  colocation: boolean;
}) {
  const lignes = [
    flags.marie ? "Marié" : null,
    flags.pacse ? "Pacsé" : null,
    flags.concubinage ? "Concubinage" : null,
    flags.colocation ? "Colocation" : null,
  ].filter((x): x is string => Boolean(x));
  return lignes.length > 0 ? lignes.join(" · ") : "Sans situation familiale déclarée";
}

export const GESTIONNAIRE_PORTAIL = {
  nom: "Yannick Ratti",
  societe: "Hublify",
  telephone: "04 93 00 12 12",
  email: "redris.gestion@gmail.com",
};

export const FAQ_LOGEMENT = [
  {
    id: "elec",
    question: "Panne d'électricité",
    reponse:
      "Vérifiez le disjoncteur du tableau et le compteur. Si le courant ne revient pas, n'appelez pas un électricien vous-même : contactez le gestionnaire du logement.",
  },
  {
    id: "plomb",
    question: "Fuite ou plomberie",
    reponse:
      "Coupez l'arrivée d'eau, placez un récipient, puis envoyez une photo au gestionnaire. Hors solution autonome, c'est lui qui mandate l'intervention.",
  },
  {
    id: "chauffe",
    question: "Plus d'eau chaude",
    reponse:
      "Contrôlez que le ballon est sous tension et que le disjoncteur dédié n'a pas sauté. Sans retour, message au gestionnaire.",
  },
  {
    id: "wifi",
    question: "Le Wi-Fi ne répond plus",
    reponse:
      "Redémarrez la box une minute. Les identifiants sont dans la fiche d'accès, protégés par le code de session. Sinon, contactez le gestionnaire.",
  },
  {
    id: "depart",
    question: "Comment déclarer un départ ?",
    reponse:
      "Indiquez une date précise. Le gestionnaire la valide : à partir de cette date, les documents de sortie sont générés.",
  },
];
