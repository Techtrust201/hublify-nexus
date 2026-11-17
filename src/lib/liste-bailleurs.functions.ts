import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { consommerQuotas } from "@/lib/cadence-persistante";
import { cleAdresse } from "@/lib/cadence-memoire";
import { traiterInscription, validerEntreeListe } from "@/lib/liste-bailleurs";
import { envoyerMail } from "@/lib/mail";
import { getSql } from "@/lib/sql";
import { verifierTurnstile } from "@/lib/turnstile";

export { adresseListeValide } from "@/lib/liste-bailleurs";

function entetesRequete() {
  try {
    return getRequest().headers;
  } catch {
    return new Headers();
  }
}

/** Inscription publique à la liste des bailleurs. L'adresse est archivée avec les autres mails. */
export const inscrireListeBailleurs = createServerFn({ method: "POST" })
  .validator((input: unknown) => validerEntreeListe(input))
  .handler(async ({ data }) => {
    const entetes = entetesRequete();
    const cleIp = cleAdresse("liste-bailleurs:ip", entetes);
    const ip = cleIp.slice("liste-bailleurs:ip:".length);
    return traiterInscription(data, cleIp, {
      maintenant: Date.now,
      consommer: (quotas) => consommerQuotas(getSql(), quotas),
      verifierCaptcha: (jeton) =>
        verifierTurnstile(jeton, ip === "sans-ip-de-confiance" ? undefined : ip),
      envoyer: envoyerMail,
    });
  });
