/**
 * Petit magasin navigateur pour les champs qui n'ont pas encore de colonne SQL.
 * Le chargement distant remplace l'état métier : ces fiches resteraient sinon
 * sur le poste le temps d'une session, puis disparaîtraient au prochain
 * rafraîchissement. Ici elles survivent sans migration de schéma.
 */

type Ecouteur = () => void;

export type Magasin<T> = {
  lire: () => T;
  lireServeur: () => T;
  ecrire: (suivant: T) => void;
  souscrire: (fn: Ecouteur) => () => void;
};

export function creerMagasin<T>(
  cle: string,
  initial: T,
  fusionner: (brut: unknown, initial: T) => T,
): Magasin<T> {
  let valeur = initial;
  let hydrate = false;
  const ecouteurs = new Set<Ecouteur>();

  function hydrater() {
    if (hydrate) return;
    hydrate = true;
    if (typeof localStorage === "undefined") return;
    try {
      const brut = localStorage.getItem(cle);
      if (!brut) return;
      valeur = fusionner(JSON.parse(brut) as unknown, initial);
    } catch {
      valeur = initial;
    }
  }

  return {
    lire() {
      hydrater();
      return valeur;
    },
    lireServeur() {
      return initial;
    },
    ecrire(suivant) {
      hydrater();
      valeur = suivant;
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(cle, JSON.stringify(suivant));
        }
      } catch {
        // Quota dépassé (photos) : la valeur reste en mémoire pour la session.
      }
      ecouteurs.forEach((fn) => fn());
    },
    souscrire(fn) {
      hydrater();
      ecouteurs.add(fn);
      return () => ecouteurs.delete(fn);
    },
  };
}
