import { createFileRoute } from "@tanstack/react-router";
import { LivretApp } from "@/components/outils/LivretApp";
import { AppShell } from "@/components/layout/AppShell";
import { chargerLivretsDistants } from "@/data/outils-remote";

export const Route = createFileRoute("/outils/livret")({
  loader: () => chargerLivretsDistants(),
  head: () => ({
    meta: [{ title: "Fiche d'accès et livret — Hublify" }],
  }),
  component: PageLivret,
});

function PageLivret() {
  const charge = Route.useLoaderData();
  return (
    <AppShell
      titre="Fiche d'accès et livret d'accueil"
      sousTitre="Modèles à personnaliser, dupliquer et remettre au voyageur"
    >
      <LivretApp charge={charge} />
    </AppShell>
  );
}
