import { createServerFn } from "@tanstack/react-start";
import { envoyerMail } from "@/lib/mail";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function adresseListeValide(valeur: unknown) {
  const email = String(valeur ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL.test(email) || email.length > 160) return null;
  return email;
}

/** Inscription publique à la liste des bailleurs. L'adresse est archivée avec les autres mails. */
export const inscrireListeBailleurs = createServerFn({ method: "POST" })
  .validator((input: { email?: string }) => {
    const email = adresseListeValide(input?.email);
    if (!email) throw new Error("Adresse e-mail invalide.");
    return { email };
  })
  .handler(async ({ data }) => {
    const envoye = await envoyerMail({
      a: data.email,
      sujet: "Hublify — inscription à la liste des bailleurs",
      html: `<p>Votre adresse ${data.email} est inscrite à la liste des bailleurs Hublify.</p>`,
    });
    return { ok: true as const, envoye };
  });
