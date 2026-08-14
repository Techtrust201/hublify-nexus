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
        "inline-flex h-[30px] items-center rounded border px-3 text-xs font-medium",
        actif
          ? "border-[#1e2939] bg-[#1e2939] text-white"
          : "border-[#d1d5dc] bg-white text-[#4a5565]",
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
        "inline-flex h-[34px] items-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#4a5565] disabled:opacity-40",
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
        "inline-flex h-[34px] items-center gap-1.5 rounded-[10px] bg-[#1e2939] px-3 text-xs font-medium text-white",
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
    <label className="block text-xs text-[#6a7282]">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-[34px] w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1e2939] outline-none placeholder:text-[#99a1af]"
      />
    </label>
  );
}

export function BadgeType({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[23px] items-center rounded border border-[#e5e7eb] bg-[#f9fafb] px-2 text-xs text-[#4a5565]">
      {children}
    </span>
  );
}
