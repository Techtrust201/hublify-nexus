import { createFileRoute } from "@tanstack/react-router";
import { ArticleRessource, PageRessource } from "@/components/marketing/PageRessource";
import { SitePublic } from "@/components/marque/SitePublic";

const ARTICLES = [
  {
    id: "quittance",
    titre: "Ce qu'une quittance de loyer doit contenir",
    meta: "5 novembre 2026 · Gestion",
    paragraphes: [
      "Une quittance n'est pas un reçu bancaire. Elle dit qui a payé, pour quel logement, sur quelle période, et quels montants se décomposent entre loyer, charges et régularisation.",
      "Dans Hublify, la quittance reprend le bailleur, le locataire, la période et les montants déjà suivis sur le bien. Elle part depuis le dossier, pas depuis un tableur à part. Relisez le modèle avant le premier envoi : le logiciel ne remplace pas une relecture.",
      "Le même geste sert le bail classique et le séjour. Vous gardez une pièce datée, et le locataire la retrouve dans son espace au lieu de la chercher dans une boîte mail.",
    ],
  },
  {
    id: "un-calendrier",
    titre: "Un seul calendrier pour le saisonnier et le bail",
    meta: "5 novembre 2026 · Organisation",
    paragraphes: [
      "Beaucoup de régies tiennent deux outils : un channel manager pour l'été, un tableau pour le bail étudiant ou classique. Les chevauchements se voient trop tard, au moment du check-in ou de la remise des clés.",
      "Hublify pose les séjours et les baux sur le même planning. Une transition — fin de saison, puis location étudiante — se prépare sur le bien, avec les missions de ménage et l'état des lieux au même endroit.",
      "Le bénéfice n'est pas d'avoir plus d'écrans. C'est de savoir, un mardi matin, si le logement est libre, occupé, ou encore en prestation.",
    ],
  },
  {
    id: "expert-comptable",
    titre: "Hublify ne tient pas votre comptabilité légale",
    meta: "5 novembre 2026 · Limites",
    paragraphes: [
      "L'outil suit les loyers, les quittances, les frais de gestion et les factures propriétaire. Il ne produit pas le bilan, la liasse ni les déclarations fiscales.",
      "Gardez votre expert-comptable. Exportez-lui les pièces : elles sont déjà rattachées au bien et à la période. Vous lui évitez la reconstitution, vous ne lui retirez pas le conseil.",
      "Cette limite est volontaire. Un logiciel qui prétend tout faire mélange le suivi d'exploitation et la comptabilité légale, et c'est là que les erreurs coûtent cher.",
    ],
  },
] as const;

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Hublify" },
      {
        name: "description",
        content: "Trois notes courtes sur les quittances, le calendrier unique et la comptabilité.",
      },
    ],
  }),
  component: PageBlog,
});

function PageBlog() {
  return (
    <SitePublic>
      <PageRessource
        kicker="Blog"
        titre="Notes de gestion"
        introduction="Trois sujets que les bailleurs et les petites agences nous posent avant de déposer leurs biens. Pas de tribune : ce que Hublify fait, et ce qu'il laisse à votre expert-comptable."
        sommaire={ARTICLES.map(({ id, titre }) => ({ id, titre }))}
      >
        {ARTICLES.map((article) => (
          <ArticleRessource key={article.id} {...article} />
        ))}
      </PageRessource>
    </SitePublic>
  );
}
