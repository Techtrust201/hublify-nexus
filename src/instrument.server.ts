import * as Sentry from "@sentry/tanstackstart-react";

import { TAUX_TRACES_SENTRY, collecteSentry, filtrerEvenementSentry } from "@/lib/sentry-partage";

function lireProcessEnv(nom: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const valeur = process.env[nom];
  return typeof valeur === "string" && valeur.length > 0 ? valeur : undefined;
}

/**
 * DSN serveur : `SENTRY_DSN`, sinon le DSN public. Lecture dynamique pour
 * que le bundler n'inline pas la valeur dans le JavaScript client.
 */
export function initSentryServer(): void {
  const dsn = lireProcessEnv("SENTRY_DSN") ?? lireProcessEnv("NEXT_PUBLIC_SENTRY_DSN");
  if (!dsn) return;

  const environment = lireProcessEnv("VERCEL_ENV");
  const release = lireProcessEnv("VERCEL_GIT_COMMIT_SHA");

  Sentry.init({
    dsn,
    tracesSampleRate: TAUX_TRACES_SENTRY,
    dataCollection: collecteSentry,
    beforeSend: filtrerEvenementSentry,
    ...(environment ? { environment } : {}),
    ...(release ? { release } : {}),
  });
}
