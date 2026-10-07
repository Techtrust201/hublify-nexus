import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function RetourVueGenerale({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Retour à la vue générale"
      className={cn(
        "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-card border border-ink bg-white text-sm font-medium text-ink hover:bg-surface sm:px-3 md:h-10 lg:px-0 xl:px-3",
        className,
      )}
    >
      <ArrowLeft className="size-3.5 shrink-0" />
      <span className="hidden sm:inline lg:hidden xl:inline">Retour à la vue générale</span>
    </Link>
  );
}

export function estPagePlanningHorsAccueil(pathname: string) {
  return (
    pathname === "/missions" ||
    pathname === "/missions/" ||
    pathname === "/reservations" ||
    pathname === "/reservations/" ||
    pathname === "/tarifs" ||
    pathname === "/tarifs/"
  );
}
