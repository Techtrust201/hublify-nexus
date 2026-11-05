import { createFileRoute } from "@tanstack/react-router";
import { UpsellsApp } from "@/components/outils/UpsellsApp";
import { AppShell } from "@/components/layout/AppShell";
import { chargerFichesUpsellDistantes } from "@/data/outils-remote";

export const Route = createFileRoute("/outils/upsells")({
  loader: () => chargerFichesUpsellDistantes(),
  head: () => ({
    meta: [{ title: "Upsells — Hublify" }],
  }),
  component: PageUpsells,
});

function PageUpsells() {
  const charge = Route.useLoaderData();
  return (
    <AppShell attendDonnees>
      <UpsellsApp fichesInitiales={charge.ok ? charge.fiches : {}} distantOk={charge.ok} />
    </AppShell>
  );
}
