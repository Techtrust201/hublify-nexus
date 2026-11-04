/** Champs catalogue de la maquette Outils / Upsells, en plus du prix déjà suivi. */

export type FicheUpsell = {
  code: string;
  type: string;
  prestataire: string;
  ville: string;
  pieceJointe: string;
};

export const FICHES_DEFAUT: Record<string, FicheUpsell> = {
  "u-dej": {
    code: "12-01-S",
    type: "Nourriture",
    prestataire: "La Boulangerie Ducoin",
    ville: "Cannes",
    pieceJointe: "Menu.pdf",
  },
  "u-late": {
    code: "8-01-K",
    type: "Service",
    prestataire: "",
    ville: "Cannes",
    pieceJointe: "",
  },
  "u-park": {
    code: "9-02-P",
    type: "Stationnement",
    prestataire: "Parking Palais",
    ville: "Cannes",
    pieceJointe: "",
  },
  u1: {
    code: "4-11-B",
    type: "Équipement",
    prestataire: "",
    ville: "Cannes",
    pieceJointe: "",
  },
  u2: {
    code: "6-04-M",
    type: "Ménage",
    prestataire: "Équipe maison",
    ville: "Cannes",
    pieceJointe: "",
  },
  u4: {
    code: "8-03-E",
    type: "Transport",
    prestataire: "Chameau Taxi",
    ville: "Cannes",
    pieceJointe: "Carte de visite.png",
  },
};

const VIDE: FicheUpsell = {
  code: "",
  type: "Service",
  prestataire: "",
  ville: "Cannes",
  pieceJointe: "",
};

export function ficheEffective(id: string, surcharge?: Partial<FicheUpsell> | null): FicheUpsell {
  return {
    ...VIDE,
    code: id.toUpperCase(),
    ...FICHES_DEFAUT[id],
    ...sansVides(surcharge),
  };
}

function sansVides(surcharge?: Partial<FicheUpsell> | null): Partial<FicheUpsell> {
  if (!surcharge) return {};
  const propre: Partial<FicheUpsell> = {};
  (Object.keys(VIDE) as (keyof FicheUpsell)[]).forEach((cle) => {
    const valeur = surcharge[cle];
    if (typeof valeur === "string") propre[cle] = valeur;
  });
  return propre;
}

export function filtrerUpsells<T extends { id: string; nom: string }>(
  lignes: readonly T[],
  fiches: Record<string, FicheUpsell>,
  recherche: string,
) {
  const q = recherche.trim().toLowerCase();
  if (!q) return [...lignes];
  return lignes.filter((ligne) => {
    const fiche = ficheEffective(ligne.id, fiches[ligne.id]);
    const blob = [
      ligne.nom,
      fiche.code,
      fiche.type,
      fiche.prestataire,
      fiche.ville,
      fiche.pieceJointe,
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}

export function csvUpsells(
  lignes: readonly { id: string; nom: string; prix: number; actif: boolean }[],
  fiches: Record<string, FicheUpsell>,
) {
  const entete = [
    "Code",
    "Désignation",
    "Type",
    "Prestataire",
    "Pièce jointe",
    "Ville",
    "Tarif unitaire",
    "Actif",
  ];
  const corps = lignes.map((ligne) => {
    const fiche = ficheEffective(ligne.id, fiches[ligne.id]);
    return [
      fiche.code,
      ligne.nom,
      fiche.type,
      fiche.prestataire,
      fiche.pieceJointe,
      fiche.ville,
      ligne.prix.toFixed(2).replace(".", ","),
      ligne.actif ? "oui" : "non",
    ];
  });
  return [entete, ...corps].map((colonnes) => colonnes.map(echapperCsv).join(";")).join("\n");
}

function echapperCsv(valeur: string) {
  if (/[;"\n]/.test(valeur)) return `"${valeur.replaceAll('"', '""')}"`;
  return valeur;
}
