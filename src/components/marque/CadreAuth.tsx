import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Chrome des frames Authentication area (179:2431, 920×1024),
 * Créer un compte (179:2482), Mot de passe oublié (179:2605)
 * et Choix du profil (184:1626).
 *
 * Le conteneur de formulaire mesuré est 456 px (868 px pour le choix
 * de profil), centré sur le blanc pleine page. Le cadre « Authentication
 * area » fait 920 px : ce n'est pas la largeur des champs.
 */
export function CadreAuth({
  titre,
  description,
  kicker,
  children,
  large = false,
}: {
  titre: string;
  description?: string;
  kicker?: string;
  children: ReactNode;
  large?: boolean;
}) {
  return (
    <div data-surface="auth" className="flex min-h-dvh flex-col bg-white text-ink">
      <header className="flex items-center justify-between gap-4 px-5 pt-8 lg:px-[72px] lg:pt-10">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-subtle"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour au site
        </Link>
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-subtle">
          <Lock className="size-3.5" aria-hidden />
          Connexion sécurisée
        </p>
      </header>
      <main
        className={`mx-auto flex w-full flex-1 flex-col justify-[safe_center] px-5 py-8 sm:px-0 ${large ? "max-w-[868px]" : "max-w-[456px]"}`}
      >
        {kicker ? (
          <p className="mb-2.5 inline-flex w-fit rounded-full border border-brand px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-brand">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-display text-[32px] font-semibold leading-[38px] tracking-[-0.6px] text-ink-deep">
          {titre}
        </h1>
        {description ? (
          <p className="mt-2.5 text-[15px] leading-[23px] text-ink">{description}</p>
        ) : null}
        <div className="mt-7">{children}</div>
      </main>
      <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 pb-8 text-xs text-ink-subtle">
        <Link to="/confidentialite">Confidentialité</Link>
        <span aria-hidden className="size-[3px] rounded-full bg-ink-subtle" />
        <Link to="/cgu">Conditions d'utilisation</Link>
        <span aria-hidden className="size-[3px] rounded-full bg-ink-subtle" />
        <span>© {new Date().getFullYear()} Hublify</span>
      </footer>
    </div>
  );
}

export const champAuth =
  "h-[50px] w-full rounded-xl border border-[#d5d7de] bg-white px-3.5 text-[15px] text-ink-deep outline-none placeholder:text-ink-muted";

export const labelAuth = "mb-1.5 block text-sm font-medium text-ink-deep";

export const boutonAuth =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-semibold text-white disabled:opacity-50";
