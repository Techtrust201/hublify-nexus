import { useEffect, useState } from "react";

/**
 * SOURCE: Hublify V1.0 — Maq V1 Gestionnaire / Patrimoine
 * (frames Vision patrimoines, annotations 200:15198, 200:15227, 200:15246,
 * 200:15247, 201:15418, 231:4506, 231:4513, 246:5595, 302:17034, 318:22837,
 * 323:24256, 329:26367, 335:1459, commentaires Yannick Ratti 10, 11, 12, 13).
 */

export type UsageLieu = "meublé" | "vide" | "événement" | "travaux";
export type TypeLoyer = "forfaitaire" | "classique";
export type ChoixRegle = "non-précisé" | "oui" | "non";
export type AlertePatrimoine = "etat-des-lieux" | "welcome-book" | "gestion-cles";

export type AccesSaisie = {
  codeCles: string;
  wifi: string;
  wifiMdp: string;
  alarme: string;
  consignes: string;
};

export type LitFiche = {
  id: string;
  type: string;
  quantite: number;
  /** Deux configurations uniquement pour un lit double (annotation 318:22837). */
  configurations: [string, string] | null;
};

export type EspaceFiche = {
  id: string;
  nom: string;
  description: string;
  lits: LitFiche[];
};

/** Métadonnée seule : les octets vivent dans `fichiers_deposes`, jamais en dataURL. */
export type PhotoFiche = {
  id: string;
  nom: string;
};

export function photosPersistables(valeur: unknown): PhotoFiche[] {
  if (!Array.isArray(valeur)) return [];
  return valeur.flatMap((entree) => {
    const photo = asRecord(entree);
    if (!photo) return [];
    const id = String(photo["id"] ?? "").trim();
    const nom = String(photo["nom"] ?? "").trim();
    if (!id || !nom) return [];
    return [{ id, nom }];
  });
}

export type MandatGestion = {
  reference: string;
  proprietaire: string;
  gestionnaire: string;
  debut: string;
  fin: string;
  signe: boolean;
};

export type AccesProprietaire = {
  financier: boolean;
  calendrier: boolean;
  messagerie: boolean;
  documents: boolean;
};

export type LienOta = {
  plateforme: string;
  compte: string;
  importeLe: string;
};

export type FicheLieu = {
  usage: UsageLieu;
  etage: string;
  porte: string;
  ascenseur: "" | "O" | "N";
  gestionnaire: string;
  enregistrementMairie: string;
  meubleTourisme: boolean;
  numeroDpe: string;
  surfaceM2: string;
  pieces: number;
  nombreEtages: number;
  occupantsMax: number;
  chambres: number;
  sallesDeBain: number;
  anneeConstruction: string;
  nombreCles: number;
  heureArrivee: string;
  heureDepart: string;
  typeLoyer: TypeLoyer;
  loyerHorsCharges: string;
  charges: string;
  tarifNuit: string;
  description: string;
  equipements: string[];
  equipementAutre: string;
  stationnement: string[];
  services: string[];
  serviceAutre: string;
  animaux: ChoixRegle;
  fetes: ChoixRegle;
  fumeur: ChoixRegle;
  longueDuree: boolean;
  camerasExterieures: boolean;
  regleAutre: string;
  espaces: EspaceFiche[];
  parkingExterieur: number;
  photos: PhotoFiche[];
  mandat: MandatGestion | null;
  accesProprietaire: AccesProprietaire;
  ota: LienOta | null;
  welcomeBook: boolean;
  welcomeBookTexte: string;
  notationExtraite: number | null;
  immeubleId: string | null;
  /** Champs de la fiche CONFIG (frame 2-43521), stockés dans le JSON de fiche. */
  placesParking: number;
  nombreAscenseurs: number;
  typeChauffage: string;
  etatGeneral: string;
  classementEnergetique: string;
  proprietaireEmail: string;
  proprietaireTel: string;
  appelLoyerAuto: boolean;
  revisionAnnuelle: boolean;
  indiceRevision: string;
  commentaireCharges: string;
};

export type GroupeCatalogue = { id: string; label: string; items: readonly string[] };

