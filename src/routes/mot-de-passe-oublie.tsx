import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleHelp, Send, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { boutonAuth, CadreAuth, champAuth, labelAuth } from "@/components/marque/CadreAuth";
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
      <div className="space-y-4">
        <form className="space-y-4" onSubmit={(ev) => void envoyer(ev)}>
          <label className="block">
            <span className={labelAuth}>Adresse e-mail</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="camille@atelier.fr"
              className={champAuth}
            />
            <span className="mt-1.5 flex items-center gap-1.5 text-[13px] leading-4 text-ink-subtle">
              <CircleHelp className="size-3.5 shrink-0" aria-hidden />
              Vérifiez l'orthographe avant de continuer.
            </span>
          </label>
          <button type="submit" disabled={enCours || !pret} className={boutonAuth}>
            {enCours ? "Envoi…" : "Envoyer le lien de réinitialisation"}
            {enCours ? null : <Send className="size-[17px]" aria-hidden />}
          </button>
        </form>
        <div className="flex gap-3 rounded-xl bg-[#eef1fb] px-3.5 py-3.5">
          <ShieldCheck className="mt-0.5 size-[18px] shrink-0 text-brand" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink-deep">Lien valable 30 minutes</p>
            <p className="mt-0.5 text-[13px] leading-5 text-ink-body">
              Pour votre sécurité, le lien ne pourra être utilisé qu'une seule fois.
            </p>
          </div>
        </div>
        <p className="text-center text-sm text-ink">
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link to="/connexion" className="font-semibold text-ink-deep">
            Se connecter
          </Link>
        </p>
        <div className="flex gap-3 rounded-xl bg-[#f4f5f7] px-3.5 py-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-base font-semibold text-ink-deep">
            ?
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-deep">
              Vous n'avez plus accès à cet e-mail ?
            </p>
            <p className="mt-0.5 text-[13px] leading-5 text-ink-body">
              Contactez notre équipe à{" "}
              <a href="mailto:aide@hublify.app" className="underline">
                aide@hublify.app
              </a>
            </p>
          </div>
        </div>
      </div>
    </CadreAuth>
  );
}
