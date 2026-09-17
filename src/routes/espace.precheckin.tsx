import { createFileRoute } from "@tanstack/react-router";
import { PortailShell } from "@/components/layout/PortailShell";
import { PrecheckinPortail } from "@/components/portail/VuesPortail";

export const Route = createFileRoute("/espace/precheckin")({
  head: () => ({ meta: [{ title: "Pré-checkin — Espace Hublify" }] }),
  component: () => (
    <PortailShell titre="Pré-checkin">
      <PrecheckinPortail />
    </PortailShell>
  ),
});
