import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/auth/auth-context";
import { PortailShell } from "@/components/layout/PortailShell";
import { OnboardingPortail } from "@/components/portail/OnboardingPortail";
import { AccueilPortail } from "@/components/portail/VuesPortail";

export const Route = createFileRoute("/espace/")({
  head: () => ({ meta: [{ title: "Espace — Hublify" }] }),
  component: EspaceAccueil,
});

function EspaceAccueil() {
  const auth = useAuth();
  if (!auth) return <OnboardingPortail />;
  return (
    <PortailShell>
      <AccueilPortail />
    </PortailShell>
  );
}
