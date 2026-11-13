/**
 * Jour calendaire LOCAL (fuseau de l'appareil, comme `AUJOURD_HUI_MO1`) au format AAAA-MM-JJ.
 * `toISOString()` donne le jour UTC : en France, entre minuit et 1-2 h, il renvoie la veille.
 */
export function jourLocalIso(ref: Date = new Date()): string {
  const annee = ref.getFullYear();
  const mois = String(ref.getMonth() + 1).padStart(2, "0");
  const jour = String(ref.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}
