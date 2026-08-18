import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Chip({
  actif,
  children,
  onClick,
}: {
  actif?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-11 min-h-11 items-center rounded border px-3 text-sm font-medium md:h-[30px] md:min-h-[30px] md:text-xs",
        actif
          ? "border-ink bg-ink text-white"
          : "border-line-strong bg-white text-ink-body",
      )}
    >
      {children}
    </button>
  );
}

export function BtnOutline({
  children,
  onClick,
  className,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 min-h-11 items-center gap-1.5 rounded-card border border-line bg-white px-3 text-sm font-medium text-ink-body disabled:opacity-40 md:h-[34px] md:min-h-[34px] md:text-xs",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function BtnNavy({
  children,
  onClick,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 min-h-11 items-center gap-1.5 rounded-card bg-ink px-3 text-sm font-medium text-white md:h-[34px] md:min-h-[34px] md:text-xs",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Champ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs text-ink-subtle">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-11 w-full rounded-card border border-line bg-white px-3 text-base text-ink outline-none placeholder:text-ink-muted md:h-[34px] md:text-sm"
      />
    </label>
  );
}

export function BadgeType({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[23px] items-center rounded border border-line bg-surface px-2 text-xs text-ink-body">
      {children}
    </span>
  );
}
