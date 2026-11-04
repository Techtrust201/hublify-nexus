// SOURCE: frames « Rédiger proposition de Bail » (Messagerie > Vision messages)
// et annotation des situations du locataire (nœud 304:19096).

export const SITUATIONS_LOCATAIRE = [
  "En études supérieures",
  "En formation Professionnelle",
  "En contrat d’apprentissage",
  "En stage",
  "En engagement volontaire dans le cadre d’un service civique",
  "En mutation Professionnelle",
  "En mission temporaire dans le cadre de son activité Professionnelle",
] as const;

export type SituationLocataire = (typeof SITUATIONS_LOCATAIRE)[number];

export const TYPES_BAIL: readonly { id: string; libelle: string; aide?: string }[] = [
  { id: "sans-charges", libelle: "Loyer mensuel sans charges" },
  {
    id: "forfait-regul",
    libelle: "Loyer mensuel + Forfait de charges avec régularisation annuelle",
  },
  {
    id: "forfaitaire",
    libelle: "Loyer mensuel + Forfait de charges fixe sans régularisation (Forfaitaire)",
    aide: "Un loyer forfaitaire est un montant fixe convenu comprenant les charges qui ne varie pas en fonction de la consommation réelle des charges incluses.",
  },
];

export type BrouillonBail = {
  typeBailId: string;
  bailleur: string;
  mandataire: string;
  locataire: string;
  situation: string;
  debut: string;
  fin: string;
  loyer: string;
  charges: string;
  caution: string;
  conditions: string;
  premierLoyer: string;
};

export type PieceRedaction = {
  id: string;
  libelle: string;
  detail?: string;
  fait: boolean;
};

export function brouillonInitial(entree: {
  locataire: string;
  redacteur: string;
  situation?: string;
}): BrouillonBail {
  return {
    typeBailId: "forfaitaire",
    bailleur: entree.redacteur,
    mandataire: entree.redacteur,
    locataire: entree.locataire,
    situation: entree.situation || "En études supérieures",
    debut: "2026-09-12",
    fin: "2027-05-10",
    loyer: "750",
    charges: "",
    caution: "",
    conditions: "",
    premierLoyer: "",
  };
}

export function periodeValide(debut: string, fin: string) {
  return Boolean(debut && fin && fin > debut);
}

export function piecesRedaction(b: BrouillonBail): PieceRedaction[] {
  return [
    { id: "type", libelle: "Type de Bail", fait: Boolean(b.typeBailId) },
    {
      id: "soussignes",
      libelle: "Soussignés",
      fait: Boolean(b.bailleur.trim() && b.locataire.trim()),
    },
    {
      id: "periode",
      libelle: "Période de location",
      fait: periodeValide(b.debut, b.fin),
    },
    { id: "loyer", libelle: "Loyer et charges", fait: Boolean(b.loyer.trim()) },
    { id: "caution", libelle: "Caution et garantie", fait: Boolean(b.caution.trim()) },
    { id: "conditions", libelle: "Conditions divers", fait: Boolean(b.conditions.trim()) },
    {
      id: "premier",
      libelle: "1er Loyer",
      detail: "Loyer d’entrée dans les lieux",
      fait: Boolean(b.premierLoyer.trim()),
    },
  ];
}

export function progressionBail(b: BrouillonBail) {
  const pieces = piecesRedaction(b);
  const faites = pieces.filter((p) => p.fait).length;
  const total = pieces.length;
  const pourcentage = total === 0 ? 0 : Math.round((faites / total) * 100);
  return { pieces, faites, total, pourcentage };
}

export function libelleTypeBail(id: string) {
  return TYPES_BAIL.find((t) => t.id === id)?.libelle ?? "";
}

export function aideTypeBail(id: string) {
  return TYPES_BAIL.find((t) => t.id === id)?.aide;
}
