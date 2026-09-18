import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PlanningGrid } from "@/components/dashboard/PlanningGrid";
import { PanneauEnDetails } from "@/components/dashboard/PanneauEnDetails";
import { AppShell } from "@/components/layout/AppShell";
import type { MissionMo1, OngletPlanning } from "@/data/planning-mo1";

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
  const [mission, setMission] = useState<MissionMo1 | null>(null);
  const [resaId, setResaId] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <AppShell
      attendDonnees
      titre="Missions"
      sousTitre="Interventions planifiées, par bien et par jour"
    >
      <PlanningGrid
        onglet={onglet}
        onOnglet={(v) => {
          if (v === "reservations") navigate({ to: "/reservations" });
          else if (v === "tarifs") navigate({ to: "/tarifs" });
          else setOnglet(v);
        }}
        onReservation={(id) => {
          setResaId(id);
          setMission(null);
        }}
        onMission={(m) => {
          setMission(m);
          setResaId(null);
        }}
      />
      <PanneauEnDetails reservationId={resaId} mission={mission} />
    </AppShell>
  );
}
