// SOURCE: V2 Redris — fiche prestataire (« Mes prestataires » / détail)
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Mail, MapPin, Phone, Star } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatutBadge } from "@/components/StatutBadge";
import { useHublify } from "@/data/store";

export const Route = createFileRoute("/prestataires/$prestataireId")({
  head: () => ({
    meta: [
      { title: "Fiche prestataire — Hublify" },
      {
        name: "description",
        content:
          "Fiche prestataire Hublify : coordonnées, catégorie d'intervention et missions affectées.",
      },
      { property: "og:title", content: "Fiche prestataire — Hublify" },
      {
        property: "og:description",
        content: "Coordonnées et missions affectées à un prestataire.",
      },
    ],
  }),
  component: FichePrestataire,
});

function FichePrestataire() {
  const { prestataireId } = Route.useParams();
  const { prestataires, missions, biens } = useHublify();
  const presta = prestataires.find((p) => p.id === prestataireId);

  if (!presta) throw notFound();

  const siennes = missions
    .filter((m) => m.prestataireId === presta.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AppShell titre={presta.nom} sousTitre={`${presta.categorie} · ${presta.ville}`}>
      <Link
        to="/prestataires"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux prestataires
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-base font-semibold text-brand-strong">
              {presta.nom
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{presta.nom}</p>
              <p className="text-xs text-muted-foreground">
                {presta.actif ? "Actif" : "Inactif"} · {presta.categorie}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" /> {presta.telephone}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> {presta.email}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {presta.ville}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Star className="h-4 w-4" /> {presta.note.toFixed(1)} / 5
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card lg:col-span-2">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Missions affectées ({siennes.length})
            </h2>
          </header>
          <ul className="divide-y divide-border">
            {siennes.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground">Aucune mission affectée.</li>
            )}
            {siennes.map((m) => (
              <li key={m.id}>
                <Link
                  to="/missions/$missionId"
                  params={{ missionId: m.id }}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-accent/50"
                >
                  <span className="w-28 text-xs text-muted-foreground">
                    {new Date(m.date).toLocaleDateString("fr-FR")} · {m.heureDebut}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {m.titre}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {biens.find((b) => b.id === m.bienId)?.nom}
                    </span>
                  </span>
                  <StatutBadge statut={m.statut} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
