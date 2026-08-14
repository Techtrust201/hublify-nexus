import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PlanningGrid } from "@/components/dashboard/PlanningGrid";
import { AppShell } from "@/components/layout/AppShell";
import { useHublify } from "@/data/store";

export const Route = createFileRoute("/missions/")({
  head: () => ({
    meta: [
      { title: "Calendrier des missions — Hublify" },
      {
        name: "description",
        content: "Planning des missions Hublify : vue 3 jours, 5 jours ou mois, par bien.",
      },
    ],
  }),
  component: PageMissions,
});

function PageMissions() {
  const { missions, biens, reservations } = useHublify();
  const [onglet, setOnglet] = useState<"missions" | "reservations" | "tarifs">("missions");
  const navigate = useNavigate();

  return (
    <AppShell titre="Missions" sousTitre="Calendrier des interventions planifiées">
      <PlanningGrid
        missions={missions}
        biens={biens}
        reservations={reservations}
        onglet={onglet}
        onOnglet={(v) => {
          if (v === "reservations") navigate({ to: "/reservations" });
          else if (v === "tarifs") navigate({ to: "/tarifs" });
          else setOnglet(v);
        }}
      />
    </AppShell>
  );
}
