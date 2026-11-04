import { createFileRoute } from "@tanstack/react-router";
import { UpsellsApp } from "@/components/outils/UpsellsApp";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/outils/upsells")({
  head: () => ({
    meta: [{ title: "Upsells — Hublify" }],
  }),
  component: PageUpsells,
});

function PageUpsells() {
  return (
    <AppShell
      attendDonnees
      titre="Upsells"
      sousTitre="Ventes additionnelles proposées aux voyageurs"
    >
      <UpsellsApp />
    </AppShell>
  );
}
