import { createFileRoute } from "@tanstack/react-router";
import { PortailShell } from "@/components/layout/PortailShell";
import { MissionsPortail } from "@/components/portail/VuesPortail";

export const Route = createFileRoute("/espace/missions")({
  head: () => ({ meta: [{ title: "Missions — Espace Hublify" }] }),
  component: () => (
    <PortailShell titre="Tâches">
      <MissionsPortail />
    </PortailShell>
  ),
});
