// SOURCE: V2 Redris — « Voir infos missions », « Détails », « Membres assignés », « Fiche intervention »
// Adapté : assemblage en une page unique. Enchaînement des statuts = HYPOTHÈSE — À VALIDER.

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Clock, Home, User } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatutBadge } from "@/components/StatutBadge";
import { LIBELLE_STATUT, TRANSITIONS } from "@/data/statuts";
import { affecterPrestataire, changerStatutMission, useHublify } from "@/data/store";

export const Route = createFileRoute("/missions/$missionId")({
  head: () => ({
    meta: [
      { title: "Détail de la mission — Hublify" },
      {
        name: "description",
        content:
          "Détail d'une mission Hublify : bien concerné, réservation liée, prestataire affecté, consignes et statut.",
      },
      { property: "og:title", content: "Détail de la mission — Hublify" },
      {
        property: "og:description",
        content: "Consignes, affectation et suivi du statut d'une intervention.",
      },
    ],
  }),
  component: DetailMission,
});

function Ligne({
  icone: Icone,
  libelle,
  valeur,
}: {
  icone: typeof Home;
  libelle: string;
  valeur: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icone className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{libelle}</p>
        <p className="text-sm text-foreground">{valeur}</p>
      </div>
    </div>
  );
}

function DetailMission() {
  const { missionId } = Route.useParams();
  const { missions, biens, prestataires, reservations } = useHublify();
  const mission = missions.find((m) => m.id === missionId);

  if (!mission) throw notFound();

  const bien = biens.find((b) => b.id === mission.bienId);
  const presta = prestataires.find((p) => p.id === mission.prestataireId);
  const reservation = reservations.find((r) => r.id === mission.reservationId);

  return (
    <AppShell titre={mission.titre} sousTitre={`${mission.reference} · ${mission.type}`}>
      <Link
        to="/missions"
        className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground md:mb-4 md:min-h-0"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au calendrier
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Informations</h2>
            <StatutBadge statut={mission.statut} />
          </div>
          <div className="mt-2 divide-y divide-border">
            <Ligne
              icone={CalendarDays}
              libelle="Date"
              valeur={new Date(mission.date).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <Ligne
              icone={Clock}
              libelle="Créneau"
              valeur={`${mission.heureDebut} – ${mission.heureFin}`}
            />
            <Ligne
              icone={Home}
              libelle="Bien"
              valeur={bien ? `${bien.nom} — ${bien.adresse}, ${bien.ville}` : "—"}
            />
            <Ligne
              icone={User}
              libelle="Réservation liée"
              valeur={
                reservation
                  ? `${reservation.voyageur.nom} · ${reservation.plateforme} · ${new Date(
                      reservation.arrivee,
                    ).toLocaleDateString("fr-FR")} → ${new Date(reservation.depart).toLocaleDateString("fr-FR")}`
                  : "Aucune réservation liée"
              }
            />
          </div>

          <div className="mt-4 rounded-lg bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">Consignes</p>
            <p className="mt-1 text-sm text-foreground">{mission.consignes}</p>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">Prestataire affecté</h2>
            {presta ? (
              <Link
                to="/prestataires/$prestataireId"
                params={{ prestataireId: presta.id }}
                className="mt-3 flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-strong">
                  {presta.nom
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <span>
                  <span className="block text-sm font-medium text-foreground">{presta.nom}</span>
                  <span className="block text-xs text-muted-foreground">{presta.categorie}</span>
                </span>
              </Link>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Aucun prestataire affecté.</p>
            )}

            <label className="mt-3 block text-xs text-muted-foreground" htmlFor="affectation">
              Affecter un prestataire
            </label>
            <select
              id="affectation"
              value={mission.prestataireId ?? ""}
              onChange={(e) => affecterPrestataire(mission.id, e.target.value || null)}
              className="mt-1 h-11 w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm md:h-auto"
            >
              <option value="">— Aucun —</option>
              {prestataires
                .filter((p) => p.actif)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} · {p.categorie}
                  </option>
                ))}
            </select>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">Statut</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Statuts provisoires — hypothèse à valider.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TRANSITIONS[mission.statut].map((s) => (
                <button
                  key={s}
                  onClick={() => changerStatutMission(mission.id, s)}
                  className="min-h-11 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent md:min-h-0"
                >
                  Passer à « {LIBELLE_STATUT[s]} »
                </button>
              ))}
              {TRANSITIONS[mission.statut].length === 0 && (
                <p className="text-xs text-muted-foreground">Aucune transition disponible.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
