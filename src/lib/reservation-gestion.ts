/**
 * « Gestion » d'une réservation : Ménage, Linge, Consommables, Oui / Non (règle R4,
 * validée par Hugo le 18/11). Colonnes `menage_gere`, `linge_gere`, `consommable_gere`
 * de la migration 024.
 *
 * Non renseigné (NULL) = calcul actuel : le linge suit chaque ménage. Aucun « Non » par
 * défaut, qui ferait baisser les factures propriétaire.
 */

export const CHAMPS_GESTION = [
  { cle: "menageGere", colonne: "menage_gere", libelle: "Ménage" },
  { cle: "lingeGere", colonne: "linge_gere", libelle: "Linge" },
  { cle: "consommableGere", colonne: "consommable_gere", libelle: "Consommables" },
] as const;

export type CleGestion = (typeof CHAMPS_GESTION)[number]["cle"];
export type GestionSaisie = Partial<Record<CleGestion, boolean | null>>;
export type ChoixGestion = "" | "oui" | "non";

export function versChoix(valeur: unknown): ChoixGestion {
  if (valeur === true) return "oui";
  if (valeur === false) return "non";
  return "";
}

export function depuisChoix(choix: ChoixGestion): boolean | null {
  if (choix === "oui") return true;
  if (choix === "non") return false;
  return null;
}

/**
 * Valeurs de gestion présentes dans une ligne ou un patch reçus du client. Seuls
 * `true`, `false` et `null` sont retenus ; une clé absente n'est pas touchée.
 */
export function gestionDepuisEntree(entree: Record<string, unknown>): GestionSaisie {
  const sortie: GestionSaisie = {};
  for (const { cle } of CHAMPS_GESTION) {
    const v = entree[cle];
    if (v === true || v === false || v === null) sortie[cle] = v;
  }
  return sortie;
}
