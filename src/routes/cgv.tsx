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
      <PageLegale titre="Conditions de vente" kicker="CGV · frame CGVente">
        <p>
          Seule mention rédigée dans le cadre CGVente (annotation 327:26091) : l'abonnement est{" "}
          <strong className="font-semibold text-v1-ink">
            sans engagement mais non remboursable
          </strong>
          .
        </p>
        <p>
          Les prix affichés sur la page d'accueil sont ceux de la maquette : Solo 14,90 €, Standard
          29,90 €, Professionnel et conciergerie 99,90 € par mois. L'option annuelle indique une
          remise de 20 %. Au-delà de 10 annonces, le tarif est sur devis.
        </p>
        <p>
          Aucun prélèvement n'est réalisé tant que Stripe n'est pas connecté. Le commentaire de
          maquette « si connection stripes » et l'écran de paiement, encore une capture annotée, ne
          constituent pas un tunnel de paiement.
        </p>
        <p>
          Le freemium ne demande pas de carte bancaire. La durée d'essai reste celle indiquée dans
          la maquette par un « X » : elle n'est pas chiffrée ici.
        </p>
      </PageLegale>
    </SitePublic>
  );
}
