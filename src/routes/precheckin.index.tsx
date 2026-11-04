// SOURCE: Hublify V1.0 — Pré chekin (gestionnaire)

import { createFileRoute, redirect } from "@tanstack/react-router";
import { aLeDroit } from "@/auth/permissions";
import { AppShell } from "@/components/layout/AppShell";
import { PrecheckinGestionnaire } from "@/components/precheckin/PrecheckinGestionnaire";

export const Route = createFileRoute("/precheckin/")({
  beforeLoad: ({ context }) => {
    if (!context.auth || !aLeDroit(context.auth.droits, "voir-reservations")) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Pré-checkin — Hublify" },
      {
        name: "description",
        content:
          "Configuration du pré-checkin : pièces d'identité, caution, code d'accès et upsells.",
      },
    ],
  }),
  component: PagePrecheckin,
});

function PagePrecheckin() {
  return (
    <AppShell
      attendDonnees
      titre="Pré-checkin"
      sousTitre="Identité, caution, accès et services proposés avant l'arrivée"
    >
      <PrecheckinGestionnaire />
    </AppShell>
  );
}
