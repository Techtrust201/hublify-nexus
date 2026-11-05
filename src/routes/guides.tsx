import { createFileRoute, Link } from "@tanstack/react-router";
import { ArticleRessource, PageRessource } from "@/components/marketing/PageRessource";
import { SitePublic } from "@/components/marque/SitePublic";

const GUIDES = [
  {
    id: "offre",
    titre: "Ouvrir un espace sans carte bancaire",
    meta: "Guide · Premiers pas",
    paragraphes: [
      "Depuis l'accueil, « essayer gratuitement » ouvre le choix du profil. Freemium ne demande pas de carte. Solo et Standard affichent le mois et l'année (−20 %). Professionnel part sur devis.",
      "L'inscription demande un prénom, un nom, une adresse e-mail et un mot de passe d'au moins 10 caractères, avec un chiffre et un caractère spécial. Aucun prélèvement n'est lancé depuis ce formulaire.",
      "Une fois connecté, l'espace est vide : vos biens, pas un parc de démonstration. Vous ajoutez le premier logement quand vous êtes prêt.",
    ],
  },
  {
    id: "dossier",
    titre: "Constituer un dossier locataire une seule fois",
    meta: "Guide · Location",
    paragraphes: [
      "Le candidat dépose ses pièces dans son espace, recto et verso pour la pièce d'identité, en photo ou en fichier. Vous ne les recevez pas en pièces jointes éparpillées.",
      "Vous ouvrez ensuite un accès limité dans le temps. Le lien peut être révoqué. Les documents confidentiels restent rattachés au dossier, pas à une messagerie personnelle.",
      "Hublify ne juge pas le dossier à votre place. Il le rend lisible : identité, ressources, pièces demandées, et l'historique de ce qui a déjà été transmis.",
    ],
  },
  {
    id: "loyer",
    titre: "Suivre un loyer et envoyer la quittance",
    meta: "Guide · Encaissement",
    paragraphes: [
      "Chaque échéance du bail apparaît sur le bien. Vous voyez ce qui est à jour, en attente, ou à relancer, sans rouvrir trois tableurs.",
      "Quand le paiement est pointé, la quittance reprend le bailleur, le locataire, la période et les montants. Le locataire la retrouve dans son espace.",
      "La relance reste un message que vous pouvez relire avant envoi. Le logiciel ne promet pas de recouvrer à votre place.",
    ],
  },
] as const;

export const Route = createFileRoute("/guides")({
  head: () => ({
    meta: [
      { title: "Guides bailleurs — Hublify" },
      {
        name: "description",
        content: "Trois guides courts : ouvrir un espace, un dossier locataire, un loyer.",
      },
    ],
  }),
  component: PageGuides,
});

function PageGuides() {
  return (
    <SitePublic>
      <PageRessource
        kicker="Guides bailleurs"
        titre="Trois parcours, sans détour"
        introduction="De l'ouverture du compte jusqu'à la quittance. Chaque guide s'arrête au geste que vous faites dans Hublify."
        sommaire={GUIDES.map(({ id, titre }) => ({ id, titre }))}
      >
        {GUIDES.map((guide) => (
          <ArticleRessource key={guide.id} {...guide} />
        ))}
        <p className="text-sm">
          <Link to="/choix-du-profil" className="font-medium text-v1-brand">
            Choisir un profil
          </Link>
        </p>
      </PageRessource>
    </SitePublic>
  );
}
