import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLegale } from "@/components/marketing/PageLegale";
import { SitePublic } from "@/components/marque/SitePublic";

export const Route = createFileRoute("/cgv")({
  head: () => ({
    meta: [
      { title: "Conditions de vente — Hublify" },
      {
        name: "description",
        content:
          "Conditions de vente de Hublify : offres, prix, absence d'engagement et résiliation.",
      },
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
          . Hublify est édité par TECHTRUST AGENCY. Ces conditions décrivent uniquement la vente de
          l'accès au logiciel. Elles ne couvrent pas les baux, cautions ou honoraires que le
          gestionnaire encaisse pour le compte de ses mandants.
        </p>
        <h2 className="text-base font-semibold text-v1-ink">Offres et prix</h2>
        <p>
          Les prix affichés sur la page d'accueil sont : Solo 14,90 €, Standard 29,90 €,
          Professionnel et conciergerie 99,90 € par mois. L'option annuelle applique une remise de
          20 %. Au-delà de 10 annonces, le tarif est établi sur devis.
        </p>
        <p>
          Dans l'espace gestionnaire, les paliers Essentiel, Confort et Agence décrivent le
          périmètre d'usage (équipe, portail, carte professionnelle). Ils ne créent pas un prix
          différent de ceux affichés ici tant qu'aucun devis n'a été accepté.
        </p>
        <h2 className="text-base font-semibold text-v1-ink">Souscription et paiement</h2>
        <p>
          Le compte gratuit ne demande pas de carte bancaire. Aucun prélèvement n'est lancé depuis
          l'application : la facturation d'une offre payante est confirmée avec vous avant tout
          encaissement. Aucune carte n'est reliée à l'abonnement dans cette version. La passerelle
          affichée dans les paramètres sert aux dépôts de garantie des voyageurs, pas à l'abonnement
          Hublify.
        </p>
        <h2 className="text-base font-semibold text-v1-ink">Durée et résiliation</h2>
        <p>
          L'abonnement court au mois, ou à l'année si l'option annuelle a été choisie. Vous pouvez
          demander la résiliation depuis Paramétrage, bouton « Me désabonner ». La demande est
          enregistrée sur le compte. Elle ne résilie aucun prélèvement, puisqu'aucun n'est lancé
          depuis l'application.
        </p>
        <h2 className="text-base font-semibold text-v1-ink">Données du compte</h2>
        <p>
          « Effacer les textes de relance » retire les messages de relance et ramène l'offre au
          palier Essentiel. Le compte, les biens, les documents et les conversations restent. La
          suppression d'un membre d'équipe retire son accès, pas les dossiers déjà créés.
        </p>
        <p>
          <Link to="/cgu" className="underline">
            Conditions d'utilisation
          </Link>
          {" · "}
          <Link to="/connexion" className="underline">
            Retour à la connexion
          </Link>
        </p>
      </PageLegale>
    </SitePublic>
  );
}
