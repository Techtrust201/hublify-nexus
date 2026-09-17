import { createFileRoute } from "@tanstack/react-router";
import { PortailShell } from "@/components/layout/PortailShell";
import { DossierPortail } from "@/components/portail/VuesPortail";

export const Route = createFileRoute("/espace/dossier")({
  head: () => ({ meta: [{ title: "Dossier de location — Hublify" }] }),
  component: () => (
    <PortailShell titre="Dossier de location">
      <DossierPortail />
    </PortailShell>
  ),
});
