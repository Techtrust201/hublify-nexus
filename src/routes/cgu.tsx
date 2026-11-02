import { createFileRoute } from "@tanstack/react-router";
import { PageLegale } from "@/components/marketing/PageLegale";
import { SitePublic } from "@/components/marque/SitePublic";

export const Route = createFileRoute("/cgu")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — Hublify" },
      { name: "description", content: "Conditions d'utilisation de Hublify." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <SitePublic>
      <PageLegale titre="Conditions d'utilisation" kicker="CGU · frame 327:26088">
        <p>
          Le cadre « CGU » de la maquette Hublify V1.0 est vide : aucun article n'y est rédigé.
          Cette page ne publie donc pas de clauses inventées.
        </p>
        <p>
          En créant un espace, vous utilisez un outil de gestion locative. Vous restez responsable
          des informations saisies, des baux émis et des décisions prises à partir des documents.
        </p>
        <p>
          Les conditions commerciales figurant dans la maquette sont portées par les conditions de
          vente : l'abonnement est sans engagement, et les sommes encaissées ne sont pas
          remboursables.
        </p>
      </PageLegale>
    </SitePublic>
  );
}
