import { createFileRoute } from "@tanstack/react-router";
import { estRolePortail } from "@/auth/permissions";
import { AppShell } from "@/components/layout/AppShell";
import { ParrainagePage } from "@/components/marketing/ParrainagePage";
import { SitePublic } from "@/components/marque/SitePublic";

export const Route = createFileRoute("/parrainage")({
  head: () => ({
    meta: [
      { title: "Parrainage — Hublify" },
      {
        name: "description",
        content: "Parrainage boosté : un mois offert pour vous et votre filleul.",
      },
    ],
  }),
  component: PageParrainage,
});

function PageParrainage() {
  const { auth } = Route.useRouteContext();
  if (auth && !estRolePortail(auth.roleId)) {
    return (
      <AppShell titre="Parrainage">
        <ParrainagePage />
      </AppShell>
    );
  }
  return (
    <SitePublic>
      <ParrainagePage />
    </SitePublic>
  );
}
