// SOURCE: Maquette MO1 — Dashboard/Calendar/Missions/3days

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
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
import { RechercheGlobale } from "@/components/layout/RechercheGlobale";
import {
  ajouterEvenement,
  ajouterNotif,
  marquerQuittance,
  useSession,
  validerLoyer,
} from "@/data/session";
import type { LoyerMo1, OngletPlanning } from "@/data/planning-mo1";
import { toastOk } from "@/lib/feedback";

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
  const session = useSession();
  const [recherche, setRecherche] = useState("");
  const [onglet, setOnglet] = useState<OngletPlanning>("missions");
  const [loyerQuittance, setLoyerQuittance] = useState<LoyerMo1 | null>(null);
  const [creerEvent, setCreerEvent] = useState(false);

  const allerOnglet = (v: OngletPlanning) => {
    if (v === "reservations") navigate({ to: "/reservations" });
    else if (v === "tarifs") navigate({ to: "/tarifs" });
    else setOnglet(v);
  };

  return (
    <AppShell>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RechercheGlobale valeur={recherche} onChange={setRecherche} />
        <Link
          to="/reservations/nouveau"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-ink px-4 text-sm font-medium text-white"
        >
          <Plus className="size-3.5" />
          Créer une réservation
        </Link>
      </div>

      <KpiCards />

      <div className="mt-4">
        <PlanningGrid onglet={onglet} onOnglet={allerOnglet} />
      </div>

      <MessagesSection messages={session.messagesDash} />
      <LoyersSection
        loyers={session.loyers}
        onValider={(id) => {
          validerLoyer(id);
          toastOk("Paiement validé.");
        }}
        onQuittance={(id) => {
          const l = session.loyers.find((x) => x.id === id);
          if (l) setLoyerQuittance(l);
        }}
      />
      <EvenementsSection evenements={session.evenements} onAjouter={() => setCreerEvent(true)} />

      <QuittanceDialog
        loyer={loyerQuittance}
        ouvert={Boolean(loyerQuittance)}
        onFermer={() => setLoyerQuittance(null)}
        onConfirmer={() => {
          if (!loyerQuittance) return;
          marquerQuittance(loyerQuittance.id);
          toastOk("Quittance générée.");
          setLoyerQuittance(null);
        }}
      />
      <CreateEventDialog
        ouvert={creerEvent}
        onFermer={() => setCreerEvent(false)}
        onCreer={(e) => {
          ajouterEvenement(e);
          ajouterNotif({
            titre: "Événement ajouté",
            detail: e.titre,
            href: "/",
          });
          toastOk("Événement enregistré.");
        }}
      />
    </AppShell>
  );
}
