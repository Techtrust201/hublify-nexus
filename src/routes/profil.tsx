import { createFileRoute } from "@tanstack/react-router";
import { estRolePortail } from "@/auth/permissions";
import { CompteGestionnaire } from "@/components/compte/CompteGestionnaire";
import { FormulaireMotDePasse } from "@/components/compte/FormulaireMotDePasse";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [{ title: "Compte gestionnaire — Hublify" }],
  }),
  component: PageProfil,
});

function PageProfil() {
  const { auth } = Route.useRouteContext();
  if (auth && estRolePortail(auth.roleId)) {
    return (
      <AppShell titre="Mon accès" sousTitre="Mot de passe de votre espace">
        <FormulaireMotDePasse />
      </AppShell>
    );
  }
  return (
    <AppShell
      attendDonnees
      titre="Compte gestionnaire"
      sousTitre="Gérez vos informations personnelles et préférences"
    >
      <CompteGestionnaire />
      <div className="mx-auto mt-4 max-w-3xl">
        <FormulaireMotDePasse />
      </div>
    </AppShell>
  );
}