export const GROUPES_TYPES: readonly GroupeCatalogue[] = [
  {
    id: "habitation",
    label: "Habitation",
    items: [
      "Immeuble",
      "Studio",
      "Appartement (T1, T2, T3, T4, T5 et plus)",
      "Duplex / triplex",
      "Loft",
      "Maison individuelle",
      "Villa",
      "Maison de ville",
      "Chalet",
      "Bastide",
      "Toit-terrasse",
      "Chambre",
      "Maison de campagne / longère",
      "Château / manoir",
    ],
  },
  {
    id: "atypique",
    label: "Locations saisonnières et atypiques",
    items: [
      "Gîte",
      "Mobil-home",
      "Caravane camping-car",
      "Péniche",
      "Bateau",
      "Cabane / tiny house / roulotte",
      "Yourte",
    ],
  },
  {
    id: "professionnel",
    label: "Locaux professionnels et commerciaux",
    items: [
      "Bureau",
      "Local commercial / boutique",
      "Local d'activité",
      "Entrepôt",
      "Espace de coworking",
      "Cabinet médical ou paramédical",
      "Restaurant",
      "Fonds de commerce (location-gérance)",
    ],
  },
  {
    id: "autres",
    label: "Autres",
    items: ["Garage", "Box", "Place de parking", "Cave", "Jardin", "Extérieur", "Terrain agricole"],
  },
];

export const TYPES_LIEU: readonly string[] = GROUPES_TYPES.flatMap((g) => [...g.items]);

/** La maquette écrit « Exterieur ». On affiche l'orthographe correcte. */
const ALIAS_TYPE: Record<string, string> = {
  appartement: "Appartement (T1, T2, T3, T4, T5 et plus)",
  maison: "Maison individuelle",
  exterieur: "Extérieur",
  "château / manoir (rare, haut de gamme)": "Château / manoir",
  "chateau / manoir": "Château / manoir",
};

export const USAGES: readonly { id: UsageLieu; label: string }[] = [
  { id: "meublé", label: "Meublé" },
  { id: "vide", label: "Vide" },
  { id: "événement", label: "Événement" },
  { id: "travaux", label: "Travaux" },
];

export const EQUIPEMENTS: readonly GroupeCatalogue[] = [
  {
    id: "essentiels",
    label: "Essentiels",
    items: [
      "Wi-Fi",
      "Eau chaude",
      "Chauffage",
      "Climatisation",
      "Cintres et penderie",
      "Fer à repasser et table à repasser",
      "Sèche-cheveux",
      "Détecteur de fumée",
      "Détecteur de monoxyde de carbone",
      "Extincteur",
      "Trousse de premiers secours",
      "Serrure sécurisée",
    ],
  },
  {
    id: "cuisine",
    label: "Cuisine",
    items: [
      "Cuisine équipée",
      "Réfrigérateur / congélateur",
      "Four",
      "Micro-ondes",
      "Plaques de cuisson",
      "Lave-vaisselle",
      "Cafetière",
      "Bouilloire",
      "Grille-pain",
      "Mixeur / robot",
      "Vaisselle, couverts et verres",
      "Casseroles, poêles et ustensiles",
      "Ouvre-bouteille / tire-bouchon",
      "Essuie-tout, éponge, produit vaisselle",
      "Table à manger et chaises",
    ],
  },
  {
    id: "sdb",
    label: "Salle de bain",
    items: [
      "Douche",
      "Baignoire",
      "Machine à laver",
      "Sèche-linge",
      "Étendoir à linge",
      "Sèche-serviettes",
    ],
  },
  {
    id: "salon",
    label: "Salon / Divertissement",
    items: [
      "Télévision",
      "Netflix / Amazon Prime / Disney+ / Canal+",
      "Enceinte Bluetooth",
      "Console de jeux",
    ],
  },
  {
    id: "chambre",
    label: "Chambre",
    items: ["Oreillers et couettes supplémentaires", "Rideaux occultants / volets", "Ventilateur"],
  },
  {
    id: "travail",
    label: "Espaces de travail",
    items: ["Bureau", "Chaise de bureau"],
  },
  {
    id: "exterieur",
    label: "Extérieur",
    items: [
      "Salon de jardin",
      "Barbecue / plancha",
      "Piscine (privée, partagée, chauffée)",
      "Jacuzzi / spa / sauna",
      "Hamac / transats",
      "Douche extérieure",
      "Accès plage / front de mer",
    ],
  },
  {
    id: "famille",
    label: "Famille",
    items: [
      "Lit bébé / lit parapluie",
      "Chaise haute",
      "Baignoire bébé / table à langer",
      "Équipements adaptés aux enfants",
    ],
  },
];

