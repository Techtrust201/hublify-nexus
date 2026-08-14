// SOURCE: Maquette MO1 — Dashboard/Calendar/Missions/3days

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CreateEventDialog,
  QuittanceDialog,
} from "@/components/dashboard/DashboardDialogs";
import {
  EvenementsSection,
  KpiCards,
  LoyersSection,
  MessagesSection,
} from "@/components/dashboard/DashboardSections";
import { PlanningGrid } from "@/components/dashboard/PlanningGrid";
import { AppShell } from "@/components/layout/AppShell";
import {
  BIENS_MO1,
  EVENEMENTS_MO1,
  LOYERS_MO1,
  MESSAGES_MO1,
  type EvenementMo1,
  type LoyerMo1,
  type OngletPlanning,
} from "@/data/planning-mo1";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vue générale — Hublify" },
      {
        name: "description",
        content:
          "Vue générale Hublify : loyers, check-in, interventions, planning des missions et messages.",
      },
    ],
  }),
  component: VueGenerale,
});

function VueGenerale() {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");
  const [onglet, setOnglet] = useState<OngletPlanning>("missions");
  const [loyers, setLoyers] = useState<LoyerMo1[]>(LOYERS_MO1);
  const [evenements, setEvenements] = useState<EvenementMo1[]>(EVENEMENTS_MO1);
  const [loyerQuittance, setLoyerQuittance] = useState<LoyerMo1 | null>(null);
  const [creerEvent, setCreerEvent] = useState(false);

  const allerOnglet = (v: OngletPlanning) => {
    if (v === "reservations") navigate({ to: "/reservations" });
    else if (v === "tarifs") navigate({ to: "/tarifs" });
    else setOnglet(v);
  };

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return { biens: [] as typeof BIENS_MO1, prestataires: [] as string[] };
    return {
      biens: BIENS_MO1.filter((b) => b.nom.toLowerCase().includes(q)),
      prestataires: ["Amélie Dubois", "Karim Benali", "Électricité Pro", "Plomberie Express"].filter(
        (p) => p.toLowerCase().includes(q),
      ),
    };
  }, [recherche]);

  return (
    <AppShell>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex h-[38px] w-full max-w-[448px] items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3">
          <Search className="size-3.5 shrink-0 text-[#99a1af]" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par prestataire ou appartement..."
            className="h-full w-full bg-transparent text-sm text-[#1e2939] outline-none placeholder:text-[#99a1af]"
          />
        </label>
        <Link
          to="/reservations/nouveau"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] bg-[#1e2939] px-4 text-sm font-medium text-white"
        >
          <Plus className="size-3.5" />
          Créer une réservation
        </Link>
      </div>

      {recherche.trim() && (
        <div className="mb-4 rounded-[10px] border border-[#e5e7eb] bg-white p-3 text-sm">
          {resultats.biens.length === 0 && resultats.prestataires.length === 0 ? (
            <p className="text-[#6a7282]">Aucun résultat pour « {recherche} ».</p>
          ) : (
            <ul className="space-y-1">
              {resultats.biens.map((b) => (
                <li key={b.id}>
                  <Link to="/patrimoines" className="text-[#1e2939] hover:underline">
                    {b.nom}
                  </Link>
                </li>
              ))}
              {resultats.prestataires.map((p) => (
                <li key={p} className={cn("text-[#1e2939]")}>
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <KpiCards />

      <div className="mt-4">
        <PlanningGrid onglet={onglet} onOnglet={allerOnglet} />
      </div>

      <MessagesSection messages={MESSAGES_MO1} />
      <LoyersSection
        loyers={loyers}
        onValider={(id) =>
          setLoyers((list) => list.map((l) => (l.id === id ? { ...l, valide: true } : l)))
        }
        onQuittance={(id) => {
          const l = loyers.find((x) => x.id === id);
          if (l) setLoyerQuittance(l);
        }}
      />
      <EvenementsSection evenements={evenements} onAjouter={() => setCreerEvent(true)} />

      <QuittanceDialog
        loyer={loyerQuittance}
        ouvert={Boolean(loyerQuittance)}
        onFermer={() => setLoyerQuittance(null)}
        onConfirmer={() => {
          if (!loyerQuittance) return;
          setLoyers((list) =>
            list.map((l) =>
              l.id === loyerQuittance.id ? { ...l, valide: true, quittance: true } : l,
            ),
          );
          setLoyerQuittance(null);
        }}
      />
      <CreateEventDialog
        ouvert={creerEvent}
        onFermer={() => setCreerEvent(false)}
        onCreer={(e) => setEvenements((list) => [e, ...list])}
      />
    </AppShell>
  );
}
