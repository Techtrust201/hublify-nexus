/** Rapproche un séjour impayé du loyer à relancer. */

export type LoyerRelance = {
  id: string;
  locataire: string;
  bienNom: string;
  echeance: string;
  valide: boolean;
  relanceAuto?: boolean;
  /** Séjour réglé par ce loyer (colonne `loyers.reservation_id`), quand le lien est connu. */
  reservationId?: string | null;
};

export type SejourImpaye = {
  /** Identifiant de la réservation : active l'association directe par `reservationId`. */
  id?: string;
  occupant: string;
  logement: string;
  checkIn: string;
  checkOut: string;
};

function norme(valeur: string) {
  return valeur.trim().replace(/\s+/g, " ").toLowerCase();
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function departager<T extends LoyerRelance>(candidats: readonly T[], sejour: SejourImpaye) {
  if (candidats.length <= 1) return candidats[0] ?? null;
  const dansSejour = candidats.filter(
    (l) => ISO.test(l.echeance) && l.echeance >= sejour.checkIn && l.echeance <= sejour.checkOut,
  );
  return dansSejour.length === 1 ? (dansSejour[0] ?? null) : null;
}

/**
 * 1. Lien explicite : un loyer impayé dont `reservationId` est ce séjour. S'il y en a
 *    plusieurs, on départage par l'échéance dans le séjour ; sans réponse unique, aucun
 *    loyer (on ne retombe pas sur la règle ci-dessous : le lien existe, il est juste ambigu).
 * 2. Sans lien : règle historique. Le MÊME locataire ET le MÊME logement, jamais le seul nom ;
 *    plusieurs candidats → échéance dans le séjour ; sans réponse unique, aucun loyer plutôt
 *    que le mauvais. Un loyer explicitement lié à UN AUTRE séjour n'est jamais pris ici.
 */
export function loyerDuSejour<T extends LoyerRelance>(
  loyers: readonly T[],
  sejour: SejourImpaye,
): T | null {
  if (sejour.id) {
    const lies = loyers.filter((l) => !l.valide && l.reservationId === sejour.id);
    if (lies.length > 0) return departager(lies, sejour);
  }
  const candidats = loyers.filter(
    (l) =>
      !l.valide &&
      (!l.reservationId || !sejour.id || l.reservationId === sejour.id) &&
      norme(l.locataire) === norme(sejour.occupant) &&
      norme(l.bienNom) === norme(sejour.logement),
  );
  return departager(candidats, sejour);
}
