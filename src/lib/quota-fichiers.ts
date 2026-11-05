/** Délai après lequel un fichier déposé mais jamais rattaché ne compte plus. */
export const GRACE_ORPHELIN_MS = 15 * 60 * 1000;

export type FichierQuota = {
  id: string;
  rattache: boolean;
  ageMs: number;
};

/**
 * Les photos enregistrées sur la fiche ou le rapport comptent toujours.
 * Un dépôt abandonné (non rattaché) est retiré au-delà de la grâce, et le plus
 * ancien est libéré tout de suite s'il empêche un nouveau dépôt légitime.
 */
export function preparerQuota(
  fichiers: readonly FichierQuota[],
  plafond: number,
  graceMs = GRACE_ORPHELIN_MS,
) {
  const perimes = fichiers.filter((fichier) => !fichier.rattache && fichier.ageMs >= graceMs);
  const vivants = fichiers.filter((fichier) => !perimes.includes(fichier));
  const orphelins = vivants
    .filter((fichier) => !fichier.rattache)
    .sort((a, b) => b.ageMs - a.ageMs);
  const rattaches = vivants.filter((fichier) => fichier.rattache).length;
  const supprimer = perimes.map((fichier) => fichier.id);
  let occupe = rattaches + orphelins.length;
  for (const orphelin of orphelins) {
    if (occupe < plafond) break;
    supprimer.push(orphelin.id);
    occupe -= 1;
  }
  return { supprimer, accepter: occupe < plafond };
}
