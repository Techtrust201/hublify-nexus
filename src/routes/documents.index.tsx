import { createFileRoute } from "@tanstack/react-router";
import { DocumentsApp } from "@/components/documents/DocumentsApp";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/documents/")({
  head: () => ({
    meta: [{ title: "Documents — Hublify" }],
  }),
  component: PageDocuments,
});

function PageDocuments() {
  return (
    <AppShell titre="Documents" sousTitre="Contrats, états des lieux et quittances">
      <DocumentsApp />
    </AppShell>
  );
}
