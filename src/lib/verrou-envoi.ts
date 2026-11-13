/**
 * Anti double envoi : tant qu'une opération est en cours, un nouvel appel est ignoré
 * (il renvoie `undefined`). Le verrou est libéré à la fin, succès, refus ou exception.
 */
export function creerVerrouEnvoi() {
  let occupe = false;
  return {
    enCours: () => occupe,
    async executer<T>(operation: () => Promise<T>): Promise<T | undefined> {
      if (occupe) return undefined;
      occupe = true;
      try {
        return await operation();
      } finally {
        occupe = false;
      }
    },
  };
}
