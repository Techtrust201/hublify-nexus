import { parcoursInitiaux, type ParcoursAuto } from "@/data/messagerie-auto";
import { brouillonInitial, type BrouillonBail } from "@/data/proposition-bail";

export type ReglagesMessagerie = {
  parcours: ParcoursAuto[];
  situations: Record<string, string>;
  propositions: Record<string, BrouillonBail>;
};

const CLE = "hublify.messagerie.reglages.v1";

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

export function lireReglages(): ReglagesMessagerie {
  if (typeof localStorage === "undefined") return reglagesParDefaut();
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return reglagesParDefaut();
    return normaliserReglages(JSON.parse(brut) as unknown);
  } catch {
    return reglagesParDefaut();
  }
}

export function ecrireReglages(reglages: ReglagesMessagerie) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CLE, JSON.stringify(reglages));
}

export function propositionPour(
  reglages: ReglagesMessagerie,
  conversationId: string,
  entree: { locataire: string; redacteur: string; situation?: string },
) {
  return reglages.propositions[conversationId] ?? brouillonInitial(entree);
}
