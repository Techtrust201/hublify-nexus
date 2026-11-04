import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import type { ReactNode } from "react";

/** Chrome des frames Authentication area, Mot de passe oublié, Créer un compte, Choix du profil. */
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
    <div className="flex min-h-dvh flex-col bg-v1-canvas-auth">
      <div className="flex min-h-dvh flex-1 flex-col bg-white px-5 py-8 sm:px-10 lg:px-[72px] lg:pb-8 lg:pt-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-v1-ink-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour au site
          </Link>
          <p className="inline-flex items-center gap-1.5 text-xs text-v1-ink-subtle">
            <Lock className="size-3.5" aria-hidden />
            Connexion sécurisée
          </p>
        </div>
        <div
          className={`mx-auto flex w-full flex-1 flex-col justify-center py-10 ${large ? "max-w-[868px]" : "max-w-[440px]"}`}
        >
          {kicker ? (
            <p className="mb-3 inline-flex w-fit rounded-full border border-v1-brand px-3 py-1 text-[11px] font-medium uppercase tracking-[0.8px] text-v1-brand">
              {kicker}
            </p>
          ) : null}
          <h1 className="font-display text-[2rem] font-semibold leading-[1.18] tracking-[-0.7px] text-v1-ink-strong">
            {titre}
          </h1>
          {description ? (
            <p className="mt-2.5 text-[15px] leading-relaxed text-[#111]">{description}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
        <p className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#111]">
          <Link to="/confidentialite">Confidentialité</Link>
          <span aria-hidden className="size-[3px] rounded-full bg-[#111]" />
          <Link to="/cgu">Conditions d'utilisation</Link>
          <span aria-hidden className="size-[3px] rounded-full bg-[#111]" />
          <span>© {new Date().getFullYear()} Hublify</span>
        </p>
      </div>
    </div>
  );
}

export const champAuth =
  "h-12 w-full rounded-xl border border-v1-line-auth bg-white px-3 text-sm text-v1-ink outline-none";

export const boutonAuth =
  "flex h-[50px] w-full items-center justify-center rounded-xl bg-v1-brand text-[15px] font-semibold text-white disabled:opacity-50";
