// SOURCE: Hublify V1.0 — Pré chekin (gestionnaire)

import { createFileRoute, redirect } from "@tanstack/react-router";
import { aLeDroit } from "@/auth/permissions";
import { AppShell } from "@/components/layout/AppShell";
import { PrecheckinGestionnaire } from "@/components/precheckin/PrecheckinGestionnaire";
import { chargerExtraPrecheckinDistant } from "@/data/outils-remote";
import { EXTRA_PRECHECKIN_DEFAUT } from "@/lib/gestionnaire-planning";

export const Route = createFileRoute("/precheckin/")({
  beforeLoad: ({ context }) => {
    if (!context.auth || !aLeDroit(context.auth.droits, "voir-reservations")) {
      throw redirect({ to: "/" });
    }
  },
  loader: async () => {
    const res = await chargerExtraPrecheckinDistant();
    if (!res.ok) return { extra: EXTRA_PRECHECKIN_DEFAUT, enregistre: false };
    return { extra: res.extra, enregistre: res.enregistre };
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
  const charge = Route.useLoaderData();
  return (
    <AppShell
      attendDonnees
      titre="Configuration Pré-checkin"
      sousTitre="Identité, caution, accès et services proposés avant l'arrivée"
    >
      <PrecheckinGestionnaire extraInitial={charge.extra} enregistre={charge.enregistre} />
    </AppShell>
  );
}
