import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
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
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md rounded-card border border-line bg-white p-6 shadow-sm">
        <h1 className="text-xl font-medium text-ink">Nouveau mot de passe</h1>
        <form className="mt-6 space-y-3" onSubmit={(ev) => void enregistrer(ev)}>
          <div>
            <label htmlFor="champ-mdp-reset" className="mb-1.5 block text-xs text-ink-body">
              Mot de passe
            </label>
            <ChampMotDePasse
              id="champ-mdp-reset"
              name="password"
              required
              minLength={10}
              className="h-11 w-full rounded-card border border-line px-3 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={enCours || !pret}
            className="flex h-11 w-full items-center justify-center rounded-card bg-ink text-sm font-medium text-white disabled:opacity-50"
          >
            {enCours ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/connexion" className="text-ink">
            Connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
