import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ModelesApp } from "@/components/outils/ModelesApp";

export const Route = createFileRoute("/outils/modeles")({
  head: () => ({
    meta: [{ title: "Modèles de documents — Hublify" }],
  }),
  component: PageModeles,
});

function PageModeles() {
  return (
    <AppShell titre="Modèles de documents" sousTitre="Bibliothèque de modèles réutilisables">
      <ModelesApp />
    </AppShell>
  );
}
