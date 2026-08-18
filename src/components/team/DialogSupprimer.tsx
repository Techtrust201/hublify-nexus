import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nomComplet, type MembreEquipe } from "@/data/messagerie-mo1";

export function DialogSupprimer({
  membre,
  onFermer,
  onConfirmer,
}: {
  membre: MembreEquipe | null;
  onFermer: () => void;
  onConfirmer: (id: string) => void;
}) {
  return (
    <Dialog open={Boolean(membre)} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-w-[400px] gap-0 rounded-card border-line p-6 sm:rounded-card">
        <DialogHeader>
          <DialogTitle className="text-sm font-normal text-ink">
            Supprimer ce membre ?
          </DialogTitle>
          <DialogDescription className="text-xs leading-4 text-ink-subtle">
            {membre
              ? `${nomComplet(membre)} sera retiré de l'équipe et perdra l'accès à Hublify.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onFermer}
            className="h-[38px] flex-1 rounded-card border border-line text-xs font-medium text-ink-body"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              if (membre) onConfirmer(membre.id);
              onFermer();
            }}
            className="h-[38px] flex-1 rounded-card bg-ink text-xs font-medium text-white"
          >
            Supprimer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
