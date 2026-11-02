import { createFileRoute, Link } from "@tanstack/react-router";
import { estRolePortail } from "@/auth/permissions";
import { AppShell } from "@/components/layout/AppShell";
import { FaqListe } from "@/components/marketing/FaqListe";
import { SitePublic } from "@/components/marque/SitePublic";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Hublify" },
      { name: "description", content: "Questions fréquentes avant de démarrer sur Hublify." },
    ],
  }),
  component: PageFaq,
});

function PageFaq() {
  const { auth } = Route.useRouteContext();
  const corps = (
    <div className="mx-auto max-w-3xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-v1-brand">
        FAQ et ressources
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-v1-ink">
        Questions fréquemment posées
      </h1>
      <div className="mt-6">
        <FaqListe idPrefix="page-faq" />
      </div>
      <p className="mt-8 text-center text-lg text-v1-ink">
        Vous n'avez pas trouvé de réponse à votre question ?
      </p>
      <div className="mt-4 flex justify-center">
        {auth && !estRolePortail(auth.roleId) ? (
          <Link
            to="/messagerie"
            className="inline-flex h-12 items-center rounded-full bg-v1-ink px-6 text-sm font-medium text-white"
          >
            Contactez le support via la messagerie
          </Link>
        ) : (
          <Link
            to="/connexion"
            className="inline-flex h-12 items-center rounded-full bg-v1-ink px-6 text-sm font-medium text-white"
          >
            Contactez le support via la messagerie
          </Link>
        )}
      </div>
    </div>
  );

  if (auth && !estRolePortail(auth.roleId)) {
    return <AppShell titre="FAQ et ressources">{corps}</AppShell>;
  }
  return <SitePublic>{<div className="px-5 py-16">{corps}</div>}</SitePublic>;
}
