/** Livrets d'accueil et fiches d'accès — maquette « Fiche d'accès et Livret d'accueil ». */

export type FamilleLivret = "livret" | "fiche";

export type PageLivret = {
  id: string;
  nom: string;
  titre: string;
  sousTitre: string;
  texte: string;
};

export type LivretAccueil = {
  id: string;
  nom: string;
  reference: string;
  famille: FamilleLivret;
  logement: string;
  modifiePar: string;
  modifieLe: string;
  couleurFond: string;
  logo: string;
  pages: PageLivret[];
  contact?: string;
  arrivee?: string;
  depart?: string;
  wifiNom?: string;
  wifiCode?: string;
  boiteNom?: string;
  boiteCode?: string;
  couvertureNom?: string;
};

function page(
  id: string,
  nom: string,
  titre: string,
  sousTitre: string,
  texte: string,
): PageLivret {
  return { id, nom, titre, sousTitre, texte };
}

export const LIVRETS_INITIAUX: LivretAccueil[] = [
  {
    id: "livret-standard",
    nom: "Livret d'accueil standard",
    reference: "LIV0001",
    famille: "livret",
    logement: "Tous les logements",
    modifiePar: "Équipe Hublify",
    modifieLe: "2026-03-10",
    couleurFond: "#f7f6f2",
    logo: "Hublify",
    pages: [
      page(
        "accueil",
        "Entête du livret",
        "Bonjour et bienvenue",
        "Votre séjour commence ici",
        "Notre équipe est présente pour vous accueillir. Retrouvez ici l'essentiel du logement, du quartier et des règles de la maison.",
      ),
      page(
        "bienvenue",
        "Bienvenue",
        "Bienvenue",
        "Mot d'accueil",
        "Bonjour et bienvenue chez vous.\n\nNous sommes ravis de vous accueillir.",
      ),
      page(
        "pratique",
        "Informations pratique",
        "Le logement au quotidien",
        "Horaires et règles",
        "Boulangerie au coin de la rue, marché le matin, arrêt de bus à deux minutes.\n\nPas de fête, silence après 22 h, et merci de laisser le logement comme vous l'avez trouvé.",
      ),
      page(
        "acces",
        "Accès",
        "Entrer dans le logement",
        "Codes et clés",
        "L'adresse et les codes sont ceux de la fiche du logement. Le code de la boîte à clés se déverrouille après le pré-check-in.",
      ),
    ],
  },
  {
    id: "fiche-colette",
    nom: "Fiche d'accès — Appartement Colette",
    reference: "ACC0001",
    famille: "fiche",
    logement: "Appartement Colette",
    modifiePar: "Équipe Hublify",
    modifieLe: "2026-03-10",
    couleurFond: "#f0f3fc",
    logo: "Colette",
    pages: [
      page(
        "acces",
        "Accès",
        "Entrer dans le logement",
        "Codes et clés",
        "Adresse communiquée dans la réservation. Digicode dans la boîte à clés, étage et porte indiqués sur cette fiche. Le code se déverrouille après le pré-check-in.",
      ),
      page(
        "wifi",
        "Wi-Fi et stationnement",
        "Rester connecté",
        "Réseau et parking",
        "Le nom du réseau et le mot de passe sont affichés dans le logement. Stationnement : place indiquée par le gestionnaire, ou rue à proximité.",
      ),
      page(
        "contact",
        "Contact",
        "En cas de difficulté",
        "Nous sommes joignables",
        "À l'arrivée (accès, clés, équipements), contactez le gestionnaire depuis la messagerie du séjour.",
      ),
    ],
  },
  {
    id: "livret-saison",
    nom: "Livret d'accueil saisonnier",
    reference: "LIV0002",
    famille: "livret",
    logement: "Villa Lavandrix",
    modifiePar: "Équipe Hublify",
    modifieLe: "2026-03-10",
    couleurFond: "#e7f5ee",
    logo: "Lavandrix",
    pages: [
      page(
        "accueil",
        "Page d'accueil",
        "Bienvenue à la villa",
        "Séjour saisonnier",
        "Check-in à partir de 16 h, check-out avant 10 h. Le linge de maison est préparé pour votre arrivée.",
      ),
      page(
        "equipements",
        "Équipements",
        "La maison",
        "Cuisine, climatisation, extérieur",
        "Climatisation dans les chambres. Merci de fermer les volets en partant et de ramener le mobilier de terrasse.",
      ),
    ],
  },
];

export function pageRenseignee(pageLivret: PageLivret) {
  return pageLivret.titre.trim().length > 0 && pageLivret.texte.trim().length > 0;
}

