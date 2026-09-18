import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/outils/baux")({
  beforeLoad: () => {
    throw redirect({ to: "/reservations/nouveau" });
  },
  component: () => null,
});
