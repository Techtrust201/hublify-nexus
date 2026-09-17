import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function RetourVueGenerale({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-card border border-ink bg-white px-3 text-sm font-medium text-ink hover:bg-surface md:h-10",
        className,
      )}
    >
      <ArrowLeft className="size-3.5" />
      Retour à la vue générale
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
