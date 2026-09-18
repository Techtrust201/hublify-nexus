import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DocumentsApp } from "@/components/documents/DocumentsApp";
import { AppShell } from "@/components/layout/AppShell";
import type { VueDocuments } from "@/data/documents-mo1";

const VUES_DOC: VueDocuments[] = [
  "logements",
  "residents",
  "proprio",
  "inventaire-presta",
  "etats",
  "fiches",
  "factures",
  "syndic",
];

export const Route = createFileRoute("/documents/")({
  validateSearch: (raw: Record<string, unknown>): { vue?: VueDocuments; logement?: string } => {
    const v = raw["vue"];
    const l = raw["logement"];
    const logement = typeof l === "string" && l.trim() ? { logement: l } : {};
    if (typeof v === "string" && (VUES_DOC as string[]).includes(v)) {
      return { vue: v as VueDocuments, ...logement };
    }
    return logement;
  },
  head: () => ({
    meta: [{ title: "Documents — Hublify" }],
  }),
  component: PageDocuments,
});

function PageDocuments() {
  const { vue, logement } = Route.useSearch();
  const navigate = useNavigate({ from: "/documents/" });
  return (
    <AppShell attendDonnees titre="Documents" sousTitre="Baux, diagnostics et dossiers — les quittances sont côté résidents">
      <DocumentsApp
        vue={vue ?? "hub"}
        {...(logement ? { logement } : {})}
        onVue={(v) => {
          void navigate({ search: v === "hub" ? {} : { vue: v } });
        }}
      />
    </AppShell>
  );
}
