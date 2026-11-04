/**
 * Ventilation financière de l'espace Analyse.
 *
 * Tous les montants internes sont des centimes entiers. Les taux sont appliqués
 * une seule fois, par `Math.round`, et la TVA est le reliquat du TTC pour que
 * HT + TVA = TTC au centime près.
 *
 * Net propriétaire = ce que la plateforme a réellement reversé :
 *   `paye` si renseigné (> 0), sinon `montant − frais_plateforme`
 *   (commission OTA résolue : montant saisi, sinon taux du canal).
 * Ménage locataire, honoraires d'agence, autres services et taxe de séjour
 * restent des lignes d'information : ils ne sont pas déduits du net.
 */

export const TAUX_TVA_HONORAIRES = 0.2;

/** Commission plateforme, sur le prix de référence, quand la réservation
 *  n'enregistre pas de `fraisPlateforme`. Direct et bail : 0. */
export const TAUX_COMMISSION_OTA: Record<string, number> = {
  Airbnb: 0.15,
  "Booking.com": 0.15,
  Booking: 0.15,
  VRBO: 0.08,
  Expedia: 0.15,
  Direct: 0,
  Autre: 0.12,
  Bail: 0,
};

/** Honoraires de gestion TTC, sur le prix de référence, quand aucun montant
 *  n'est saisi sur la réservation. Le pourcentage du formulaire est un taux TTC :
 *  le montant stocké égale déjà `prix × taux` (ex. 15 % de 1 260 € = 189 €). */
export const TAUX_HONORAIRES_TTC = {
  saisonnier: 0.15,
  bail: 0.08,
} as const;

/** Barème des frais de gestion avancés, faute de tarif prestataire en base.
 *  Ces lignes, comme le ménage locataire et les honoraires d'agence, restent
 *  hors net propriétaire (affichage et facturation séparés). */
export const BAREME_FRAIS_GESTION_CENTIMES = {
  Menage: 4_500,
  Linge: 1_200,
  "Check-in": 2_000,
  "Check-out": 1_500,
  Maintenance: 8_000,
  "Etat des lieux": 8_000,
} as const;

/** Totaux figés du tableau Juliette (maquette). Conservés pour les colonnes
 *  informatives ; le net maquette (746 501) n'est plus la règle produit. */
export const TOTAUX_JULIETTE_CENTIMES = {
  prix: 1_548_907,
  ajustements: 0,
  menage: 206_028,
  autres: 104_302,
  taxe: 8_389,
  ota: 234_854,
  agence: 248_833,
} as const;

export type CanalAnalyse =
  "Airbnb" | "Booking.com" | "Direct" | "VRBO" | "Expedia" | "Autre" | "Bail";

export type VentilationCentimes = {
  prixReference: number;
  ajustements: number;
  menageLocataire: number;
  autresServices: number;
  taxeSejour: number;
  commissionOta: number;
  commissionAgenceTtc: number;
};

export type LignePrestation = {
  id: string;
  nature: string;
  periode: string;
  quantite: number;
  prixUnitaireHt: number;
  tauxTva: number;
  /** Reliquat déjà calculé (TTC − HT). Évite un second arrondi. */
  tvaForcee?: number;
};

export type TotauxFacture = {
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  tvaParTaux: Array<{ taux: number; baseHt: number; tva: number }>;
};

export type SoldeCaution = {
  du: number;
  encaisse: number;
  rembourse: number;
  retenu: number;
  solde: number;
  dateEncaissement: string | null;
  dateRemboursement: string | null;
};

export function centimes(euros: number) {
  if (!Number.isFinite(euros)) return 0;
  return Math.round(euros * 100);
}

export function eurosDepuisCentimes(centimesMontant: number) {
  return centimesMontant / 100;
}

export function appliquerTaux(baseCentimes: number, taux: number) {
  if (!Number.isFinite(baseCentimes) || !Number.isFinite(taux)) return 0;
  return Math.round(baseCentimes * taux);
}

export function decomposerTtc(ttcCentimes: number, tauxTva = TAUX_TVA_HONORAIRES) {
  const ttc = Math.round(ttcCentimes);
  if (tauxTva <= 0) return { ht: ttc, tva: 0, ttc };
  const ht = Math.round(ttc / (1 + tauxTva));
  return { ht, tva: ttc - ht, ttc };
}

export function estBail(type?: string) {
  return Boolean(type && type.toLowerCase().startsWith("bail"));
}

