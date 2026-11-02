import { parcoursInitiaux, type ParcoursAuto } from "@/data/messagerie-auto";
import { brouillonInitial, type BrouillonBail } from "@/data/proposition-bail";

export type ReglagesMessagerie = {
  parcours: ParcoursAuto[];
  situations: Record<string, string>;
  propositions: Record<string, BrouillonBail>;
};

export const CLE_REGLAGES_MESSAGERIE = "hublify.messagerie.reglages.v1";

export function reglagesParDefaut(): ReglagesMessagerie {
  return { parcours: parcoursInitiaux(), situations: {}, propositions: {} };
}

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === "object" && valeur !== null;
}

export function normaliserReglages(brut: unknown): ReglagesMessagerie {
  const base = reglagesParDefaut();
  if (!estObjet(brut)) return base;
  const parcours = Array.isArray(brut["parcours"]) ? (brut["parcours"] as ParcoursAuto[]) : null;
  const situations = estObjet(brut["situations"])
    ? (brut["situations"] as Record<string, string>)
    : {};
  const propositions = estObjet(brut["propositions"])
    ? (brut["propositions"] as Record<string, BrouillonBail>)
    : {};
  return {
    parcours: parcours && parcours.length > 0 ? parcours : base.parcours,
    situations,
    propositions,
  };
}

/** Lecture one-shot du legacy local — puis purge. */
export function lireReglagesLegacyPuisPurger(): ReglagesMessagerie | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const brut = localStorage.getItem(CLE_REGLAGES_MESSAGERIE);
    localStorage.removeItem(CLE_REGLAGES_MESSAGERIE);
    if (!brut) return null;
    return normaliserReglages(JSON.parse(brut) as unknown);
  } catch {
    try {
      localStorage.removeItem(CLE_REGLAGES_MESSAGERIE);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function purgerReglagesMessagerieLocal() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(CLE_REGLAGES_MESSAGERIE);
  } catch {
    /* ignore */
  }
}

/** @deprecated Conservé pour compat tests — préférer la base. */
export function lireReglages(): ReglagesMessagerie {
  return lireReglagesLegacyPuisPurger() ?? reglagesParDefaut();
}

/** @deprecated Ne plus écrire en localStorage. */
export function ecrireReglages(_reglages: ReglagesMessagerie) {
  purgerReglagesMessagerieLocal();
}

export function propositionPour(
  reglages: ReglagesMessagerie,
  conversationId: string,
  entree: { locataire: string; redacteur: string; situation?: string },
) {
  return reglages.propositions[conversationId] ?? brouillonInitial(entree);
}
