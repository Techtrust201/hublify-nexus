import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, FileText, Info, Wrench } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/outils/")({
  head: () => ({
    meta: [{ title: "Outils — Hublify" }],
  }),
  component: PageOutils,
});

const OUTILS = [
  {
    titre: "Modèles de documents",
    texte: "Créez et gérez vos modèles de factures, devis, quittances et contrats.",
    icone: FileText,
    vers: "/outils/modeles" as const,
  },
  {
    titre: "Vue Annuelle",
    texte: "Disponibilités, blocages et réservations sur l'année.",
    icone: CalendarDays,
    vers: "/outils/vue-annuelle" as const,
  },
  {
    titre: "Inventaire",
    texte: "Tous les inventaires de la maison sont réunis ici.",
    icone: ClipboardList,
    vers: "/inventaire" as const,
  },
  {
    titre: "Je débute",
    texte: "Parcours guidé : créer un bien, une réservation, puis une première mission.",
    icone: Info,
    vers: "/patrimoines" as const,
  },
  {
    titre: "Je découvre",
    texte: "Tous les modules de la maquette : planning, documents, messagerie, tarifs.",
    icone: Wrench,
    vers: "/" as const,
  },
];

function PageOutils() {
  return (
    <AppShell titre="Outils" sousTitre="Tous les outils">
      <div className="grid gap-4 md:grid-cols-3">
        {OUTILS.map((o) => (
          <article key={o.titre} className="rounded-[10px] border border-[#e5e7eb] bg-white p-4">
            <o.icone className="size-4 text-[#4a5565]" />
            <h2 className="mt-3 text-sm font-medium text-[#1e2939]">{o.titre}</h2>
            <p className="mt-1 text-xs text-[#6a7282]">{o.texte}</p>
            {o.vers && (
              <Link to={o.vers} className="mt-3 inline-block text-xs font-medium text-[#4a5565]">
                Ouvrir
              </Link>
            )}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
