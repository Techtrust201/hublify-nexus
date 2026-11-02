import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PatrimoineApp } from "@/components/patrimoine/PatrimoineApp";

export const Route = createFileRoute("/patrimoines/")({
  validateSearch: (raw: Record<string, unknown>): { logement?: string } => {
    const logement = typeof raw["logement"] === "string" ? raw["logement"] : undefined;
    return logement ? { logement } : {};
  },
  head: () => ({
    meta: [{ title: "Patrimoine — Hublify" }],
  }),
  component: PagePatrimoines,
});

function PagePatrimoines() {
  const { logement } = Route.useSearch();
  return (
    <AppShell attendDonnees titre="Patrimoine" sousTitre="Logements, immeubles, lieux d'événements">
      <PatrimoineApp {...(logement ? { logementCible: logement } : {})} />
    </AppShell>
  );
}
