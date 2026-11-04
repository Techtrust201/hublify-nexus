/**
 * Titres fabriqués par `e2e/securite.spec.ts` (`Marqueur-…`, `Hors-ligne-…`).
 * Le motif est assez étroit pour ne jamais recouper un événement saisi
 * à la main ou semé (Festival, Marathon, Salon…).
 */
export const MOTIF_EVENEMENT_TEST = "^(Marqueur|Hors-ligne)-[a-z0-9]+$";

export function estEvenementDeTest(titre: string) {
  return new RegExp(MOTIF_EVENEMENT_TEST).test(titre.trim());
}
