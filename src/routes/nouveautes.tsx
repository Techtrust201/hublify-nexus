import { createFileRoute } from "@tanstack/react-router";
import { ArticleRessource, PageRessource } from "@/components/marketing/PageRessource";
import { SitePublic } from "@/components/marque/SitePublic";

const ENTREES = [
  {
    id: "auth",
    titre: "Connexion, inscription et mot de passe",
    meta: "5 novembre 2026",
    paragraphes: [
      "Les écrans d'entrée sont centrés sur fond blanc, avec un bouton principal sur toute la largeur du formulaire. Le mot de passe demandé fait au moins 10 caractères, avec un chiffre et un caractère spécial.",
      "La connexion avec Google n'est pas affichée : elle n'est pas encore ouverte. Le lien de réinitialisation part vers l'adresse du compte, et l'aide écrit à aide@hublify.app.",
    ],
  },
  {
    id: "gestionnaire",
    titre: "Espace gestionnaire",
    meta: "5 novembre 2026",
    paragraphes: [
      "Le fond de l'application est le beige #EAE7DE. Les cartes sont blanches, bordure #E5E7EB, coins de 10 px. Le bouton primaire est le sarcelle #5591A9. Le texte courant est en Inter.",
      "L'analyse se filtre par mois. Les tarifs montrent les événements du planning. Une quittance et une note se saisissent depuis le tableau, sans quitter le bien.",
    ],
  },
  {
    id: "portail",
    titre: "Portail voyageur et prestataire",
    meta: "5 novembre 2026",
    paragraphes: [
      "Le portail mobile est composé en Lexend Deca, sur la largeur d'un téléphone. L'accueil dépend du rôle : le résident voit ses tâches, le prestataire sa journée.",
      "Les documents, le calendrier et les messages restent dans cet espace. Le profil s'ouvre depuis l'avatar, pas depuis un écran à part inventé pour la démo.",
    ],
  },
] as const;

export const Route = createFileRoute("/nouveautes")({
  head: () => ({
    meta: [
      { title: "Nouveautés — Hublify" },
      {
        name: "description",
        content: "Ce qui a été livré dans Hublify dans la nuit du 5 novembre 2026.",
      },
    ],
  }),
  component: PageNouveautes,
});

function PageNouveautes() {
  return (
    <SitePublic>
      <PageRessource
        kicker="Nouveautés"
        titre="Journal du 5 novembre 2026"
        introduction="Ce qui est en place ce matin pour les personnes qui ouvrent Hublify. Pas une liste de commits : les changements que vous pouvez voir."
        sommaire={ENTREES.map(({ id, titre }) => ({ id, titre }))}
      >
        {ENTREES.map((entree) => (
          <ArticleRessource key={entree.id} {...entree} />
        ))}
      </PageRessource>
    </SitePublic>
  );
}
