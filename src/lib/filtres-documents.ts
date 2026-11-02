// SOURCE: Hublify V1.0 — Onglets Documents, annotations de contenu (196:12241 et suivantes).

export type DocFiltrable = {
  type: string;
  filtre: string;
  titre: string;
  occupant?: string;
};

function blob(d: DocFiltrable) {
  return `${d.type} ${d.filtre} ${d.titre}`.toLowerCase();
}

/** Filtres des dossiers de la maquette, en conservant les libellés déjà en données. */
export function correspondFiltreDocument(d: DocFiltrable, filtre: string) {
  if (filtre === "Tous") return true;
  const texte = blob(d);
  if (d.filtre === filtre || d.type === filtre) return true;

  switch (filtre) {
    case "Fiche Locataire":
      return d.occupant === "locataires" && /dossier|fiche|identité|identite|cni/.test(texte);
    case "Fiche Voyageur":
      return d.occupant === "voyageurs" && /dossier|fiche|règlement|reglement|contrat/.test(texte);
    case "Bail":
      return /bail/.test(texte);
    case "Quittances":
    case "Quittances de loyer":
      return /quittance/.test(texte);
    case "Appels de loyer":
      return /appel|avis|échéance|echeance/.test(texte);
    case "Factures voyageur":
      return d.occupant === "voyageurs" && /facture/.test(texte);
    case "Autres":
    case "Documents":
      return /correspondance|courrier|avoir|autre/.test(texte);
    case "Fiche logement":
      return /fiche logement|inventaire logement/.test(texte);
    case "Factures entretien":
      return /facture/.test(texte) && !/voyageur|syndic|copro/.test(texte);
    case "Diagnostics":
      return /diagnostic|dpe|crep|électricité|electricite|gaz/.test(texte);
    case "Syndic — Appels de fonds":
    case "Syndic / Copro":
      return /syndic|copro|appel de fonds/.test(texte) && !/\brib\b/.test(texte);
    case "Syndic — RIB":
      return /\brib\b/.test(texte);
    case "Divers courriers":
    case "Courrier libre":
    case "Correspondances":
      return /courrier|correspondance/.test(texte);
    case "Fiche d'accès":
    case "Fiches accès":
      return /accès|acces/.test(texte);
    case "Clés":
      return /clé|cles|clefs/.test(texte);
    case "Badges":
      return /badge/.test(texte);
    case "Fiche propriétaire":
    case "Pièce d'identité":
      return /fiche proprio|identité|identite|cni|pièce|piece d/.test(texte);
    case "Attestation de propriété":
    case "Attestations":
      return /attestation/.test(texte);
    case "Contrats de gestion":
    case "Contrats":
    case "Contrats de prestation":
      return /contrat/.test(texte);
    case "Fiche prestataire":
      return d.occupant === "prestataires" && /fiche|dossier/.test(texte);
    case "Rapport de prestation":
    case "Preuves":
      return /rapport|preuve|intervention/.test(texte);
    case "Factures":
      return /facture/.test(texte);
    case "Justificatifs":
      return /justificatif|domicile|revenus/.test(texte);
    case "RIB":
      return /\brib\b/.test(texte);
    case "Devis":
      return /devis/.test(texte);
    case "États des lieux":
      return /état des lieux|etat des lieux/.test(texte);
    case "Inventaire":
      return /inventaire/.test(texte) && !/consommable/.test(texte);
    default:
      return false;
  }
}

export function referenceDocument(id: string) {
  const compact = id.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return (compact.slice(-8) || "DOC").padStart(4, "0");
}

export function libelleOccupant(occupant?: string) {
  if (occupant === "voyageurs") return "Voyageur";
  if (occupant === "prestataires") return "Prestataire";
  if (occupant === "locataires") return "Locataire";
  return "—";
}
