import { createFileRoute } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useHublify } from "@/data/store";

export const Route = createFileRoute("/patrimoines/")({
  head: () => ({
    meta: [{ title: "Patrimoines — Hublify" }],
  }),
  component: PagePatrimoines,
});

function PagePatrimoines() {
  const { biens, reservations, missions } = useHublify();

  return (
    <AppShell titre="Patrimoines" sousTitre={`${biens.length} biens suivis`}>
      <div className="grid gap-4 sm:grid-cols-2">
        {biens.map((b) => {
          const sejours = reservations.filter((r) => r.bienId === b.id).length;
          const inter = missions.filter((m) => m.bienId === b.id).length;
          return (
            <article key={b.id} className="rounded-[10px] border border-[#e5e7eb] bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#f3f4f6]">
                  <Home className="size-4 text-[#4a5565]" />
                </span>
                <div>
                  <h2 className="text-sm font-medium text-[#1e2939]">{b.nom}</h2>
                  <p className="text-xs text-[#99a1af]">
                    {b.adresse}, {b.ville}
                  </p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-[10px] border border-[#f3f4f6] py-2">
                  <dt className="text-[#99a1af]">Typologie</dt>
                  <dd className="mt-0.5 text-[#4a5565]">{b.typologie}</dd>
                </div>
                <div className="rounded-[10px] border border-[#f3f4f6] py-2">
                  <dt className="text-[#99a1af]">Réservations</dt>
                  <dd className="mt-0.5 text-[#4a5565]">{sejours}</dd>
                </div>
                <div className="rounded-[10px] border border-[#f3f4f6] py-2">
                  <dt className="text-[#99a1af]">Missions</dt>
                  <dd className="mt-0.5 text-[#4a5565]">{inter}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