export function dupliquerLivret(source: LivretAccueil, maintenant = new Date()): LivretAccueil {
  const suffixe = maintenant.getTime().toString(36);
  return {
    ...source,
    id: `${source.id}-${suffixe}`,
    nom: `${source.nom} (copie)`,
    reference:
      source.famille === "fiche"
        ? `ACC${suffixe.slice(-4).toUpperCase()}`
        : `LIV${suffixe.slice(-4).toUpperCase()}`,
    modifieLe: maintenant.toISOString().slice(0, 10),
    pages: source.pages.map((p) => ({ ...p })),
  };
}

export function livretRenomme(
  source: LivretAccueil,
  nom: string,
  maintenant = new Date(),
): LivretAccueil {
  return {
    ...source,
    nom: nom.trim() || source.nom,
    modifieLe: maintenant.toISOString().slice(0, 10),
  };
}

export const CLE_LIVRETS = "hublify.livrets.v1";

/**
 * Ancien stockage navigateur. La source de vérité est `org_livrets`.
 * Sert uniquement à la bascule unique quand l'organisation n'a encore aucune ligne.
 */
export function lireLivretsLegacy(): LivretAccueil[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const brut = localStorage.getItem(CLE_LIVRETS);
    if (!brut) return null;
    const parsed = JSON.parse(brut) as unknown;
    if (!Array.isArray(parsed)) return null;
    const livres = parsed.map(normaliserLivret).filter((l): l is LivretAccueil => l != null);
    return livres.length > 0 ? livres : null;
  } catch {
    return null;
  }
}

export function lireLivretsLocaux(
  seed: readonly LivretAccueil[] = LIVRETS_INITIAUX,
): LivretAccueil[] {
  return lireLivretsLegacy() ?? seed.map(cloner);
}

/** @deprecated Ne plus écrire le livret dans le navigateur. */
export function ecrireLivretsLocaux(livrets: readonly LivretAccueil[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CLE_LIVRETS, JSON.stringify(livrets));
}

export function purgerLivretsLocaux() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(CLE_LIVRETS);
}

/**
 * La base gagne dès qu'elle a des lignes. Le navigateur n'est repris que si
 * l'organisation n'a encore rien, puis il est purgé après écriture serveur.
 */
export function fusionMigrationLivrets(
  distants: readonly LivretAccueil[],
  legacy: readonly LivretAccueil[] | null,
): { livrets: LivretAccueil[]; pousser: boolean } {
  if (distants.length > 0) return { livrets: distants.map(cloner), pousser: false };
  if (legacy && legacy.length > 0) return { livrets: legacy.map(cloner), pousser: true };
  return { livrets: [], pousser: false };
}

function cloner(livret: LivretAccueil): LivretAccueil {
  return { ...livret, pages: livret.pages.map((p) => ({ ...p })) };
}

export function normaliserLivret(brut: unknown): LivretAccueil | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as Partial<LivretAccueil>;
  if (typeof o.id !== "string" || typeof o.nom !== "string" || !Array.isArray(o.pages)) return null;
  const pages = o.pages
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const pageBrute = p as Partial<PageLivret>;
      if (typeof pageBrute.id !== "string" || typeof pageBrute.nom !== "string") return null;
      return {
        id: pageBrute.id,
        nom: pageBrute.nom,
        titre: String(pageBrute.titre ?? ""),
        sousTitre: String(pageBrute.sousTitre ?? ""),
        texte: String(pageBrute.texte ?? ""),
      };
    })
    .filter((p): p is PageLivret => p != null);
  if (pages.length === 0) return null;
  return {
    id: o.id,
    nom: o.nom,
    reference: String(o.reference ?? "LIV0000"),
    famille: o.famille === "fiche" ? "fiche" : "livret",
    logement: String(o.logement ?? ""),
    modifiePar: String(o.modifiePar ?? "Équipe Hublify"),
    modifieLe: String(o.modifieLe ?? "2026-03-10"),
    couleurFond: String(o.couleurFond ?? "#f7f6f2"),
    logo: String(o.logo ?? "Hublify"),
    pages,
    ...texteOptionnel("contact", o.contact),
    ...texteOptionnel("arrivee", o.arrivee),
    ...texteOptionnel("depart", o.depart),
    ...texteOptionnel("wifiNom", o.wifiNom),
    ...texteOptionnel("wifiCode", o.wifiCode),
    ...texteOptionnel("boiteNom", o.boiteNom),
    ...texteOptionnel("boiteCode", o.boiteCode),
    ...texteOptionnel("couvertureNom", o.couvertureNom),
  };
}

function texteOptionnel<K extends string>(cle: K, valeur: unknown): Partial<Record<K, string>> {
  return typeof valeur === "string" && valeur.length > 0 ? ({ [cle]: valeur } as Record<K, string>) : {};
}
