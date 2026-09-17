import { createFileRoute } from "@tanstack/react-router";
import { PortailShell } from "@/components/layout/PortailShell";
import { AccueilPortail } from "@/components/portail/VuesPortail";

export const Route = createFileRoute("/espace/")({
  head: () => ({ meta: [{ title: "Espace — Hublify" }] }),
  component: () => (
    <PortailShell>
      <AccueilPortail />
    </PortailShell>
  ),
});
