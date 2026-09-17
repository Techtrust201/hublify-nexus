import { createFileRoute } from "@tanstack/react-router";
import { PortailShell } from "@/components/layout/PortailShell";
import { CandidaturePortail } from "@/components/portail/VuesPortail";

export const Route = createFileRoute("/espace/candidature")({
  head: () => ({ meta: [{ title: "Candidature — Hublify" }] }),
  component: () => (
    <PortailShell titre="Candidature">
      <CandidaturePortail />
    </PortailShell>
  ),
});
