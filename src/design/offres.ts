/**
 * Offres Hublify V1.0.
 *
 * Landing — frame Pricing 163:9264.
 * Onboarding — frame Choix du profil 184:1626.
 *
 * Les deux frames ne disent pas la même chose pour Standard
 * (3 annonces sur la landing, 5 dans le choix de profil) ni pour le
 * professionnel (99,90 € et 10 annonces sur la landing, « sur devis » dans
 * le choix). Chaque écran reprend le texte de son frame.
 *
 * Le commutateur Annuel porte « –20 % ». Les pastilles « XXX.XX €/annuel »
 * du choix de profil sont des placeholders : le montant annuel est calculé
 * avec cette remise, pas inventé.
 */

export type IdOffre = "freemium" | "solo" | "standard" | "professionnel";
export type PeriodeOffre = "mensuel" | "annuel";

export type Offre = {
  id: IdOffre;
  titreLanding: string;
  titreChoix: string;
  /** Centimes TTC mensuels. Null = pas de prix affiché (essai ou devis). */
  prixMoisCentimes: number | null;
  annoncesLanding: string;
  detailChoix: string;
  pointsLanding: readonly string[];
  devis: boolean;
};

export const REMISE_ANNUELLE = 0.2;

export const OFFRES: readonly Offre[] = [
  {
    id: "freemium",
    titreLanding: "Freemium",
    titreChoix: "Freemium",
    prixMoisCentimes: null,
    annoncesLanding: "Découverte de la plateforme en version limitée, pour une durée d'essai.",
    detailChoix: "Pour découvrir Hublify gratuitement pendant la période d'essai.",
    pointsLanding: [],
    devis: false,
  },
  {
    id: "solo",
    titreLanding: "Solo",
    titreChoix: "Offre Solo",
    prixMoisCentimes: 1490,
    annoncesLanding: "1 annonce incluse",
    detailChoix: "Les outils indispensables pour démarrer, 1 annonce.",
    pointsLanding: ["1 annonce incluse", "Accès complet", "Auto-onboarding"],
    devis: false,
  },
  {
    id: "standard",
    titreLanding: "Standard",
    titreChoix: "Offre Standard",
    prixMoisCentimes: 2990,
    annoncesLanding: "3 annonces incluses",
    detailChoix: "La formule complète pour développer votre activité, 5 annonces.",
    pointsLanding: ["3 annonces incluses", "Accès complet", "Onboarding personnalisé"],
    devis: false,
  },
  {
    id: "professionnel",
    titreLanding: "Professionnel et conciergerie",
    titreChoix: "Professionnel sur devis",
    prixMoisCentimes: 9990,
    annoncesLanding: "10 annonces incluses",
    detailChoix: "Une solution personnalisée pour votre organisation.",
    pointsLanding: [
      "10 annonces incluses",
      "Accès complet",
      "Onboarding personnalisé",
      "Price Labs, tarification dynamique",
      "Outil de création de visuels et d'affiches",
      "Inventaire consommable",
      "Outil de création de contrat de gestion",
      "Intégration de votre site sur la place de marché Hublify",
    ],
    devis: false,
  },
];

export const AU_DELA: Offre = {
  id: "professionnel",
  titreLanding: "Au-delà de 10 annonces",
  titreChoix: "Professionnel sur devis",
  prixMoisCentimes: null,
  annoncesLanding: "Sur devis",
  detailChoix: "Une solution personnalisée pour votre organisation.",
  pointsLanding: [
    "Accès complet",
    "Onboarding personnalisé",
    "Price Labs, tarification dynamique",
    "Outil de création de visuels et d'affiches",
    "Inventaire consommable",
    "Outil de création de contrat de gestion",
    "Intégration de votre site sur la place de marché Hublify",
  ],
  devis: true,
};

export const INCLUS_TOUTES_OFFRES = [
  "CRM et channel manager unifiés",
  "Messagerie interne et OTA unifiée",
  "Calendrier ménage et prestations",
  "Assignation des prestataires",
  "Étude des documents des candidats",
  "Consultation des documents locataire",
  "Suivi des loyers et paiements",
  "Quittances automatiques illimitées",
  "Relances personnalisables",
  "Documents et signatures centralisés",
  "Assistance téléphonique",
] as const;

export const QUESTIONS_FAQ: readonly { question: string; reponse?: string }[] = [
  {
    question: "Puis-je importer mes biens et locataires existants ?",
    reponse:
      "Oui. Un import guidé depuis Excel ou votre ancien logiciel reprend biens, baux, locataires et historiques. Notre équipe peut aussi s'en charger avec vous.",
  },
  { question: "Hublify remplace-t-il mon expert-comptable ?" },
  { question: "Les quittances et les documents sont-ils conformes à la réglementation ?" },
  { question: "Comment mes données sont-elles protégées ?" },
  { question: "Puis-je gérer plusieurs propriétaires ou SCI ?" },
  { question: "Que se passe-t-il si je résilie ?" },
];

const IDS: readonly IdOffre[] = ["freemium", "solo", "standard", "professionnel"];

export type RechercheInscription = {
  offre?: IdOffre;
  periode?: PeriodeOffre;
  devis?: "1";
  parrainage?: "1";
};

export function lireRechercheInscription(search: Record<string, unknown>): RechercheInscription {
  const periodeBrute = search["periode"];
  const offreBrute = search["offre"];
  const periode =
    periodeBrute === "annuel" || periodeBrute === "mensuel" ? periodeBrute : undefined;
  return {
    ...(estIdOffre(offreBrute) ? { offre: offreBrute } : {}),
    ...(periode ? { periode } : {}),
    ...(search["devis"] === "1" ? { devis: "1" as const } : {}),
    ...(search["parrainage"] === "1" ? { parrainage: "1" as const } : {}),
  };
}

export function estIdOffre(valeur: unknown): valeur is IdOffre {
  return typeof valeur === "string" && (IDS as readonly string[]).includes(valeur);
}

export function offreParId(id: IdOffre): Offre {
  const offre = OFFRES.find((o) => o.id === id);
  if (!offre) throw new Error(`Offre inconnue : ${id}`);
  return offre;
}

/** Prix mensuel après remise annuelle, en centimes. Null si l'offre n'a pas de prix. */
export function prixMoisRemise(centimes: number | null, periode: PeriodeOffre): number | null {
  if (centimes == null) return null;
  if (periode === "mensuel") return centimes;
  return Math.round(centimes * (1 - REMISE_ANNUELLE));
}

/** Total annuel facturé, en centimes. */
export function prixAnnuelCentimes(centimesMois: number): number {
  return Math.round(centimesMois * 12 * (1 - REMISE_ANNUELLE));
}

export function formaterEuros(centimes: number): string {
  const negatif = centimes < 0;
  const abs = Math.abs(centimes);
  const euros = Math.floor(abs / 100);
  const cts = String(abs % 100).padStart(2, "0");
  return `${negatif ? "-" : ""}${euros},${cts} €`;
}

/**
 * Freemium : pas de carte (mention « Sans carte bancaire » du hero).
 * Les offres payantes attendent Stripe — le commentaire maquette « si connection stripes »
 * et l'écran Paiement ne montrent qu'une capture et une question ouverte.
 */
export function demandeCarte(_id: IdOffre): boolean {
  return false;
}

export function lienParrainage(origine: string): string {
  const url = new URL("/inscription", origine);
  url.searchParams.set("parrainage", "1");
  return url.toString();
}
