import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PlanningGrid } from "@/components/dashboard/PlanningGrid";
import { AppShell } from "@/components/layout/AppShell";
import { useHublify } from "@/data/store";

export const Route = createFileRoute("/reservations/")({
  head: () => ({
    meta: [{ title: "Réservations — Hublify" }],
  }),
  component: PageReservations,
});

function PageReservations() {
  const { reservations, biens, missions } = useHublify();
  const [onglet, setOnglet] = useState<"missions" | "reservations" | "tarifs">("reservations");

  return (
    <AppShell titre="Réservations" sousTitre={`${reservations.length} séjours planifiés`}>
      <div className="mb-4 flex justify-end">
        <span className="inline-flex h-10 items-center gap-2 rounded-[14px] bg-[#1e2939] px-4 text-sm font-medium text-white">
          <Plus className="size-3.5" />
          Créer une réservation
        </span>
      </div>
      <PlanningGrid
        missions={missions}
        biens={biens}
        reservations={reservations}
        onglet={onglet}
        onOnglet={setOnglet}
      />
      <section className="mt-4 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <header className="border-b border-[#f3f4f6] px-4 py-3 text-sm text-[#1e2939]">
          Liste des réservations
        </header>
        <ul className="divide-y divide-[#f3f4f6]">
          {reservations.map((r) => {
            const bien = biens.find((b) => b.id === r.bienId);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#1e2939]">{r.voyageur.nom}</p>
                  <p className="text-xs text-[#99a1af]">
                    {bien?.nom} · {new Date(r.arrivee).toLocaleDateString("fr-FR")} →{" "}
                    {new Date(r.depart).toLocaleDateString("fr-FR")} · {r.plateforme}
                  </p>
                </div>
                <Link to="/" className="text-xs font-medium text-[#4a5565] hover:underline">
                  Voir le planning
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </AppShell>
  );
}
