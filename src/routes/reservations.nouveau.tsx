import { createFileRoute } from "@tanstack/react-router";
import { FormulaireReservation } from "@/components/reservations/FormulaireReservation";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/reservations/nouveau")({
  head: () => ({
    meta: [
      { title: "Créer une réservation — Hublify" },
      {
        name: "description",
        content: "Créer une réservation saisonnière ou un bail longue durée dans Hublify.",
      },
    ],
  }),
  component: PageNouvelleReservation,
});

function PageNouvelleReservation() {
  return (
    <AppShell>
      <FormulaireReservation />
    </AppShell>
  );
}
