// SOURCE: V2 Redris — « Dashboard.tsx » (variante principale) : cartes d'indicateurs,
// arrivées/départs, événements du jour. Adapté : indicateurs recentrés sur les missions.

import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarCheck, CheckCircle2, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatutBadge } from "@/components/StatutBadge";
import { useHublify } from "@/data/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vue générale — Hublify" },
      {
        name: "description",
        content:
          "Vue générale Hublify : missions du jour, biens, réservations et prestataires en un coup d'œil.",
      },
      { property: "og:title", content: "Vue générale — Hublify" },
      {
        property: "og:description",
        content: "Pilotage des missions, biens et prestataires dans Hublify.",
      },
    ],
  }),
  component: VueGenerale,
});

function Carte({
  titre,
  valeur,
  icone: Icone,
  detail,
}: {
  titre: string;
  valeur: string | number;
  icone: typeof Clock;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{titre}</p>
        <Icone className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{valeur}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function VueGenerale() {
  const { missions, biens, prestataires, reservations } = useHublify();
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const duJour = missions.filter((m) => m.date === aujourdhui);
  const aAffecter = missions.filter((m) => m.statut === "a_affecter");
  const enCours = missions.filter((m) => m.statut === "en_cours");
  const terminees = missions.filter((m) => m.statut === "terminee");
  const arrivees = reservations.filter((r) => r.arrivee >= aujourdhui).slice(0, 4);

  return (
    <AppShell titre="Vue générale" sousTitre="Activité du jour et missions à traiter">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Carte
          titre="Missions du jour"
          valeur={duJour.length}
          icone={CalendarCheck}
          detail={`${biens.length} biens suivis`}
        />
        <Carte
          titre="À affecter"
          valeur={aAffecter.length}
          icone={AlertTriangle}
          detail="Aucun prestataire assigné"
        />
        <Carte titre="En cours" valeur={enCours.length} icone={Clock} detail="Interventions ouvertes" />
        <Carte
          titre="Terminées"
          valeur={terminees.length}
          icone={CheckCircle2}
          detail={`${prestataires.filter((p) => p.actif).length} prestataires actifs`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card lg:col-span-2">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Missions du jour</h2>
            <Link to="/missions" className="text-xs font-medium text-brand hover:underline">
              Voir le calendrier
            </Link>
          </header>
          <ul className="divide-y divide-border">
            {duJour.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground">
                Aucune mission planifiée aujourd'hui.
              </li>
            )}
            {duJour.map((m) => {
              const bien = biens.find((b) => b.id === m.bienId);
              const presta = prestataires.find((p) => p.id === m.prestataireId);
              return (
                <li key={m.id}>
                  <Link
                    to="/missions/$missionId"
                    params={{ missionId: m.id }}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-accent/50"
                  >
                    <span className="w-16 text-xs text-muted-foreground">{m.heureDebut}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {m.titre}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {bien?.nom} · {presta?.nom ?? "Aucun prestataire"}
                      </span>
                    </span>
                    <StatutBadge statut={m.statut} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Prochaines arrivées</h2>
          </header>
          <ul className="divide-y divide-border">
            {arrivees.map((r) => {
              const bien = biens.find((b) => b.id === r.bienId);
              return (
                <li key={r.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{r.voyageur.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {bien?.nom} · {new Date(r.arrivee).toLocaleDateString("fr-FR")} · {r.plateforme}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
