import type {
  AttributionPrestation,
  MetaPrestation,
  PorteurPrestation,
} from "@/lib/gestionnaire-planning";
import type { OrigineTarif } from "@/lib/mission-facturation-serveur";

/**
 * Fenêtre « Créer une Mission » (PR 4/6) : une seule liste « Assigné à ».
 * Valeurs : "" (non assigné), "proprio", "presta:<nom>", "team:<nom>", "ouvert".
 */
export type ChoixDecode = {
  porteur: PorteurPrestation;
  nom: string;
  /** Valeur écrite dans `missions.assigne` (le serveur y met l'e-mail du prestataire). */
  assigne: string;
};

export function decoderChoixAssigne(choix: string): ChoixDecode {
  if (choix === "proprio") return { porteur: "proprietaire", nom: "", assigne: "Propriétaire" };
  if (choix.startsWith("presta:")) {
    const nom = choix.slice("presta:".length).trim();
    return { porteur: "prestataire", nom, assigne: nom || "Non assigné" };
  }
  if (choix.startsWith("team:")) {
    const nom = choix.slice("team:".length).trim();
    return { porteur: "teammate", nom, assigne: nom || "Non assigné" };
  }
  // « Ouvert » et « Non assigné » : personne, porté par un prestataire à venir.
  return { porteur: "prestataire", nom: "", assigne: "Non assigné" };
}

function personne(assigne: string) {
  const nom = assigne.trim();
  return nom && nom !== "Non assigné" && nom !== "Propriétaire" ? nom : "";
}

/** Choix affiché à l'ouverture d'une mission existante. */
export function choixAssigne(meta: MetaPrestation, assigne: string): string {
  const nom = personne(assigne ?? "");
  if (meta.porteur === "proprietaire") return "proprio";
  if (!nom) return meta.marketplace ? "ouvert" : "";
  if (meta.porteur === "teammate") return `team:${nom}`;
  return `presta:${nom}`;
}

export type SaisieFenetre = {
  periode: boolean;
  plageDebut: string;
  plageFin: string;
  horairePrecise: string;
  attribution: AttributionPrestation | "";
  tarif: number | null;
  reservationId: string;
  typeLibre: string;
  porteur: PorteurPrestation;
  ouvert: boolean;
  /** « Assigné à » n'a pas bougé : on garde l'état marketplace tel quel. */
  choixInchange: boolean;
};

/** Clés de la méta que la fenêtre gère. Les autres (ménage, linge, consommable,
 *  envoi, notes, règlement…) sont conservées telles quelles à l'édition. */
const GEREES = [
  "plageDebut",
  "plageFin",
  "horairePrecise",
  "attribution",
  "tarif",
  "reservationId",
  "typeLibre",
  "porteur",
  "marketplace",
] as const;

export function fusionnerMetaFenetre(precedente: MetaPrestation, s: SaisieFenetre): MetaPrestation {
  const meta: MetaPrestation = { ...precedente };
  for (const cle of GEREES) delete meta[cle];
  if (s.periode) {
    meta.plageDebut = s.plageDebut;
    meta.plageFin = s.plageFin;
    if (s.horairePrecise) meta.horairePrecise = s.horairePrecise;
  }
  if (s.attribution) meta.attribution = s.attribution;
  if (s.tarif != null) meta.tarif = s.tarif;
  if (s.reservationId) meta.reservationId = s.reservationId;
  if (s.typeLibre) meta.typeLibre = s.typeLibre;
  meta.porteur = s.porteur;
  if (s.ouvert) meta.marketplace = true;
  else if (s.choixInchange && precedente.marketplace) meta.marketplace = precedente.marketplace;
  return meta;
}

export function libelleOrigineTarif(origine: OrigineTarif): string {
  switch (origine) {
    case "modifie":
      return "modifié";
    case "prestataire":
      return "auto, tarif du prestataire";
    case "grille_org":
      return "auto, grille de l'agence";
    case "bareme":
      return "auto, barème";
    default:
      return "à définir";
  }
}
