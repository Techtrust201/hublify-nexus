import * as Sentry from "@sentry/tanstackstart-react";

import { TAUX_TRACES_SENTRY, collecteSentry, filtrerEvenementSentry } from "@/lib/sentry-partage";

function present(valeur: string | undefined): string | undefined {
  return typeof valeur === "string" && valeur.length > 0 ? valeur : undefined;
}

/**
 * À appeler avant l'hydratation. Sans DSN public, le SDK reste inactif :
 * aucun envoi, y compris en local et en CI.
 * Session Replay n'est pas branché.
 */
export function initSentryClient(): void {
  const dsn = present(import.meta.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!dsn) return;

  const environment = present(import.meta.env.VERCEL_ENV);
  const release = present(import.meta.env.VERCEL_GIT_COMMIT_SHA);

  Sentry.init({
    dsn,
    tracesSampleRate: TAUX_TRACES_SENTRY,
    dataCollection: collecteSentry,
    beforeSend: filtrerEvenementSentry,
    ...(environment ? { environment } : {}),
    ...(release ? { release } : {}),
  });
}
