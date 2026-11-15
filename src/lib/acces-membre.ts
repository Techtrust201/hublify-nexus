/**
 * Un membre au statut « attente » (invité, pas encore validé par un administrateur) ne se connecte pas
 * et ne lit aucune donnée. Le statut est lu côté serveur à chaque requête et à la création de session :
 * valider le membre (`approuverMembre`) rouvre l'accès sans autre action.
 */
export const MESSAGE_ACCES_EN_ATTENTE =
  "Votre accès est en attente de validation par un administrateur de votre organisation.";

export function accesBloque(statut: string | null | undefined): boolean {
  return statut === "attente";
}

type Interrogeable = {
  query: (texte: string, valeurs?: unknown[]) => Promise<ArrayLike<Record<string, unknown>>>;
};

/** Vrai si le compte a au moins un rattachement « attente ». Un compte sans rattachement n'est pas bloqué. */
export async function membreEnAttente(sql: Interrogeable, userId: string): Promise<boolean> {
  const lignes = await sql.query(`select statut from public.org_membres where user_id = $1::uuid`, [
    userId,
  ]);
  return Array.from(lignes).some((l) => accesBloque(l["statut"] as string | undefined));
}
