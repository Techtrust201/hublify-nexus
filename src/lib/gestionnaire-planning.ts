// SOURCE: Hublify V1.0 — dashboard, calendrier, pré-checkin, lieux, team mate
// Annotations Yannick Ratti (notes.md + commentaires Figma).

import type { DroitId, RoleId } from "@/auth/permissions";
import { ACCES_RESTREINT, DROITS_PAR_ROLE, estDroitId } from "@/auth/permissions";
import type { MissionMo1 } from "@/data/planning-mo1";
import { joursPlage } from "@/data/v1-metier";

export const TYPES_LIEU = [
  "Appartement",
  "Studio",
  "Maison",
  "Villa",
  "Jardin",
  "Garage",
  "Bateau",
  "Lieu d'événement",
] as const;

export const OCCUPATIONS_LIEU = ["Meublé", "Vide", "Événement", "Travaux"] as const;

export type TypeLieu = (typeof TYPES_LIEU)[number];
export type OccupationLieu = (typeof OCCUPATIONS_LIEU)[number];

export type AttributionPrestation = "mandataire" | "proprietaire" | "locataire";
export type PorteurPrestation = "prestataire" | "teammate" | "proprietaire";

export type EnvoiPrestation = "envoyee" | "validee" | "refusee" | "en_attente";

export type MetaPrestation = {
  plageDebut?: string;
  plageFin?: string;
  horairePrecise?: string;
  attribution?: AttributionPrestation;
  tarif?: number;
  reservationId?: string;
  typeLibre?: string;
  menage?: boolean;
  linge?: boolean;
  consommable?: boolean;
  porteur?: PorteurPrestation;
  /** Cycle d'envoi affiché dans le panneau En détails. */
  envoi?: EnvoiPrestation;
  note?: string;
  noteVoyageur?: string;
  noteInterne?: string;
  marketplace?: boolean;
  signifiee?: boolean;
};

export const LIBELLES_ENVOI: Record<EnvoiPrestation, string> = {
  envoyee: "Prestation envoyée",
  validee: "Prestation validée",
  refusee: "Prestation refusée",
  en_attente: "Prestation en attente",
};

const SEP = "\u2063";

export const TYPES_PRESTATION: Array<{ id: MissionMo1["type"]; label: string }> = [
  { id: "Menage", label: "Ménage" },
  { id: "Check-in", label: "Check-in" },
  { id: "Check-out", label: "Check-out" },
  { id: "Inventaire", label: "État des lieux" },
  { id: "Maintenance", label: "Autre" },
];

export const JOURS_MAX_PRESTATION = 31;

export function descriptionVisible(description: string) {
  const i = description.indexOf(SEP);
  return (i < 0 ? description : description.slice(0, i)).replace(/\s+$/, "");
}

export function lireMetaPrestation(description: string): MetaPrestation {
  const i = description.indexOf(SEP);
  if (i < 0) return {};
  try {
    const brut = JSON.parse(description.slice(i + SEP.length)) as MetaPrestation;
    if (!brut || typeof brut !== "object") return {};
    return brut;
  } catch {
    return {};
  }
}

export function ecrireDescription(texte: string, meta: MetaPrestation) {
  const propre = descriptionVisible(texte);
  const utile = Object.fromEntries(
    Object.entries(meta).filter(([, v]) => v !== undefined && v !== ""),
  );
  if (Object.keys(utile).length === 0) return propre;
  return `${propre}${SEP}${JSON.stringify(utile)}`;
}

/** Type libre saisi par l'utilisateur (bucket SQL = Maintenance). */
export function typeLibrePrestation(mission: {
  type: MissionMo1["type"];
  titre: string;
  description: string;
}): string | null {
  const meta = lireMetaPrestation(mission.description);
  if (meta.typeLibre?.trim()) return meta.typeLibre.trim();
  if (mission.type === "Maintenance") {
    const libelleCatalogue = TYPES_PRESTATION.find((t) => t.id === "Maintenance")?.label;
    const titre = descriptionVisible(mission.titre).trim();
    if (titre && titre !== libelleCatalogue && titre !== "Maintenance") return titre;
  }
  return null;
}

/**
 * « Prestations seules » ne doit pas masquer les missions custom (Maintenance + typeLibre).
 * Les séjours sont masqués séparément côté grille.
 */
export function filtrerPrestationsSeules<
  T extends { type: MissionMo1["type"]; description: string; titre: string },
