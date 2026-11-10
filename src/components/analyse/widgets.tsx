// SOURCE: Hublify V1.0 — Maq V1 Gestionnaire / Analyse

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Carte({
  children,
  className,
  teinte = "blanc",
  id,
}: {
  children: ReactNode;
  className?: string;
  teinte?: "blanc" | "menthe" | "sable";
  id?: string;
}) {
  return (
    <article
      id={id}
      className={cn(
        "rounded-card border border-line bg-white p-4 shadow-[var(--shadow-carte)]",
        teinte === "menthe" && "border-transparent bg-gest-vert",
        teinte === "sable" && "border-transparent bg-gest-jaune",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function Kpi({
  titre,
  valeur,
  detail,
  extra,
  teinte = "blanc",
  action,
  onAction,
  icone,
}: {
  titre: string;
  valeur: string;
  detail?: string | undefined;
  extra?: string | undefined;
  teinte?: "blanc" | "menthe" | "sable";
  action?: string;
  onAction?: () => void;
  icone?: ReactNode;
}) {
  const valeurClasse = "text-ink";
  return (
    <Carte teinte={teinte} className="flex min-h-[132px] flex-col">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-ink-body">
          {icone}
          {titre}
        </p>
      </div>
      <p className={cn("mt-3 text-2xl tracking-tight sm:text-[28px]", valeurClasse)}>{valeur}</p>
      {detail && <p className="mt-1 text-xs leading-relaxed text-ink-muted">{detail}</p>}
      {extra && <p className="mt-1 text-xs text-ink-subtle">{extra}</p>}
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="mt-auto inline-flex min-h-11 items-center pt-2 text-left text-xs font-medium text-accent-teal sm:min-h-0"
        >
          {action}
        </button>
      )}
    </Carte>
  );
}

export function BarreOnglets<T extends string>({
  valeur,
  options,
  onChange,
  label,
}: {
  valeur: T;
  options: Array<{ id: T; label: string }>;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-line"
    >
      {options.map((o) => {
        const actif = o.id === valeur;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={actif}
            onClick={() => onChange(o.id)}
            className={cn(
              "min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium",
              actif ? "border-ink text-ink" : "border-transparent text-ink-subtle",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Pastille({
  children,
  ton,
}: {
  children: ReactNode;
  ton: "ok" | "attente" | "stop" | "neutre";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        ton === "ok" && "bg-[#e7f6ee] text-[#0f7a45]",
        ton === "attente" && "bg-[#fbf6ea] text-[#8a5a00]",
        ton === "stop" && "bg-[#fdecec] text-[#9b2c2c]",
        ton === "neutre" && "bg-surface-soft text-ink-body",
      )}
    >
      {children}
    </span>
  );
}
