import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { autoriserCadence, cleAdresse } from "@/lib/cadence-memoire";
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
    let autorise = true;
    try {
      autorise = autoriserCadence(
        cleAdresse("liste-bailleurs", getRequest().headers),
        5,
        60 * 60 * 1000,
      );
    } catch {
      autorise = autoriserCadence("liste-bailleurs:hors-requete", 5, 60 * 60 * 1000);
    }
    if (!autorise) throw new Error("Trop de tentatives. Réessayez plus tard.");
    const envoye = await envoyerMail({
      a: data.email,
      sujet: "Hublify — inscription à la liste des bailleurs",
      html: `<p>Votre adresse ${data.email} est inscrite à la liste des bailleurs Hublify.</p>`,
    });
    return { ok: true as const, envoye };
  });