>(missions: T[]): T[] {
  return missions;
}

export function typeMissionPourSaisie(typeLibre: string | undefined, type: MissionMo1["type"]) {
  const libre = typeLibre?.trim() ?? "";
  return {
    typeStocke: (libre ? "Maintenance" : type) as MissionMo1["type"],
    typeLibre: libre || undefined,
    libelle: libre || TYPES_PRESTATION.find((t) => t.id === type)?.label || type,
  };
}

export function heureAffichee(heure: string, meta: MetaPrestation) {
  if (meta.horairePrecise) return meta.horairePrecise;
  if (meta.plageDebut && meta.plageFin) return `${meta.plageDebut}–${meta.plageFin}`;
  return heure;
}

/** Le propriétaire qui réalise lui-même la prestation n'est pas facturé.
 *  Sinon : mandataire = tarif contractuel sur son espace, propriétaire ou
 *  locataire = tarif du prestataire (espace proprio, ou facture voyageur). */
export function facturationPrestation(meta: MetaPrestation): {
  facture: boolean;
  destinataire: "mandataire" | "proprietaire" | "locataire" | null;
  montant: number | null;
  libelle: string;
} {
  if (meta.porteur === "proprietaire") {
    return {
      facture: false,
      destinataire: null,
      montant: null,
      libelle: "Propriétaire : pas de facturation tant qu'aucun prestataire n'est choisi.",
    };
  }
  if (meta.attribution === "mandataire") {
    return {
      facture: true,
      destinataire: "mandataire",
      montant: meta.tarif ?? null,
      libelle: "Tarif contractuel, facture sur l'espace du mandataire.",
    };
  }
  const enAttente = "Le prix apparaîtra quand le prestataire et son tarif seront définis.";
  if (meta.attribution === "proprietaire") {
    return {
      facture: meta.tarif != null && meta.porteur != null,
      destinataire: "proprietaire",
      montant: meta.tarif ?? null,
      libelle:
        meta.tarif != null && meta.porteur != null
          ? "Tarif du prestataire, facture sur l'espace du propriétaire."
          : enAttente,
    };
  }
  if (meta.attribution === "locataire") {
    return {
      facture: meta.tarif != null,
      destinataire: "locataire",
      montant: meta.tarif ?? null,
      libelle:
        meta.tarif != null ? "Tarif du prestataire, ajouté à la facture du locataire." : enAttente,
    };
  }
  return {
    facture: false,
    destinataire: null,
    montant: null,
    libelle: "Choisissez à qui la prestation est attribuée.",
  };
}

export function plageValide(debut: string, fin: string) {
  return /^\d{2}:\d{2}$/.test(debut) && /^\d{2}:\d{2}$/.test(fin) && debut < fin;
}

export function horaireDansPlage(precise: string, debut: string, fin: string) {
  if (!precise) return true;
  if (!/^\d{2}:\d{2}$/.test(precise) || !plageValide(debut, fin)) return false;
  return precise >= debut && precise <= fin;
}

export function joursPrestation(debut: string, fin: string) {
  const jours = joursPlage(debut, fin);
  return jours.slice(0, JOURS_MAX_PRESTATION);
}

export type LigneServiceImport = {
  type: MissionMo1["type"];
  titre: string;
  meta: MetaPrestation;
};

/** Réservation importée d'une OTA : ménage, linge et consommables sont posés,
 *  sans attribution. Le prix mandataire est contractuel ; le prix propriétaire
 *  attend le prestataire. */
export function lignesServicesImport(): LigneServiceImport[] {
  return [
    {
      type: "Menage",
      titre: "Ménage",
      meta: { menage: true },
    },
    {
      type: "Menage",
      titre: "Linge de maison",
      meta: { linge: true },
    },
    {
      type: "Maintenance",
      titre: "Consommables",
      meta: { consommable: true, typeLibre: "Consommables" },
    },
  ];
}

export function estImportOta(plateforme: string) {
  return plateforme === "Airbnb" || plateforme === "Booking.com";
}

export function missionDepuisLigne(
  ligne: LigneServiceImport,
  base: { id: string; bienId: string; date: string },
): MissionMo1 {
  return {
    id: base.id,
    bienId: base.bienId,
    date: base.date,
    titre: ligne.titre,
    type: ligne.type,
    emoji: ligne.type === "Menage" ? "🧹" : "🧴",
    heure: "",
    assigne: "Non assigné",
    statut: "a_faire",
    description: ecrireDescription(
      "Ajouté automatiquement à l'import. L'attribution n'est pas automatique.",
      ligne.meta,
    ),
  };
}

