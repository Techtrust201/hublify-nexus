import { createFileRoute } from "@tanstack/react-router";
import { CompteGestionnaire } from "@/components/compte/CompteGestionnaire";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [{ title: "Compte gestionnaire — Hublify" }],
  }),
  component: PageProfil,
});

function PageProfil() {
  return (
    <AppShell
      attendDonnees
      titre="Compte gestionnaire"
      sousTitre="Gérez vos informations personnelles et préférences"
    >
      <CompteGestionnaire />
    </AppShell>
  );
}
