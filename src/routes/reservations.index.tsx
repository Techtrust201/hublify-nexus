import { useDroit } from "@/auth/auth-context";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateEventDialog, QuittanceDialog } from "@/components/dashboard/DashboardDialogs";
import { AppShell } from "@/components/layout/AppShell";
import { RetourVueGenerale } from "@/components/layout/RetourVueGenerale";
import {
  EvenementsSection,
  LoyersSection,
  MessagesSection,
} from "@/components/dashboard/DashboardSections";
import { KpiReservations } from "@/components/reservations/KpiEtAccordeons";
import { PlanningReservations } from "@/components/reservations/PlanningReservations";
import { TableauReservations } from "@/components/reservations/TableauReservations";
import { PanneauEnDetails } from "@/components/dashboard/PanneauEnDetails";
import type { LoyerMo1 } from "@/data/planning-mo1";
import {
  ajouterEvenement,
  ajouterNotif,
  marquerQuittance,
  useSession,
  validerLoyer,
} from "@/data/session";
import { toastErreur, toastOk } from "@/lib/feedback";
import { telechargerQuittanceLoyer } from "@/lib/exports-docs";
import { paiementViaPlateforme } from "@/data/v1-metier";

type VuePage = "planning" | "liste";

export const Route = createFileRoute("/reservations/")({
  validateSearch: (search: Record<string, unknown>): { vue?: VuePage; resa?: string } => {
    const v = search["vue"];
    const resa = typeof search["resa"] === "string" ? search["resa"] : undefined;
    const vue = v === "liste" || v === "planning" ? v : undefined;
    return {
      ...(vue ? { vue } : {}),
      ...(resa ? { resa } : {}),
    };
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
  const { vue: vueUrl, resa } = Route.useSearch();
  const navigate = useNavigate({ from: "/reservations/" });
  const vue: VuePage = vueUrl ?? (resa ? "liste" : "planning");
  const setVue = (v: VuePage) => {
    void navigate({ search: { vue: v } });
  };
  const session = useSession();
  const peutReserver = useDroit("mod-reservations");
  const [loyerQuittance, setLoyerQuittance] = useState<LoyerMo1 | null>(null);
  const [creerEvent, setCreerEvent] = useState(false);
  const [resaId, setResaId] = useState<string | null>(resa ?? null);

  if (vue === "liste") {
    return (
      <AppShell attendDonnees>
        <div className="mb-3">
          <RetourVueGenerale />
        </div>
        <div className="mt-3 mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-medium text-ink">Réservations</h1>
            <p className="text-sm text-ink-subtle">Séjours, baux et paiements</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setVue("planning")}
              className="inline-flex h-11 items-center rounded-card border border-line px-4 text-sm font-medium text-ink-body md:h-10"
            >
              Planning
            </button>
            {peutReserver && (
              <Link
                to="/reservations/nouveau"
                className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-ink px-4 text-sm font-medium text-white md:h-10"
              >
                <Plus className="size-3.5" />
                <span className="sm:hidden">Créer</span>
                <span className="hidden sm:inline">Créer une réservation</span>
              </Link>
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-card border border-line bg-white">
          <TableauReservations
            {...(resa ? { focusId: resa } : {})}
            onSelectReservation={setResaId}
          />
        </div>
        {resaId ? (
          <PanneauEnDetails
            reservationId={resaId}
            onFermer={() => setResaId(null)}
          />
        ) : null}
      </AppShell>
    );
  }

  return (
    <AppShell
      attendDonnees
      titre="Réservations"
      sousTitre="Séjours planifiés, loyers et événements"
    >
      <KpiReservations />

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setVue("liste")}
          className="inline-flex h-11 items-center rounded-card border border-line px-4 text-sm font-medium text-ink-body"
        >
          Liste
        </button>
      </div>

      <div className="mt-4">
        <PlanningReservations
          onVoirListe={() => setVue("liste")}
          onSelectReservation={setResaId}
          selectedResaId={resaId}
        />
      </div>

      {resaId ? (
        <PanneauEnDetails reservationId={resaId} onFermer={() => setResaId(null)} />
      ) : null}

      <MessagesSection messages={session.messagesDash} />
      <LoyersSection
        loyers={session.loyers}
        viaPlateforme={(l) =>
          paiementViaPlateforme(
            session.reservationsDossier.find(
              (r) => r.occupant.toLowerCase() === l.locataire.toLowerCase(),
            )?.plateforme,
          )
        }
        onValider={(id) => {
          const l = session.loyers.find((x) => x.id === id);
          const via = paiementViaPlateforme(
            session.reservationsDossier.find(
              (r) => r.occupant.toLowerCase() === (l?.locataire ?? "").toLowerCase(),
            )?.plateforme,
          );
          validerLoyer(id);
          if (via && l) {
            void telechargerQuittanceLoyer(l)
              .then(() => {
                marquerQuittance(id);
                toastOk("Paiement plateforme : quittance générée automatiquement.");
              })
              .catch(() => toastErreur("Impossible de générer la quittance."));
            return;
          }
          toastOk("Paiement validé. Saisissez le montant pour la quittance.");
          if (l) setLoyerQuittance(l);
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
        saisirMontant
        viaPlateforme={paiementViaPlateforme(
          session.reservationsDossier.find(
            (r) => r.occupant.toLowerCase() === (loyerQuittance?.locataire ?? "").toLowerCase(),
          )?.plateforme,
        )}
        onConfirmer={(montant) => {
          if (!loyerQuittance) return;
          const loyer = { ...loyerQuittance, montant };
          void (async () => {
            try {
              await telechargerQuittanceLoyer(loyer);
              marquerQuittance(loyer.id);
              setLoyerQuittance(null);
              toastOk("Quittance enregistrée.");
            } catch {
              toastErreur("Impossible de générer la quittance.");
            }
          })();
        }}
      />
      <CreateEventDialog
        ouvert={creerEvent}
        onFermer={() => setCreerEvent(false)}
        onCreer={(e) => {
          ajouterEvenement(e);
          ajouterNotif({ titre: "Événement ajouté", detail: e.titre, href: "/reservations" });
          toastOk("Événement ajouté.");
        }}
      />
    </AppShell>
  );
}
