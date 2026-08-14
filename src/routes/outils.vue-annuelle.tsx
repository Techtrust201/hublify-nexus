import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { VueAnnuelle } from "@/components/outils/VueAnnuelle";

export const Route = createFileRoute("/outils/vue-annuelle")({
  head: () => ({
    meta: [{ title: "Vue annuelle — Hublify" }],
  }),
  component: PageVueAnnuelle,
});

function PageVueAnnuelle() {
  return (
    <AppShell titre="Vue Annuelle" sousTitre="Disponibilités et blocages 2026">
      <VueAnnuelle />
    </AppShell>
  );
}
