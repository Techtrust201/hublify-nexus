import { createFileRoute } from "@tanstack/react-router";
import { ListeOccupants } from "@/components/reservations/ListeOccupants";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/occupants/")({
  head: () => ({
    meta: [
      { title: "Liste des occupants — Hublify" },
      {
        name: "description",
        content: "Gérez vos locataires, voyageurs et prestataires de services.",
      },
    ],
  }),
  component: PageOccupants,
});

function PageOccupants() {
  return (
    <AppShell>
      <ListeOccupants />
    </AppShell>
  );
}
