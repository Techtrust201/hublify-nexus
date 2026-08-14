import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PatrimoineApp } from "@/components/patrimoine/PatrimoineApp";

export const Route = createFileRoute("/patrimoines/")({
  head: () => ({
    meta: [{ title: "Patrimoines — Hublify" }],
  }),
  component: PagePatrimoines,
});

function PagePatrimoines() {
  return (
    <AppShell titre="Patrimoines" sousTitre="Biens immobiliers et immeubles">
      <PatrimoineApp />
    </AppShell>
  );
}
