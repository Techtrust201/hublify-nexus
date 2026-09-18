// SOURCE: Maquette MO1 — Dashboard/Calendar/Missions/3days

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useDroit } from "@/auth/auth-context";
import { CreateEventDialog, QuittanceDialog } from "@/components/dashboard/DashboardDialogs";
import {
  EvenementsSection,
  KpiCards,
  LoyersSection,
  MessagesSection,
} from "@/components/dashboard/DashboardSections";
import { PlanningGrid } from "@/components/dashboard/PlanningGrid";
import { PanneauEnDetails } from "@/components/dashboard/PanneauEnDetails";
import { AppShell } from "@/components/layout/AppShell";
import { RechercheGlobale } from "@/components/layout/RechercheGlobale";
import {
  ajouterEvenement,
  ajouterNotif,
  marquerQuittance,
  useSession,
  validerLoyer,
} from "@/data/session";
import type { LoyerMo1, MissionMo1, OngletPlanning } from "@/data/planning-mo1";
import { toastErreur, toastOk } from "@/lib/feedback";
import { telechargerQuittanceLoyer } from "@/lib/exports-docs";
import { paiementViaPlateforme } from "@/data/v1-metier";

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
  const peutReserver = useDroit("mod-reservations");
  const voirFinances = useDroit("voir-finances");
  const voirMessages = useDroit("messagerie");
  const voirCalendrier = useDroit("voir-calendrier");
  const [recherche, setRecherche] = useState("");
  const [onglet, setOnglet] = useState<OngletPlanning>("missions");
  const [loyerQuittance, setLoyerQuittance] = useState<LoyerMo1 | null>(null);
  const [creerEvent, setCreerEvent] = useState(false);
  const [resaId, setResaId] = useState<string | null>(null);
  const [mission, setMission] = useState<MissionMo1 | null>(null);

  const allerOnglet = (v: OngletPlanning) => {
    if (v === "reservations") navigate({ to: "/reservations" });
    else if (v === "tarifs") navigate({ to: "/tarifs" });
    else setOnglet(v);
  };

  return (
    <AppShell attendDonnees>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RechercheGlobale valeur={recherche} onChange={setRecherche} />
        {peutReserver && (
          <Link
            to="/reservations/nouveau"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-accent-teal px-4 text-sm font-medium text-white"
          >
            <Plus className="size-3.5" />
            Créer une réservation
          </Link>
        )}
      </div>

      <KpiCards />

      {voirCalendrier && (
        <div className="mt-4">
          <PlanningGrid
            onglet={onglet}
            onOnglet={allerOnglet}
            onReservation={(id) => {
              setResaId(id);
              setMission(null);
            }}
            onMission={(m) => {
              setMission(m);
              setResaId(null);
            }}
          />
        </div>
      )}

      <PanneauEnDetails reservationId={resaId} mission={mission} />

      {voirMessages && <MessagesSection messages={session.messagesDash} />}
      {voirFinances && (
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
      )}
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
          ajouterNotif({
            titre: "Événement ajouté",
            detail: e.titre,
            href: "/",
          });
          toastOk("Événement ajouté.");
        }}
      />
    </AppShell>
  );
}
