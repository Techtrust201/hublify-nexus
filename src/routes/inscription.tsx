import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { boutonAuth, CadreAuth, champAuth } from "@/components/marque/CadreAuth";
import { lireRechercheInscription, offreParId } from "@/design/offres";
import { forceMotDePasse } from "@/lib/force-mot-de-passe";
import { ChampMotDePasse } from "@/components/ui/champ-mot-de-passe";
import { inscrireAdherent } from "@/lib/auth.functions";
import { authClient } from "@/lib/auth-client";
import { toastErreur, toastOk } from "@/lib/feedback";

export const Route = createFileRoute("/inscription")({
  validateSearch: lireRechercheInscription,
  head: () => ({
    meta: [
      { title: "Créer un compte — Hublify" },
      { name: "description", content: "Créer votre espace Hublify." },
    ],
  }),
  component: PageInscription,
});

function PageInscription() {
  const navigate = useNavigate();
  const router = useRouter();
  const recherche = Route.useSearch();
  const [enCours, setEnCours] = useState(false);
  const [pret, setPret] = useState(false);
  const [mdp, setMdp] = useState("");
  const force = forceMotDePasse(mdp);
  useEffect(() => setPret(true), []);
  const offre = recherche.offre ? offreParId(recherche.offre) : null;

  async function inscrire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    const password = String(donnees.get("password") ?? "");
    if (password !== String(donnees.get("confirmation") ?? "")) {
      toastErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setEnCours(true);
    try {
      await inscrireAdherent({
        data: {
          prenom: String(donnees.get("prenom") ?? ""),
          nom: String(donnees.get("nom") ?? ""),
          email: String(donnees.get("email") ?? "").trim(),
          password,
          nomOrg: String(donnees.get("nomOrg") ?? ""),
        },
      });
      const { error } = await authClient.signIn.email({
        email: String(donnees.get("email") ?? "").trim(),
        password,
      });
      if (error) {
        toastOk("Compte créé. Connectez-vous.");
        await navigate({ to: "/connexion" });
        return;
      }
      toastOk("Espace créé. Aucun prélèvement n'a été fait.");
      await router.invalidate();
      await navigate({ to: "/" });
    } catch (err) {
      toastErreur(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <CadreAuth
      kicker="Nouveau point de départ"
      titre="Créer un compte"
      description="Créez votre espace en moins de deux minutes. Aucune carte bancaire requise."
    >
      {offre ? (
        <p className="mb-4 rounded-xl bg-v1-brand-soft px-3 py-2 text-sm text-v1-ink">
          Offre : {offre.titreChoix}
          {recherche.periode === "annuel" ? " · facturation annuelle (−20 %)" : ""}
          {recherche.devis === "1"
            ? ". Le devis est noté avec votre compte. Aucun prélèvement n'est lancé depuis ce formulaire."
            : ". Sans carte bancaire."}
        </p>
      ) : null}
      {recherche.parrainage === "1" ? (
        <p className="mb-4 rounded-xl bg-v1-canvas px-3 py-2 text-sm text-v1-ink-body">
          Vous arrivez par un parrainage. Un mois offert est prévu pour un abonnement annuel. La
          facturation ne le déduit pas toute seule : il reste associé à cette inscription.
        </p>
      ) : null}
      <form className="space-y-3" onSubmit={(ev) => void inscrire(ev)}>
        <label className="block">
          <span className="mb-1.5 block text-xs text-v1-ink-body">Prénom</span>
          <input
            name="prenom"
            required
            autoComplete="given-name"
            placeholder="Camille"
            className={champAuth}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-v1-ink-body">Nom</span>
          <input
            name="nom"
            autoComplete="family-name"
            placeholder="Votre nom"
            className={champAuth}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-v1-ink-body">Organisation</span>
          <input name="nomOrg" required minLength={2} className={champAuth} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-v1-ink-body">Adresse e-mail</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="camille@atelier.fr"
            className={champAuth}
          />
          <span className="mt-1 block text-xs text-v1-ink-muted">
            Votre e-mail servira d'identifiant de connexion.
          </span>
        </label>
        <div>
          <label htmlFor="champ-mdp-inscription" className="mb-1.5 block text-xs text-v1-ink-body">
            Créer un mot de passe
          </label>
          <ChampMotDePasse
            id="champ-mdp-inscription"
            name="password"
            autoComplete="new-password"
            required
            minLength={10}
            className={champAuth}
            onChange={(ev) => setMdp(ev.target.value)}
          />
          <p className="mt-2 flex flex-wrap gap-2 text-xs text-v1-ink-muted">
            <span>{force.longueur ? "10 caractères" : "10 caractères requis"}</span>
            <span>{force.chiffre ? "1 chiffre" : "1 chiffre requis"}</span>
            <span>{force.special ? "1 caractère spécial" : "1 caractère spécial requis"}</span>
            <span className="font-semibold text-v1-ink">{force.libelle}</span>
          </p>
        </div>
        <div>
          <label htmlFor="champ-confirmation" className="mb-1.5 block text-xs text-v1-ink-body">
            Confirmer votre mot de passe
          </label>
          <ChampMotDePasse
            id="champ-confirmation"
            name="confirmation"
            autoComplete="new-password"
            required
            minLength={10}
            className={champAuth}
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-v1-ink-body">
          <input type="checkbox" name="cgu" required className="mt-1 size-4 accent-v1-brand" />
          <span>
            J'accepte les <Link to="/cgu">Conditions d'utilisation</Link> et la{" "}
            <Link to="/confidentialite">Politique de confidentialité</Link>.
          </span>
        </label>
        <button type="submit" disabled={enCours || !pret} className={boutonAuth}>
          {enCours ? "Création…" : "Continuer"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-v1-ink-muted">
        Vous avez déjà un compte ?{" "}
        <Link to="/connexion" className="font-medium text-v1-brand">
          Se connecter
        </Link>
      </p>
    </CadreAuth>
  );
}
