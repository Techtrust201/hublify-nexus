import { useDroit } from "@/auth/auth-context";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Clock, Home, User } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EcranAttente } from "@/components/layout/EcranAttente";
import {
  affecterMission,
  changerStatutMission,
  useSession,
  useSessionChargee,
} from "@/data/session";
import type { StatutPastille } from "@/data/planning-mo1";

export const Route = createFileRoute("/missions/$missionId")({
  head: () => ({
    meta: [
      { title: "Détail de la mission — Hublify" },
      {
        name: "description",
        content:
          "Détail d'une mission Hublify : bien concerné, prestataire affecté, consignes et statut.",
      },
    ],
  }),
  component: DetailMission,
});

const LIBELLE: Record<StatutPastille, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  terminee: "Terminée",
};

const SUITE: Record<StatutPastille, StatutPastille[]> = {
  a_faire: ["en_cours"],
  en_cours: ["terminee", "a_faire"],
  terminee: ["a_faire"],
};

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
      <Icone className="mt-0.5 h-4 w-4 text-ink-muted" />
      <div>
        <p className="text-xs text-ink-muted">{libelle}</p>
        <p className="text-sm text-ink">{valeur}</p>
      </div>
    </div>
  );
}

function DetailMission() {
  const { missionId } = Route.useParams();
  const { missions, biens, prestataires, reservationsDossier } = useSession();
  const peutMod = useDroit("mod-missions");
  const chargee = useSessionChargee();
  const mission = missions.find((m) => m.id === missionId);

  // Avant le chargement de l'état, l'absence ne prouve rien : la mission existe
  // peut-être. On attend d'en être sûr plutôt que d'annoncer une page inexistante.
  if (!mission) {
    if (!chargee) return <EcranAttente titre="Mission" />;
    throw notFound();
  }

  const bien = biens.find((b) => b.id === mission.bienId);
  const presta = prestataires.find((p) => p.nom === mission.assigne);
  const reservation = reservationsDossier.find(
    (r) => r.bienId === mission.bienId && r.arrivee <= mission.date && r.depart >= mission.date,
  );

  return (
    <AppShell titre={mission.titre} sousTitre={`${mission.type} · ${LIBELLE[mission.statut]}`}>
      <Link
        to="/missions"
        className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted hover:text-ink md:mb-4 md:min-h-0"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au calendrier
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-card border border-line bg-white p-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">Informations</h2>
            <span className="rounded border border-line px-2 py-1 text-xs text-ink-body">
              {LIBELLE[mission.statut]}
            </span>
          </div>
          <div className="mt-2 divide-y divide-line">
            <Ligne
              icone={CalendarDays}
              libelle="Date"
              valeur={new Date(`${mission.date}T12:00:00`).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <Ligne icone={Clock} libelle="Créneau" valeur={mission.heure} />
            <Ligne
              icone={Home}
              libelle="Bien"
              valeur={bien ? `${bien.nom}${bien.adresse ? ` — ${bien.adresse}` : ""}` : "—"}
            />
            <Ligne
              icone={User}
              libelle="Réservation liée"
              valeur={
                reservation
                  ? `${reservation.occupant} · ${reservation.arrivee} → ${reservation.depart}`
                  : "Aucune réservation sur ces dates"
              }
            />
          </div>

          <div className="mt-4 rounded-card bg-surface p-3">
            <p className="text-xs font-medium text-ink-muted">Consignes</p>
            <p className="mt-1 text-sm text-ink">{mission.description}</p>
          </div>
          {reservation && (
            <Link
              to="/reservations"
              search={{ vue: "liste", resa: reservation.id }}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-accent-teal md:min-h-0"
            >
              Ouvrir la réservation
            </Link>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-card border border-line bg-white p-4">
            <h2 className="text-sm font-semibold text-ink">Prestataire affecté</h2>
            {presta ? (
              <Link
                to="/prestataires/$prestataireId"
                params={{ prestataireId: presta.id }}
                className="mt-3 flex min-h-11 items-center gap-3 rounded-card border border-line p-3 hover:bg-surface"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-soft text-xs font-semibold text-ink">
                  {presta.nom
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">{presta.nom}</span>
                  <span className="block text-xs text-ink-muted">{presta.categorie}</span>
                </span>
              </Link>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">
                {mission.assigne || "Aucun prestataire affecté."}
              </p>
            )}

            {peutMod ? (
              <>
                <label className="mt-3 block text-xs text-ink-muted" htmlFor="affectation">
                  Affecter un prestataire
                </label>
                <select
                  id="affectation"
                  value={presta?.id ?? ""}
                  onChange={(e) => {
                    const cible = prestataires.find((p) => p.id === e.target.value);
                    affecterMission(mission.id, cible?.nom ?? "Non assigné");
                  }}
                  className="mt-1 h-11 w-full rounded-card border border-line bg-white px-2.5 py-2 text-sm"
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
              </>
            ) : null}
          </section>

          {peutMod && (
            <section className="rounded-card border border-line bg-white p-4">
              <h2 className="text-sm font-semibold text-ink">Statut</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUITE[mission.statut].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changerStatutMission(mission.id, s)}
                    className="min-h-11 rounded-card border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface md:min-h-0"
                  >
                    Passer à « {LIBELLE[s]} »
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
