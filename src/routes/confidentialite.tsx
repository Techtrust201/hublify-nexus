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
      <PageLegale titre="Confidentialité" kicker="Données">
        <p>
          Les données du service sont hébergées en France. La session de connexion repose sur un
          cookie qui n'est pas lisible par le navigateur.
        </p>
        <p>
          Les pièces, dossiers et messages servent à la gestion du parc du compte qui les a
          déposés. Chaque accès est limité au profil : gestionnaire, propriétaire, locataire,
          voyageur, prestataire ou lecture.
        </p>
        <p>
          Les codes d'accès des logements sont chiffrés. Vous pouvez écrire à l'équipe depuis la
          page d'aide pour une question sur vos données.
        </p>
      </PageLegale>
    </SitePublic>
  );
}
