// SOURCE: Hublify V1.0 — Ajout presta/resa/modif calendrier
// « Que souhaitez vous faire à cette date ? » (clic sur la case, comme Outlook).

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { actionsDate, type ActionDate } from "@/lib/gestionnaire-planning";

type ActionProposee = { id: ActionDate; label: string };

export function DialogueActionDate({
  ouvert,
  bienNom,
  dateLabel,
  bloque,
  actions,
  onFermer,
  onChoisir,
}: {
  ouvert: boolean;
  bienNom: string;
  dateLabel: string;
  bloque: boolean;
  actions?: ActionProposee[];
  onFermer: () => void;
  onChoisir: (action: ActionDate) => void;
}) {
  const liste = actions ?? actionsDate(bloque);
  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Que souhaitez-vous faire à cette date ?</DialogTitle>
        <DialogDescription>
          {bienNom ? `${bienNom} · ` : ""}
          {dateLabel}. La case reste libre autour des séjours : le clic ouvre ce choix, comme dans
          un calendrier.
        </DialogDescription>
        {liste.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            Cette date est consultable. La modification dépend de vos droits.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {liste.map((action) => (
              <li key={action.id}>
                <button
                  type="button"
                  onClick={() => onChoisir(action.id)}
                  className="flex min-h-11 w-full items-center rounded-card border border-line px-3 text-left text-sm text-ink hover:bg-surface"
                >
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
