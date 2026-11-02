import { creerMagasin } from "@/data/magasin-local";
import { useSyncExternalStore } from "react";

/**
 * Réglages visibles sur la frame Paramètres et absents de `public.parametrage`.
 * Les interrupteurs déjà en base restent dans ParametrageSession.
 */

export type OffreAbonnement = "essentiel" | "confort" | "agence";

export type ReglagesEtendus = {
  relanceLoyer: boolean;
  messageRelanceLoyer: string;
  relanceFacture: boolean;
  messageRelanceFacture: string;
  autoMenage: boolean;
  autoEdlBail: boolean;
  messagesAuto: boolean;
  abonnementRef: string;
  abonnementActif: boolean;
  offre: OffreAbonnement;
};

export const REGLAGES_DEFAUT: ReglagesEtendus = {
  relanceLoyer: true,
  messageRelanceLoyer:
    "Votre appel de loyer reste ouvert. Merci de le régulariser. Passé ce délai, une relance partira.",
  relanceFacture: true,
  messageRelanceFacture:
    "Une facture reste impayée. Le rappel part par e-mail, sans changer le statut du paiement.",
  autoMenage: true,
  autoEdlBail: true,
  messagesAuto: true,
  abonnementRef: "HUB-000000",
  abonnementActif: true,
  offre: "confort",
};

export const OFFRES: readonly { id: OffreAbonnement; label: string; detail: string }[] = [
  { id: "essentiel", label: "Essentiel", detail: "Un gestionnaire, le parc et la messagerie." },
  { id: "confort", label: "Confort", detail: "Équipe, portail voyageur et relances." },
  { id: "agence", label: "Agence", detail: "Carte T, mandats et plusieurs gestionnaires." },
];

export function normaliserReglages(brut: unknown): ReglagesEtendus {
  if (!brut || typeof brut !== "object") return { ...REGLAGES_DEFAUT };
  const o = brut as Partial<ReglagesEtendus>;
  const offre = o.offre === "essentiel" || o.offre === "agence" ? o.offre : "confort";
  return {
    ...REGLAGES_DEFAUT,
    ...o,
    offre:
      o.offre === "essentiel" || o.offre === "confort" || o.offre === "agence" ? o.offre : offre,
    relanceLoyer: o.relanceLoyer ?? REGLAGES_DEFAUT.relanceLoyer,
    relanceFacture: o.relanceFacture ?? REGLAGES_DEFAUT.relanceFacture,
    autoMenage: o.autoMenage ?? REGLAGES_DEFAUT.autoMenage,
    autoEdlBail: o.autoEdlBail ?? REGLAGES_DEFAUT.autoEdlBail,
    messagesAuto: o.messagesAuto ?? REGLAGES_DEFAUT.messagesAuto,
    abonnementActif: o.abonnementActif ?? REGLAGES_DEFAUT.abonnementActif,
  };
}

export function planPrestationsAuto(
  reglages: Pick<ReglagesEtendus, "autoMenage" | "autoEdlBail">,
  sejour: { debut: string; fin: string; bail: boolean },
): string[] {
  const lignes: string[] = [];
  if (reglages.autoMenage) {
    lignes.push(`Prestation de ménage le ${sejour.fin}, jour de fin de réservation.`);
  }
  if (reglages.autoEdlBail && sejour.bail) {
    lignes.push(`État des lieux d'entrée le ${sejour.debut}.`);
    lignes.push(`État des lieux de sortie le ${sejour.fin}.`);
  }
  return lignes;
}

const magasin = creerMagasin("hublify.reglages-etendus.v1", REGLAGES_DEFAUT, normaliserReglages);

export function useReglagesEtendus() {
  const reglages = useSyncExternalStore(magasin.souscrire, magasin.lire, magasin.lireServeur);
  return {
    reglages,
    sauver(suivant: ReglagesEtendus) {
      magasin.ecrire(normaliserReglages(suivant));
    },
  };
}
