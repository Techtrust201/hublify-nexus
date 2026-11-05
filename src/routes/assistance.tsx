import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/auth/auth-context";
import { AppShell } from "@/components/layout/AppShell";
import { ajouterMessageDash, ajouterNotif, idNouveau } from "@/data/session";
import { toastErreur, toastOk } from "@/lib/feedback";

export const Route = createFileRoute("/assistance")({
  head: () => ({
    meta: [
      { title: "Contact 24/24h — Hublify" },
      { name: "description", content: "Écrire à l'assistance Hublify, jour et nuit." },
    ],
  }),
  component: PageAssistance,
});

function PageAssistance() {
  const auth = useAuth();
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [envoye, setEnvoye] = useState(false);

  return (
    <AppShell
      titre="Contact 24/24h"
      sousTitre="Un message suffit. Il reste dans la messagerie de l'équipe."
    >
      <form
        className="mx-auto max-w-xl space-y-3 rounded-2xl border border-line bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const titre = sujet.trim();
          const texte = message.trim();
          if (titre.length < 3 || texte.length < 8) {
            toastErreur("Indiquez un sujet et un message.");
            return;
          }
          const auteur = auth ? `${auth.prenom} ${auth.nom}` : "Gestionnaire";
          ajouterMessageDash({
            id: idNouveau("msg"),
            canal: "team",
            auteur,
            initiales: auth?.initiales ?? "??",
            texte: `${titre} — ${texte}`,
            ilYa: "à l'instant",
          });
          ajouterNotif({
            titre: "Demande d'assistance",
            detail: titre,
            href: "/assistance",
          });
          setEnvoye(true);
          setSujet("");
          setMessage("");
          toastOk("Message transmis à l'équipe.");
        }}
      >
        <label className="block text-sm text-ink">
          Sujet
          <input
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            required
            className="mt-1 h-11 w-full rounded-full border border-line px-4 text-sm outline-none"
          />
        </label>
        <label className="block text-sm text-ink">
          Message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            className="mt-1 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-white"
        >
          Envoyer à l'assistance
        </button>
        {envoye && (
          <p className="text-sm text-ink-body" role="status">
            Demande enregistrée. Elle apparaît dans Les Messages, onglet Team mate.
          </p>
        )}
      </form>
    </AppShell>
  );
}
