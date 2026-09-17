/** Types ajoutés pour Hublify V1 (baux, portail, dossiers, syndic). */

export type PrecheckinStatut = "non_fait" | "fait";

export type RemboursementReservation = {
  id: string;
  date: string;
  motif: string;
  montant: number;
  note: string;
};

export type RapportIntervention = {
  id: string;
  missionId: string;
  texte: string;
  photos: string[];
  auteur: string;
  date: string;
};

export type ContactCopro = {
  id: string;
  nom: string;
  copropriete: string;
  email: string;
  telephone: string;
  relance: string;
};

export type PieceDossier = {
  id: string;
  titre: string;
  type: string;
  present: boolean;
  filigrane?: boolean;
  aide?: string;
  photoNom?: string;
  numero2dDoc?: string;
};

export type GarantDossier = {
  id: string;
  type: "personne" | "institutionnel";
  nom: string;
  email: string;
  telephone: string;
  organisme?: string;
  numeroDossier?: string;
};

export type DossierLocation = {
  id: string;
  occupantId: string;
  occupantNom: string;
  email: string;
  statut: "brouillon" | "complet" | "partage" | "archive";
  pieces: PieceDossier[];
  garants: GarantDossier[];
  dureeAccesMois: number;
  archiveLe?: string;
  departDeclare?: string;
  departValide?: boolean;
  revenus?: number;
  rfr?: number;
  situationProfessionnelle?: string;
  situationFamiliale?: string;
  aPropos?: string;
};

export type PartageDossier = {
  id: string;
  dossierId: string;
  destinataire: string;
  autorise: boolean | null;
  demandeLe: string;
  expireLe?: string;
  lienExterne?: string;
  notePersonnelle?: string;
  telephone?: string;
};

export type CandidatureLocation = {
  id: string;
  dossierId: string;
  bienId: string;
  arrivee: string;
  depart: string;
  montant: number;
  statut: "brouillon" | "proposee" | "acceptee" | "refusee";
  commissionIncluse?: number;
};

export const PIECES_DOSSIER_DEFAUT: PieceDossier[] = [
  {
    id: "piece-id",
    titre: "Pièce d'identité",
    type: "identité",
    present: false,
    aide: "Carte d'identité, passeport ou titre de séjour en cours de validité.",
  },
  {
    id: "piece-hebergement",
    titre: "Justificatif de situation d'hébergement",
    type: "domicile",
    present: false,
    aide: "Quittance, attestation d'hébergement ou titre de propriété.",
  },
  {
    id: "piece-pro",
    titre: "Justificatif de situation professionnelle",
    type: "activité",
    present: false,
    aide: "CDI, étudiant, indépendant… Contrat, certificat de scolarité ou extrait RCS.",
  },
  {
    id: "piece-avis",
    titre: "Avis d'imposition",
    type: "fiscal",
    present: false,
    aide: "Dernier avis d'imposition. Recopiez le code 2D-DOC imprimé en bas du document.",
  },
  {
    id: "piece-revenus",
    titre: "Justificatif de ressources",
    type: "revenus",
    present: false,
    aide: "3 derniers bulletins, indemnités, bilan ou revenus fonciers.",
  },
];

export const DUREE_ARCHIVE_MAX_MS = 1000 * 60 * 60 * 24 * 365 * 2;

export function dossierArchiveSeuleLigne(dossier?: DossierLocation) {
  if (!dossier?.archiveLe) return false;
  return Date.now() - new Date(dossier.archiveLe).getTime() > DUREE_ARCHIVE_MAX_MS;
}

export function joursDansMois(annee: number, mois0: number) {
  return new Date(annee, mois0 + 1, 0).getDate();
}

/** Prorata calendaire des mois incomplets + commissions. */
export function totalCandidature(params: {
  debut: string;
  fin: string;
  loyerMensuel: number;
  commission?: number;
}) {
  if (!params.debut || !params.fin || params.fin <= params.debut) {
    return { prorata: 0, commissions: params.commission ?? 0, total: params.commission ?? 0 };
  }
  const debut = new Date(`${params.debut}T12:00:00`);
  const fin = new Date(`${params.fin}T12:00:00`);
  let acc = 0;
  const curseur = new Date(debut);
  curseur.setDate(1);
  while (curseur <= fin) {
    const y = curseur.getFullYear();
    const m = curseur.getMonth();
    const dim = joursDansMois(y, m);
    const debutMois = new Date(y, m, 1);
    const finMois = new Date(y, m, dim);
    const from = debut > debutMois ? debut : debutMois;
    const to = fin < finMois ? fin : finMois;
    const jours = Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
    acc += (params.loyerMensuel / dim) * jours;
    curseur.setMonth(curseur.getMonth() + 1);
  }
  const prorata = Math.round(acc);
  const commissions = Math.round(params.commission ?? 0);
  return { prorata, commissions, total: prorata + commissions };
}

