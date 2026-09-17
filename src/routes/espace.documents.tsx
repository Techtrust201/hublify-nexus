import { createFileRoute } from "@tanstack/react-router";
import { PortailShell } from "@/components/layout/PortailShell";
import { DocumentsPortail } from "@/components/portail/VuesPortail";

export const Route = createFileRoute("/espace/documents")({
  head: () => ({ meta: [{ title: "Documents — Espace Hublify" }] }),
  component: () => (
    <PortailShell titre="Documents">
      <DocumentsPortail />
    </PortailShell>
  ),
});
