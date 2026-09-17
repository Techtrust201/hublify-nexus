import { createFileRoute } from "@tanstack/react-router";
import { PortailShell } from "@/components/layout/PortailShell";
import { CalendrierPortail } from "@/components/portail/VuesPortail";

export const Route = createFileRoute("/espace/calendrier")({
  head: () => ({ meta: [{ title: "Agenda — Espace Hublify" }] }),
  component: () => (
    <PortailShell titre="Agenda">
      <CalendrierPortail />
    </PortailShell>
  ),
});
