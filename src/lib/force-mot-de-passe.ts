/** Indicateurs du frame « Créer un compte ». Le minimum réel du produit reste 10 caractères. */
export function forceMotDePasse(motDePasse: string) {
  const longueur = motDePasse.length >= 10;
  const chiffre = /\d/.test(motDePasse);
  const special = /[^A-Za-z0-9]/.test(motDePasse);
  const score = Number(longueur) + Number(chiffre) + Number(special);
  const libelle = score === 3 ? "Bon" : score === 2 ? "Moyen" : "Faible";
  return { longueur, chiffre, special, libelle };
}
