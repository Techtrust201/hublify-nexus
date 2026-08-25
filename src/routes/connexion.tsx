import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SUPER_ADMINS } from "@/auth/permissions";
import { ChampMotDePasse } from "@/components/ui/champ-mot-de-passe";
import { authClient } from "@/lib/auth-client";
import { getSession } from "@/lib/auth.functions";
import { toastErreur, toastOk } from "@/lib/feedback";

const MDP_DEMO = "Hublify-Demo-2026!";

export const Route = createFileRoute("/connexion")({
  beforeLoad: async () => {
    const deja = await getSession();
    if (deja) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Connexion — Hublify" },
      { name: "description", content: "Connexion à l'espace Hublify." },
    ],
  }),
  component: PageConnexion,
});

// Recette : panneau des comptes de démo visible (iPhone / associés).
// À masquer (`VITE_MODE_DEMO=0`) avant un déploiement client réel.
const MODE_DEMO = import.meta.env["VITE_MODE_DEMO"] !== "0";

const COMPTES_FONDATEURS = SUPER_ADMINS.map((c) => ({
  email: c.email,
  nom: `${c.prenom} ${c.nom}`,
  role: "Super-administrateur",
}));

const COMPTES_DEMO = [
  { email: "amelie.dubois@hublify.app", role: "Gestionnaire" },
  { email: "lucas.menage@hublify.app", role: "Prestataire" },
  { email: "claire.lecture@hublify.app", role: "Lecture" },
];

function PageConnexion() {
  const navigate = useNavigate();
  const router = useRouter();
  const champEmail = useRef<HTMLInputElement>(null);
  const champMdp = useRef<HTMLInputElement>(null);
  const [enCours, setEnCours] = useState(false);
  // La page est servie par le serveur : jusqu'à l'hydratation, un clic partirait
  // en soumission native. Le bouton signale l'attente au lieu de perdre la saisie.
  const [pret, setPret] = useState(false);
  useEffect(() => setPret(true), []);

  function remplirCompte(email: string) {
    if (champEmail.current) champEmail.current.value = email;
    if (champMdp.current) champMdp.current.value = MDP_DEMO;
    champMdp.current?.focus();
  }

  async function connecter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Champs non contrôlés : l'hydratation ne doit pas écraser ce qui a déjà été tapé.
    const donnees = new FormData(e.currentTarget);
    setEnCours(true);
    const { error } = await authClient.signIn.email({
      email: String(donnees.get("email") ?? "").trim(),
      password: String(donnees.get("password") ?? ""),
    });
    setEnCours(false);
    if (error) {
      toastErreur(error.message ?? "Identifiants incorrects.");
      return;
    }
    toastOk("Connexion réussie.");
    await router.invalidate();
    await navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md rounded-card border border-line bg-white p-6 shadow-sm">
        <p className="text-[10px] uppercase tracking-[0.3px] text-ink-muted">Hublify</p>
        <h1 className="mt-1 text-xl font-medium text-ink">Connexion</h1>
        <p className="mt-1 text-sm text-ink-subtle">
          Espace sécurisé — session chiffrée, cookie httpOnly, droits côté serveur.
        </p>

        <form className="mt-6 space-y-3" onSubmit={(ev) => void connecter(ev)}>
          <label className="block">
            <span className="mb-1.5 block text-xs text-ink-body">Email</span>
            <input
              ref={champEmail}
              name="email"
              type="email"
              autoComplete="username"
              required
              defaultValue={MODE_DEMO ? "contact@tech-trust.fr" : ""}
              className="h-11 w-full rounded-card border border-line px-3 text-sm text-ink outline-none"
            />
          </label>
          <div>
            <label htmlFor="champ-mdp" className="mb-1.5 block text-xs text-ink-body">
              Mot de passe
            </label>
            <ChampMotDePasse
              ref={champMdp}
              id="champ-mdp"
              name="password"
              autoComplete="current-password"
              required
              minLength={10}
              defaultValue={MODE_DEMO ? MDP_DEMO : ""}
            />
          </div>
          <button
            type="submit"
            disabled={enCours || !pret}
            className="flex h-11 w-full items-center justify-center rounded-card bg-ink text-sm font-medium text-white disabled:opacity-50"
          >
            {enCours ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-subtle">
          <Link to="/inscription" className="font-medium text-ink">
            Créer un espace
          </Link>
          {" · "}
          <Link to="/mot-de-passe-oublie" className="font-medium text-ink">
            Mot de passe oublié
          </Link>
        </p>

        {MODE_DEMO && (
          <div className="mt-6 rounded-card border border-surface-soft bg-surface px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.3px] text-ink-muted">
              Comptes fondateurs
            </p>
            <ul className="mt-2 space-y-1.5">
              {COMPTES_FONDATEURS.map((c) => (
                <li key={c.email}>
                  <button
                    type="button"
                    onClick={() => remplirCompte(c.email)}
                    className="flex min-h-11 w-full flex-col justify-center text-left text-xs text-ink-body hover:text-ink md:min-h-0"
                  >
                    <span className="font-medium text-ink">{c.nom}</span>
                    <span className="ml-1 text-ink-muted">· {c.role}</span>
                    <span className="block text-ink-muted">{c.email}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] uppercase tracking-[0.3px] text-ink-muted">Rôles démo</p>
            <ul className="mt-2 space-y-1.5">
              {COMPTES_DEMO.map((c) => (
                <li key={c.email}>
                  <button
                    type="button"
                    onClick={() => remplirCompte(c.email)}
                    className="flex min-h-11 w-full flex-col justify-center text-left text-xs text-ink-body hover:text-ink md:min-h-0"
                  >
                    <span className="font-medium text-ink">{c.role}</span>
                    <span className="block text-ink-muted">{c.email}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-body">
              Mot de passe de tous ces comptes :{" "}
              <span className="font-medium text-ink">{MDP_DEMO}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
