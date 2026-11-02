import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SUPER_ADMINS, accueilPourRole } from "@/auth/permissions";
import { boutonAuth, CadreAuth, champAuth } from "@/components/marque/CadreAuth";
import { ChampMotDePasse } from "@/components/ui/champ-mot-de-passe";
import { authClient } from "@/lib/auth-client";
import { getSession } from "@/lib/auth.functions";
import { toastErreur, toastOk } from "@/lib/feedback";

/**
 * Le mot de passe de démonstration vient de la configuration, jamais du code.
 * Un littéral écrit ici partirait dans le fichier JavaScript envoyé au
 * navigateur, où il resterait lisible par n'importe quel visiteur — y compris
 * une fois le panneau ci-dessous masqué, car masquer un affichage ne retire
 * rien du bundle. Absent de la configuration, il vaut la chaîne vide.
 */
const MDP_DEMO = import.meta.env["VITE_MDP_DEMO"] ?? "";

export const Route = createFileRoute("/connexion")({
  beforeLoad: async () => {
    const deja = await getSession();
    if (deja) throw redirect({ to: accueilPourRole(deja.roleId) });
  },
  head: () => ({
    meta: [
      { title: "Connexion — Hublify" },
      { name: "description", content: "Connexion à l'espace Hublify." },
    ],
  }),
  component: PageConnexion,
});

/**
 * Panneau d'aide listant les comptes de recette. Il s'active explicitement
 * (`VITE_MODE_DEMO=1`) et reste absent partout ailleurs : un environnement
 * publie la liste de ses comptes parce qu'on l'a demandé, jamais parce qu'on a
 * oublié de la désactiver.
 */
const MODE_DEMO = import.meta.env["VITE_MODE_DEMO"] === "1";

const COMPTES_FONDATEURS = SUPER_ADMINS.map((c) => ({
  email: c.email,
  nom: `${c.prenom} ${c.nom}`,
  role: "Super-administrateur",
}));

const COMPTES_DEMO = [
  { email: "amelie.dubois@hublify.app", role: "Gestionnaire" },
  { email: "lucas.menage@hublify.app", role: "Prestataire" },
  { email: "jean.martin@hublify.app", role: "Locataire" },
  { email: "sophie.martin@hublify.app", role: "Voyageur" },
  { email: "pierre.moreau@hublify.app", role: "Propriétaire" },
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
      rememberMe: donnees.get("souvenir") === "on",
    });
    setEnCours(false);
    if (error) {
      toastErreur(error.message ?? "Identifiants incorrects.");
      return;
    }
    toastOk("Connexion réussie.");
    await router.invalidate();
    const session = await getSession();
    await navigate({ to: accueilPourRole(session?.roleId ?? "lecteur") });
  }

  async function google() {
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    if (error) toastErreur("La connexion Google n'est pas encore activée.");
  }

  return (
    <CadreAuth
      kicker="Commencer"
      titre="Se connecter"
      description="Accédez à votre espace Hublify et reprenez là où vous vous étiez arrêtés."
    >
      <button
        type="button"
        onClick={() => void google()}
        className="mb-4 flex h-12 w-full items-center justify-center rounded-xl border border-v1-line-auth text-sm font-medium text-v1-ink"
      >
        Continuer avec Google
      </button>
      <p className="mb-4 text-center text-xs text-v1-ink-subtle">ou</p>
      <form className="space-y-3" onSubmit={(ev) => void connecter(ev)}>
        <label className="block">
          <span className="mb-1.5 block text-xs text-ink-body">Adresse e-mail</span>
          <input
            ref={champEmail}
            name="email"
            type="email"
            autoComplete="username"
            required
            defaultValue={MODE_DEMO ? "contact@tech-trust.fr" : ""}
            className={champAuth}
          />
        </label>
        <div>
          <label htmlFor="champ-mdp" className="mb-1.5 block text-xs text-ink-body">
            Mot de passe
          </label>
          <div className="mb-1 flex justify-end">
            <Link to="/mot-de-passe-oublie" className="text-xs text-v1-ink-muted">
              Mot de passe oublié ?
            </Link>
          </div>
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
        <label className="flex items-center gap-2 text-sm text-v1-ink-body">
          <input type="checkbox" name="souvenir" className="size-4 accent-v1-brand" />
          Se souvenir de moi
        </label>
        <button type="submit" disabled={enCours || !pret} className={boutonAuth}>
          {enCours ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-subtle">
        Nouveau sur Hublify ?{" "}
        <Link to="/inscription" className="font-medium text-v1-brand">
          Créer un compte
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
          {MDP_DEMO && (
            <p className="mt-3 text-xs text-ink-body">
              Mot de passe de tous ces comptes :{" "}
              <span className="font-medium text-ink">{MDP_DEMO}</span>
            </p>
          )}
        </div>
      )}
    </CadreAuth>
  );
}
