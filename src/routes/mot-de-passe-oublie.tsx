import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { boutonAuth, CadreAuth, champAuth } from "@/components/marque/CadreAuth";
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
    <CadreAuth
      kicker="Récupération du compte"
      titre="Mot de passe oublié ?"
      description="Indiquez l'adresse e-mail utilisée lors de votre inscription. Nous vous enverrons un lien sécurisé."
    >
      <form className="space-y-3" onSubmit={(ev) => void envoyer(ev)}>
        <label className="block">
          <span className="mb-1.5 block text-xs text-v1-ink-body">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="camille@atelier.fr"
            className={champAuth}
          />
        </label>
        <button type="submit" disabled={enCours || !pret} className={boutonAuth}>
          {enCours ? "Envoi…" : "Envoyer le lien de réinitialisation"}
        </button>
      </form>
      <div className="mt-4 rounded-xl bg-v1-brand-soft px-4 py-3 text-sm text-v1-ink">
        <p className="font-semibold">Lien valable 30 minutes</p>
        <p className="mt-1 text-v1-ink-body">
          Pour votre sécurité, le lien ne pourra être utilisé qu'une seule fois.
        </p>
      </div>
      <p className="mt-4 text-center text-sm text-v1-ink-body">
        Vous vous souvenez de votre mot de passe ?{" "}
        <Link to="/connexion" className="font-medium text-v1-brand">
          Se connecter
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-v1-ink-muted">
        Vous n'avez plus accès à cet e-mail ?{" "}
        <Link to="/faq" className="font-medium text-v1-ink">
          Contactez notre équipe
        </Link>
      </p>
    </CadreAuth>
  );
}
