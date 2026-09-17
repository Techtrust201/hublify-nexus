import { createFileRoute } from "@tanstack/react-router";
import { CreerBail } from "@/components/outils/CreerBail";

export const Route = createFileRoute("/outils/baux")({
  head: () => ({
    meta: [{ title: "Créer un bail — Hublify" }],
  }),
  component: CreerBail,
});
