import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export { KpiCards as KpiReservations } from "@/components/dashboard/DashboardSections";

export function FiltreOnglet({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center rounded border px-2.5 text-xs font-medium md:h-[26px]",
        actif
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-ink-body",
      )}
    >
      {children}
    </button>
  );
}
