import { createFileRoute } from "@tanstack/react-router";
import { ChoixOffre } from "@/components/marketing/ChoixOffre";

export const Route = createFileRoute("/choix-du-profil")({
  head: () => ({
    meta: [
      { title: "Choix du profil — Hublify" },
      {
        name: "description",
        content: "Freemium, Solo, Standard ou professionnel : choisissez votre offre Hublify.",
      },
    ],
  }),
  component: ChoixOffre,
});
