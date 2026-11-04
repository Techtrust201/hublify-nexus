import { createFileRoute } from "@tanstack/react-router";
import { LivretApp } from "@/components/outils/LivretApp";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/outils/livret")({
  head: () => ({
    meta: [{ title: "Fiche d'accès et livret — Hublify" }],
  }),
  component: PageLivret,
});

function PageLivret() {
  return (
    <AppShell
      titre="Fiche d'accès et livret d'accueil"
      sousTitre="Modèles à personnaliser, dupliquer et remettre au voyageur"
    >
      <LivretApp />
    </AppShell>
  );
}