export const STATIONNEMENT: readonly string[] = [
  "Parking gratuit sur place",
  "Parking privé / garage",
  "Parking dans la rue",
  "Borne de recharge véhicule électrique",
  "Accès PMR",
  "Local à vélos",
];

export const SERVICES: readonly string[] = [
  "Arrivée autonome (self check-in)",
  "Consigne à bagages",
  "Service de conciergerie",
  "Petit-déjeuner",
  "Laverie à proximité",
];

export const LITS: readonly string[] = [
  "Lit simple 90",
  "Lit double",
  "Lit queen",
  "Lit king",
  "Lits superposés",
  "Canapé-lit",
  "Lit bébé",
];

export const PLATEFORMES_OTA = ["Airbnb", "Booking", "Abritel", "Vrbo", "Direct"] as const;

export const TEXTE_LEGAL_MEUBLE = {
  titre: "Principe légal — meublé de tourisme",
  principe:
    "L'article L. 324-1-1 du Code du tourisme impose à toute personne qui loue un meublé de tourisme de procéder préalablement à une déclaration soumise à enregistrement. Cette obligation vise toute personne qui loue un meublé de tourisme, sans condition de commune. Le numéro doit ensuite figurer dans toute annonce touristique.",
  concerne:
    "Les résidences secondaires et logements d'investissement proposés en meublé de tourisme, ainsi que les résidences principales. Les loueurs en direct comme ceux qui passent par une conciergerie ou une plateforme. Les hôtels classés, résidences de tourisme et chambres d'hôtes relèvent de régimes distincts. Les chambres d'hôtes restent soumises à une déclaration en mairie.",
} as const;

export const LIBELLES_ALERTES: Record<AlertePatrimoine, string> = {
  "etat-des-lieux": "État des lieux manquant",
  "welcome-book": "Livret d'accueil manquant",
  "gestion-cles": "Gestion des clés manquant",
};

const ACCES_FERME: AccesProprietaire = {
  financier: false,
  calendrier: false,
  messagerie: false,
  documents: false,
};

export function accesVide(): AccesSaisie {
  return { codeCles: "", wifi: "", wifiMdp: "", alarme: "", consignes: "" };
}

export function ficheVierge(): FicheLieu {
  return {
    usage: "meublé",
    etage: "",
    porte: "",
    ascenseur: "",
    gestionnaire: "",
    enregistrementMairie: "",
    meubleTourisme: false,
    numeroDpe: "",
    surfaceM2: "",
    pieces: 1,
    nombreEtages: 0,
    occupantsMax: 0,
    chambres: 1,
    sallesDeBain: 1,
    anneeConstruction: "",
    nombreCles: 0,
    heureArrivee: "15:00",
    heureDepart: "10:00",
    typeLoyer: "classique",
    loyerHorsCharges: "",
    charges: "",
    tarifNuit: "",
    description: "",
    equipements: [],
    equipementAutre: "",
    stationnement: [],
    services: [],
    serviceAutre: "",
    animaux: "non-précisé",
    fetes: "non-précisé",
    fumeur: "non-précisé",
    longueDuree: false,
    camerasExterieures: false,
    regleAutre: "",
    espaces: [],
    parkingExterieur: 0,
    photos: [],
    mandat: null,
    accesProprietaire: { ...ACCES_FERME },
    ota: null,
    welcomeBook: false,
    welcomeBookTexte: "",
    notationExtraite: null,
    immeubleId: null,
    placesParking: 0,
    nombreAscenseurs: 0,
    typeChauffage: "",
    etatGeneral: "",
    classementEnergetique: "",
    proprietaireEmail: "",
    proprietaireTel: "",
    appelLoyerAuto: false,
    revisionAnnuelle: false,
    indiceRevision: "",
    commentaireCharges: "",
  };
}

