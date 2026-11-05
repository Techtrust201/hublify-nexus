import { createFileRoute } from "@tanstack/react-router";
import { TimelineApp } from "@/components/outils/TimelineApp";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/outils/timeline")({
  head: () => ({
    meta: [{ title: "Timeline — Hublify" }],
  }),
  component: PageTimeline,
});

function PageTimeline() {
  return (
    <AppShell attendDonnees>
      <TimelineApp />
    </AppShell>
  );
}
