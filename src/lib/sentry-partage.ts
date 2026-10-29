// Réglages partagés client/serveur. Aucun DSN ici : les secrets restent dans l'environnement.

export const TAUX_TRACES_SENTRY = 0.1;

/**
 * Le SDK v11 collecte cookies, corps HTTP et lignes SQL par défaut.
 * Hublify manipule des comptes, des baux et des coordonnées : on n'envoie
 * que le strict nécessaire pour diagnostiquer une exception.
 */
export const collecteSentry = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [] as Array<
    "incomingRequest" | "outgoingRequest" | "incomingResponse" | "outgoingResponse"
  >,
  urlQueryParams: false,
  databaseQueryData: false,
  stackFrameVariables: false,
};

function statutHttp(error: unknown): number | undefined {
  if (error == null || typeof error !== "object") return undefined;
  const candidat = error as { statusCode?: unknown; status?: unknown };
  const valeur = candidat.statusCode ?? candidat.status;
  return typeof valeur === "number" ? valeur : undefined;
}

/** Les 4xx (redirections d'auth, 404) ne sont pas des pannes à remonter. */
export function filtrerEvenementSentry<Evenement>(
  evenement: Evenement,
  indice: { originalException?: unknown },
): Evenement | null {
  const statut = statutHttp(indice.originalException);
  if (statut != null && statut >= 400 && statut < 500) return null;
  return evenement;
}
