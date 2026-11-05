import { createFileRoute } from "@tanstack/react-router";
import { PageLegale } from "@/components/marketing/PageLegale";
import { SitePublic } from "@/components/marque/SitePublic";

export const Route = createFileRoute("/cgv")({
  head: () => ({
    meta: [
      { title: "Conditions de vente — Hublify" },
      { name: "description", content: "Conditions de vente de Hublify." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SitePublic>
      <PageLegale titre="Conditions de vente" kicker="Conditions de vente">
        <p>
          L'abonnement est{" "}
          <strong className="font-semibold text-v1-ink">sans engagement et non remboursable</strong>
          .
        </p>
        <p>
          Les prix affichés sur la page d'accueil sont : Solo 14,90 €, Standard 29,90 €,
          Professionnel et conciergerie 99,90 € par mois. L'option annuelle applique une remise de
          20 %. Au-delà de 10 annonces, le tarif est établi sur devis.
        </p>
        <p>
          Le compte gratuit ne demande pas de carte bancaire. Aucun prélèvement n'est lancé depuis
          l'application : la facturation d'une offre payante est confirmée avec vous avant tout
          encaissement.
        </p>
      </PageLegale>
    </SitePublic>
  );
}
