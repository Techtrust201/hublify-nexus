import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

const GUIDES = [
  {
    titre: "Vue générale",
    texte: "Les cartes du jour, le planning et le panneau En détails vivent sur l'accueil.",
    vers: "/" as const,
    libelle: "Ouvrir la vue générale",
  },
  {
    titre: "Créer une mission",
    texte:
      "Le bouton Créer une Mission ouvre le formulaire complet. La mission reste au calendrier après rechargement.",
    vers: "/" as const,
    libelle: "Aller au planning",
  },
  {
    titre: "Messagerie",
    texte: "Les onglets Nouveaux, Occupants, Prestataires et Team mate ouvrent la conversation.",
    vers: "/messagerie" as const,
    libelle: "Ouvrir la messagerie",
  },
  {
    titre: "Patrimoine",
    texte: "Les couchages saisis sur la fiche lieu apparaissent dans En détails.",
    vers: "/patrimoines" as const,
    libelle: "Ouvrir le patrimoine",
  },
] as const;

export const Route = createFileRoute("/formations/utiliser")({
  head: () => ({
    meta: [
      { title: "Utiliser hublify — Hublify" },
      { name: "description", content: "Mode d'emploi court de l'espace gestionnaire." },
    ],
  }),
  component: PageUtiliser,
});

function PageUtiliser() {
  return (
    <AppShell titre="Utiliser hublify" sousTitre="Le geste utile, écran par écran">
      <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <li key={g.titre} className="flex flex-col rounded-2xl border border-line bg-white p-4">
            <h2 className="text-base text-ink">{g.titre}</h2>
            <p className="mt-1 flex-1 text-sm text-ink-body">{g.texte}</p>
            <Link
              to={g.vers}
              className="mt-3 inline-flex h-9 items-center self-start rounded-full bg-accent-teal px-4 text-sm font-medium text-white"
            >
              {g.libelle}
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
