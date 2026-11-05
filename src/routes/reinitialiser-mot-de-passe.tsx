import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { boutonAuth, CadreAuth, champAuth, labelAuth } from "@/components/marque/CadreAuth";
import { ChampMotDePasse } from "@/components/ui/champ-mot-de-passe";
import { toastErreur, toastOk } from "@/lib/feedback";

export const Route = createFileRoute("/reinitialiser-mot-de-passe")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  head: () => ({
    meta: [{ title: "Nouveau mot de passe — Hublify" }],
  }),
  component: PageReset,
});

function PageReset() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [enCours, setEnCours] = useState(false);
  const [pret, setPret] = useState(false);
  useEffect(() => setPret(true), []);

  async function enregistrer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (!token) {
      toastErreur("Lien invalide ou expiré.");
      return;
    }
    setEnCours(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setEnCours(false);
    if (error) {
      toastErreur(error.message ?? "Réinitialisation impossible.");
      return;
    }
    toastOk("Mot de passe mis à jour.");
    await navigate({ to: "/connexion" });
  }

  return (
    <CadreAuth
      kicker="Récupération du compte"
      titre="Nouveau mot de passe"
      description="Choisissez un mot de passe d'au moins 10 caractères."
    >
      <form className="space-y-4" onSubmit={(ev) => void enregistrer(ev)}>
        <div>
          <label htmlFor="champ-mdp-reset" className={labelAuth}>
            Mot de passe
          </label>
          <ChampMotDePasse
            id="champ-mdp-reset"
            name="password"
            required
            minLength={10}
            autoComplete="new-password"
            className={champAuth}
          />
        </div>
        <button type="submit" disabled={enCours || !pret} className={boutonAuth}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink">
        <Link to="/connexion" className="font-semibold text-ink-deep">
          Se connecter
        </Link>
      </p>
    </CadreAuth>
  );
}
