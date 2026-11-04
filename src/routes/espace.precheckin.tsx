import { createFileRoute } from "@tanstack/react-router";
import { PortailShell } from "@/components/layout/PortailShell";
import { PrecheckinPortail } from "@/components/portail/VuesPortail";
import { chargerExtraPrecheckinDistant } from "@/data/outils-remote";
import { EXTRA_PRECHECKIN_DEFAUT } from "@/lib/gestionnaire-planning";

export const Route = createFileRoute("/espace/precheckin")({
  loader: async () => {
    const res = await chargerExtraPrecheckinDistant();
    if (!res.ok) return EXTRA_PRECHECKIN_DEFAUT;
    return res.extra;
  },
  head: () => ({ meta: [{ title: "Pré-checkin — Espace Hublify" }] }),
  component: () => (
    <PortailShell titre="Pré-checkin">
      <PrecheckinPortail extra={Route.useLoaderData()} />
    </PortailShell>
  ),
});