export type ActionDate = "prestation" | "reservation" | "evenement" | "bloquer" | "debloquer";

export function actionsDate(bloque: boolean): Array<{ id: ActionDate; label: string }> {
  return [
    { id: "prestation", label: "Ajouter une prestation" },
    { id: "reservation", label: "Créer une réservation" },
    { id: "evenement", label: "Créer une note ou un événement" },
    bloque
      ? { id: "debloquer", label: "Retirer le blocage" }
      : { id: "bloquer", label: "Bloquer cette date" },
  ];
}

export const CATEGORIES_DROITS: Array<{ id: string; titre: string; droits: DroitId[] }> = [
  { id: "financier", titre: "Financier", droits: ["voir-finances", "mod-finances"] },
  {
    id: "calendrier",
    titre: "Calendrier",
    droits: ["voir-calendrier", "mod-missions", "voir-reservations", "mod-reservations"],
  },
  { id: "messagerie", titre: "Messagerie", droits: ["messagerie"] },
  {
    id: "biens",
    titre: "Biens et documents",
    droits: ["voir-biens", "mod-biens", "voir-documents"],
  },
  { id: "equipe", titre: "Équipe", droits: ["gerer-equipe"] },
];

/** « Personnalisé » part de zéro. Le profil du rôle reste le plafond. */
export function droitsPersonnalises(roleId: RoleId, coches: readonly string[]): string[] {
  const plafond = new Set<string>(DROITS_PAR_ROLE[roleId]);
  const ids = coches.filter((id) => estDroitId(id) && plafond.has(id));
  return [ACCES_RESTREINT, ...ids];
}

export function droitAutoriseParProfil(roleId: RoleId, id: string) {
  return estDroitId(id) && DROITS_PAR_ROLE[roleId].includes(id);
}

export type FicheLieuSaisie = {
  typologie: string;
  meuble: boolean;
  statut: "libre" | "loué" | "en travaux";
};

export function ficheDepuisOccupation(type: string, occupation: OccupationLieu): FicheLieuSaisie {
  const typologie = occupation === "Événement" ? "Lieu d'événement" : type || "Appartement";
  if (occupation === "Travaux") {
    return { typologie, meuble: false, statut: "en travaux" };
  }
  return {
    typologie,
    meuble: occupation === "Meublé",
    statut: "libre",
  };
}

export type AnnonceLieu = {
  nom: string;
  type: string;
  occupation: OccupationLieu;
  adresse: string;
  note: number;
};

export function exporterAnnonces(lignes: AnnonceLieu[]) {
  const corps = lignes.map(
    (l) =>
      `${echapperCsv(l.nom)};${echapperCsv(l.type)};${l.occupation};${echapperCsv(l.adresse)};${l.note.toFixed(1)}`,
  );
  return ["Nom;Type;Occupation;Adresse;Note", ...corps].join("\n");
}

export function importerAnnonces(csv: string): { lignes: AnnonceLieu[]; ignorees: number } {
  const lignesBrutes = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const lignes: AnnonceLieu[] = [];
  let ignorees = 0;
  for (const ligne of lignesBrutes) {
    if (/^nom\s*;/i.test(ligne)) continue;
    const [nom, type, occupation, adresse, note] = ligne.split(";").map((c) => c.trim());
    if (!nom) {
      ignorees += 1;
      continue;
    }
    const occ = OCCUPATIONS_LIEU.find((o) => o.toLowerCase() === (occupation ?? "").toLowerCase());
    if (!occ) {
      ignorees += 1;
      continue;
    }
    const noteN = Number((note ?? "").replace(",", "."));
    lignes.push({
      nom,
      type: type || "Appartement",
      occupation: occ,
      adresse: adresse ?? "",
      note: Number.isFinite(noteN) ? Math.min(5, Math.max(0, noteN)) : 0,
    });
  }
  return { lignes, ignorees };
}

function echapperCsv(valeur: string) {
  return valeur.replaceAll(";", ",");
}

