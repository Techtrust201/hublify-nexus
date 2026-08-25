import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toastErreur, toastOk } from "@/lib/feedback";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [{ title: "Mot de passe oublié — Hublify" }],
  }),
  component: PageOublie,
});

function PageOublie() {
  const [enCours, setEnCours] = useState(false);
  const [pret, setPret] = useState(false);
  useEffect(() => setPret(true), []);

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setEnCours(true);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reinitialiser-mot-de-passe",
    });
    setEnCours(false);
    if (error) {
      toastErreur(error.message ?? "Impossible d'envoyer l'e-mail.");
      return;
    }
    toastOk("Si le compte existe, un e-mail a été envoyé.");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md rounded-card border border-line bg-white p-6 shadow-sm">
        <h1 className="text-xl font-medium text-ink">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          Indiquez votre e-mail. Vous recevrez un lien de réinitialisation.
        </p>
        <form className="mt-6 space-y-3" onSubmit={(ev) => void envoyer(ev)}>
          <label className="block">
            <span className="mb-1.5 block text-xs text-ink-body">Email</span>
            <input
              name="email"
              type="email"
              required
              className="h-11 w-full rounded-card border border-line px-3 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={enCours || !pret}
            className="flex h-11 w-full items-center justify-center rounded-card bg-ink text-sm font-medium text-white disabled:opacity-50"
          >
            {enCours ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/connexion" className="text-ink">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
