// SOURCE: V2 Redris — « Mes prestataires », « Prestataires (5) »
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Star } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSession } from "@/data/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prestataires/")({
  head: () => ({
    meta: [
      { title: "Prestataires — Hublify" },
      {
        name: "description",
        content:
          "Annuaire des prestataires Hublify : ménage, maintenance, blanchisserie, accueil et jardinage par ville.",
      },
      { property: "og:title", content: "Prestataires — Hublify" },
      {
        property: "og:description",
        content: "Liste des prestataires, catégories et disponibilité.",
      },
    ],
  }),
  component: ListePrestataires,
});

function ListePrestataires() {
  const { prestataires, missions } = useSession();
  const [categorie, setCategorie] = useState("toutes");
  const categories = ["toutes", ...new Set(prestataires.map((p) => p.categorie))];

  const liste =
    categorie === "toutes" ? prestataires : prestataires.filter((p) => p.categorie === categorie);

  return (
    <AppShell
      titre="Prestataires"
      sousTitre={`${prestataires.length} prestataires enregistrés`}
      actions={
        <Link
          to="/prestataires/nouveau"
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 md:min-h-0"
        >
          <Plus className="h-4 w-4" /> Ajouter
        </Link>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategorie(c)}
            className={cn(
              "inline-flex h-11 min-h-11 items-center rounded-full border px-3 text-sm font-medium md:h-auto md:min-h-0 md:py-1 md:text-xs",
              categorie === c
                ? "border-brand bg-brand-soft text-brand-strong"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {c === "toutes" ? "Toutes les catégories" : c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {liste.map((p) => {
          const nb = missions.filter((m) => m.assigne === p.nom).length;
          return (
            <Link
              key={p.id}
              to="/prestataires/$prestataireId"
              params={{ prestataireId: p.id }}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">
                    {p.nom
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-foreground">{p.nom}</span>
                    <span className="block text-xs text-muted-foreground">{p.categorie}</span>
                  </span>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs",
                    p.actif
                      ? "border-success/30 bg-success-soft text-success-strong"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {p.actif ? "Actif" : "Inactif"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.ville}</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" /> {p.note.toFixed(1)} · {nb} mission
                  {nb > 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
