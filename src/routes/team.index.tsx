// SOURCE: Maquette MO1 — Vision TeamMate / TeamMatePage / InviteModal / EditAccessModal

import { createFileRoute, redirect } from "@tanstack/react-router";
import { aLeDroit } from "@/auth/permissions";
import { AppShell } from "@/components/layout/AppShell";
import { TeamPage } from "@/components/team/TeamPage";
import type { MembreEquipe } from "@/data/messagerie-mo1";
import { listerEquipe } from "@/lib/auth.functions";

export const Route = createFileRoute("/team/")({
  beforeLoad: ({ context }) => {
    if (!context.auth || !aLeDroit(context.auth.droits, "gerer-equipe")) {
      throw redirect({ to: "/" });
    }
  },
  loader: async () => {
    const liste = await listerEquipe();
    return liste.map(
      (m): MembreEquipe => ({
        id: m.id,
        prenom: m.prenom,
        nom: m.nom,
        initiales: m.initiales,
        statut: m.statut,
        role: m.role,
        affectation: m.affectation,
        droits: m.droits,
        email: m.email,
        protege: m.protege,
      }),
    );
  },
  head: () => ({
    meta: [{ title: "Team Mate — Hublify" }],
  }),
  component: PageTeam,
});

function PageTeam() {
  const membres = Route.useLoaderData();
  return (
    <AppShell
      titre="Team Mate"
      sousTitre="Constituez votre équipe afin de vous assister au quotidien"
    >
      <TeamPage membres={membres} />
    </AppShell>
  );
}
