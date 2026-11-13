/** Rapproche un séjour impayé du loyer à relancer. */

export type LoyerRelance = {
  id: string;
  locataire: string;
  bienNom: string;
  echeance: string;
  valide: boolean;
  relanceAuto?: boolean;
};

export type SejourImpaye = {
  occupant: string;
  logement: string;
  checkIn: string;
  checkOut: string;
};

function norme(valeur: string) {
  return valeur.trim().replace(/\s+/g, " ").toLowerCase();
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Le schéma `loyers` n'a pas de clé vers le séjour ou le bail (seulement locataire, logement
 * et échéance). On exige donc le MÊME locataire ET le MÊME logement, jamais le seul nom.
 * Si plusieurs loyers impayés restent possibles, on départage par l'échéance dans le séjour ;
 * sans réponse unique, on ne relance aucun loyer plutôt que le mauvais.
 */
export function loyerDuSejour<T extends LoyerRelance>(
  loyers: readonly T[],
  sejour: SejourImpaye,
): T | null {
  const candidats = loyers.filter(
    (l) =>
      !l.valide &&
      norme(l.locataire) === norme(sejour.occupant) &&
      norme(l.bienNom) === norme(sejour.logement),
  );
  if (candidats.length <= 1) return candidats[0] ?? null;
  const dansSejour = candidats.filter(
    (l) => ISO.test(l.echeance) && l.echeance >= sejour.checkIn && l.echeance <= sejour.checkOut,
  );
  return dansSejour.length === 1 ? (dansSejour[0] ?? null) : null;
}