export function canalDe(plateforme: string, type?: string): CanalAnalyse {
  if (estBail(type)) return "Bail";
  if (plateforme === "Booking") return "Booking.com";
  if (
    plateforme === "Airbnb" ||
    plateforme === "Booking.com" ||
    plateforme === "Direct" ||
    plateforme === "VRBO" ||
    plateforme === "Expedia"
  ) {
    return plateforme;
  }
  return "Autre";
}

export function tauxOta(plateforme: string, type?: string) {
  if (estBail(type)) return 0;
  return TAUX_COMMISSION_OTA[plateforme] ?? TAUX_COMMISSION_OTA["Autre"] ?? 0;
}

export function mandatairePercçoit(plateforme: string, type?: string) {
  const canal = canalDe(plateforme, type);
  return canal !== "Direct" && canal !== "Bail";
}

/** Net reversé au propriétaire : payout réel (`paye`) ou estimation
 *  `montant − frais_plateforme`. La colonne SQL `paye` est NOT NULL DEFAULT 0 :
 *  un zéro signifie « non versé / non saisi », pas un payout nul volontaire. */
export function netProprietaire(params: {
  payeCentimes?: number | undefined;
  montantCentimes: number;
  fraisPlateformeCentimes: number;
}) {
  const paye = params.payeCentimes;
  if (paye !== undefined && paye > 0) return Math.round(paye);
  return Math.round(params.montantCentimes) - Math.round(params.fraisPlateformeCentimes);
}

export function commissionOtaCentimes(params: {
  prixCentimes: number;
  plateforme: string;
  type?: string | undefined;
  fraisPlateformeEuros?: number | undefined;
}) {
  if (params.fraisPlateformeEuros !== undefined)
    return Math.max(0, centimes(params.fraisPlateformeEuros));
  return Math.max(0, appliquerTaux(params.prixCentimes, tauxOta(params.plateforme, params.type)));
}

export function honorairesAgence(params: {
  prixCentimes: number;
  type?: string | undefined;
  commissionMontantEuros?: number | undefined;
  commissionPourcent?: number | undefined;
}) {
  const tauxDefaut = estBail(params.type)
    ? TAUX_HONORAIRES_TTC.bail
    : TAUX_HONORAIRES_TTC.saisonnier;
  let ttc = 0;
  let tauxTtc: number = tauxDefaut;
  if (params.commissionMontantEuros !== undefined) {
    ttc = Math.max(0, centimes(params.commissionMontantEuros));
    tauxTtc = params.prixCentimes > 0 ? ttc / params.prixCentimes : 0;
  } else if (params.commissionPourcent !== undefined) {
    tauxTtc = Math.max(0, params.commissionPourcent) / 100;
    ttc = appliquerTaux(params.prixCentimes, tauxTtc);
  } else {
    ttc = appliquerTaux(params.prixCentimes, tauxDefaut);
  }
  const detail = decomposerTtc(ttc);
  return { ...detail, tauxTtc, base: params.prixCentimes };
}

export function ventilationSejour(params: {
  montantEuros: number;
  reductionEuros?: number | undefined;
  fraisMenageEuros?: number | undefined;
  taxeSejourEuros?: number | undefined;
  autresServicesEuros?: number | undefined;
  plateforme: string;
  type?: string | undefined;
  fraisPlateformeEuros?: number | undefined;
  commissionMontantEuros?: number | undefined;
  commissionPourcent?: number | undefined;
}): VentilationCentimes & {
  honorairesHt: number;
  honorairesTva: number;
  tauxHonorairesTtc: number;
} {
  const prixReference = Math.max(0, centimes(params.montantEuros));
  const ajustements = Math.max(0, centimes(params.reductionEuros ?? 0));
  const honoraires = honorairesAgence({
    prixCentimes: prixReference,
    type: params.type,
    commissionMontantEuros: params.commissionMontantEuros,
    commissionPourcent: params.commissionPourcent,
  });
  const ventilation: VentilationCentimes = {
    prixReference,
    ajustements,
    menageLocataire: Math.max(0, centimes(params.fraisMenageEuros ?? 0)),
    autresServices: Math.max(0, centimes(params.autresServicesEuros ?? 0)),
    taxeSejour: Math.max(0, centimes(params.taxeSejourEuros ?? 0)),
    commissionOta: commissionOtaCentimes({
      prixCentimes: prixReference,
      plateforme: params.plateforme,
      type: params.type,
      fraisPlateformeEuros: params.fraisPlateformeEuros,
    }),
    commissionAgenceTtc: honoraires.ttc,
  };
  return {
    ...ventilation,
    honorairesHt: honoraires.ht,
    honorairesTva: honoraires.tva,
    tauxHonorairesTtc: honoraires.tauxTtc,
  };
}

