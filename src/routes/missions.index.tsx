import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PlanningGrid } from "@/components/dashboard/PlanningGrid";
import { AppShell } from "@/components/layout/AppShell";
import type { OngletPlanning } from "@/data/planning-mo1";

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
  const [onglet, setOnglet] = useState<OngletPlanning>("missions");
  const navigate = useNavigate();

  return (
    <AppShell>
      <PlanningGrid
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
