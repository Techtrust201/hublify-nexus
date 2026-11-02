import { createFileRoute } from "@tanstack/react-router";
import { PageLegale } from "@/components/marketing/PageLegale";
import { SitePublic } from "@/components/marque/SitePublic";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Confidentialité — Hublify" },
      { name: "description", content: "Informations sur les données traitées par Hublify." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SitePublic>
      <PageLegale titre="Confidentialité" kicker="Lien du pied de page d'authentification">
        <p>
          La maquette nomme ce lien (« Confidentialité ») sans rédiger de politique. Aucun texte
          juridique n'est donc ajouté au-delà de ce que le produit fait déjà.
        </p>
        <p>
          La landing indique que les données sont hébergées en France. La session de connexion
          repose sur un cookie httpOnly. Les pièces et dossiers saisis dans l'application servent à
          la gestion du parc du compte qui les a déposés.
        </p>
      </PageLegale>
    </SitePublic>
  );
}
