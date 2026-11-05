/** Les autres onglets écoutent cette clé pour fermer une session révoquée. */
export const CLE_DECONNEXION = "hublify.deconnexion";

export function signalerDeconnexion() {
  try {
    localStorage.setItem(CLE_DECONNEXION, String(Date.now()));
  } catch {
    /* mode privé */
  }
}
