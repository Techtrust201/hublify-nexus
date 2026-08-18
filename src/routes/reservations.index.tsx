import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  CreateEventDialog,
  QuittanceDialog,
} from "@/components/dashboard/DashboardDialogs";
import {
  EvenementsSection,
  LoyersSection,
  MessagesSection,
} from "@/components/dashboard/DashboardSections";
import { KpiReservations } from "@/components/reservations/KpiEtAccordeons";
import { PlanningReservations } from "@/components/reservations/PlanningReservations";
import { TableauReservations } from "@/components/reservations/TableauReservations";
import { AppShell } from "@/components/layout/AppShell";
import { RechercheGlobale } from "@/components/layout/RechercheGlobale";
import type { LoyerMo1 } from "@/data/planning-mo1";
import {
  ajouterEvenement,
  ajouterNotif,
  marquerQuittance,
  useSession,
  validerLoyer,
} from "@/data/session";
import { toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type VuePage = "planning" | "liste";

export const Route = createFileRoute("/reservations/")({
  validateSearch: (search: Record<string, unknown>): { vue?: VuePage } => {
    const v = search["vue"];
    if (v === "liste" || v === "planning") return { vue: v };
    return {};
  },
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
  const session = useSession();
  const [recherche, setRecherche] = useState("");
  const [loyerQuittance, setLoyerQuittance] = useState<LoyerMo1 | null>(null);
  const [creerEvent, setCreerEvent] = useState(false);

  if (vue === "liste") {
    return (
      <AppShell>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Link to="/" className="hover:text-ink-body">
            Tableau de bord
          </Link>
          <span>›</span>
          <span>Réservations</span>
        </div>
        <div className="mt-3 mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-medium text-ink">Réservations</h1>
            <p className="text-sm text-ink-subtle">Gérer toutes vos réservations en un endroit</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setVue("planning")}
              className="inline-flex h-10 items-center rounded-card border border-line px-4 text-sm font-medium text-ink-body"
            >
              Planning
            </button>
            <Link
              to="/reservations/nouveau"
              className="inline-flex h-10 items-center gap-2 rounded-[14px] bg-ink px-4 text-sm font-medium text-white"
            >
              <Plus className="size-3.5" />
              Créer une réservation
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-card border border-line bg-white">
          <TableauReservations />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <KpiReservations />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RechercheGlobale valeur={recherche} onChange={setRecherche} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setVue("liste")}
            className={cn(
              "inline-flex h-11 items-center rounded-card border border-line px-4 text-sm font-medium text-ink-body",
            )}
          >
            Liste
          </button>
          <Link
            to="/reservations/nouveau"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-ink px-4 text-sm font-medium text-white"
          >
            <Plus className="size-3.5" />
            Créer une réservation
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <PlanningReservations onVoirListe={() => setVue("liste")} />
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
          ajouterNotif({ titre: "Événement ajouté", detail: e.titre, href: "/reservations" });
          toastOk("Événement enregistré.");
        }}
      />
    </AppShell>
  );
}
