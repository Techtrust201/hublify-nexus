import { createFileRoute, redirect } from "@tanstack/react-router";
import { aLeDroit } from "@/auth/permissions";
import { FormulaireReservation } from "@/components/reservations/FormulaireReservation";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/reservations/nouveau")({
  beforeLoad: ({ context }) => {
    if (!context.auth || !aLeDroit(context.auth.droits, "mod-reservations")) {
      throw redirect({ to: "/reservations" });
    }
  },
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
