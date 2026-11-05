import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { toastInfo } from "@/lib/feedback";

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
    <div className="flex min-h-dvh flex-col bg-white text-ink">
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
        <span>© {new Date().getFullYear()} Clair</span>
      </footer>
    </div>
  );
}

export const champAuth =
  "h-[50px] w-full rounded-xl border border-[#d5d7de] bg-white px-3.5 text-[15px] text-ink-deep outline-none placeholder:text-ink-muted";

export const labelAuth = "mb-1.5 block text-sm font-medium text-ink-deep";

export const boutonAuth =
  "flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-semibold text-white disabled:opacity-50";

export const boutonGoogleClasse =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d5d7de] bg-white text-[15px] font-medium text-ink-deep";

export const MESSAGE_GOOGLE = "La connexion avec Google n'est pas ouverte sur cet espace.";

export function SeparateurOu() {
  return (
    <div className="flex items-center gap-3 text-[13px] text-ink-muted">
      <span className="h-px flex-1 bg-[#e6e8ee]" />
      ou
      <span className="h-px flex-1 bg-[#e6e8ee]" />
    </div>
  );
}

/** Le fournisseur Google n'est pas configuré : le bouton de la maquette reste cliquable et le dit. */
export function BoutonGoogle({ libelle }: { libelle: string }) {
  return (
    <button type="button" className={boutonGoogleClasse} onClick={() => toastInfo(MESSAGE_GOOGLE)}>
      <MarqueGoogle />
      {libelle}
    </button>
  );
}

function MarqueGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.6 7.1l6.3 5.3C37.4 38.3 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