function asRecord(valeur: unknown): Record<string, unknown> | null {
  return valeur && typeof valeur === "object" ? (valeur as Record<string, unknown>) : null;
}

export function normaliserFiche(partiel: unknown): FicheLieu {
  const base = ficheVierge();
  const brut = asRecord(partiel);
  if (!brut) return base;
  const acces = asRecord(brut["accesProprietaire"]);
  const usage = USAGES.some((u) => u.id === brut["usage"])
    ? (brut["usage"] as UsageLieu)
    : base.usage;
  const typeLoyer = brut["typeLoyer"] === "forfaitaire" ? "forfaitaire" : "classique";
  return {
    ...base,
    ...(brut as Partial<FicheLieu>),
    usage,
    typeLoyer,
    equipements: Array.isArray(brut["equipements"])
      ? brut["equipements"].filter((x) => typeof x === "string")
      : [],
    stationnement: Array.isArray(brut["stationnement"])
      ? brut["stationnement"].filter((x) => typeof x === "string")
      : [],
    services: Array.isArray(brut["services"])
      ? brut["services"].filter((x) => typeof x === "string")
      : [],
    espaces: Array.isArray(brut["espaces"]) ? (brut["espaces"] as EspaceFiche[]) : [],
    photos: photosPersistables(brut["photos"]),
    accesProprietaire: {
      financier: Boolean(acces?.["financier"]),
      calendrier: Boolean(acces?.["calendrier"]),
      messagerie: Boolean(acces?.["messagerie"]),
      documents: Boolean(acces?.["documents"]),
    },
    mandat: asRecord(brut["mandat"]) ? (brut["mandat"] as MandatGestion) : null,
    ota: asRecord(brut["ota"]) ? (brut["ota"] as LienOta) : null,
    welcomeBook:
      Boolean(brut["welcomeBook"]) || String(brut["welcomeBookTexte"] ?? "").trim() !== "",
    nombreCles: Number(brut["nombreCles"] ?? 0) || 0,
    pieces: Number(brut["pieces"] ?? 1) || 1,
    nombreEtages: Number(brut["nombreEtages"] ?? 0) || 0,
    occupantsMax: Number(brut["occupantsMax"] ?? 0) || 0,
    chambres: Number(brut["chambres"] ?? 1) || 1,
    sallesDeBain: Number(brut["sallesDeBain"] ?? 1) || 1,
    parkingExterieur: Number(brut["parkingExterieur"] ?? 0) || 0,
    placesParking: Number(brut["placesParking"] ?? 0) || 0,
    nombreAscenseurs: Number(brut["nombreAscenseurs"] ?? 0) || 0,
    typeChauffage: String(brut["typeChauffage"] ?? ""),
    etatGeneral: String(brut["etatGeneral"] ?? ""),
    classementEnergetique: String(brut["classementEnergetique"] ?? ""),
    proprietaireEmail: String(brut["proprietaireEmail"] ?? ""),
    proprietaireTel: String(brut["proprietaireTel"] ?? ""),
    appelLoyerAuto: Boolean(brut["appelLoyerAuto"]),
    revisionAnnuelle: Boolean(brut["revisionAnnuelle"]),
    indiceRevision: String(brut["indiceRevision"] ?? ""),
    commentaireCharges: String(brut["commentaireCharges"] ?? ""),
  };
}

export type ResumeBien = {
  nom: string;
  typologie?: string | undefined;
  surface?: string | undefined;
  meuble?: boolean | undefined;
  proprietaire?: string | undefined;
  statut?: string | undefined;
  immeubleId?: string | null | undefined;
  note?: number | undefined;
};

export function typeCanonique(typologie: string | undefined): string {
  const brut = (typologie ?? "").trim();
  if (!brut) return "Appartement (T1, T2, T3, T4, T5 et plus)";
  if (TYPES_LIEU.includes(brut)) return brut;
  return ALIAS_TYPE[brut.toLowerCase()] ?? brut;
}

export function libelleCourt(typologie: string): string {
  if (typologie.startsWith("Appartement")) return "Appartement";
  if (typologie.startsWith("Château")) return "Château / manoir";
  return typologie;
}

