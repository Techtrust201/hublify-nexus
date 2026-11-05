import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DocumentsApp } from "@/components/documents/DocumentsApp";
import { AppShell } from "@/components/layout/AppShell";
import type { OngletResident, VueDocuments } from "@/data/documents-mo1";

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
  validateSearch: (
    raw: Record<string, unknown>,
  ): { vue?: VueDocuments; logement?: string; onglet?: OngletResident } => {
    const v = raw["vue"];
    const l = raw["logement"];
    const o = raw["onglet"];
    const logement = typeof l === "string" && l.trim() ? l : undefined;
    const onglet: OngletResident | undefined =
      o === "locataires" || o === "voyageurs" || o === "prestataires" ? o : undefined;
    const vue = typeof v === "string" && (VUES_DOC as string[]).includes(v) ? (v as VueDocuments) : undefined;
    return {
      ...(vue ? { vue } : {}),
      ...(logement ? { logement } : {}),
      ...(onglet ? { onglet } : {}),
    };
  },
  head: () => ({
    meta: [{ title: "Documents — Hublify" }],
  }),
  component: PageDocuments,
});

function PageDocuments() {
  const { vue, logement, onglet } = Route.useSearch();
  const navigate = useNavigate({ from: "/documents/" });
  return (
    <AppShell
      attendDonnees
      titre="Documents"
      sousTitre="Occupants, états des lieux, logements, prestataires, propriétaires, accès"
    >
      <DocumentsApp
        vue={vue ?? "hub"}
        {...(logement ? { logement } : {})}
        {...(onglet ? { onglet } : {})}
        onVue={(v, suivant) => {
          void navigate({
            search:
              v === "hub"
                ? {}
                : {
                    vue: v,
                    ...(logement ? { logement } : {}),
                    ...(suivant ? { onglet: suivant } : {}),
                  },
          });
        }}
      />
    </AppShell>
  );
}
