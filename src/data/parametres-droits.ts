import { aLeDroit, droitsEffectifs, type DroitId, type RoleId } from "@/auth/permissions";

/** Lecture / écriture du compte entreprise (RIB, SIRET, agrément). */
export function peutGererCompteEntreprise(droits: readonly string[]) {
  return aLeDroit(droits, "gerer-equipe") || aLeDroit(droits, "mod-biens");
}

/** Fiches lieu étendues et types perso. */
export function peutLireFichesLieu(droits: readonly string[]) {
  return aLeDroit(droits, "voir-biens") || aLeDroit(droits, "mod-biens");
}

export function peutEcrireFichesLieu(droits: readonly string[]) {
  return aLeDroit(droits, "mod-biens");
}

/** Relances, abonnement, automatismes paramètres. */
export function peutLireReglagesEtendus(droits: readonly string[]) {
  return aLeDroit(droits, "mod-biens") || aLeDroit(droits, "gerer-equipe");
}

export function peutEcrireReglagesEtendus(droits: readonly string[]) {
  return aLeDroit(droits, "mod-biens");
}

/**
 * Réglages messagerie auto : réservés à l'équipe gestionnaire.
 * Le droit `messagerie` seul (portail locataire / voyageur / prestataire) ne suffit pas.
 */
export function peutLireReglagesMessagerie(droits: readonly string[]) {
  return aLeDroit(droits, "mod-biens") || aLeDroit(droits, "gerer-equipe");
}

export function peutEcrireReglagesMessagerie(droits: readonly string[]) {
  return aLeDroit(droits, "mod-biens");
}

export function droitsPourRole(roleId: RoleId, personnalises?: readonly string[] | null) {
  return droitsEffectifs(roleId, personnalises);
}

export function masquerIban(iban: string): string {
  const compact = iban.replace(/\s/g, "").toUpperCase();
  if (!compact) return "";
  if (compact.length <= 8) return "••••";
  return `${compact.slice(0, 4)}••••••••${compact.slice(-4)}`;
}

export type DecisionCompte = { acces: "complet" } | { acces: "masque" } | { acces: "interdit" };

/**
 * Politique lecture compte : complet pour gestionnaire/admin org,
 * masqué (sans IBAN clair) pour les autres membres authentifiés de l'org qui
 * n'ont pas les droits — en pratique on refuse (interdit) pour éviter toute fuite.
 */
export function decisionLectureCompte(droits: readonly string[]): DecisionCompte {
  if (peutGererCompteEntreprise(droits)) return { acces: "complet" };
  return { acces: "interdit" };
}

export const DROITS_TEST: Record<string, readonly DroitId[]> = {
  "super-admin": droitsEffectifs("super-admin"),
  administrateur: droitsEffectifs("administrateur"),
  gestionnaire: droitsEffectifs("gestionnaire"),
  lecteur: droitsEffectifs("lecteur"),
  prestataire: droitsEffectifs("prestataire"),
  locataire: droitsEffectifs("locataire"),
  voyageur: droitsEffectifs("voyageur"),
  proprietaire: droitsEffectifs("proprietaire"),
};
