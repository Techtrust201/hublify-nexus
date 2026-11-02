// SOURCE: annotation « Message automatique / Parcours 1 » + commentaire
// « paramétrage message automatique » (Yannick Ratti).

export const DECLENCHEURS = [
  { id: "connexion-compte", libelle: "Connexion au compte personnel" },
  { id: "precheckin", libelle: "Pré-check-in complété" },
  { id: "demande-location", libelle: "Demande de location reçue" },
  { id: "proposition-bail", libelle: "Proposition de bail émise" },
  { id: "checkin", libelle: "Check-in effectué" },
] as const;

export type DeclencheurId = (typeof DECLENCHEURS)[number]["id"];

export const CIBLES_MESSAGE = [
  { id: "tous", libelle: "Tous les interlocuteurs" },
  { id: "voyageur", libelle: "Voyageurs" },
  { id: "locataire", libelle: "Locataires" },
  { id: "prospect", libelle: "Prospects" },
  { id: "prestataire", libelle: "Prestataires" },
  { id: "team", libelle: "Team mates" },
] as const;

export type CibleMessage = (typeof CIBLES_MESSAGE)[number]["id"];

export type TypeMessageAuto = {
  id: string;
  libelle: string;
  declencheur: DeclencheurId;
  cible: CibleMessage;
  modele: string;
  actif: boolean;
};

export type ParcoursAuto = {
  id: string;
  nom: string;
  actif: boolean;
  types: TypeMessageAuto[];
};

export type VariablesMessage = {
  nom: string;
  heure: string;
  date: string;
  bien: string;
};

const MODELE_VIDE = "{nom} — message automatique.";

export function parcoursInitiaux(): ParcoursAuto[] {
  return [
    {
      id: "parcours-1",
      nom: "Parcours 1",
      actif: true,
      types: [
        {
          id: "mt-connexion",
          libelle: "Compte personnel",
          declencheur: "connexion-compte",
          cible: "voyageur",
          actif: true,
          modele: "{nom} s'est connecté à son compte personnel à {heure} le {date}.",
        },
        {
          id: "mt-precheckin",
          libelle: "Pré-check-in",
          declencheur: "precheckin",
          cible: "voyageur",
          actif: true,
          modele: "{nom} a rempli son pré-check-in à {heure} le {date}.",
        },
        {
          id: "mt-demande",
          libelle: "Demande de location",
          declencheur: "demande-location",
          cible: "prospect",
          actif: true,
          modele: "{nom} a émis une demande de location à {heure} le {date}.",
        },
        {
          id: "mt-bail",
          libelle: "Proposition de bail",
          declencheur: "proposition-bail",
          cible: "prospect",
          actif: true,
          modele: "Le gestionnaire a émis une proposition de bail à {heure} le {date}.",
        },
        {
          id: "mt-checkin",
          libelle: "Check-in",
          declencheur: "checkin",
          cible: "team",
          actif: true,
          modele: "Check-in effectué pour {nom} — {bien}.",
        },
      ],
    },
  ];
}

export function libelleDeclencheur(id: DeclencheurId) {
  return DECLENCHEURS.find((d) => d.id === id)?.libelle ?? id;
}

export function rendreModele(modele: string, vars: VariablesMessage) {
  const table: Record<string, string> = vars;
  return modele.replace(/\{(\w+)\}/g, (_, cle: string) => table[cle] ?? "");
}

export function messagesDeclenches(
  parcours: ParcoursAuto[],
  declencheur: DeclencheurId,
  cible: CibleMessage,
  vars: VariablesMessage,
) {
  return parcours
    .filter((p) => p.actif)
    .flatMap((p) => p.types)
    .filter(
      (t) => t.actif && t.declencheur === declencheur && (t.cible === "tous" || t.cible === cible),
    )
    .map((t) => rendreModele(t.modele, vars).trim())
    .filter((texte) => texte.length > 0);
}

export function ajouterTypeMessage(
  parcours: ParcoursAuto[],
  parcoursId: string,
  type: Omit<TypeMessageAuto, "id" | "actif"> & { actif?: boolean },
): { parcours: ParcoursAuto[]; erreur?: string } {
  const libelle = type.libelle.trim();
  const modele = type.modele.trim();
  if (!libelle) return { parcours, erreur: "Indiquez un libellé." };
  if (!modele) return { parcours, erreur: "Indiquez le texte du message." };
  const cible = parcours.find((p) => p.id === parcoursId);
  if (!cible) return { parcours, erreur: "Parcours introuvable." };
  const suivant: TypeMessageAuto = {
    id: `mt-${Date.now().toString(36)}`,
    libelle,
    declencheur: type.declencheur,
    cible: type.cible,
    modele,
    actif: type.actif ?? true,
  };
  return {
    parcours: parcours.map((p) =>
      p.id === parcoursId ? { ...p, types: [...p.types, suivant] } : p,
    ),
  };
}

export function retirerTypeMessage(parcours: ParcoursAuto[], typeId: string) {
  return parcours.map((p) => ({ ...p, types: p.types.filter((t) => t.id !== typeId) }));
}

export function basculerType(parcours: ParcoursAuto[], typeId: string, actif: boolean) {
  return parcours.map((p) => ({
    ...p,
    types: p.types.map((t) => (t.id === typeId ? { ...t, actif } : t)),
  }));
}

export function basculerParcours(parcours: ParcoursAuto[], parcoursId: string, actif: boolean) {
  return parcours.map((p) => (p.id === parcoursId ? { ...p, actif } : p));
}

export function ajouterParcours(parcours: ParcoursAuto[]): ParcoursAuto[] {
  const numero = parcours.length + 1;
  return [
    ...parcours,
    {
      id: `parcours-${numero}-${Date.now().toString(36)}`,
      nom: `Parcours ${numero}`,
      actif: true,
      types: [
        {
          id: `mt-nouveau-${Date.now().toString(36)}`,
          libelle: "Nouveau message type",
          declencheur: "demande-location",
          cible: "tous",
          modele: MODELE_VIDE,
          actif: false,
        },
      ],
    },
  ];
}

export function cibleConversation(type: string, badge: string): CibleMessage {
  if (/prospect/i.test(badge)) return "prospect";
  if (type === "locataire") return "locataire";
  if (type === "prestataire") return "prestataire";
  if (type === "team") return "team";
  if (type === "voyageur") return "voyageur";
  return "tous";
}
