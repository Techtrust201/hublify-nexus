import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Circle, CircleCheck, CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  BoutonGoogle,
  boutonAuth,
  CadreAuth,
  champAuth,
  labelAuth,
  SeparateurOu,
} from "@/components/marque/CadreAuth";
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

function Exigence({ ok, libelle }: { ok: boolean; libelle: string }) {
  const Icone = ok ? CircleCheck : Circle;
  return (
    <li className={`inline-flex items-center gap-1.5 ${ok ? "text-brand" : "text-ink-subtle"}`}>
      <Icone className="size-3.5" aria-hidden />
      {libelle}
    </li>
  );
}

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
      const prenom = String(donnees.get("prenom") ?? "").trim();
      const nom = String(donnees.get("nom") ?? "").trim();
      await inscrireAdherent({
        data: {
          prenom,
          nom,
          email: String(donnees.get("email") ?? "").trim(),
          password,
          // La maquette n'a pas de champ organisation : le nom de l'espace suit la personne.
          nomOrg: `${prenom} ${nom}`.trim(),
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
        <p className="mb-4 rounded-xl bg-brand-soft px-3 py-2 text-sm text-ink">
          Offre : {offre.titreChoix}
          {recherche.periode === "annuel" ? " · facturation annuelle (−20 %)" : ""}
          {recherche.devis === "1"
            ? ". Le devis est noté avec votre compte. Aucun prélèvement n'est lancé depuis ce formulaire."
            : ". Sans carte bancaire."}
        </p>
      ) : null}
      {recherche.parrainage === "1" ? (
        <p className="mb-4 rounded-xl bg-surface px-3 py-2 text-sm text-ink-body">
          Vous arrivez par un parrainage. Un mois offert est prévu pour un abonnement annuel. La
          facturation ne le déduit pas toute seule : il reste associé à cette inscription.
        </p>
      ) : null}
      <div className="space-y-4">
        <BoutonGoogle libelle="S'inscrire avec Google" />
        <SeparateurOu />
        <form className="space-y-4" onSubmit={(ev) => void inscrire(ev)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelAuth}>Prénom</span>
              <input
                name="prenom"
                required
                autoComplete="given-name"
                placeholder="Camille"
                className={champAuth}
              />
            </label>
            <label className="block">
              <span className={labelAuth}>Nom</span>
              <input
                name="nom"
                required
                autoComplete="family-name"
                placeholder="Votre nom"
                className={champAuth}
              />
            </label>
          </div>
          <label className="block">
            <span className={labelAuth}>Adresse e-mail</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="camille@atelier.fr"
              className={champAuth}
            />
            <span className="mt-1.5 flex items-center gap-1.5 text-[13px] leading-4 text-ink-subtle">
              <CircleHelp className="size-3.5 shrink-0" aria-hidden />
              Votre e-mail servira d'identifiant de connexion.
            </span>
          </label>
          <div>
            <label htmlFor="champ-mdp-inscription" className={labelAuth}>
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
            <div className="mt-2 rounded-xl bg-[#f3f5fb] px-3 py-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-ink-body">Sécurité du mot de passe</span>
                <span
                  className={
                    force.libelle === "Bon" ? "font-semibold text-brand" : "text-ink-subtle"
                  }
                >
                  {force.libelle}
                </span>
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                {/* Le frame écrit « 8 caractères ». L'icône et l'envoi suivent le minimum produit : 10. */}
                <Exigence ok={force.longueur} libelle="8 caractères" />
                <Exigence ok={force.chiffre} libelle="1 chiffre" />
                <Exigence ok={force.special} libelle="1 caractère spécial" />
              </ul>
            </div>
          </div>
          <div>
            <label htmlFor="champ-confirmation" className={labelAuth}>
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
          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="cgu"
              required
              defaultChecked
              className="mt-0.5 size-[18px] accent-brand"
            />
            <span>
              J'accepte les{" "}
              <Link to="/cgu" className="underline">
                Conditions d'utilisation
              </Link>{" "}
              et la{" "}
              <Link to="/confidentialite" className="underline">
                Politique de confidentialité
              </Link>
              .
            </span>
          </label>
          <button type="submit" disabled={enCours || !pret} className={boutonAuth}>
            {enCours ? "Création…" : "Continuer"}
          </button>
        </form>
        <p className="text-center text-sm text-ink">
          Vous avez déjà un compte ?{" "}
          <Link to="/connexion" className="font-semibold text-ink-deep">
            Se connecter
          </Link>
        </p>
      </div>
    </CadreAuth>
  );
}
