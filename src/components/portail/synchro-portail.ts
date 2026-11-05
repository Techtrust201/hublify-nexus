import { lireInstantaneLocal } from "@/components/portail/etat-local";
import { type EtatPortail } from "@/data/portail-etat";

export type InstantanePortail = ReturnType<typeof lireInstantaneLocal>;

export function aDuLocal(local: InstantanePortail) {
  return (
    local.mode !== null ||
    local.demarre ||
    local.notes.length > 0 ||
    local.paiements.length > 0 ||
    Boolean(local.edl.valideLe) ||
    Boolean(local.edl.emisLe) ||
    local.rdv !== null ||
    local.demandes.length > 0 ||
    local.favoris.length > 0 ||
    Boolean(local.docCourant) ||
    Object.keys(local.candidature).length > 0
  );
}

export function fusionnerPortail(distant: EtatPortail, local: InstantanePortail): EtatPortail {
  return {
    mode: distant.mode ?? local.mode,
    demarre: distant.demarre || local.demarre,
    notes: distant.notes.length > 0 ? distant.notes : local.notes,
    paiements: distant.paiements.length > 0 ? distant.paiements : local.paiements,
    edl: distant.edl.valideLe || distant.edl.emisLe ? distant.edl : local.edl,
    rdv: distant.rdv ?? local.rdv,
    demandes: distant.demandes.length > 0 ? distant.demandes : local.demandes,
    favoris: distant.favoris.length > 0 ? distant.favoris : local.favoris,
    docCourant: distant.docCourant ?? local.docCourant,
    candidature:
      Object.keys(distant.candidature).length > 0 ? distant.candidature : local.candidature,
  };
}

/** La fusion contient un champ que le serveur n'avait pas : il faut l'écrire avant d'oublier le navigateur. */
export function fusionDoitEtrePubliee(distant: EtatPortail, suivant: EtatPortail) {
  return JSON.stringify(distant) !== JSON.stringify(suivant);
}
