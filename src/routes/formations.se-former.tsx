import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import { ajouterNotif, useSession } from "@/data/session";
import { toastOk } from "@/lib/feedback";
import { cn } from "@/lib/utils";

const MODULES = [
  {
    id: "formation-reservations",
    titre: "Réservations et planning",
    texte: "Lire un séjour, filtrer les check-in et ouvrir le panneau En détails.",
    vers: "/reservations" as const,
  },
  {
    id: "formation-missions",
    titre: "Missions et prestataires",
    texte: "Créer une mission, la signifier et suivre son envoi.",
    vers: "/" as const,
  },
  {
    id: "formation-paiements",
    titre: "Paiements et relances",
    texte: "Encaisser un loyer, armer la relance automatique, émettre la quittance.",
    vers: "/analyse" as const,
  },
] as const;

export const Route = createFileRoute("/formations/se-former")({
  head: () => ({
    meta: [
      { title: "Se Former — Hublify" },
      { name: "description", content: "Parcours de prise en main de l'espace gestionnaire." },
    ],
  }),
  component: PageSeFormer,
});

function PageSeFormer() {
  const auth = useAuth();
  const session = useSession();
  const faits = new Set(session.notifications.map((n) => n.id));

  return (
    <AppShell titre="Se Former" sousTitre="Trois modules pour prendre l'espace en main">
      <ol className="mx-auto max-w-2xl space-y-3">
        {MODULES.map((m, i) => {
          const fait = faits.has(m.id);
          return (
            <li key={m.id} className="rounded-2xl border border-line bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-ink-muted">Module {i + 1}</p>
              <h2 className="mt-1 text-lg text-ink">{m.titre}</h2>
              <p className="mt-1 text-sm text-ink-body">{m.texte}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={m.vers}
                  className="inline-flex h-9 items-center rounded-full border border-line px-4 text-sm text-ink"
                >
                  Ouvrir
                </Link>
                <button
                  type="button"
                  disabled={fait}
                  onClick={() => {
                    ajouterNotif({
                      id: m.id,
                      titre: `Formation terminée — ${m.titre}`,
                      detail: auth ? `${auth.prenom} ${auth.nom}` : "Gestionnaire",
                      href: "/formations/se-former",
                    });
                    toastOk("Module enregistré.");
                  }}
                  className={cn(
                    "inline-flex h-9 items-center gap-1 rounded-full px-4 text-sm text-white",
                    fait ? "bg-ink-muted" : "bg-accent-teal",
                  )}
                >
                  {fait && <Check className="size-3.5" />}
                  {fait ? "Terminé" : "J'ai terminé ce module"}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </AppShell>
  );
}
