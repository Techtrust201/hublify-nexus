import { createFileRoute } from "@tanstack/react-router";
import { PortailShell } from "@/components/layout/PortailShell";
import { LogementPortail } from "@/components/portail/VuesPortail";

export const Route = createFileRoute("/espace/logement")({
  head: () => ({ meta: [{ title: "Logement — Espace Hublify" }] }),
  component: () => (
    <PortailShell titre="Mon logement">
      <LogementPortail />
    </PortailShell>
  ),
});
