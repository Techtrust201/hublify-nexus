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
      <PageLegale titre="Conditions d'utilisation" kicker="CGU">
        <p>
          Hublify est édité par TECHTRUST AGENCY. Le compte que vous créez sert à suivre des biens,
          des réservations, des documents et des échanges.
        </p>
        <p>
          Vous restez responsable des informations saisies, des baux émis et des décisions prises à
          partir des documents. Hublify ne se substitue pas à un conseil juridique, comptable ou
          fiscal.
        </p>
        <p>
          Les prix, l'absence d'engagement et l'absence de remboursement sont décrits dans les
          conditions de vente. La création d'un compte ne déclenche aucun prélèvement.
        </p>
      </PageLegale>
    </SitePublic>
  );
}
