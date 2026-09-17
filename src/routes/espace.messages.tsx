import { createFileRoute } from "@tanstack/react-router";
import { PortailShell } from "@/components/layout/PortailShell";
import { MessagesPortail } from "@/components/portail/VuesPortail";

export const Route = createFileRoute("/espace/messages")({
  head: () => ({ meta: [{ title: "Messages — Espace Hublify" }] }),
  component: () => (
    <PortailShell titre="Messages">
      <MessagesPortail />
    </PortailShell>
  ),
});
