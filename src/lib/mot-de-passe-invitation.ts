import { randomBytes } from "node:crypto";

/**
 * Mot de passe aléatoire posé à la création d'un compte invité. 18 octets
 * aléatoires : il ne se devine pas. Il n'est ni renvoyé dans la réponse HTTP
 * ni envoyé par e-mail : l'invité choisit le sien via le lien de l'invitation.
 */
export function genererMotDePasseInvitation() {
  return `Hublify-${randomBytes(18).toString("base64url")}!aA1`;
}
