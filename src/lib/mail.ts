import { getSql, type Sql } from "@/lib/sql";

export type Mail = {
  a: string;
  sujet: string;
  html: string;
  /** Lien ou mot de passe : en production l'archive ne garde pas le corps. */
  sensible?: boolean;
};

export function htmlPourArchive(mail: Mail, production: boolean) {
  if (!production || !mail.sensible) return mail.html;
  return "<p>Message d'authentification. Le contenu n'est pas conservé.</p>";
}

async function capturer(sql: Sql, mail: Mail) {
  await sql`
    insert into public.mails_sortants (destinataire, sujet, html)
    values (${mail.a}, ${mail.sujet}, ${mail.html})
  `;
}

export const EXPEDITEUR_PAR_DEFAUT = "Hublify <noreply@tech-trust.fr>";
export const REPONSE_PAR_DEFAUT = "contact@tech-trust.fr";

type Env = Record<string, string | undefined>;

const ADRESSE = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;
const EXPEDITEUR_NOMME = /^[^<>"\r\n]{1,80} <([^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+)>$/;

function expediteurValide(valeur: string) {
  return ADRESSE.test(valeur) || EXPEDITEUR_NOMME.test(valeur);
}

/**
 * Expéditeur et adresse de réponse. Une valeur vide ou mal formée retombe sur le
 * défaut : un `from` invalide ferait refuser chaque envoi par Resend, et un
 * `reply_to` cassé enverrait les réponses dans le vide.
 * `MAIL_REPLY_TO=aucune` désactive explicitement l'adresse de réponse.
 */
export function parametresEnvoi(env: Env = process.env) {
  const from = env["MAIL_FROM"]?.trim();
  const reponse = env["MAIL_REPLY_TO"]?.trim();
  let replyTo: string | undefined = REPONSE_PAR_DEFAUT;
  if (reponse?.toLowerCase() === "aucune") replyTo = undefined;
  else if (reponse && ADRESSE.test(reponse)) replyTo = reponse;
  return {
    from: from && expediteurValide(from) ? from : EXPEDITEUR_PAR_DEFAUT,
    replyTo,
  };
}

/** Corps exact envoyé à l'API Resend (testé sans réseau). */
export function corpsResend(mail: Mail, env: Env = process.env) {
  const { from, replyTo } = parametresEnvoi(env);
  return {
    from,
    to: [mail.a],
    subject: mail.sujet,
    html: mail.html,
    ...(replyTo ? { reply_to: [replyTo] } : {}),
  };
}

async function viaResend(mail: Mail) {
  const cle = process.env["RESEND_API_KEY"];
  if (!cle) return false;
  const reponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cle}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpsResend(mail)),
  });
  return reponse.ok;
}

// Renvoie true seulement si le message est réellement parti chez le fournisseur.
// Sans RESEND_API_KEY il est uniquement archivé dans `mails_sortants` : l'appelant
// doit pouvoir le dire à l'utilisateur au lieu d'annoncer un envoi qui n'a pas eu lieu.
export async function envoyerMail(mail: Mail) {
  const sql = getSql();
  if (sql) {
    await capturer(sql, {
      ...mail,
      html: htmlPourArchive(mail, process.env["NODE_ENV"] === "production"),
    });
  }
  const envoye = await viaResend(mail).catch(() => false);
  if (!envoye && process.env["NODE_ENV"] !== "production") {
    console.info(`[mail] ${mail.a} — ${mail.sujet}`);
  }
  return envoye;
}

export async function mailsPour(destinataire: string) {
  const sql = getSql();
  if (!sql) return [];
  return sql`
    select id, destinataire, sujet, html, created_at
    from public.mails_sortants
    where destinataire = ${destinataire.trim().toLowerCase()}
    order by created_at desc
    limit 20
  ` as Promise<
    Array<{ id: string; destinataire: string; sujet: string; html: string; created_at: string }>
  >;
}
