import { createFileRoute, redirect } from "@tanstack/react-router";
import { aLeDroit } from "@/auth/permissions";
import { FormulaireReservation } from "@/components/reservations/FormulaireReservation";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/reservations/nouveau")({
  validateSearch: (
    raw: Record<string, unknown>,
  ): { id?: string; bien?: string; arrivee?: string } => {
    const id = typeof raw["id"] === "string" ? raw["id"] : undefined;
    const bien = typeof raw["bien"] === "string" ? raw["bien"] : undefined;
    const arrivee = typeof raw["arrivee"] === "string" ? raw["arrivee"] : undefined;
    return {
      ...(id ? { id } : {}),
      ...(bien ? { bien } : {}),
      ...(arrivee ? { arrivee } : {}),
    };
  },
  beforeLoad: ({ context }) => {
    if (!context.auth || !aLeDroit(context.auth.droits, "mod-reservations")) {
      throw redirect({ to: "/reservations" });
    }
  },
  head: ({ match }) => {
    const id = (match.search as { id?: string }).id;
    return {
      meta: [
        { title: id ? "Modifier une réservation — Hublify" : "Créer une réservation — Hublify" },
        {
          name: "description",
          content: id
            ? "Mettre à jour une réservation dans Hublify."
            : "Créer une réservation saisonnière ou un bail longue durée dans Hublify.",
        },
      ],
    };
  },
  component: PageNouvelleReservation,
});

function PageNouvelleReservation() {
  const { id, bien, arrivee } = Route.useSearch();
  return (
    <AppShell attendDonnees>
      <FormulaireReservation
        {...(id ? { reservationId: id } : {})}
        {...(bien ? { bienId: bien } : {})}
        {...(arrivee ? { arrivee } : {})}
      />
    </AppShell>
  );
}