export function emojiMission(
  type: "Menage" | "Check-in" | "Check-out" | "Inventaire" | "Maintenance",
) {
  switch (type) {
    case "Menage":
      return "🧹";
    case "Check-in":
      return "🔑";
    case "Check-out":
      return "🚪";
    case "Inventaire":
      return "📋";
    case "Maintenance":
      return "🔧";
  }
}

export function joursPlage(debut: string, fin: string) {
  if (!debut) return [];
  const jusqua = !fin || fin < debut ? debut : fin;
  const jours: string[] = [];
  let cur = debut;
  while (cur <= jusqua) {
    jours.push(cur);
    const d = new Date(`${cur}T12:00:00`);
    d.setDate(d.getDate() + 1);
    cur = d.toISOString().slice(0, 10);
  }
  return jours;
}

export function jourIso(valeur: string | Date | undefined | null) {
  if (!valeur) return "";
  if (valeur instanceof Date) return valeur.toISOString().slice(0, 10);
  return String(valeur).slice(0, 10);
}

export function idDossierPourCalendrier(
  sejour: { id: string; voyageur: string; bienId: string; arrivee: string | Date },
  dossiers: Array<{
    id: string;
    occupant: string;
    bienId: string;
    arrivee: string | Date;
  }>,
) {
  const arrivee = jourIso(sejour.arrivee);
  const direct = dossiers.find((d) => d.id === sejour.id || sejour.id === `cal-${d.id}`);
  if (direct) return direct.id;
  const memePersonne = dossiers.filter(
    (d) => d.bienId === sejour.bienId && d.occupant === sejour.voyageur,
  );
  return (
    memePersonne.find((d) => jourIso(d.arrivee) === arrivee)?.id ?? memePersonne[0]?.id
  );
}

export function netPercu(params: {
  montant: number;
  taxeSejour?: number | undefined;
  commissionMontant?: number | undefined;
}) {
  return Math.max(0, params.montant + (params.taxeSejour ?? 0) - (params.commissionMontant ?? 0));
}

/** Airbnb / Booking = paiement plateforme → quittance automatique (126:1291). */
export function paiementViaPlateforme(plateforme?: string) {
  return plateforme === "Airbnb" || plateforme === "Booking.com";
}

export function poserPeriodesOuverture<
  T extends { id: string; bienId: string; date: string; motif?: string },
>(existantes: T[], bienId: string, debut: string, fin: string): T[] {
  const jours = joursPlage(debut, fin);
  const cles = new Set(jours.map((j) => `${bienId}|${j}`));
  const reste = existantes.filter((d) => !cles.has(`${d.bienId}|${d.date}`));
  const ajoutees = jours.map((date) => ({
    id: `ouv-${bienId}-${date}`,
    bienId,
    date,
    motif: "Ouverture BAIL",
  })) as T[];
  return [...reste, ...ajoutees];
}

export function detailMontantsReservation(params: {
  montant: number;
  paye: number;
  taxeSejour?: number | undefined;
  commissionMontant?: number | undefined;
  caution?: number | undefined;
  fraisMenage?: number | undefined;
  reductionPourcent?: number | undefined;
  reductionMontant?: number | undefined;
  fraisPlateforme?: number | undefined;
  montantVoyageur?: number | undefined;
  upsellsMontant?: number | undefined;
}) {
  const reduction =
    params.reductionMontant ??
    Math.round((params.montant * (params.reductionPourcent ?? 0)) / 100);
  const menage = params.fraisMenage ?? 0;
  const taxe = params.taxeSejour ?? 0;
  const comm = params.commissionMontant ?? 0;
  const frais = params.fraisPlateforme ?? 0;
  const upsells = params.upsellsMontant ?? 0;
  const voyageur =
    params.montantVoyageur ??
    Math.max(0, params.montant + taxe + menage + upsells + frais - reduction);
  const net = netPercu({
    montant: params.montant,
    taxeSejour: taxe,
    commissionMontant: comm + frais,
  });
  return {
    loyer: params.montant,
    caution: params.caution ?? 0,
    menage,
    taxe,
    reduction,
    frais,
    comm,
    upsells,
    voyageur,
    paye: params.paye,
    net,
  };
}
