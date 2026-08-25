import { getSql, type Sql } from "@/lib/sql";

export type Mail = {
  a: string;
  sujet: string;
  html: string;
};

async function capturer(sql: Sql, mail: Mail) {
  await sql`
    insert into public.mails_sortants (destinataire, sujet, html)
    values (${mail.a}, ${mail.sujet}, ${mail.html})
  `;
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
    body: JSON.stringify({
      from: process.env["MAIL_FROM"] ?? "Hublify <noreply@hublify.app>",
      to: [mail.a],
      subject: mail.sujet,
      html: mail.html,
    }),
  });
  return reponse.ok;
}

export async function envoyerMail(mail: Mail) {
  const sql = getSql();
  if (sql) await capturer(sql, mail);
  const envoye = await viaResend(mail).catch(() => false);
  if (!envoye && process.env["NODE_ENV"] !== "production") {
    console.info(`[mail] ${mail.a} — ${mail.sujet}`);
  }
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
