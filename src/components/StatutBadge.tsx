import { CLASSE_STATUT, LIBELLE_STATUT, type StatutMission } from "@/data/statuts";
import { cn } from "@/lib/utils";

export function StatutBadge({
  statut,
  className,
}: {
  statut: StatutMission;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        CLASSE_STATUT[statut],
        className,
      )}
    >
      {LIBELLE_STATUT[statut]}
    </span>
  );
}
