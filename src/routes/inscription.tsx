import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { inscrireAdherent } from "@/lib/auth.functions";
import { ChampMotDePasse } from "@/components/ui/champ-mot-de-passe";
import { authClient } from "@/lib/auth-client";
import { toastErreur, toastOk } from "@/lib/feedback";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Inscription — Hublify" },
      { name: "description", content: "Créer votre espace Hublify." },
    ],
  }),
  component: PageInscription,
});

function PageInscription() {
  const navigate = useNavigate();
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [pret, setPret] = useState(false);
  useEffect(() => setPret(true), []);

  async function inscrire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    setEnCours(true);
    try {
      await inscrireAdherent({
        data: {
          prenom: String(donnees.get("prenom") ?? ""),
          nom: String(donnees.get("nom") ?? ""),
          email: String(donnees.get("email") ?? "").trim(),
          password: String(donnees.get("password") ?? ""),
          nomOrg: String(donnees.get("nomOrg") ?? ""),
        },
      });
      const { error } = await authClient.signIn.email({
        email: String(donnees.get("email") ?? "").trim(),
        password: String(donnees.get("password") ?? ""),
      });
      if (error) {
        toastOk("Compte créé. Connectez-vous.");
        await navigate({ to: "/connexion" });
        return;
      }
      toastOk("Espace créé.");
      await router.invalidate();
      await navigate({ to: "/" });
    } catch (err) {
      toastErreur(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md rounded-card border border-line bg-white p-6 shadow-sm">
        <p className="text-[10px] uppercase tracking-[0.3px] text-ink-muted">Hublify</p>
        <h1 className="mt-1 text-xl font-medium text-ink">Créer un espace</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          Votre organisation démarre vide. Aucun parc n'est copié depuis un autre client.
        </p>
        <form className="mt-6 space-y-3" onSubmit={(ev) => void inscrire(ev)}>
          <label className="block">
            <span className="mb-1.5 block text-xs text-ink-body">Prénom</span>
            <input name="prenom" required className={champ} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-ink-body">Nom</span>
            <input name="nom" className={champ} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-ink-body">Organisation</span>
            <input name="nomOrg" required minLength={2} className={champ} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-ink-body">Email</span>
            <input name="email" type="email" autoComplete="username" required className={champ} />
          </label>
          <div>
            <label htmlFor="champ-mdp-inscription" className="mb-1.5 block text-xs text-ink-body">
              Mot de passe
            </label>
            <ChampMotDePasse
              id="champ-mdp-inscription"
              name="password"
              autoComplete="new-password"
              required
              minLength={10}
              className={champ}
            />
          </div>
          <button
            type="submit"
            disabled={enCours || !pret}
            className="flex h-11 w-full items-center justify-center rounded-card bg-ink text-sm font-medium text-white disabled:opacity-50"
          >
            {enCours ? "Création…" : "Créer mon espace"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-subtle">
          Déjà un compte ?{" "}
          <Link to="/connexion" className="font-medium text-ink">
            Connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

const champ =
  "h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none";
