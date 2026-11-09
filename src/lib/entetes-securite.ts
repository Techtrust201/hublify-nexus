/** En-têtes posés sur chaque réponse. Pas de CSP : le framework injecte des scripts. */
export const ENTETES_SECURITE: ReadonlyArray<readonly [string, string]> = [
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
  ["X-DNS-Prefetch-Control", "off"],
];

export const ENTETE_HSTS: readonly [string, string] = [
  "Strict-Transport-Security",
  "max-age=63072000; includeSubDomains",
];

export function poserEntetesSecurite(response: Response, production: boolean) {
  for (const [cle, valeur] of ENTETES_SECURITE) {
    if (!response.headers.has(cle)) response.headers.set(cle, valeur);
  }
  if (production && !response.headers.has(ENTETE_HSTS[0])) {
    response.headers.set(ENTETE_HSTS[0], ENTETE_HSTS[1]);
  }
  return response;
}
