import { Link } from "@tanstack/react-router";
import { Bell, ChevronLeft, Home } from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";
import type { ModePortail } from "@/lib/portail-mobile";
import { cn } from "@/lib/utils";

export type PortailUi = {
  mode: ModePortail;
  definirMode: (mode: ModePortail) => void;
  demarre: boolean;
  demarrer: () => void;
  masquerNav: (valeur: boolean) => void;
  ouvrirNotifs: () => void;
  alertes: number;
};

const Ctx = createContext<PortailUi | null>(null);

export function PortailUiProvider({
  valeur,
  children,
}: {
  valeur: PortailUi;
  children: ReactNode;
}) {
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function usePortailUi() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Portail hors du shell");
  return ctx;
}

export function Ecran({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-4 px-6 pb-6 pt-3", className)}>
      {children}
    </div>
  );
}

export function Cloche({ className }: { className?: string }) {
  const ui = usePortailUi();
  return (
    <button
      type="button"
      onClick={ui.ouvrirNotifs}
      aria-label="Notifications"
      className={cn(
        "relative grid size-11 shrink-0 place-items-center rounded-full text-[var(--portail-encre)]",
        className,
      )}
    >
      <Bell className="size-6" fill="currentColor" strokeWidth={1.5} />
      {ui.alertes > 0 && (
        <span className="absolute right-2 top-2 size-2 rounded-full bg-[#e11d48]" aria-hidden />
      )}
    </button>
  );
}

export function Entete({
  titre,
  sousTitre,
  surRetour,
}: {
  titre?: string | undefined;
  sousTitre?: string | undefined;
  surRetour?: (() => void) | undefined;
}) {
  return (
    <div className="flex items-start gap-2">
      {surRetour ? (
        <button
          type="button"
          onClick={surRetour}
          aria-label="Retour"
          className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full text-[var(--portail-encre)]"
        >
          <ChevronLeft className="size-6" strokeWidth={2.4} />
        </button>
      ) : (
        <Link
          to="/espace"
          aria-label="Accueil"
          className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full text-[var(--portail-encre)]"
        >
          <Home className="size-6" fill="currentColor" strokeWidth={1.5} />
        </Link>
      )}
      <div className="min-w-0 flex-1 pt-2 text-center">
        {titre && (
          <h1 className="font-display text-[20px] font-semibold leading-tight text-[var(--portail-encre)]">
            {titre}
          </h1>
        )}
        {sousTitre && (
          <p className="mt-0.5 text-sm text-[var(--portail-encre-douce)]">{sousTitre}</p>
        )}
      </div>
      <Cloche className="mt-0.5" />
    </div>
  );
}

export function Carte({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-[var(--portail-rayon)] bg-[var(--portail-carte)] p-4 shadow-[var(--portail-ombre)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Bouton({
  children,
  onClick,
  type = "button",
  variante = "plein",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variante?: "plein" | "ghost" | "ligne";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-[52px] w-full items-center justify-center rounded-[26px] px-4 text-[16px] font-semibold transition disabled:opacity-50",
        variante === "plein" && "bg-[var(--portail-sarcelle)] text-white",
        variante === "ghost" && "text-[#5090A8]",
        variante === "ligne" && "border border-[#d0d5dd] bg-white text-[#1d2939]",
      )}
    >
      {children}
    </button>
  );
}

export function Champ({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-[#667085]">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const champClasse =
  "h-11 w-full scroll-mb-[45vh] scroll-mt-24 rounded-2xl border border-transparent bg-[#f4f6f5] px-3 text-sm text-[#1d2939] outline-none focus:border-[#5090A8]";

export function Marque({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-[72px] place-items-center rounded-full bg-[#e5f3f1] text-[32px] font-semibold text-[#5090A8]",
        className,
      )}
    >
      Ü
    </span>
  );
}

export function LienInterne({
  to,
  hash,
  children,
  className,
}: {
  to:
    | "/espace"
    | "/espace/calendrier"
    | "/espace/documents"
    | "/espace/messages"
    | "/espace/logement"
    | "/espace/dossier"
    | "/espace/missions"
    | "/espace/precheckin"
    | "/espace/candidature"
    | "/espace/contacts";
  hash?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      {...(hash ? { hash } : {})}
      className={cn("text-sm font-medium text-[#5090A8]", className)}
    >
      {children}
    </Link>
  );
}

export function PastillesVerif({
  professionnel,
  annonce,
}: {
  professionnel?: boolean;
  annonce?: boolean;
}) {
  if (!professionnel && !annonce) return null;
  return (
    <p className="flex flex-wrap gap-1 text-[10px] font-medium">
      {professionnel && (
        <span className="rounded-full bg-[#e7f6ee] px-2 py-0.5 text-[#027a48]">
          Professionnel vérifié
        </span>
      )}
      {annonce && (
        <span className="rounded-full bg-[#e8f3f8] px-2 py-0.5 text-[#175cd3]">
          Annonce vérifiée
        </span>
      )}
    </p>
  );
}

export function BandeauSimulation() {
  return (
    <p className="rounded-2xl border border-dashed border-[#b54708] bg-[#fffaeb] px-3 py-2 text-xs leading-relaxed text-[#93370d]">
      Simulation — aucun paiement réel. Hublify n'appelle ni Stripe ni un autre prestataire.
    </p>
  );
}
