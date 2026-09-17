import { createFileRoute } from "@tanstack/react-router";
import { PortailShell } from "@/components/layout/PortailShell";
import { ContactsPortail } from "@/components/portail/VuesPortail";

export const Route = createFileRoute("/espace/contacts")({
  head: () => ({ meta: [{ title: "Contacts — Espace Hublify" }] }),
  component: () => (
    <PortailShell titre="Contacts">
      <ContactsPortail />
    </PortailShell>
  ),
});