export function libelleUsage(usage: UsageLieu): string {
  return USAGES.find((u) => u.id === usage)?.label ?? usage;
}

export function fichePourBien(bien: ResumeBien): FicheLieu {
  const nom = bien.nom.trim().toLowerCase();
  const suzette = nom === "suzette";
  const studio =
    nom.includes("raclette") || (bien.typologie ?? "").toLowerCase().includes("studio");
  const usage: UsageLieu =
    bien.statut === "en travaux" ? "travaux" : bien.meuble === false ? "vide" : "meublé";
  const surface = (bien.surface ?? "").replace(/[^\d.,]/g, "").replace(",", ".");
  return normaliserFiche({
    usage,
    surfaceM2: surface,
    nombreCles: suzette ? 0 : 2,
    welcomeBook: !suzette,
    gestionnaire: bien.proprietaire && bien.proprietaire !== "—" ? bien.proprietaire : "",
    pieces: studio ? 1 : 3,
    chambres: studio ? 0 : 2,
    sallesDeBain: 1,
    heureArrivee: "15:00",
    heureDepart: "10:00",
    immeubleId: bien.immeubleId ?? null,
    meubleTourisme: false,
    equipements: ["Wi-Fi", "Chauffage"],
  });
}

export function estLitDouble(type: string): boolean {
  return type.toLowerCase().includes("double");
}

export function litDoubleValide(lit: LitFiche): boolean {
  if (!estLitDouble(lit.type)) return true;
  const [a, b] = lit.configurations ?? ["", ""];
  return Boolean(a.trim() && b.trim());
}

export function litsValides(fiche: FicheLieu): boolean {
  return fiche.espaces.every((e) => e.lits.every(litDoubleValide));
}

function nombre(valeur: string): number | null {
  const brut = valeur.replace(/\s/g, "").replace(",", ".");
  if (!brut) return null;
  const n = Number(brut);
  return Number.isFinite(n) ? n : null;
}

export function montantLoyer(
  fiche: Pick<FicheLieu, "typeLoyer" | "loyerHorsCharges" | "charges">,
): {
  total: number | null;
  libelle: string;
} {
  const loyer = nombre(fiche.loyerHorsCharges);
  const charges = nombre(fiche.charges);
  if (fiche.typeLoyer === "forfaitaire") {
    return {
      total: loyer,
      libelle: loyer == null ? "Forfaitaire" : `Forfaitaire · ${loyer.toLocaleString("fr-FR")} €`,
    };
  }
  if (loyer == null && charges == null) return { total: null, libelle: "Loyer + charges" };
  const total = (loyer ?? 0) + (charges ?? 0);
  return {
    total,
    libelle: `Classique · ${total.toLocaleString("fr-FR")} € (loyer + charges)`,
  };
}

export function extraireNotation(texte: string): number | null {
  const motifs = [
    /note\s*[:=]?\s*(\d(?:[.,]\d)?)\s*(?:\/\s*5)?/i,
    /(\d(?:[.,]\d)?)\s*\/\s*5/,
    /[★*]{1,5}\s*(\d(?:[.,]\d)?)/,
  ];
  for (const motif of motifs) {
    const m = texte.match(motif);
    if (!m?.[1]) continue;
    const n = Number(m[1].replace(",", "."));
    if (n >= 0 && n <= 5) return Math.round(n * 10) / 10;
  }
  return null;
}

export type AnnonceExport = {
  version: 1;
  nom: string;
  typologie: string;
  adresse: string;
  fiche: FicheLieu;
};

export function exporterAnnonce(annonce: AnnonceExport): string {
  const { photos: _photos, ...fiche } = annonce.fiche;
  return JSON.stringify({ ...annonce, fiche: { ...fiche, photos: [] } }, null, 2);
}

