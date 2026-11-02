// SOURCE: Hublify V1.0 — annotation « Voir systeme prise de caution » (section A faire)
// et page Bail « Caution et garantie ».

export type StatutCaution = "a_encaisser" | "encaissee" | "restituee";

export const STATUTS_CAUTION: StatutCaution[] = ["a_encaisser", "encaissee", "restituee"];

/** Deux mois de loyer charges comprises, usage courant d'une prise de caution. */
export function cautionSuggeree(loyer: number, charges: number) {
  const base =
    (Number.isFinite(loyer) ? Math.max(0, loyer) : 0) +
    (Number.isFinite(charges) ? Math.max(0, charges) : 0);
  return Math.round(base * 2);
}

export function libelleStatutCaution(statut: StatutCaution) {
  if (statut === "encaissee") return "Encaissée";
  if (statut === "restituee") return "Restituée";
  return "À encaisser";
}

export function peutEncaisserCaution(montant: number, statut: StatutCaution) {
  return statut === "a_encaisser" && Number.isFinite(montant) && montant > 0;
}
