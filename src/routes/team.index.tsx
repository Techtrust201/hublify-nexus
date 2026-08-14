// SOURCE: Maquette MO1 — Vision TeamMate / TeamMatePage / InviteModal / EditAccessModal

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { TeamPage } from "@/components/team/TeamPage";

export const Route = createFileRoute("/team/")({
  head: () => ({
    meta: [{ title: "Team Mate — Hublify" }],
  }),
  component: PageTeam,
});

function PageTeam() {
  return (
    <AppShell
      titre="Team Mate"
      sousTitre="Constituez votre équipe afin de vous assister au quotidien"
    >
      <TeamPage />
    </AppShell>
  );
}