export function importerAnnonce(texte: string): {
  nom?: string;
  typologie?: string;
  adresse?: string;
  fiche?: Partial<FicheLieu>;
  notation?: number | null;
  erreur?: string;
} {
  const brut = texte.trim();
  if (!brut) return { erreur: "Annonce vide." };
  if (brut.startsWith("{")) {
    try {
      const json = JSON.parse(brut) as Partial<AnnonceExport>;
      if (json.version !== 1 || !json.fiche) return { erreur: "Fichier d'annonce illisible." };
      const fiche = normaliserFiche(json.fiche);
      return {
        ...(json.nom ? { nom: json.nom } : {}),
        ...(json.typologie ? { typologie: json.typologie } : {}),
        ...(json.adresse ? { adresse: json.adresse } : {}),
        fiche,
        notation: fiche.notationExtraite,
      };
    } catch {
      return { erreur: "JSON invalide." };
    }
  }
  const lignes = brut
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const nom = lignes[0];
  if (!nom) return { erreur: "Annonce vide." };
  const notation = extraireNotation(brut);
  const description = lignes.filter((l, i) => i > 0 && !/^note\b/i.test(l)).join("\n");
  return {
    nom,
    notation,
    fiche: {
      description,
      ...(notation != null ? { notationExtraite: notation } : {}),
    },
  };
}

export function alertesLieu(input: {
  nom: string;
  fiche: FicheLieu;
  codeCles: string;
  edl: readonly { logement: string }[];
  documents: readonly { titre: string; logement: string }[];
}): AlertePatrimoine[] {
  const nom = input.nom.trim().toLowerCase();
  const meme = (logement: string) => logement.trim().toLowerCase() === nom;
  const alertes: AlertePatrimoine[] = [];
  const aUnEdl = input.edl.some((d) => meme(d.logement));
  if (!aUnEdl) alertes.push("etat-des-lieux");
  const livret = input.documents.some(
    (d) => meme(d.logement) && /welcome\s*book|livret/i.test(d.titre),
  );
  if (!input.fiche.welcomeBook && !input.fiche.welcomeBookTexte.trim() && !livret) {
    alertes.push("welcome-book");
  }
  if (!input.codeCles.trim() && input.fiche.nombreCles <= 0) alertes.push("gestion-cles");
  return alertes;
}

export type PatchBien = {
  nom: string;
  typologie: string;
  surface: string;
  meuble: boolean;
  proprietaire: string;
  initiales: string;
  statut: "loué" | "libre" | "en travaux";
  adresse: string;
  immeubleId: string | null;
  note?: number;
};

export function patchBienDepuisFiche(
  actuel: {
    statut?: "loué" | "libre" | "en travaux" | undefined;
    meuble?: boolean | undefined;
    note?: number | undefined;
  },
  saisie: {
    nom: string;
    typologie: string;
    adresse: string;
    proprietaire: string;
    fiche: FicheLieu;
  },
): PatchBien {
  const usage = saisie.fiche.usage;
  const meuble = usage === "vide" ? false : usage === "travaux" ? (actuel.meuble ?? true) : true;
  let statut = actuel.statut ?? "libre";
  if (usage === "travaux") statut = "en travaux";
  else if (statut === "en travaux") statut = "libre";
  const surface = saisie.fiche.surfaceM2.trim()
    ? `${saisie.fiche.surfaceM2.replace(".", ",")} m²`
    : "—";
  const note = saisie.fiche.notationExtraite ?? actuel.note;
  const proprietaire = saisie.proprietaire.trim();
  return {
    nom: saisie.nom.trim(),
    typologie: saisie.typologie.trim() || "Logement",
    surface,
    meuble,
    proprietaire,
    initiales: initialesDe(proprietaire || saisie.nom),
    statut,
    adresse: saisie.adresse.trim(),
    immeubleId: saisie.fiche.immeubleId,
    ...(note != null ? { note } : {}),
  };
}

export function initialesDe(nom: string) {
  return (
    nom
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "??"
  );
}

export function annoncePublable(fiche: FicheLieu): string | null {
  if (fiche.meubleTourisme && !fiche.enregistrementMairie.trim()) {
    return "Le numéro d'enregistrement (art. L. 324-1-1) est requis pour publier l'annonce.";
  }
  if (!litsValides(fiche)) {
    return "Un lit double demande deux configurations (dimensions).";
  }
  return null;
}

const FICHES_VIDES: Record<string, FicheLieu> = {};
const CLE_FICHES = "hublify.fiches-lieu.v1";
const CLE_TYPES = "hublify.types-lieu.v1";

