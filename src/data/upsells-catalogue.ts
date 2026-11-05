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

/** Fiche telle qu'elle est stockée, sans repli sur le catalogue. */
export function ficheStockee(brut: unknown): FicheUpsell | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as Partial<FicheUpsell>;
  const texte = (valeur: unknown, defaut = "") => (typeof valeur === "string" ? valeur : defaut);
  return {
    code: texte(o.code).slice(0, 80),
    type: texte(o.type, "Service").slice(0, 80) || "Service",
    prestataire: texte(o.prestataire).slice(0, 160),
    ville: texte(o.ville).slice(0, 80),
    pieceJointe: texte(o.pieceJointe).slice(0, 200),
  };
}

export const CLE_FICHES_UPSELL = "hublify.upsells.fiches.v1";

export function lireFichesUpsellLegacy(): Record<string, FicheUpsell> | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const brut = localStorage.getItem(CLE_FICHES_UPSELL);
    if (!brut) return null;
    const parsed = JSON.parse(brut) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const fiches: Record<string, FicheUpsell> = {};
    for (const [id, valeur] of Object.entries(parsed)) {
      const fiche = ficheStockee(valeur);
      if (id.trim() && fiche) fiches[id] = fiche;
    }
    return Object.keys(fiches).length > 0 ? fiches : null;
  } catch {
    return null;
  }
}

export function purgerFichesUpsellLocales() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(CLE_FICHES_UPSELL);
}

/** La base gagne dès qu'une fiche d'organisation existe. */
export function fusionMigrationFiches(
  distantes: Record<string, FicheUpsell>,
  legacy: Record<string, FicheUpsell> | null,
): { fiches: Record<string, FicheUpsell>; pousser: boolean } {
  if (Object.keys(distantes).length > 0) return { fiches: { ...distantes }, pousser: false };
  if (legacy && Object.keys(legacy).length > 0) return { fiches: { ...legacy }, pousser: true };
  return { fiches: {}, pousser: false };
}

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