export type ExtraPrecheckin = {
  rectoVerso: boolean;
  photo: boolean;
  fichier: boolean;
  telephone: boolean;
  codePorteJourArrivee: boolean;
  cautionActive: boolean;
  cautionMontant: number;
  cautionBaux: boolean;
  cautionVoyageurs: boolean;
  upsellsProposes: string[];
};

export const EXTRA_PRECHECKIN_DEFAUT: ExtraPrecheckin = {
  rectoVerso: true,
  photo: true,
  fichier: true,
  telephone: true,
  codePorteJourArrivee: false,
  cautionActive: false,
  cautionMontant: 0,
  cautionBaux: true,
  cautionVoyageurs: true,
  upsellsProposes: [],
};

export const CLE_EXTRA_PRECHECKIN = "hublify.precheckin.extra.v1";
const CLE_EXTRA = CLE_EXTRA_PRECHECKIN;

export function normaliserExtra(partiel?: Partial<ExtraPrecheckin> | null): ExtraPrecheckin {
  return {
    ...EXTRA_PRECHECKIN_DEFAUT,
    ...partiel,
    cautionMontant: Math.max(0, Number(partiel?.cautionMontant) || 0),
    upsellsProposes: partiel?.upsellsProposes?.filter((id) => id.trim()) ?? [],
  };
}

/** Null s'il n'y a rien dans le navigateur — à distinguer du défaut métier. */
export function lireExtraLegacy(): ExtraPrecheckin | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const brut = localStorage.getItem(CLE_EXTRA);
    if (!brut) return null;
    return normaliserExtra(JSON.parse(brut) as Partial<ExtraPrecheckin>);
  } catch {
    return null;
  }
}

export function lireExtraPrecheckin(): ExtraPrecheckin {
  return lireExtraLegacy() ?? { ...EXTRA_PRECHECKIN_DEFAUT, upsellsProposes: [] };
}

/** @deprecated Les options extra vivent dans `org_precheckin_extra`. */
export function ecrireExtraPrecheckin(extra: ExtraPrecheckin) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CLE_EXTRA, JSON.stringify(normaliserExtra(extra)));
}

export function purgerExtraLocal() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(CLE_EXTRA);
}

/**
 * Une ligne déjà en base n'est jamais remplacée par le navigateur.
 * Sans ligne, l'ancien localStorage est repris une fois puis purgé.
 */
export function fusionMigrationExtra(
  distant: { extra: ExtraPrecheckin; enregistre: boolean },
  legacy: ExtraPrecheckin | null,
): { extra: ExtraPrecheckin; pousser: boolean } {
  if (distant.enregistre) return { extra: normaliserExtra(distant.extra), pousser: false };
  if (legacy) return { extra: normaliserExtra(legacy), pousser: true };
  return { extra: normaliserExtra(null), pousser: false };
}

/** Même mécanisme pour un bail et un séjour voyageur : la caution n'est demandée
 *  que si elle est active et que le contexte est coché. */
export function cautionDemandee(
  extra: ExtraPrecheckin,
  contexte: "bail" | "voyageur",
): { demandee: boolean; montant: number } {
  const contexteOk = contexte === "bail" ? extra.cautionBaux : extra.cautionVoyageurs;
  const montant = Math.max(0, extra.cautionMontant);
  return {
    demandee: extra.cautionActive && contexteOk && montant > 0,
    montant: extra.cautionActive && contexteOk ? montant : 0,
  };
}

export function messageRelancePaiement(l: {
  locataire: string;
  montant: number;
  bienNom: string;
  echeance: string;
  lien: string;
}) {
  const montant = l.montant.toLocaleString("fr-FR");
  return `Bonjour ${l.locataire}, il reste ${montant} € à régler pour ${l.bienNom} (échéance ${l.echeance}). Lien de paiement : ${l.lien}`;
}

export function resteADevoir(montant: number, valide: boolean) {
  return valide ? 0 : Math.max(0, montant);
}

export type ReglePortee = { periodeSeule: boolean; note: string };

const MARQUE_PERIODE = "[cette-periode]";

export function noterPortee(note: string, periodeSeule: boolean): string {
  const propre = note.replace(MARQUE_PERIODE, "").trim();
  return periodeSeule ? `${MARQUE_PERIODE} ${propre}`.trim() : propre;
}

export function lirePortee(note?: string): ReglePortee {
  const brut = note ?? "";
  return {
    periodeSeule: brut.includes(MARQUE_PERIODE),
    note: brut.replace(MARQUE_PERIODE, "").trim(),
  };
}