function lireFichesLegacyPuisPurger(): Record<string, FicheLieu> | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const brut = localStorage.getItem(CLE_FICHES);
    localStorage.removeItem(CLE_FICHES);
    if (!brut) return null;
    const lu = JSON.parse(brut) as unknown;
    if (!lu || typeof lu !== "object") return null;
    const sortie: Record<string, FicheLieu> = {};
    for (const [id, fiche] of Object.entries(lu as Record<string, unknown>)) {
      sortie[id] = normaliserFiche(fiche);
    }
    return sortie;
  } catch {
    try {
      localStorage.removeItem(CLE_FICHES);
    } catch {
      /* ignore */
    }
    return null;
  }
}

function lireTypesLegacyPuisPurger(): string[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const brut = localStorage.getItem(CLE_TYPES);
    localStorage.removeItem(CLE_TYPES);
    if (!brut) return null;
    const lu = JSON.parse(brut) as unknown;
    return Array.isArray(lu) ? lu.filter((x) => typeof x === "string" && x.trim()) : null;
  } catch {
    try {
      localStorage.removeItem(CLE_TYPES);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function useFichesLieu() {
  const [fiches, setFiches] = useState<Record<string, FicheLieu>>(FICHES_VIDES);
  const [typesPerso, setTypesPerso] = useState<string[]>([]);

  useEffect(() => {
    let actif = true;
    const legacyFiches = lireFichesLegacyPuisPurger();
    const legacyTypes = lireTypesLegacyPuisPurger();
    void import("@/data/parametres-remote").then(
      ({ chargerFichesLieuDistantes, sauverFicheLieuDistante, sauverTypesLieuDistants }) =>
        chargerFichesLieuDistantes().then(async (res) => {
          if (!actif) return;
          if (res.ok) {
            const distant = res.data;
            const fichesFinal =
              Object.keys(distant.fiches).length === 0 && legacyFiches
                ? legacyFiches
                : distant.fiches;
            const typesFinal =
              distant.typesPerso.length === 0 && legacyTypes ? legacyTypes : distant.typesPerso;
            setFiches(fichesFinal);
            setTypesPerso(typesFinal);
            if (legacyFiches && Object.keys(distant.fiches).length === 0) {
              for (const [id, fiche] of Object.entries(legacyFiches)) {
                await sauverFicheLieuDistante({ data: { bienId: id, fiche } });
              }
            }
            if (legacyTypes && distant.typesPerso.length === 0) {
              await sauverTypesLieuDistants({ data: { types: legacyTypes } });
            }
          } else {
            if (legacyFiches) setFiches(legacyFiches);
            if (legacyTypes) setTypesPerso(legacyTypes);
          }
        }),
    );
    return () => {
      actif = false;
    };
  }, []);

  return {
    fiches,
    typesPerso,
    sauver(id: string, fiche: FicheLieu) {
      const propre = normaliserFiche(fiche);
      setFiches((prev) => ({ ...prev, [id]: propre }));
      void import("@/data/parametres-remote").then(({ sauverFicheLieuDistante }) =>
        sauverFicheLieuDistante({ data: { bienId: id, fiche: propre } }),
      );
    },
    retirer(ids: string[]) {
      setFiches((prev) => {
        const suivant = { ...prev };
        ids.forEach((id) => delete suivant[id]);
        return suivant;
      });
      void import("@/data/parametres-remote").then(({ sauverFicheLieuDistante }) => {
        for (const id of ids) {
          void sauverFicheLieuDistante({ data: { bienId: id, fiche: ficheVierge() } });
        }
      });
    },
    ajouterType(nom: string) {
      const propre = nom.trim();
      if (!propre || TYPES_LIEU.includes(propre) || typesPerso.includes(propre)) return;
      const suivant = [...typesPerso, propre];
      setTypesPerso(suivant);
      void import("@/data/parametres-remote").then(({ sauverTypesLieuDistants }) =>
        sauverTypesLieuDistants({ data: { types: suivant } }),
      );
    },
  };
}

export function ficheEffective(
  bien: ResumeBien & { id: string },
  fiches: Record<string, FicheLieu>,
) {
  return fiches[bien.id] ? normaliserFiche(fiches[bien.id]) : fichePourBien(bien);
}
