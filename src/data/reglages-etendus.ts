import { useEffect, useState } from "react";

/**
 * Réglages visibles sur la frame Paramètres et absents de `public.parametrage`.
 * Persistés en base (`org_reglages_etendus`).
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

const CLE_LEGACY = "hublify.reglages-etendus.v1";

function lireLegacyPuisPurger(): ReglagesEtendus | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const brut = localStorage.getItem(CLE_LEGACY);
    localStorage.removeItem(CLE_LEGACY);
    if (!brut) return null;
    return normaliserReglages(JSON.parse(brut) as unknown);
  } catch {
    try {
      localStorage.removeItem(CLE_LEGACY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function useReglagesEtendus() {
  const [reglages, setReglages] = useState<ReglagesEtendus>(REGLAGES_DEFAUT);

  useEffect(() => {
    let actif = true;
    const legacy = lireLegacyPuisPurger();
    void import("@/data/parametres-remote").then(
      ({ chargerReglagesEtendusDistants, sauverReglagesEtendusDistants }) =>
        chargerReglagesEtendusDistants().then(async (res) => {
          if (!actif) return;
          if (res.ok) {
            const distant = res.data;
            const estDefaut =
              distant.messageRelanceLoyer === REGLAGES_DEFAUT.messageRelanceLoyer &&
              distant.abonnementRef === REGLAGES_DEFAUT.abonnementRef &&
              distant.offre === REGLAGES_DEFAUT.offre;
            if (estDefaut && legacy) {
              setReglages(legacy);
              await sauverReglagesEtendusDistants({ data: legacy });
            } else {
              setReglages(distant);
            }
          } else if (legacy) {
            setReglages(legacy);
          }
        }),
    );
    return () => {
      actif = false;
    };
  }, []);

  return {
    reglages,
    sauver(suivant: ReglagesEtendus) {
      const propre = normaliserReglages(suivant);
      setReglages(propre);
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.removeItem(CLE_LEGACY);
        } catch {
          /* ignore */
        }
      }
      void import("@/data/parametres-remote").then(({ sauverReglagesEtendusDistants }) =>
        sauverReglagesEtendusDistants({ data: propre }),
      );
    },
  };
}
