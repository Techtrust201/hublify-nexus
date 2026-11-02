import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { aLeDroit } from "@/auth/permissions";
import { PlanningGrid } from "@/components/dashboard/PlanningGrid";
import { AppShell } from "@/components/layout/AppShell";
import type { OngletPlanning } from "@/data/planning-mo1";

export const Route = createFileRoute("/tarifs/")({
  beforeLoad: ({ context }) => {
    if (!context.auth || !aLeDroit(context.auth.droits, "voir-finances")) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [{ title: "Tarifs — Hublify" }],
  }),
  component: PageTarifs,
});

function PageTarifs() {
  const [onglet, setOnglet] = useState<OngletPlanning>("tarifs");
  const navigate = useNavigate();

  return (
    <AppShell attendDonnees titre="Tarifs" sousTitre="Prix par nuit, règles et ensembles de règles">
      <p className="mb-3 rounded-card border border-line bg-white px-4 py-3 text-xs text-ink-muted">
        Les tarifs se modifient ici. En V1, aucune API channel manager ni Stripe n'est connectée :
        les OTA ne sont pas mis à jour automatiquement. Cochez « Enregistrer uniquement pour cette
        période » pour qu'une règle ne dépasse pas les dates saisies.
      </p>
      <PlanningGrid
        onglet={onglet}
        vueInitiale="mois"
        onOnglet={(v) => {
          if (v === "missions") navigate({ to: "/missions" });
          else if (v === "reservations") navigate({ to: "/reservations" });
          else setOnglet(v);
        }}
      />
    </AppShell>
  );
}
