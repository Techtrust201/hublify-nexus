import { randomBytes } from "node:crypto";

/**
 * Mot de passe temporaire d'invitation. 18 octets aléatoires : il ne se devine
 * pas, et il n'est jamais renvoyé dans la réponse HTTP.
 * Il reste valable jusqu'au changement par l'invité : ce n'est pas un jeton
 * à expiration.
 */
export function genererMotDePasseInvitation() {
  return `Hublify-${randomBytes(18).toString("base64url")}!aA1`;
}
