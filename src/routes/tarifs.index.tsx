import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PlanningGrid } from "@/components/dashboard/PlanningGrid";
import { AppShell } from "@/components/layout/AppShell";
import { useHublify } from "@/data/store";

export const Route = createFileRoute("/tarifs/")({
  head: () => ({
    meta: [{ title: "Tarifs — Hublify" }],
  }),
  component: PageTarifs,
});

function PageTarifs() {
  const { biens, missions, reservations, tarifs } = useHublify();
  const [onglet, setOnglet] = useState<"missions" | "reservations" | "tarifs">("tarifs");
  const navigate = useNavigate();

  return (
    <AppShell titre="Tarifs" sousTitre="Grille tarifaire par bien">
      <PlanningGrid
        missions={missions}
        biens={biens}
        reservations={reservations}
        onglet={onglet}
        onOnglet={(v) => {
          if (v === "missions") navigate({ to: "/" });
          else if (v === "reservations") navigate({ to: "/reservations" });
          else setOnglet(v);
        }}
      />
      <div className="mt-4 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#f3f4f6] text-xs text-[#99a1af]">
            <tr>
              <th className="px-4 py-3 font-medium">Bien</th>
              <th className="px-4 py-3 font-medium">Nuit</th>
              <th className="px-4 py-3 font-medium">Week-end</th>
              <th className="px-4 py-3 font-medium">Haute saison</th>
            </tr>
          </thead>
          <tbody>
            {tarifs.map((t) => {
              const bien = biens.find((b) => b.id === t.bienId);
              return (
                <tr key={t.bienId} className="border-b border-[#f3f4f6] last:border-0">
                  <td className="px-4 py-3 text-[#1e2939]">{bien?.nom}</td>
                  <td className="px-4 py-3 text-[#4a5565]">{t.nuit} €</td>
                  <td className="px-4 py-3 text-[#4a5565]">{t.weekend} €</td>
                  <td className="px-4 py-3 text-[#4a5565]">{t.hauteSaison} €</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
