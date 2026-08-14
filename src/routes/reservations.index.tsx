import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { AccordeonsBas, KpiReservations } from "@/components/reservations/KpiEtAccordeons";
import { PlanningReservations } from "@/components/reservations/PlanningReservations";
import { TableauReservations } from "@/components/reservations/TableauReservations";
import { AppShell } from "@/components/layout/AppShell";
import { BIENS_MO1 } from "@/data/reservations-mo1";
import { cn } from "@/lib/utils";

type VuePage = "planning" | "liste";

export const Route = createFileRoute("/reservations/")({
  validateSearch: (search: Record<string, unknown>): { vue?: VuePage } => ({
    vue: search.vue === "liste" ? "liste" : search.vue === "planning" ? "planning" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Réservations — Hublify" },
      {
        name: "description",
        content: "Planning et liste des réservations Hublify : 3 jours, 5 jours, mois et tableau.",
      },
    ],
  }),
  component: PageReservations,
});

function PageReservations() {
  const { vue: vueUrl } = Route.useSearch();
  const navigate = useNavigate({ from: "/reservations/" });
  const vue: VuePage = vueUrl ?? "planning";
  const setVue = (v: VuePage) => {
    void navigate({ search: { vue: v } });
  };
  const [recherche, setRecherche] = useState("");

  const resultats = recherche.trim()
    ? BIENS_MO1.filter(
        (b) =>
          b.nom.toLowerCase().includes(recherche.toLowerCase()) ||
          b.adresse.toLowerCase().includes(recherche.toLowerCase()),
      )
    : [];

  if (vue === "liste") {
    return (
      <AppShell>
        <div className="flex items-center gap-2 text-xs text-[#99a1af]">
          <Link to="/" className="hover:text-[#4a5565]">
            Tableau de bord
          </Link>
          <span>›</span>
          <span>Réservations</span>
        </div>
        <div className="mt-3 mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-medium text-[#1e2939]">Réservations</h1>
            <p className="text-sm text-[#6a7282]">Gérer toutes vos réservations en un endroit</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setVue("planning")}
              className="inline-flex h-10 items-center rounded-[10px] border border-[#e5e7eb] px-4 text-sm font-medium text-[#4a5565]"
            >
              Planning
            </button>
            <Link
              to="/reservations/nouveau"
              className="inline-flex h-10 items-center gap-2 rounded-[14px] bg-[#1e2939] px-4 text-sm font-medium text-white"
            >
              <Plus className="size-3.5" />
              Créer une réservation
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
          <TableauReservations />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <KpiReservations />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex h-[38px] w-full max-w-[448px] items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3">
          <Search className="size-3.5 shrink-0 text-[#99a1af]" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par prestataire ou appartement..."
            className="h-full w-full bg-transparent text-sm text-[#1e2939] outline-none placeholder:text-[#99a1af]"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setVue("liste")}
            className={cn(
              "inline-flex h-10 items-center rounded-[10px] border border-[#e5e7eb] px-4 text-sm font-medium text-[#4a5565]",
            )}
          >
            Liste
          </button>
          <Link
            to="/reservations/nouveau"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#1e2939] px-4 text-sm font-medium text-white"
          >
            <Plus className="size-3.5" />
            Créer une réservation
          </Link>
        </div>
      </div>

      {recherche.trim() && (
        <div className="mt-3 rounded-[10px] border border-[#e5e7eb] bg-white p-3 text-sm">
          {resultats.length === 0 ? (
            <p className="text-[#6a7282]">Aucun résultat pour « {recherche} ».</p>
          ) : (
            <ul className="space-y-1">
              {resultats.map((b) => (
                <li key={b.id} className="text-[#1e2939]">
                  {b.nom} · {b.adresse}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4">
        <PlanningReservations onVoirListe={() => setVue("liste")} />
      </div>

      <AccordeonsBas />
    </AppShell>
  );
}