export function montantsLigne(ligne: LignePrestation) {
  const ht = Math.round(ligne.quantite * ligne.prixUnitaireHt);
  const tva =
    ligne.tvaForcee !== undefined
      ? ligne.tvaForcee
      : ligne.tauxTva <= 0
        ? 0
        : Math.round(ht * ligne.tauxTva);
  return { ht, tva, ttc: ht + tva };
}

export function totauxFacture(lignes: LignePrestation[]): TotauxFacture {
  const parTaux = new Map<number, { baseHt: number; tva: number }>();
  let totalHt = 0;
  let totalTva = 0;
  for (const ligne of lignes) {
    const m = montantsLigne(ligne);
    totalHt += m.ht;
    totalTva += m.tva;
    const cle = Math.round(ligne.tauxTva * 1000) / 1000;
    const deja = parTaux.get(cle) ?? { baseHt: 0, tva: 0 };
    deja.baseHt += m.ht;
    deja.tva += m.tva;
    parTaux.set(cle, deja);
  }
  return {
    totalHt,
    totalTva,
    totalTtc: totalHt + totalTva,
    tvaParTaux: [...parTaux.entries()]
      .map(([taux, v]) => ({ taux, baseHt: v.baseHt, tva: v.tva }))
      .sort((a, b) => a.taux - b.taux),
  };
}

/** Somme des nets reversés au propriétaire quand le mandataire a encaissé les loyers. */
export function montantReverse(netsCentimes: number[]) {
  return netsCentimes.reduce((s, n) => s + n, 0);
}

/** Ce que le propriétaire doit quand il a encaissé lui-même : honoraires + frais avancés. */
export function montantDu(honorairesTtc: number, fraisAnnexesTtc: number) {
  return honorairesTtc + fraisAnnexesTtc;
}

export function solderCaution(params: {
  cautionEuros: number;
  statut: string;
  arrivee: string;
  depart: string;
  aujourdhui: string;
  retenuEuros?: number;
}): SoldeCaution {
  const du = Math.max(0, centimes(params.cautionEuros));
  if (params.statut === "Annulé" || du === 0) {
    return {
      du,
      encaisse: 0,
      rembourse: 0,
      retenu: 0,
      solde: 0,
      dateEncaissement: null,
      dateRemboursement: null,
    };
  }
  const encaisse = params.arrivee <= params.aujourdhui ? du : 0;
  const retenuDemande = Math.max(0, centimes(params.retenuEuros ?? 0));
  const retenu = Math.min(encaisse, retenuDemande);
  const sortieFaite = encaisse > 0 && params.depart <= params.aujourdhui;
  const rembourse = sortieFaite ? encaisse - retenu : 0;
  return {
    du,
    encaisse,
    rembourse,
    retenu,
    solde: encaisse - rembourse - retenu,
    dateEncaissement: encaisse > 0 ? params.arrivee : null,
    dateRemboursement: rembourse > 0 ? params.depart : null,
  };
}

/** Parts entières qui somment exactement à 100. La maquette affichait
 *  45 + 30 + 15 + 10 + 10 = 110. */
export function partsPourcent(valeurs: number[]) {
  const total = valeurs.reduce((s, v) => s + Math.max(0, v), 0);
  if (total <= 0) return valeurs.map(() => 0);
  const exact = valeurs.map((v) => (Math.max(0, v) / total) * 100);
  const plancher = exact.map((v) => Math.floor(v));
  let reste = 100 - plancher.reduce((s, v) => s + v, 0);
  const ordre = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  const out = [...plancher];
  for (const item of ordre) {
    if (reste <= 0) break;
    out[item.i] = (out[item.i] ?? 0) + 1;
    reste -= 1;
  }
  return out;
}

export function formatCentimes(valeur: number, decimales: "auto" | 0 | 2 = "auto") {
  const entier = valeur % 100 === 0;
  const digits = decimales === "auto" ? (entier ? 0 : 2) : decimales;
  const texte = (valeur / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${texte} €`;
}

export function formatTaux(taux: number) {
  return `${(taux * 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })} %`;
}
