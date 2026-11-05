/** Contrôles de saisie partagés par les formulaires du gestionnaire. */

export function emailValide(valeur: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur.trim());
}

/** Au moins 8 chiffres, pour accepter un numéro français ou international. */
export function telephoneValide(valeur: string) {
  const chiffres = valeur.replace(/\D/g, "");
  return chiffres.length >= 8 && chiffres.length <= 15;
}
