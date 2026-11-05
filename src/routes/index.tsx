// SOURCE: Maquette MO1 — Dashboard/Calendar/Missions/3days

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LandingPage } from "@/components/marketing/LandingPage";
import { SitePublic } from "@/components/marque/SitePublic";
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
import {
  ajouterEvenement,
  ajouterNotif,
  marquerQuittance,
  rembourserLoyer,
  useSession,
  useSessionChargee,
  validerLoyer,
} from "@/data/session";
import type { LoyerMo1, MissionMo1, OngletPlanning } from "@/data/planning-mo1";
import { toastErreur, toastOk } from "@/lib/feedback";
import { telechargerQuittanceLoyer } from "@/lib/exports-docs";
import { paiementViaPlateforme } from "@/data/v1-metier";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hublify — Tous vos biens. Un seul tableau de bord." },
      {
        name: "description",
        content: "Hublify centralise calendriers, loyers, quittances, documents et ménages.",
      },
    ],
  }),
  component: PageAccueil,
});

function PageAccueil() {
  const { auth } = Route.useRouteContext();
  if (!auth) {
    return (
      <SitePublic>
        <LandingPage />
      </SitePublic>
    );
  }
  return <VueGenerale />;
}

function VueGenerale() {
  useEffect(() => {
    document.title = "Vue générale — Hublify";
  }, []);
  const navigate = useNavigate();
  const session = useSession();
  const chargee = useSessionChargee();
  const compteVide =
    chargee &&
    session.biens.length === 0 &&
    session.reservationsDossier.length === 0 &&
    session.loyers.length === 0 &&
    session.missions.length === 0;
  const voirFinances = useDroit("voir-finances");
  const voirMessages = useDroit("messagerie");
  const voirCalendrier = useDroit("voir-calendrier");
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
      {compteVide && (
        <p className="mb-4 rounded-card border border-line bg-white px-4 py-3 text-sm text-ink-muted">
          Cet espace ne contient encore aucun logement, séjour ou loyer. Les indicateurs resteront
          à zéro tant que vous n'aurez rien enregistré.
        </p>
      )}
      <KpiCards versImpayes="/analyse" />

      {voirCalendrier && (
        <div id="planning" className="mt-4">
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
            selectedResaId={resaId}
            selectedMissionId={mission?.id}
          />
        </div>
      )}

      {(resaId || mission) && (
        <PanneauEnDetails
          reservationId={resaId}
          mission={mission}
          onFermer={() => {
            setResaId(null);
            setMission(null);
          }}
        />
      )}

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
          onValider={(id, details) => {
            const l = session.loyers.find((x) => x.id === id);
            const plateforme = session.reservationsDossier.find(
              (r) => r.occupant.toLowerCase() === (l?.locataire ?? "").toLowerCase(),
            )?.plateforme;
            const via = paiementViaPlateforme(plateforme);
            validerLoyer(
              id,
              details ?? { methode: `Versement ${plateforme ?? "plateforme"}`, reference: "" },
            );
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
          onRembourser={(id, montant) => {
            if (!rembourserLoyer(id, montant)) {
              toastErreur("Montant de remboursement invalide.");
              return;
            }
            ajouterNotif({
              titre: "Remboursement émis",
              detail: `${montant.toLocaleString("fr-FR")} €`,
              href: "/#paiements",
            });
            toastOk("Remboursement enregistré sur le reste à devoir.");
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
          const plateforme = session.reservationsDossier.find(
            (r) => r.occupant.toLowerCase() === loyer.locataire.toLowerCase(),
          )?.plateforme;
          void (async () => {
            try {
              await telechargerQuittanceLoyer(loyer);
              if (!session.loyers.find((x) => x.id === loyer.id)?.valide) {
                validerLoyer(loyer.id, {
                  methode: paiementViaPlateforme(plateforme)
                    ? `Versement ${plateforme}`
                    : "Non précisée",
                  reference: "",
                });
              }
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
