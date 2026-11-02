/**
 * Chemins accessibles sans session.
 * Les pages d'authentification ne chargent pas la session dans la racine
 * (chaque page la vérifie elle-même). Les pages marketing la chargent si elle
 * existe, pour afficher l'application aux personnes déjà connectées.
 */

export const CHEMINS_AUTH = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
] as const;

export const CHEMINS_MARKETING = [
  "/",
  "/faq",
  "/parrainage",
  "/cgu",
  "/cgv",
  "/confidentialite",
  "/choix-du-profil",
] as const;

export function estCheminAuth(pathname: string): boolean {
  return (CHEMINS_AUTH as readonly string[]).includes(pathname);
}

export function estCheminMarketing(pathname: string): boolean {
  return (CHEMINS_MARKETING as readonly string[]).includes(pathname);
}
