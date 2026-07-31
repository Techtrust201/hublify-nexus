// SOURCE: V2 Redris — « Vision Missions Calendar »
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { MissionsCalendar } from "@/components/missions/MissionsCalendar";
import { LIBELLE_STATUT, STATUTS_MISSION } from "@/data/statuts";
import { CLASSE_STATUT } from "@/data/statuts";
import { useHublify } from "@/data/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Calendrier des missions — Hublify" },
      {
        name: "description",
        content:
          "Calendrier des missions Hublify : vue 3 jours ou mois, filtrage par bien, accès au détail de chaque intervention.",
      },
      { property: "og:title", content: "Calendrier des missions — Hublify" },
      {
        property: "og:description",
        content: "Planification et suivi des missions par bien et par prestataire.",
      },
    ],
  }),
  component: PageMissions,
});

function PageMissions() {
  const { missions, biens } = useHublify();

  return (
    <AppShell titre="Missions" sousTitre="Calendrier des interventions planifiées">
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUTS_MISSION.map((s) => (
          <span
            key={s}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs",
              CLASSE_STATUT[s],
            )}
          >
            {LIBELLE_STATUT[s]}
            <span className="font-semibold">{missions.filter((m) => m.statut === s).length}</span>
          </span>
        ))}
      </div>
      <MissionsCalendar missions={missions} biens={biens} />
    </AppShell>
  );
}
