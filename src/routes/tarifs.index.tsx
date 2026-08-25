import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { aLeDroit } from "@/auth/permissions";
import { PlanningGrid } from "@/components/dashboard/PlanningGrid";
import { AppShell } from "@/components/layout/AppShell";
import type { OngletPlanning } from "@/data/planning-mo1";

export const Route = createFileRoute("/tarifs/")({
  beforeLoad: ({ context }) => {
    if (!context.auth || !aLeDroit(context.auth.droits, "voir-finances")) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [{ title: "Tarifs — Hublify" }],
  }),
  component: PageTarifs,
});

function PageTarifs() {
  const [onglet, setOnglet] = useState<OngletPlanning>("tarifs");
  const navigate = useNavigate();

  return (
    <AppShell>
      <PlanningGrid
        onglet={onglet}
        vueInitiale="mois"
        onOnglet={(v) => {
          if (v === "missions") navigate({ to: "/" });
          else if (v === "reservations") navigate({ to: "/reservations" });
          else setOnglet(v);
        }}
      />
    </AppShell>
  );
}
