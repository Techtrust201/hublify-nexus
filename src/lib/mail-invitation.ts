import { AsyncLocalStorage } from "node:async_hooks";
import type { Mail } from "@/lib/mail";

/**
 * Invitation d'un membre : le mail ne contient jamais de mot de passe. Il porte
 * un lien de définition du mot de passe, fabriqué par le flux de
 * réinitialisation Better Auth (jeton à usage unique, expiration 1 h).
 */
export type ContexteInvitation = {
  orgNom: string;
  /** Origine publique de l'application (ex. https://hublify.example). */
  origine: string;
  /** Renseigné par `sendResetPassword` : vrai si le fournisseur a accepté l'envoi. */
  envoye: boolean;
};

/**
 * Pendant `inviterMembre`, `sendResetPassword` envoie le mail d'invitation au
 * lieu du mail « mot de passe oublié ». Le contexte suit l'appel asynchrone,
 * il ne fuit pas vers les autres requêtes.
 */
export const invitationEnCours = new AsyncLocalStorage<ContexteInvitation>();

export const DUREE_LIEN_INVITATION = "1 heure";

function echapper(texte: string) {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sansSlashFinal(url: string) {
  return url.replace(/\/+$/, "");
}

/** Lien direct vers la page qui consomme le jeton (`authClient.resetPassword`). */
export function lienDefinitionMotDePasse(origine: string, jeton: string) {
  return `${sansSlashFinal(origine)}/reinitialiser-mot-de-passe?token=${encodeURIComponent(jeton)}`;
}

export function mailInvitation(params: {
  email: string;
  orgNom: string;
  origine: string;
  jeton: string;
}): Mail {
  const org = echapper(params.orgNom);
  const lien = lienDefinitionMotDePasse(params.origine, params.jeton);
  const connexion = `${sansSlashFinal(params.origine)}/connexion`;
  const oubli = `${sansSlashFinal(params.origine)}/mot-de-passe-oublie`;
  return {
    a: params.email,
    sujet: `Invitation Hublify — ${params.orgNom}`,
    html: `<p>Vous êtes invité(e) à rejoindre <strong>${org}</strong> sur Hublify.</p>
<p>Pour activer votre compte (${echapper(params.email)}), choisissez votre mot de passe :</p>
<p><a href="${lien}">Définir mon mot de passe</a></p>
<p>Ce lien est personnel et valable ${DUREE_LIEN_INVITATION}. Passé ce délai, utilisez « <a href="${oubli}">Mot de passe oublié</a> » avec cette adresse e-mail.</p>
<p>Votre accès s'ouvre dès qu'un administrateur de ${org} l'a validé : tant que ce n'est pas fait, la connexion est refusée.</p>
<p>Connexion : <a href="${connexion}">${connexion}</a></p>`,
    sensible: true,
  };
}

/** Mail « mot de passe oublié » standard (hors invitation). */
export function mailReinitialisation(email: string, url: string): Mail {
  return {
    a: email,
    sujet: "Réinitialiser votre mot de passe Hublify",
    html: `<p>Réinitialisez votre mot de passe :</p><p><a href="${url}">Choisir un nouveau mot de passe</a></p>`,
    sensible: true,
  };
}

/** Choix du mail émis par `sendResetPassword` selon le contexte. */
export function mailPourJetonMotDePasse(
  contexte: ContexteInvitation | undefined,
  user: { email: string },
  url: string,
  jeton: string,
): Mail {
  if (!contexte) return mailReinitialisation(user.email, url);
  return mailInvitation({
    email: user.email,
    orgNom: contexte.orgNom,
    origine: contexte.origine,
    jeton,
  });
}

function urlPublique(hote: string | undefined) {
  const v = hote?.trim();
  if (!v) return undefined;
  return v.startsWith("http://") || v.startsWith("https://") ? v : `https://${v}`;
}

function origineDe(url: string | undefined) {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

/**
 * Origine des liens de l'invitation : celle où l'administrateur travaille si
 * elle fait partie des origines connues (production, Preview, local), sinon
 * l'URL publique configurée. Un en-tête `Host` arbitraire n'est jamais repris.
 */
export function origineInvitation(
  origineRequete: string | undefined,
  env: Record<string, string | undefined> = process.env,
) {
  const connues = [
    env["BETTER_AUTH_URL"],
    urlPublique(env["VERCEL_URL"]),
    urlPublique(env["VERCEL_BRANCH_URL"]),
    urlPublique(env["VERCEL_PROJECT_PRODUCTION_URL"]),
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ]
    .map(origineDe)
    .filter((x): x is string => Boolean(x));
  const demandee = origineDe(origineRequete);
  if (demandee && connues.includes(demandee)) return demandee;
  return connues[0] ?? "http://localhost:8080";
}
