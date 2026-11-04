import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { InventaireApp } from "@/components/outils/InventaireApp";

export const Route = createFileRoute("/inventaire/")({
  head: () => ({
    meta: [{ title: "Inventaire — Hublify" }],
  }),
  component: PageInventaire,
});

function PageInventaire() {
  return (
    <AppShell
      attendDonnees
      titre="Inventaire"
      sousTitre="Conciergerie : linge de maison et consommables"
    >
      <InventaireApp />
    </AppShell>
  );
}
