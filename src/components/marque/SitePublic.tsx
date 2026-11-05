import { Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/marque/Logo";
import { inscrireListeBailleurs } from "@/lib/liste-bailleurs.functions";

const LIENS = [
  { href: "/#produit", label: "Produit" },
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#ressources", label: "Ressources" },
] as const;

export function SitePublic({ children }: { children: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const [liste, setListe] = useState<"attente" | "envoye" | "enregistre" | "erreur">("attente");
  const [enCours, setEnCours] = useState(false);
  const [pret, setPret] = useState(false);
  useEffect(() => setPret(true), []);

  async function inscrireListe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setEnCours(true);
    try {
      const res = await inscrireListeBailleurs({ data: { email } });
      setListe(res.envoye ? "envoye" : "enregistre");
    } catch {
      setListe("erreur");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="min-h-dvh bg-v1-canvas text-v1-ink">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-lg focus:bg-v1-brand focus:px-3 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>
      <header className="sticky top-0 z-sticky border-b border-v1-line bg-v1-canvas/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-5 lg:px-[72px]">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-[#111] lg:flex" aria-label="Pages">
            {LIENS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-v1-brand">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/connexion" className="px-3 text-sm text-[#111]">
              Se connecter
            </Link>
            <Link
              to="/choix-du-profil"
              className="inline-flex h-12 items-center rounded-lg bg-v1-brand px-5 text-sm text-white"
            >
              Essayer gratuitement
            </Link>
          </div>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg border border-v1-line lg:hidden"
            aria-expanded={ouvert}
            aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOuvert((v) => !v)}
          >
            {ouvert ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
        {ouvert && (
          <nav className="space-y-1 border-t border-v1-line px-5 py-3 lg:hidden" aria-label="Pages">
            {LIENS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="flex min-h-11 items-center text-sm"
                onClick={() => setOuvert(false)}
              >
                {l.label}
              </a>
            ))}
            <Link to="/connexion" className="flex min-h-11 items-center text-sm">
              Se connecter
            </Link>
            <Link
              to="/choix-du-profil"
              className="mt-2 flex h-12 items-center justify-center rounded-lg bg-v1-brand text-sm text-white"
            >
              Essayer gratuitement
            </Link>
          </nav>
        )}
      </header>
      <main id="contenu">{children}</main>
      <footer className="border-t border-v1-line bg-v1-canvas">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-[72px]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-v1-ink-body">
              La gestion locative claire, fidèle et humaine pour les propriétaires bailleurs et les
              petites régies.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-v1-ink">Produit</p>
            <ul className="mt-3 space-y-2 text-sm text-v1-ink-body">
              <li>
                <a href="/#fonctionnalites">Fonctionnalités</a>
              </li>
              <li>
                <a href="/#tarifs">Tarifs</a>
              </li>
              <li>
                <Link to="/faq">Questions fréquentes</Link>
              </li>
              <li>
                <Link to="/parrainage">Parrainage</Link>
              </li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-v1-ink">
                Ressources
              </p>
              <ul className="mt-3 space-y-2 text-sm text-v1-ink-body">
                <li>
                  <Link to="/faq">Centre d'aide</Link>
                </li>
                <li>
                  <Link to="/cgv">Conditions de vente</Link>
                </li>
                <li>
                  <Link to="/cgu">Conditions d'utilisation</Link>
                </li>
                <li>
                  <Link to="/confidentialite">Confidentialité</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-v1-ink">À propos</p>
              <ul className="mt-3 space-y-2 text-sm text-v1-ink-body">
                <li>
                  <Link to="/choix-du-profil">Créer un compte</Link>
                </li>
                <li>
                  <Link to="/connexion">Connexion</Link>
                </li>
                <li>
                  <Link to="/faq" hash="contact">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <form onSubmit={inscrireListe}>
            <p className="text-sm font-semibold text-v1-ink">
              Le rendez-vous des bailleurs sereins
            </p>
            <p className="mt-1 text-xs text-v1-ink-muted">
              Un conseil utile par mois. Aucun bruit.
            </p>
            <div className="mt-3 flex gap-2">
              <label className="sr-only" htmlFor="liste-bailleurs">
                Adresse e-mail
              </label>
              <input
                id="liste-bailleurs"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@exemple.fr"
                className="h-11 min-w-0 flex-1 rounded-lg border border-v1-line bg-white px-3 text-sm"
              />
              <button
                type="submit"
                disabled={!pret || enCours}
                className="inline-flex size-11 items-center justify-center rounded-lg bg-v1-brand text-white disabled:opacity-60"
                aria-label="S'inscrire à la liste"
              >
                →
              </button>
            </div>
            {liste === "envoye" ? (
              <p className="mt-2 text-xs text-v1-ink-body" role="status">
                Inscription enregistrée. Un e-mail de confirmation vient de partir.
              </p>
            ) : null}
            {liste === "enregistre" ? (
              <p className="mt-2 text-xs text-v1-ink-body" role="status">
                Inscription enregistrée. La confirmation est conservée et partira dès que l'envoi
                est ouvert.
              </p>
            ) : null}
            {liste === "erreur" ? (
              <p className="mt-2 text-xs text-v1-ink" role="alert">
                Indiquez une adresse e-mail valide.
              </p>
            ) : null}
          </form>
        </div>
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 border-t border-v1-line px-5 py-4 text-xs text-v1-ink-muted lg:px-[72px]">
          <p>© {new Date().getFullYear()} Hublify. Tous droits réservés.</p>
          <p className="flex flex-wrap gap-4">
            <Link to="/cgu">Mentions légales</Link>
            <Link to="/confidentialite">Confidentialité</Link>
            <Link to="/cgu">CGU</Link>
            <Link to="/cgv">Conditions de vente</Link>
          </p>
          <p>Tous les systèmes sont opérationnels</p>
        </div>
      </footer>
    </div>
  );
}
